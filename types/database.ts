// ─────────────────────────────────────────────────────────────
// Database types – mirrors the Supabase schema
// ─────────────────────────────────────────────────────────────

export type UserRole = "student" | "coordinator" | "superadmin";
export type ProgramId = "BSIS" | "BSIT" | "BSCS" | "BSCA";

export interface Profile {
  id: string; // FK → auth.users.id
  email: string;
  role: UserRole;
  full_name: string;
  program_id: ProgramId | null;
  contact_number: string | null;
  student_id: string | null;
  resume_path: string | null;
  resume_url: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  company_overview: string;
  hr_name: string | null;
  logo_url: string | null;
  email_address: string | null;
  location_address: string | null;
  website_url: string | null;
  contact_number: string | null;
  created_by: string | null;
  created_by_name: string | null;
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

export interface CompanyApplication {
  id: string;
  company_id: string;
  user_id: string;
  applicant_name: string;
  applicant_email: string;
  message: string | null;
  status: string;
  resume_path: string;
  resume_url: string | null;
  cover_letter_path: string | null;
  cover_letter_url: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
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
      company_applications: {
        Row: CompanyApplication;
        Insert: Omit<CompanyApplication, "id" | "created_at">;
        Update: Partial<Omit<CompanyApplication, "id" | "created_at">>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: Partial<Omit<AuditLog, "id" | "created_at">>;
      };
    };
  };
}
