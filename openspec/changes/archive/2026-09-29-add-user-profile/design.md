## Context

The Users list (`UsersAndGroups.tsx`) shows name, title, email and a siteAdmin toggle, with name and title editable in place, plus Reports and Delete buttons per row. The API already offers `GET /api/admin/users` (list), `PATCH /api/admin/users/:id` (name, title, siteAdmin, siteRules) and `DELETE /api/admin/users/:id`. Memberships live in `group_memberships` and store only `rules`, `tier` and `status`; roles are presets whose rule sets are defined in `@noisefloor/shared`, applied once to prefill a checklist and never stored. Role display names currently sit inside `AdminGroup.tsx`.

## Goals / Non-Goals

**Goals:**
- One page per user with their info and a clear view of their groups and rules.
- All user edits in one place, with visible controls.

**Non-Goals:**
- Editing a user's group memberships from the profile (the group screen stays the place for that; the profile links to it).
- Editing `siteRules` (shown read-only for now; no UI for it exists today).
- Any schema change.

## Decisions

### Decision 1: Arrangement of controls

The profile holds every edit: name and title inputs with an explicit Save button, the siteAdmin toggle, a Reports link, and Delete with a confirm prompt that returns to the list on success. The list becomes read-only: Name, Title and Email link to the profile, and siteAdmin is a read-only indicator. This follows the direction that all profile changes live on the profile page and avoids two places to do the same thing. The cost is one more click to delete or toggle admin; accepted.

### Decision 2: One profile endpoint

`GET /api/admin/users/:id` returns the user fields plus `emailVerified` and a `memberships` array (membership id, groupId, groupName, status, tier, rules), from a join of `group_memberships` and `groups`. Existing PATCH and DELETE are reused unchanged, including their bootstrap-admin, last-siteAdmin and self-delete protections, which the profile surfaces as inline errors.

### Decision 3: Role label by exact match

Since roles aren't stored, the profile derives a label: if a membership's rule set, compared as sets, equals a role preset's rule set, show that role's name. Otherwise show only the individual rules. Matching is a display convenience computed in the browser from `GROUP_ROLE_DEFAULT_RULES`; it never affects access. When two presets have identical rules, show the first match.

### Decision 4: Share role labels

Move the role display-name map out of `AdminGroup.tsx` into a small shared web module so the group screen and the profile use one source.

### Decision 5: Explicit save for name and title

Inputs are edited locally and saved with a Save button, disabled until something changed, instead of saving on blur. That removes the hidden-editing surprise and the blur/race handling the list needed.

## Risks / Trade-offs

- Removing per-row delete and admin toggle from the list is a behavior change for anyone used to it. Accepted per the decision to centralize edits.
- A role label can disappear if a preset's rules change later. It is derived, not stored, so this only changes the display.
