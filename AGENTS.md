<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes -- APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Pairwise project rules

## Always lint after changes
After making edits, always run `ReadLints` on all modified files before considering the task done. Fix any errors you introduced.

## Cookies and session
You cannot modify cookies (including `session.save()`) inside a Server Component. Only Server Actions and Route Handlers can set cookies. If you need to modify the session and redirect based on data fetched in a Server Component, call a Server Action to do it.

## Retreat timezone conventions
Retreat times in `config/retreats.json` use "fake UTC" -- the `slots.start`/`slots.end` values are local wall-clock times in the retreat's timezone, stored without a timezone suffix. They get parsed as UTC for storage (e.g. `new Date("2026-04-15T08:00:00Z")`). The `generateSlots` and `nowInRetreatTz` helpers in `lib/config.ts` follow this same convention. Never mix real UTC with these fake-UTC retreat times.

## JSON editing
When adding entries to JSON arrays (e.g. `retreats.json`), always check for the trailing comma between existing and new entries.

## Join flow
Join links are `/join/{retreatId}`. The join page checks if the user is already a member and auto-redirects them via a client-side `AutoSubmit` component that calls the server action (since we can't set cookies in Server Components).
