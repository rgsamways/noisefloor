## Context

Accounts are created only as a side effect of a first magic-link sign-in (Better Auth's magic-link plugin, no passwords, no other providers). Admins can list, edit, and delete users (`/api/admin/users`) but not create them. Group access can be granted by invitation, which emails the person. Pending invitations for an email are converted to memberships on that user's first session resolution (`applyPendingGroupInvitations`).

## Goals / Non-Goals

**Goals:**
- A siteAdmin creates an account directly, silently, with an optional initial group.
- The created account is what the person lands in when they later sign in by magic link.

**Non-Goals:**
- Passwords, set-password flows, or password reset (decided against).
- Sending a welcome or notification email on create.
- Setting siteAdmin or site rules at creation; the existing user edit screen handles that afterward.
- Bulk or CSV user creation.

## Decisions

### Decision 1: Create the row through Better Auth's internal adapter

Use `auth.$context` `internalAdapter.createUser` rather than a raw Drizzle insert into `user`. That keeps ID generation and timestamps identical to accounts created by first sign-in and avoids drift if Better Auth's expectations change. `emailVerified` is left false; the first magic-link sign-in marks it verified.

Alternative considered: raw `db.insert(user)`. Simpler, but it duplicates ID and default logic Better Auth owns. To be confirmed against the installed Better Auth version during implementation; fall back to a raw insert only if the adapter API is unavailable, with a comment saying why.

### Decision 2: No `account` row

Magic-link accounts here do not depend on a credential `account` row (there is no password). Creating only the `user` row matches the state after a first magic-link sign-in. Verify during implementation that sign-in against a pre-created row does not create a duplicate or error.

### Decision 3: Email matching is lowercased

Store the email lowercased and check for an existing account case-insensitively, matching how invitations are stored and compared.

### Decision 4: Initial group is a direct membership

If a group is supplied, insert into `group_memberships` directly (active, with tier and rules), reusing the same validation the invite route uses (rule keys, group exists). If the user creation succeeds but membership fails, the request should not leave a half-applied result: do both in one transaction where the adapter allows, otherwise create the membership first-failing checks (group exists, rules valid) before creating the user.

### Decision 5: Interaction with pending invitations

If a pending invitation already exists for the same email, it stays and is applied on first sign-in as usual. No special handling; the duplicate-membership check in `applyPendingGroupInvitations` already covers overlap with an initial group.

## Risks / Trade-offs

- A created user never receives an email, so they only know to sign in if the admin tells them. Accepted; that is the point of the feature.
- Better Auth internals could change across versions. Mitigated by a test that signs in a created user through the real magic-link path.
