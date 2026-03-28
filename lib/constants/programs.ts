export const PROGRAM_OPTIONS = ["BSIS", "BSIT", "BSCS", "BSCA"] as const;

export type ProgramOption = (typeof PROGRAM_OPTIONS)[number];
