# Inline Suggestions Architecture

This document explains how the inline suggestions dropdowns were built for:

- Student Technical Skills input (dashboard)
- Coordinator Required Skills input (company form)

The goal is to provide live, multi-token (comma-separated) suggestions with both
mouse and keyboard support, sourced from the company required skills corpus.

## Data Source and Flow

### Source of Suggestions

- Source: `companies.required_skills` from Supabase.
- Reason: these are the canonical skills used for matching; reusing them reduces
  spelling drift (e.g., "Web Dev" vs "Web Development").

### Student Dashboard (server to client)

1. Server page fetches all company `required_skills`.
2. It flattens the array of arrays, removes duplicates, and sorts alphabetically.
3. The resulting array is passed into the client component as `skillSuggestions`.

Files:

- `app/dashboard/page.tsx`
  - Fetches `companies.required_skills`.
  - Builds `skillSuggestions`.
  - Passes the list to `StudentDashboardClient`.

- `app/dashboard/client.tsx`
  - Receives `skillSuggestions` and uses it to filter suggestions.

### Coordinator Panel (client only)

- The coordinator page already receives the full `companies` list.
- Suggestions are derived directly in the client:
  - `new Set(companies.flatMap(required_skills))`
  - Sorted alphabetically for consistent UX.

File:

- `app/coordinator/client.tsx`

## Components Used

### Input Components

- `Input` from `components/ui/input`
- `Label` from `components/ui/label`

These are plain inputs with no additional custom component abstraction.
The suggestion list is rendered as a custom dropdown beneath the input.

### Suggestion Dropdown

- Rendered as a `<div>` list of `<button>` rows.
- Appears only when there are filtered suggestions.
- Styled to look like a simple menu with hover and active states.

Key UI traits:

- Absolute positioned below the input (`absolute`, `z-10`, `mt-1`).
- Full width of the input container.
- Buttons use `onMouseDown` to avoid input blur when clicking.

## Parsing Comma-Separated Input

### Active Token Extraction

The input supports comma-separated skills. We only suggest against the
currently active token (the text after the last comma).

Function (both files use the same concept):

- `getActiveSkillToken(value: string)`
  - Finds the last comma.
  - Returns the trimmed substring after it.

### Selected Skills

To avoid suggesting items already chosen, the input value is split by commas
and trimmed into `selectedSkills`.

Pseudo-code:

```
const selectedSkills = value
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
```

## Suggestion Filtering

Filtering is case-insensitive and only shown when there is a non-empty token.

- Contains match: `skill.toLowerCase().includes(token.toLowerCase())`
- Excludes already-selected values
- Truncates list to a max of 8 items

This behavior is identical for student and coordinator views.

## Insertion Behavior

When a suggestion is picked:

1. Replace the active token with the suggestion.
2. Keep everything before the last comma unchanged.
3. Append ", " so the user can continue typing the next skill.
4. Re-focus the input.

Key function:

- `applySkillSuggestion(suggestion: string)`

## Keyboard Navigation

Keyboard support is enabled for both inputs.

### States

- `skillHighlightIndex` (student)
- `requiredSkillHighlightIndex` (coordinator)

### Key Bindings

- ArrowDown: move highlight down, wrap to top
- ArrowUp: move highlight up, wrap to bottom
- Enter: insert highlighted suggestion
- Escape: reset highlight to 0

### Why `onKeyDown`

- The input handles key events directly, so the user never has to leave the
  field to select a suggestion.

## Accessibility Notes

- Each suggestion button uses `aria-selected` to indicate the active item.
- Suggestions are still plain buttons for compatibility with focus/hover.
- The input remains fully keyboard-driven.

If you want richer accessibility (ARIA roles for combobox/listbox), we can add
`role="listbox"` and `role="option"` semantics with `aria-activedescendant`.

## Files and Key Functions

Student dashboard:

- `app/dashboard/page.tsx`
  - Builds `skillSuggestions`.
- `app/dashboard/client.tsx`
  - `getActiveSkillToken`
  - `applySkillSuggestion`
  - `handleSkillsKeyDown`

Coordinator panel:

- `app/coordinator/client.tsx`
  - `getActiveSkillToken`
  - `applySkillSuggestion`
  - `handleRequiredSkillsKeyDown`

## Extensibility Ideas

- Add a shared utility hook (e.g., `useInlineSuggestions`) to avoid duplication.
- Add a `skills` table as a canonical list that is not tied to companies.
- Add typeahead ranking (startsWith > contains).
- Add debounce and async query for large datasets.
- Add keyboard page-up/page-down or tab-to-accept behavior.
