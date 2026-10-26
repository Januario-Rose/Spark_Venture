
import { supabase } from "./supabaseClient";

const FUNDING_STATUSES = [
  "saved",
  "applied",
  "approved",
  "declined",
  "withdrawn",
];

const ASSESSMENT_ANSWERS = ["yes", "partial", "no"];

/**
 * Get the currently authenticated user.
 */
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error("Please sign in to continue.");

  return data.user;
}

/**
 * Verify that the selected business belongs to the signed-in user.
 * The businesses table uses user_id for ownership.
 */
async function requireOwnedBusiness(businessId) {
  if (!businessId) throw new Error("Select a business first.");

  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Business not found or access denied.");

  return user;
}

/**
 * Return today's date in YYYY-MM-DD format.
 */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calculate deadline urgency for display.
 * This does not change the database status.
 */
export function getDeadlineInfo(deadline) {
  if (!deadline) {
    return {
      daysRemaining: null,
      label: "No deadline listed",
      urgency: "none",
    };
  }

  const today = new Date(`${todayISO()}T00:00:00Z`);
  const dueDate = new Date(`${deadline}T00:00:00Z`);
  const daysRemaining = Math.round(
    (dueDate - today) / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      label: "Deadline passed",
      urgency: "closed",
    };
  }

  if (daysRemaining === 0) {
    return {
      daysRemaining,
      label: "Closes today",
      urgency: "critical",
    };
  }

  if (daysRemaining <= 7) {
    return {
      daysRemaining,
      label: `Closes in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
      urgency: "critical",
    };
  }

  if (daysRemaining <= 30) {
    return {
      daysRemaining,
      label: `Closes in ${daysRemaining} days`,
      urgency: "soon",
    };
  }

  return {
    daysRemaining,
    label: `${daysRemaining} days remaining`,
    urgency: "normal",
  };
}

/**
 * Fetch and filter the shared funding catalogue.
 *
 * filters:
 * search, type, sector, province, status,
 * minAmount, maxAmount
 */
export async function getFundingOpportunities(filters = {}) {
  let query = supabase
    .from("funding_opportunities")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters.type && filters.type !== "all") {
    query = query.eq("opportunity_type", filters.type);
  }

  if (filters.sector && filters.sector !== "all") {
    query = query.eq("sector", filters.sector);
  }

  if (filters.province && filters.province !== "all") {
    query = query.in("province", [
      filters.province,
      "National",
      "All provinces",
    ]);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.minAmount !== "" && filters.minAmount != null) {
    const minAmount = Number(filters.minAmount);

    if (Number.isFinite(minAmount)) {
      query = query.gte("amount_max", minAmount);
    }
  }

  if (filters.maxAmount !== "" && filters.maxAmount != null) {
    const maxAmount = Number(filters.maxAmount);

    if (Number.isFinite(maxAmount)) {
      query = query.lte("amount_min", maxAmount);
    }
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim().replace(/[%(),]/g, " ");
    query = query.or(
      `title.ilike.%${search}%,provider.ilike.%${search}%,summary.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  const today = todayISO();

  return (data || []).map((item) => {
    const deadlineInfo = getDeadlineInfo(item.deadline);
    const isPastDeadline = item.deadline && item.deadline < today;

    return {
      ...item,
      deadlineInfo,
      effectiveStatus: isPastDeadline ? "closed" : item.status,
    };
  });
}

/**
 * Fetch one funding opportunity.
 */
export async function getFundingOpportunityById(opportunityId) {
  if (!opportunityId) {
    throw new Error("A funding opportunity ID is required.");
  }

  const { data, error } = await supabase
    .from("funding_opportunities")
    .select("*")
    .eq("id", opportunityId)
    .single();

  if (error) throw error;

  return {
    ...data,
    deadlineInfo: getDeadlineInfo(data.deadline),
  };
}

/**
 * Get saved funding options and applications for a business.
 */
export async function getFundingRecords(businessId) {
  await requireOwnedBusiness(businessId);

  const { data, error } = await supabase
    .from("saved_funding")
    .select(`
      *,
      opportunity:funding_opportunities (*)
    `)
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Save an opportunity.
 */
export async function saveFundingOpportunity({
  businessId,
  opportunityId,
}) {
  const user = await requireOwnedBusiness(businessId);

  const { data, error } = await supabase
    .from("saved_funding")
    .upsert(
      {
        business_id: businessId,
        user_id: user.id,
        opportunity_id: opportunityId,
        status: "saved",
      },
      {
        onConflict: "business_id,opportunity_id",
        ignoreDuplicates: true,
      }
    )
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Remove an opportunity only if it is still in the saved state.
 * Applied and completed records must not be deleted accidentally.
 */
export async function unsaveFunding(recordId) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("saved_funding")
    .delete()
    .eq("id", recordId)
    .eq("user_id", user.id)
    .eq("status", "saved")
    .select("id")
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "This item was not removed. It may already be an application."
    );
  }

  return data;
}

/**
 * Mark an opportunity as applied for.
 */
