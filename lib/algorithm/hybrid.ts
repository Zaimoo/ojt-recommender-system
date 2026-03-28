// ─────────────────────────────────────────────────────────────
// Hybrid scoring: TF-IDF similarity + program eligibility boost
// ─────────────────────────────────────────────────────────────

import { skillSimilarityScore } from "./tfidf";
import type { Company, RecommendationResult } from "@/types";

/** Weight constants – tuneable */
const SIMILARITY_WEIGHT = 0.7;
const PROGRAM_WEIGHT = 0.3;
const PROGRAM_MATCH_BONUS = 100; // full marks when program matches
const MAX_RECOMMENDATIONS = 10;

interface StudentInput {
  technical_skills: string[];
  program_id: string | null;
}

/**
 * Compute a hybrid score for every company and return them
 * sorted descending by hybridScore.
 */
export function generateRecommendations(
  student: StudentInput,
  companies: Company[],
): RecommendationResult[] {
  const allCompanySkills = companies.map((c) => c.required_skills);

  return companies
    .map((company) => {
      // 1️⃣ TF-IDF cosine similarity (0-100)
      const similarityScore = skillSimilarityScore(
        student.technical_skills,
        company.required_skills,
        allCompanySkills,
      );

      // 2️⃣ Program eligibility check
      const programMatch =
        !!student.program_id &&
        company.eligibility_programs.some(
          (p) =>
            p.trim().toLowerCase() === student.program_id!.trim().toLowerCase(),
        );

      // 3️⃣ Hybrid score
      const programScore = programMatch ? PROGRAM_MATCH_BONUS : 0;
      const hybridScore = Math.round(
        similarityScore * SIMILARITY_WEIGHT + programScore * PROGRAM_WEIGHT,
      );

      return {
        company,
        similarityScore,
        programMatch,
        hybridScore,
      } satisfies RecommendationResult;
    })
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, MAX_RECOMMENDATIONS);
}
