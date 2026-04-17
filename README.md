# EA Retreat 1:1 Scheduler

Schedule 1:1 meetings at EA retreats. Magic-link login, half-hour availability grid, request/accept flow, and ICS calendar export.

## Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- Prisma + Postgres
- iron-session (encrypted cookies)
- SendGrid (magic-link emails)
- `ics` (calendar export)

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in values
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000.

If `SENDGRID_API_KEY` is empty, magic-link URLs print to the server console instead of being emailed.

### Env vars

See `.env.example`. All are required for production:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | 32+ char secret (`openssl rand -base64 32`) |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender address in SendGrid |
| `APP_URL` | Public URL (e.g. `https://www.pairwise.now`) |

## Configuring retreats

Retreats are stored in the database and managed through the UI. Super admins can create, edit, and deactivate retreats at `/admin`, and assign per-retreat admins from `/admin/<retreatId>`.

The first super admin is bootstrapped via the initial migration (see `prisma/migrations/.../migration.sql`). After that, super admins grant each other access from the `/admin` page.

### Shortlinks

`next.config.ts` contains a `shortlinks` map that redirects short paths (e.g. `/wc`) to the full join URL (`/join/west-coast-ea-2026`). Add new entries there and restart the dev server.

## Deploy to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com) (Next.js auto-detected)
3. Add Postgres via **Storage > Create > Postgres** (injects `DATABASE_URL` automatically)
4. Set env vars in **Settings > Environment Variables**:
   - `SESSION_SECRET`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `APP_URL`
5. Run the initial migration from your machine:
   ```bash
   npx vercel env pull .env.production.local
   npx dotenv -e .env.production.local -- prisma migrate deploy
   ```
6. Redeploy

## How it works

1. Users sign in with email via magic link, pick a retreat
2. Mark half-hour slots as **available** on the Schedule tab
3. Browse other attendees and see overlapping availability
4. Request a 1:1 by tapping a shared open slot
5. Recipient accepts or declines on the Requests tab
6. Accepted meetings lock the slot for both people
7. Export meetings as `.ics` calendar files

## Admin

- **Super admins** (`User.superAdmin = true`) can create retreats, manage any retreat, and grant/revoke super admin access at `/admin`.
- **Retreat admins** (rows in `RetreatAdmin`) can manage a single retreat's settings, attendees, and meetings at `/admin/<retreatId>`.