export async function markFundingApplied({
  businessId,
  opportunityId,
  amountRequested = null,
  notes = "",
  appliedAt = todayISO(),
}) {
  const user = await requireOwnedBusiness(businessId);

  if (
    amountRequested !== null &&
    (!Number.isFinite(Number(amountRequested)) ||
      Number(amountRequested) < 0)
  ) {
    throw new Error("Enter a valid requested amount.");
  }

  const { data, error } = await supabase
    .from("saved_funding")
    .upsert(
      {
        business_id: businessId,
        user_id: user.id,
        opportunity_id: opportunityId,
        status: "applied",
        amount_requested:
          amountRequested === "" || amountRequested == null
            ? null
            : Number(amountRequested),
        notes: notes.trim(),
        applied_at: appliedAt || null,
      },
      { onConflict: "business_id,opportunity_id" }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update the outcome or details of an existing funding record.
 */
export async function updateFundingRecord({
  recordId,
  status,
  notes,
  amountRequested,
  amountApproved,
  appliedAt,
}) {
  if (!FUNDING_STATUSES.includes(status)) {
    throw new Error("Invalid funding status.");
  }

  const user = await getCurrentUser();
  const updates = { status };

  if (notes !== undefined) updates.notes = notes.trim();

  if (amountRequested !== undefined) {
    if (
      amountRequested !== null &&
      amountRequested !== "" &&
      (!Number.isFinite(Number(amountRequested)) ||
        Number(amountRequested) < 0)
    ) {
      throw new Error("Enter a valid requested amount.");
    }

    updates.amount_requested =
      amountRequested === "" ? null : amountRequested;
  }

  if (amountApproved !== undefined) {
    if (
      amountApproved !== null &&
      amountApproved !== "" &&
      (!Number.isFinite(Number(amountApproved)) ||
        Number(amountApproved) < 0)
    ) {
      throw new Error("Enter a valid approved amount.");
    }

    updates.amount_approved =
      amountApproved === "" ? null : amountApproved;
  }

  if (appliedAt !== undefined) {
    updates.applied_at = appliedAt || null;
  }

  const { data, error } = await supabase
    .from("saved_funding")
    .update(updates)
    .eq("id", recordId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Retrieve active assessment questions in display order.
 */
export async function getFundingAssessmentQuestions() {
  const { data, error } = await supabase
    .from("funding_assessment_questions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return data || [];
}

/**
 * Fetch assessment history for a business.
 */
export async function getFundingAssessmentHistory(businessId) {
  await requireOwnedBusiness(businessId);

  const { data, error } = await supabase
    .from("funding_assessment_attempts")
    .select("*")
    .eq("business_id", businessId)
    .order("completed_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Save an assessment result and its answers.
 * `answers` is an array of:
 * { question_id, answer, points_awarded }
 *
 * The caller will calculate the score in the next step.
 */
export async function saveFundingAssessment({
  businessId,
  overallScore,
  sectionScores,
  recommendations,
  answers,
}) {
  const user = await requireOwnedBusiness(businessId);

  if (
    !Number.isFinite(Number(overallScore)) ||
    Number(overallScore) < 0 ||
    Number(overallScore) > 100
  ) {
    throw new Error("Assessment score must be between 0 and 100.");
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new Error("Complete the assessment before saving.");
  }

  for (const item of answers) {
    if (!ASSESSMENT_ANSWERS.includes(item.answer)) {
      throw new Error("An assessment answer is invalid.");
    }
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("funding_assessment_attempts")
    .insert({
      business_id: businessId,
      user_id: user.id,
      overall_score: Number(overallScore),
      section_scores: sectionScores || {},
      recommendations: recommendations || [],
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (attemptError) throw attemptError;

  const answerRows = answers.map((item) => ({
    attempt_id: attempt.id,
    question_id: item.question_id,
    answer: item.answer,
    points_awarded: Number(item.points_awarded || 0),
  }));

  const { error: answersError } = await supabase
    .from("funding_assessment_answers")
    .insert(answerRows);

  if (answersError) {
    // Remove the incomplete attempt if saving its answers failed.
    await supabase
      .from("funding_assessment_attempts")
      .delete()
      .eq("id", attempt.id)
      .eq("user_id", user.id);

    throw answersError;
  }

  return attempt;
}

/**
 * Summarise records for the Funding dashboard.
 */
export function calculateFundingSummary(records = []) {
  const totalRequested = records.reduce(
    (sum, record) =>
      sum + Number(record.amount_requested || 0),
    0
  );

  const totalApproved = records
    .filter((record) => record.status === "approved")
    .reduce(
      (sum, record) =>
        sum + Number(record.amount_approved || 0),
      0
    );

  return {
    saved: records.filter((r) => r.status === "saved").length,
    inProgress: records.filter((r) => r.status === "applied").length,
    approved: records.filter((r) => r.status === "approved").length,
    declined: records.filter((r) => r.status === "declined").length,
    withdrawn: records.filter((r) => r.status === "withdrawn").length,
    totalRequested,
    totalApproved,
  };
}
