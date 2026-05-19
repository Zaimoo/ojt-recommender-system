# Implementation Plan: Full UI Redesign

## Overview

Redesign the entire system UI inspired by the reference dashboard — clean white cards, structured layout, consistent headers, and a collapsible icon sidebar with Lucide icons. The blue color theme (`blue-600`) is preserved. Both student and coordinator experiences will share the same layout shell and design language.

---

## Design System

### Color Palette (retained + formalized)
| Token | Value | Usage |
|---|---|---|
| Primary | `#2563eb` (blue-600) | Active nav, buttons, accents |
| Primary light | `#eff6ff` (blue-50) | Active nav background |
| Surface | `#ffffff` | Sidebar, cards, header |
| Background | `#f1f5f9` (slate-100) | Page background |
| Border | `#e2e8f0` (slate-200) | Dividers, card borders |
| Text primary | `#0f172a` (slate-900) | Headings |
| Text secondary | `#64748b` (slate-500) | Sub-labels, hints |

### Typography
- Import **Inter** from Google Fonts via `globals.css` — replaces the current Arial fallback.

### Sidebar Dimensions
| State | Width |
|---|---|
| Expanded | `256px` |
| Collapsed | `64px` |

---

## Component Architecture

### [NEW] `components/ui/app-sidebar.tsx`
The single source-of-truth sidebar for the whole app — used by both student and coordinator layouts.

**Features:**
- **Collapse toggle button** — a `ChevronLeft` / `ChevronRight` icon anchored to the right edge of the sidebar, like the 2nd reference image.
- **Collapsed state**: shows icon only (20×20px), centered. No labels.
- **Expanded state**: shows icon + label side by side.
- **Tooltips on hover** when collapsed (using a simple `title` attribute or a small absolutely-positioned label) — shows the nav item name.
- **Collapse state persisted** to `localStorage` so it survives page navigation.
- **Top section**: App logo icon + "OJT Recommender" title (hidden when collapsed) + collapse button.
- **Middle section**: Nav items (passed as props so both roles can use it).
- **Bottom section**: User avatar pill + name/role (icon-only avatar when collapsed) + Sign Out button.

**Props:**
```ts
interface NavItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  active: boolean;
}

interface AppSidebarProps {
  profile: Profile | null;
  role: "student" | "coordinator";
  navItems: NavItem[];
}
```

### Sidebar Nav Items

**Student:**
| Icon | Label | Route |
|---|---|---|
| `LayoutDashboard` | Dashboard | `/dashboard` |
| `Sparkles` | Recommendations | `/dashboard/recommendations` |
| `FileText` | Applications | `/dashboard/applications` |
| `Settings` | Account Settings | `/dashboard/account` |

**Coordinator:**
| Icon | Label | Action |
|---|---|---|
| `LayoutDashboard` | Dashboard | tab: `dashboard` |
| `Users` | Students | tab: `students` |
| `Building2` | Companies | tab: `companies` |
| `Settings` | Account Settings | `/coordinator/account` |

---

## Page Layout Shell

Every authenticated page will follow this exact structure:

```
┌──────────────────────────────────────────────────┐
│  [Sidebar 64px/256px]  │  [Main content area]    │
│                        │  ┌──────────────────┐   │
│  Logo + Nav + User     │  │ Header bar       │   │
│                        │  │ (page title)     │   │
│                        │  ├──────────────────┤   │
│                        │  │ <main> content   │   │
│                        │  └──────────────────┘   │
└──────────────────────────────────────────────────┘
```

The **header bar** is a thin white bar (`h-16`) with:
- Page title (left, `text-xl font-semibold`)
- Optional right-side slot (e.g. buttons like "Generate Recommendations", "Add Company")

---

## Proposed Changes

---

### Shared Components

#### [NEW] [app-sidebar.tsx](file:///c:/WORK/ojt-company-recommendation-system/components/ui/app-sidebar.tsx)
Collapsible sidebar with Lucide icons, tooltips, localStorage persistence, user pill, sign-out.

---

### Auth Pages

#### [MODIFY] [login/page.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/login/page.tsx)
- Two-column layout: left panel with branded blue gradient + tagline illustration area; right panel with the login form.
- On mobile: single column, form only.
- Better typography hierarchy, subtle input focus states.

#### [MODIFY] [register/page.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/register/page.tsx)
- Same two-column layout as login for visual consistency.

---

### Student Layout & Pages

