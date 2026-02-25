// ─────────────────────────────────────────────────────────────
// TF-IDF  &  Cosine-Similarity  engine
// ─────────────────────────────────────────────────────────────
//
// For skill-based matching the "documents" are skill-arrays.
// Term Frequency  (TF)  = occurrences of a term in a document
//                          (binary 0|1 for unique-keyword lists)
// Inverse Document Freq (IDF) = log(N / df)  where df = number of
//          documents containing the term, N = total documents.
// ─────────────────────────────────────────────────────────────

/** Normalise a skill string for consistent matching */
function normalise(skill: string): string {
  return skill.trim().toLowerCase();
}

/**
 * Build the complete vocabulary from all provided documents
 * (each document is a string-array of skills).
 */
export function buildVocabulary(docs: string[][]): string[] {
  const set = new Set<string>();
  docs.forEach((doc) => doc.forEach((s) => set.add(normalise(s))));
  return Array.from(set).sort();
}

/**
 * Compute Term-Frequency (TF) vector for a single document
 * against a given vocabulary. Uses binary TF (0 or 1) since
 * skill lists rarely contain duplicates.
 */
export function computeTF(doc: string[], vocabulary: string[]): number[] {
  const normDoc = new Set(doc.map(normalise));
  return vocabulary.map((term) => (normDoc.has(term) ? 1 : 0));
}

/**
 * Compute Inverse Document Frequency for each vocabulary term
 * across all provided documents.
 * Uses sklearn-style smoothed IDF:  log((1 + N) / (1 + df)) + 1
 * This guarantees every term has a positive weight even in small
 * corpora, preventing zero-vector cosine results.
 */
export function computeIDF(docs: string[][], vocabulary: string[]): number[] {
  const N = docs.length;
  return vocabulary.map((term) => {
    const df = docs.filter((d) => d.some((s) => normalise(s) === term)).length;
    return Math.log((1 + N) / (1 + df)) + 1;
  });
}

/**
 * Produce a TF-IDF vector for a single document.
 */
export function computeTFIDF(
  doc: string[],
  vocabulary: string[],
  idf: number[],
): number[] {
  const tf = computeTF(doc, vocabulary);
  return tf.map((t, i) => t * idf[i]);
}

/**
 * Cosine similarity between two equal-length numeric vectors.
 * Returns a value between 0 and 1 (or 0-100 when scaled).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return dot / denom;
}

/**
 * Convenience: compute cosine-similarity percentage (0-100)
 * between two skill arrays using TF-IDF weighting against a
 * corpus of all company skill-sets.
 *
 * @param studentSkills  – the student's technical_skills[]
 * @param companySkills  – the target company's required_skills[]
 * @param allCompanySkills – full corpus (all companies' required_skills[])
 * @returns score 0-100 (%)
 */
export function skillSimilarityScore(
  studentSkills: string[],
  companySkills: string[],
  allCompanySkills: string[][],
): number {
  // Build vocabulary from all company documents + student document
  const allDocs = [...allCompanySkills, studentSkills];
  const vocab = buildVocabulary(allDocs);
  const idf = computeIDF(allDocs, vocab);

  const studentVec = computeTFIDF(studentSkills, vocab, idf);
  const companyVec = computeTFIDF(companySkills, vocab, idf);

  return Math.round(cosineSimilarity(studentVec, companyVec) * 100);
}
