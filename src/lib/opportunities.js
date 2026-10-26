
import { supabase } from "./supabaseClient";

// Load opportunities with optional filters.
export async function getOpportunities({
  search = "",
  type = "all",
  sector = "all",
  province = "all",
  status = "all",
} = {}) {
  let query = supabase
    .from("opportunities")
    .select("*")
    .order("closing_date", { ascending: true });

  if (search.trim()) {
    const term = search.trim().replace(/[,%()]/g, "");
    if (term) {
      query = query.or(
        `title.ilike.%${term}%,organisation.ilike.%${term}%,summary.ilike.%${term}%`
      );
    }
  }

  if (type !== "all") {
    query = query.eq("opportunity_type", type);
  }

  if (sector !== "all") {
    query = query.eq("sector", sector);
  }

  if (province !== "all") {
    query = query.eq("province", province);
  }

  // Closing urgency is calculated from the closing date in the UI.
  if (status === "closed") {
    query = query.lt("closing_date", new Date().toISOString().slice(0, 10));
  } else if (status === "open") {
    query = query.gte("closing_date", new Date().toISOString().slice(0, 10));
  } else if (status === "closing_soon") {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);

    query = query
      .gte("closing_date", today.toISOString().slice(0, 10))
      .lte("closing_date", sevenDaysLater.toISOString().slice(0, 10));
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((opportunity) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const closingDate = opportunity.closing_date
      ? new Date(`${opportunity.closing_date}T00:00:00`)
      : null;

    const daysLeft = closingDate
      ? Math.ceil((closingDate - today) / (1000 * 60 * 60 * 24))
      : null;

    let calculatedStatus = "open";

    if (daysLeft !== null && daysLeft < 0) {
      calculatedStatus = "closed";
    } else if (daysLeft !== null && daysLeft <= 7) {
      calculatedStatus = "closing_soon";
    }

    return {
      ...opportunity,
      status: calculatedStatus,
      daysLeft,
    };
  });
}

// Load one opportunity by ID.
export async function getOpportunityById(id) {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

// Load this business's saved/application pipeline.
export async function getBusinessOpportunityRecords(businessId) {
  if (!businessId) {
    throw new Error("A business ID is required.");
  }

  const { data, error } = await supabase
    .from("saved_opportunities")
    .select("*, opportunity:opportunities(*)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

// Save an opportunity for the current business.
export async function saveOpportunity({
  businessId,
  userId,
  opportunityId,
}) {
  if (!businessId || !userId || !opportunityId) {
    throw new Error("Business, user, and opportunity IDs are required.");
  }

  const { data, error } = await supabase
    .from("saved_opportunities")
    .upsert(
      {
        business_id: businessId,
        user_id: userId,
        opportunity_id: opportunityId,
        status: "saved",
      },
      {
        onConflict: "business_id,opportunity_id",
      }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Mark an opportunity as applied.
export async function markOpportunityApplied({
  businessId,
  userId,
  opportunityId,
  notes = "",
  appliedAt = new Date().toISOString(),
}) {
  if (!businessId || !userId || !opportunityId) {
    throw new Error("Business, user, and opportunity IDs are required.");
  }

  const { data, error } = await supabase
    .from("saved_opportunities")
    .upsert(
      {
        business_id: businessId,
        user_id: userId,
        opportunity_id: opportunityId,
        status: "applied",
        notes: notes.trim() || null,
        applied_at: appliedAt,
      },
      {
        onConflict: "business_id,opportunity_id",
      }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Update an existing pipeline status: saved, applied, won, or lost.
export async function updateOpportunityStatus({
  recordId,
  status,
  notes,
}) {
  const allowedStatuses = ["saved", "applied", "won", "lost"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid opportunity status.");
  }

  const updates = { status };

  if (notes !== undefined) {
    updates.notes = notes.trim() || null;
  }

  if (status === "applied") {
    updates.applied_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("saved_opportunities")
    .update(updates)
    .eq("id", recordId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Remove a saved opportunity from the pipeline.
export async function unsaveOpportunity(recordId) {
  const { error } = await supabase
    .from("saved_opportunities")
    .delete()
    .eq("id", recordId);

  if (error) throw error;
}

export async function getAssessmentQuestions() {
  const { data, error } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("is_active", true)
    .order("section")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getAssessmentHistory(businessId) {
  if (!businessId) {
    throw new Error("A business ID is required.");
  }

  const { data, error } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("business_id", businessId)
    .order("completed_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getSavedOpportunityRecords(businessId) {
  if (!businessId) {
    throw new Error("A business ID is required.");
  }

  const { data, error } = await supabase
    .from("saved_opportunities")
    .select(`
      id,
      business_id,
      opportunity_id,
      status,
      notes,
      applied_at,
      created_at,
      opportunity:opportunities(*)
    `)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getOpportunityCounts(businessId) {
  const records = await getSavedOpportunityRecords(businessId);

  return {
    saved: records.filter((item) => item.status === "saved").length,
    applied: records.filter((item) => item.status === "applied").length,
    won: records.filter((item) => item.status === "won").length,
    lost: records.filter((item) => item.status === "lost").length,
  };
}
