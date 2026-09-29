## Why

There is no page for a single user. The Users list is the only place to see someone, and it shows just name, title, email and the site admin flag. An admin can't see which groups a user belongs to or what rules they hold without opening every group. The list's name and title cells are also editable in place with nothing to signal that, which surprised the admin.

## What Changes

- Add a user profile page at `/admin/users/:userId` showing name, title, email, whether the email is verified, the site admin flag, site rules, and every group the user belongs to with its status, tier if any, and individual rules. A role label is shown next to a membership only when its rules exactly match a role preset's rule set.
- Add `GET /api/admin/users/:id` (siteAdmin only) returning the user and their memberships with group names; 404 for an unknown user.
- Make the profile the only place to edit a user: name and title (via the existing `PATCH /api/admin/users/:id`), the site admin toggle, the Reports link, and Delete all move there.
- Make the Users list read-only. Name, title and email each link to the profile, and site admin is shown as a read-only indicator. **BREAKING** (UI only): the in-place name/title editing, site admin toggle, Reports link and Delete button leave the list.
- Each group on the profile links to that group's screen.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-panel`: a siteAdmin can view a single user's profile with their group memberships, and the users list links to it.

## Impact

- `apps/api/src/routes/admin.ts`: new `GET /api/admin/users/:id`.
- `apps/web/src/pages/UserProfile.tsx` (new), `apps/web/src/pages/UsersAndGroups.tsx` (list made read-only), `apps/web/src/App.tsx` (route).
- Role labels currently live inside `AdminGroup.tsx`; they move to a small shared web module so both pages use them.
- No schema migration and no change to the existing PATCH or DELETE endpoints.