#### [MODIFY] [student-sidebar.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/dashboard/_components/student-sidebar.tsx)
- Replace current implementation with a thin wrapper around `AppSidebar`, passing the student nav items and `role="student"`.

#### [MODIFY] [dashboard/client.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/dashboard/client.tsx)
- **Header**: greeting (`Hello, [Name]`) + sub-text on left; "Save Skills" / "Save Program" button moved into card headers.
- **Stats row**: Profile Completion % shown as a styled stat card with progress ring or bar. Recent Activity as a second stat card.
- **Skills & Program cards**: refine spacing, make the skill tag input visually cleaner.
- **Recommendations card**: becomes a CTA card linking to the recommendations page (no longer embedded inline).

#### [MODIFY] [applications/page.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/dashboard/applications/page.tsx)
- Replace plain list rows with polished table rows: company name, date, status badge, action links.
- Header bar: "Application History" title on left; empty right slot.
- Empty state illustration text when no applications exist.

#### [MODIFY] [recommendations/recommendations-client.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/dashboard/recommendations/recommendations-client.tsx)
- Header right slot: "Generate Recommendations" primary button.
- Insight stat cards (Highest Match, Average Match, Program Matches) styled consistently with the dashboard stat row.
- Recommendation cards: company name + score badge + skills chips. Clean hover lift effect.

#### [MODIFY] [dashboard/account/page.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/dashboard/account/page.tsx)
- Header: "Account Settings".
- Content: `AccountForm` (no changes to the form itself, just consistent page shell).

---

### Coordinator Layout & Pages

#### [MODIFY] [coordinator-sidebar.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/coordinator/_components/coordinator-sidebar.tsx)
- Same pattern as student sidebar — thin wrapper around `AppSidebar` with coordinator nav items.
- The `onTabChange` prop is forwarded to tab-switching nav items (for in-page tabs like Dashboard/Students/Companies).

#### [MODIFY] [coordinator/client.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/coordinator/client.tsx)
- **Dashboard tab**: Stat cards (Companies count, Students count) styled with icons and consistent grid.
- **Students tab**: Data table with clean row spacing, program badges.
- **Companies tab**: Company cards redesigned — logo thumbnail, info chips, edit/delete actions on the right. "Add Company" button moved to the header right slot.
- The create/edit form becomes a slide-in panel or an inline card that appears above the list (already inline, just better styled).

#### [MODIFY] [coordinator/account/page.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/coordinator/account/page.tsx)
- Same pattern as student account — consistent shell.

---

### Shared Content Pages

#### [MODIFY] [companyDetails/[id]/page.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/companyDetails/%5Bid%5D/page.tsx)
- Redesign the company detail card: banner image full-width at top, then info grid below.
- "Apply" button stays in the header right slot (student only).
- Consistent header bar + sidebar (already role-aware from previous work).

#### [MODIFY] [companyDetails/[id]/apply/page.tsx](file:///c:/WORK/ojt-company-recommendation-system/app/companyDetails/%5Bid%5D/apply/page.tsx)
- Apply form card gets consistent page shell styling.
- Section header: company name + "Application Form" subtitle.

---

### Global Styles

#### [MODIFY] [globals.css](file:///c:/WORK/ojt-company-recommendation-system/app/globals.css)
- Import Inter from Google Fonts.
- Set `font-family: 'Inter', sans-serif` on `body`.
- Add scrollbar styling (thin, blue thumb).
- Add a `.sidebar-tooltip` utility for collapsed-state tooltips.

---

## Verification Plan

### Build
- `npm run build` — must pass with 0 TypeScript errors.

### Manual
1. Expand/collapse sidebar — verify smooth transition, icons-only state, tooltips, localStorage persistence across page reloads.
2. Student flow: Dashboard → Recommendations → Applications → Account → Company Details → Apply.
3. Coordinator flow: Dashboard tab → Students tab → Companies tab → Account.
4. Both flows: verify sidebar active state highlights the correct item on every page.
5. Mobile (< 768px): verify sidebar doesn't overflow or break layout.

---

## Open Questions

> [!NOTE]
> The coordinator panel currently uses in-page tab switching (not separate routes) for Dashboard/Students/Companies. The redesign will keep this behavior — only Account Settings uses a separate route. This means the sidebar for those three items calls `onTabChange` instead of navigating. Is this acceptable, or should each tab become its own route?

> [!NOTE]
> Should the login/register pages include an illustration or just keep the branded gradient panel with text? I can generate an illustration using the image generation tool.
