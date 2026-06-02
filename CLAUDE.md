# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Next.js on localhost:3000)
npm run build     # Production build
npm run lint      # ESLint check
```

No test suite is configured.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — used only by `createSuperadminClient()` for admin auth operations |
| `BREVO_API_KEY` | Brevo transactional email key (`xkeysib-...`); omit to skip email sending |
| `APP_MAIL_FROM` | Verified sender email address for Brevo |

## Architecture

**Stack:** Next.js 15 (App Router) + Supabase (auth, database, storage) + Tailwind CSS v4 + Tiptap (rich-text editor)

### Role-based routing

Three roles — `student`, `coordinator`, `superadmin` — each with their own section:

| Role | Route prefix | Entry point |
|---|---|---|
| student | `/dashboard` | `app/dashboard/` |
| coordinator | `/coordinator` | `app/coordinator/` |
| superadmin | `/superadmin` | `app/superadmin/` |

`middleware.ts` → `lib/supabase/middleware.ts` enforces role-based redirects on every request. Unauthenticated users are redirected to `/login`; authenticated users are redirected away from routes they don't own.

### Supabase clients

- `lib/supabase/client.ts` — browser client (use in `"use client"` components via `createClient()`)
- `lib/supabase/server.ts` — server client using Next.js cookies (use in server components and Server Actions)
- `lib/supabase/superadmin.ts` — service-role admin client; only used in `app/actions/superadmin.ts` for creating/deleting users via `admin.auth.admin.*`

### Auth context

`context/auth-context.tsx` wraps the app with `<AuthProvider>` (added in `app/layout.tsx`). It exposes `useAuth()` which returns `{ user, profile, role, loading, signOut }`. The provider uses `onAuthStateChange` as the single source of truth, avoiding race conditions with separate `getUser()` calls. It also polls every 10 minutes to refresh expiring sessions.

### Server Actions

All mutations go through Next.js Server Actions in `app/actions/`:

| File | Responsibilities |
|---|---|
| `auth.ts` | `signUp`, `signIn`, `signOut` |
| `company.ts` | CRUD for companies (coordinator); uploads logo to Supabase Storage `company-assets` bucket |
| `application.ts` | `applyToCompany` (inserts record + sends email via Brevo API), `updateApplicationStatus` |
| `superadmin.ts` | Create/update/delete coordinator accounts via `admin.auth.admin` |
| `student.ts` | Student profile updates |
| `account.ts` | Resume upload, profile edits |
| `recommendations.ts` | Calls the recommendation algorithm; no DB writes |
| `audit.ts` | `logAudit()` — called from every mutating action to write to `audit_logs` table |

### Recommendation algorithm

`lib/algorithm/` contains a pure TypeScript implementation (no external ML library):

1. **TF-IDF** (`tfidf.ts`) — builds a vocabulary from all company skill sets, computes TF-IDF vectors for both the student's `technical_skills` and each company's `required_skills`, then computes cosine similarity (0–100 score).
2. **Hybrid scoring** (`hybrid.ts`) — final score = `similarityScore × 0.7 + programScore × 0.3`. Program score is 100 if the student's `program_id` appears in the company's `eligibility_programs`, else 0. Top 10 results are returned sorted descending.

The algorithm runs server-side in the `getRecommendations` Server Action.

### Database schema (key tables)

Defined in `types/database.ts`:

- `profiles` — one row per user; `role` determines routing; `program_id` is one of `BSIS | BSIT | BSCS | BSCA`
- `student_profiles` — extended student data (`technical_skills: string[]`, `project_exp: string`); FK → `profiles.id`
- `companies` — `required_skills: string[]`, `eligibility_programs: ProgramId[]`; logo stored in Supabase Storage
- `company_applications` — `status` lifecycle: `submitted → under_review → accepted | rejected`
- `audit_logs` — append-only log of every mutating action

### Path aliases

`@/` resolves to the project root (configured in `tsconfig.json`).
