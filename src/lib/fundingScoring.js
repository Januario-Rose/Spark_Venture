
const ANSWER_MULTIPLIERS = {
  yes: 1,
  partial: 0.5,
  no: 0,
};

const SECTION_RECOMMENDATIONS = {
  "Business legitimacy": {
    title: "Strengthen business registration",
    actions: [
      "Confirm that your business details and registration records are up to date.",
      "Prepare your CIPC registration documents where applicable.",
      "Check that your business bank account details match your application.",
    ],
  },

  "Financial records": {
    title: "Improve financial recordkeeping",
    actions: [
      "Keep recent business bank statements ready.",
      "Record income, expenses, and outstanding debts consistently.",
      "Prepare up-to-date financial statements or management accounts where required.",
    ],
  },

  "Use of funds": {
    title: "Clarify how funding will be used",
    actions: [
      "Write a clear breakdown of the amount you need.",
      "Obtain supplier quotations for equipment or other major purchases.",
      "Explain how the funding will help the business grow or operate.",
    ],
  },

  "Repayment or impact case": {
    title: "Strengthen your business case",
    actions: [
      "Prepare a realistic business plan with measurable objectives.",
      "For loans, estimate monthly repayments and demonstrate affordability.",
      "For grants or investments, explain the expected business impact and growth potential.",
    ],
  },

  Documents: {
    title: "Prepare your supporting documents",
    actions: [
      "Create a checklist of the documents required by your chosen funder.",
      "Prepare your business plan, quotations, and financial records.",
      "Check whether tax compliance documents or B-BBEE information are required.",
    ],
  },

  "Credit and compliance": {
    title: "Review credit and compliance readiness",
    actions: [
      "Check tax compliance requirements with SARS.",
      "Review existing business debt and repayment obligations.",
      "Check the specific funder's credit, regulatory, and B-BBEE requirements where applicable.",
    ],
  },
};

/**
 * Convert one answer into weighted points.
 */
export function calculateQuestionPoints(question, answer) {
  const multiplier = ANSWER_MULTIPLIERS[answer];

  if (multiplier === undefined) {
    throw new Error(`Invalid assessment answer: ${answer}`);
  }

  const weight = Number(question.weight);

  if (!Number.isFinite(weight) || weight <= 0) {
    throw new Error("Each assessment question must have a positive weight.");
  }

  return Number((weight * multiplier).toFixed(2));
}

/**
 * Calculate the overall and section readiness scores.
 *
 * questions: array from getFundingAssessmentQuestions()
 * answers: object keyed by question ID, e.g. { [questionId]: "yes" }
 */
export function calculateFundingReadiness(questions, answers) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No assessment questions are available.");
  }

  if (!answers || typeof answers !== "object") {
    throw new Error("Please answer the assessment questions.");
  }

  const sectionTotals = {};
  let totalWeight = 0;
  let totalPoints = 0;
  let answeredCount = 0;

  const answerRows = questions.map((question) => {
    const answer = answers[question.id];

    if (!Object.hasOwn(ANSWER_MULTIPLIERS, answer)) {
      throw new Error("Please answer every question before continuing.");
    }

    const weight = Number(question.weight);
    const pointsAwarded = calculateQuestionPoints(question, answer);

    if (!sectionTotals[question.section]) {
      sectionTotals[question.section] = {
        section: question.section,
        earned: 0,
        possible: 0,
        score: 0,
        questionCount: 0,
      };
    }

    const section = sectionTotals[question.section];

    section.earned += pointsAwarded;
    section.possible += weight;
    section.questionCount += 1;

    totalWeight += weight;
    totalPoints += pointsAwarded;
    answeredCount += 1;

    return {
      question_id: question.id,
      question: question.question,
      section: question.section,
      answer,
      weight,
      points_awarded: pointsAwarded,
    };
  });

  if (totalWeight <= 0) {
    throw new Error("The assessment has no valid scoring weights.");
  }

  const sectionScores = Object.fromEntries(
    Object.entries(sectionTotals).map(([name, section]) => [
      name,
      {
        ...section,
        earned: Number(section.earned.toFixed(2)),
        possible: Number(section.possible.toFixed(2)),
        score: Number(
          ((section.earned / section.possible) * 100).toFixed(2)
        ),
      },
    ])
  );

  const overallScore = Number(
    ((totalPoints / totalWeight) * 100).toFixed(2)
  );

  const weakestSections = Object.values(sectionScores)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const recommendations = weakestSections.map((section) => {
    const guidance = SECTION_RECOMMENDATIONS[section.section];

    return {
      section: section.section,
      score: section.score,
      title: guidance?.title || `Improve ${section.section}`,
      actions: guidance?.actions || [
        "Review the requirements for your target funding opportunity.",
        "Identify missing information or supporting evidence.",
        "Complete the outstanding tasks and reassess your readiness.",
      ],
    };
  });

  return {
    overallScore,
    totalPoints: Number(totalPoints.toFixed(2)),
    totalWeight: Number(totalWeight.toFixed(2)),
    answeredCount,
    totalQuestions: questions.length,
    sectionScores,
    weakestSections,
    recommendations,
    answers: answerRows,
    completed: answeredCount === questions.length,
  };
}

/**
 * Provide a descriptive label for the score.
 * These labels describe preparation, not funding eligibility.
 */
export function getReadinessLabel(score) {
  if (score >= 85) return "Well prepared";
  if (score >= 70) return "Good progress";
  if (score >= 50) return "Needs improvement";
  return "Early preparation";
}
