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
| `APP_URL` | Public URL (e.g. `https://your-app.vercel.app`) |

## Configuring retreats

Edit `config/retreats.json`:

```json
{
  "id": "west-coast-ea-2026",
  "name": "West Coast EA Retreat",
  "timezone": "America/Los_Angeles",
  "active": true,
  "slots": {
    "start": "2026-04-10T20:00",
    "end": "2026-04-12T19:00",
    "dayStart": "08:00",
    "dayEnd": "20:30",
    "granularityMinutes": 30
  }
}
```

Add admin emails to `adminEmails` in the same file.

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

Admins (listed in `config/retreats.json` under `adminEmails`) can remove attendees and cancel any meeting.
