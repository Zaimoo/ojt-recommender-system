// ─────────────────────────────────────────────────────────────
// Database types – mirrors the Supabase schema
// ─────────────────────────────────────────────────────────────

export type UserRole = "student" | "coordinator";
export type ProgramId = "BSIS" | "BSIT" | "BSCS" | "BSCA";

export interface Profile {
  id: string; // FK → auth.users.id
  email: string;
  role: UserRole;
  full_name: string;
  program_id: ProgramId | null;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  email_address: string | null;
  location_address: string | null;
  website_url: string | null;
  contact_number: string | null;
  required_skills: string[];
  eligibility_programs: ProgramId[];
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string; // FK → profiles.id
  technical_skills: string[];
  project_exp: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Composite / view types used by the UI
// ─────────────────────────────────────────────────────────────

export interface RecommendationResult {
  company: Company;
  similarityScore: number; // 0‑100
  programMatch: boolean;
  hybridScore: number; // 0‑100
}

// ─────────────────────────────────────────────────────────────
// Supabase generated helper (minimal)
// ─────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      companies: {
        Row: Company;
        Insert: Omit<Company, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Company, "id" | "created_at" | "updated_at">>;
      };
      student_profiles: {
        Row: StudentProfile;
        Insert: Omit<StudentProfile, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<StudentProfile, "id" | "created_at" | "updated_at">
        >;
      };
    };
  };
}
