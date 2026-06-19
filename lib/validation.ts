// ─────────────────────────────────────────────────────────────
// Shared input format validation (register + account settings)
// ─────────────────────────────────────────────────────────────

/**
 * Accepts a Philippine mobile number in either of two formats:
 *   • International:  +63 966 368 5824  (spaces optional)
 *   • Local:         09663685824
 */
export function isValidContactNumber(value: string): boolean {
  const compact = value.trim().replace(/\s+/g, "");
  return /^\+639\d{9}$/.test(compact) || /^09\d{9}$/.test(compact);
}

export const CONTACT_NUMBER_HINT =
  "Use +63 966 368 5824 or 09663685824 format.";

/** Accepts a student ID in the format YYYY-0000 (e.g. 2022-1894). */
export function isValidStudentId(value: string): boolean {
  return /^\d{4}-\d{4}$/.test(value.trim());
}

export const STUDENT_ID_HINT = "Format: 2022-1894 (YYYY-0000).";
