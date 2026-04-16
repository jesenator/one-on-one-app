<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes -- APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Pairwise project rules

## Always lint after changes
After making edits, always run `ReadLints` on all modified files before considering the task done. Fix any errors you introduced.

## Cookies and session
You cannot modify cookies (including `session.save()`) inside a Server Component. Only Server Actions and Route Handlers can set cookies. If you need to modify the session and redirect based on data fetched in a Server Component, call a Server Action to do it.

## Retreat config is in Postgres
Retreat configuration lives in the `Retreat` table in Postgres (not a JSON file). Use `getRetreat(id)` and `getActiveRetreats()` from `lib/config.ts` -- both are async and return Prisma `Retreat` objects.

## Retreat timezone conventions
Retreat times use "fake UTC" -- the `slotsStart`/`slotsEnd` fields are local wall-clock times in the retreat's timezone, stored as strings like `"2026-04-15T08:00"`. They get parsed as UTC for storage (e.g. `new Date("2026-04-15T08:00:00Z")`). The `generateSlots` and `nowInRetreatTz` helpers in `lib/config.ts` follow this same convention. Never mix real UTC with these fake-UTC retreat times.

## Admin model
There are two tiers of admin: **super admins** (`user.superAdmin = true`) who can manage all retreats and create new ones at `/admin`, and **retreat admins** (per-retreat via `RetreatAdmin` table) who can manage a specific retreat at `/admin/[retreatId]`. Use `isSuperAdmin(userId)` and `isRetreatAdmin(userId, retreatId)` from `lib/config.ts`.

## Join flow
Join links are `/join/{retreatId}`. The join page checks if the user is already a member and auto-redirects them via a client-side `AutoSubmit` component that calls the server action (since we can't set cookies in Server Components).
