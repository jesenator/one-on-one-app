# EA Retreat 1:1 Scheduling App

A small private app for scheduling 1:1s at EA retreats. Magic-link login, half-hour availability grid, attendee browser, request/accept flow, and ICS calendar export. Mobile-friendly.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind
- Prisma + Vercel Postgres
- iron-session cookies
- Twilio SendGrid for magic-link emails
- `ics` for calendar export

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in values
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000.

If `SENDGRID_API_KEY` is not set, magic-link URLs are printed to the server console instead of being emailed — useful for local dev.

### Required env vars

| Name | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string. Vercel sets this automatically. |
| `SESSION_SECRET` | Random 32+ char string. Generate with `openssl rand -base64 32`. |
| `SENDGRID_API_KEY` | From SendGrid → Settings → API Keys. |
| `SENDGRID_FROM_EMAIL` | A verified sender in SendGrid. |
| `APP_URL` | Public URL, e.g. `https://your-app.vercel.app`. Used in magic-link emails. |

A `.env.example` file is included.

## Configuring retreats

Edit `config/retreats.json`. Each retreat has:

```json
{
  "id": "west-coast-ea-2026",
  "name": "West Coast EA Retreat",
  "timezone": "America/Los_Angeles",
  "active": true,
  "slots": {
    "start": "2026-04-10T20:00",
    "end":   "2026-04-12T19:00",
    "dayStart": "08:00",
    "dayEnd":   "20:30",
    "granularityMinutes": 30
  }
}
```

`adminEmails` is the list of users who get the admin panel. Add your email here before deploying.

After editing, redeploy (just `git push`).

## Deployment (Vercel + Vercel Postgres + SendGrid)

You need 3 free accounts: **GitHub**, **Vercel**, **SendGrid**.

### 1. Push to GitHub
```bash
git add .
git commit -m "initial"
gh repo create ea-retreat-1on1 --private --source=. --push
```

### 2. Create the Vercel project
1. Go to vercel.com → Add New → Project → import your GitHub repo.
2. Framework preset: Next.js (auto-detected). Click **Deploy**. The first deploy will fail because there's no DB yet — that's fine.

### 3. Add Vercel Postgres
1. In your project on Vercel: **Storage → Create → Postgres** (Hobby tier, free).
2. This auto-injects `DATABASE_URL` (and `POSTGRES_*`) env vars into the project.

### 4. Add SendGrid
1. Sign up at sendgrid.com.
2. **Settings → Sender Authentication → Single Sender Verification**: verify a "from" address (your personal email is fine).
3. **Settings → API Keys → Create API Key** (Full Access). Copy it.

### 5. Set Vercel env vars
In Vercel → Project → Settings → Environment Variables, add:
- `SESSION_SECRET` — `openssl rand -base64 32`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL` — the address you verified
- `APP_URL` — your Vercel URL, e.g. `https://ea-retreat-1on1.vercel.app`

### 6. Run the initial migration
The easiest way: from your local machine, pull the prod env and run the migration.

```bash
npx vercel env pull .env.production.local
npx dotenv -e .env.production.local -- prisma migrate deploy
```

(Or add `prisma migrate deploy && next build` as the build command in Vercel; one-time setup.)

### 7. Redeploy
Trigger a redeploy from the Vercel dashboard (or `git commit --allow-empty -m "redeploy" && git push`).

### 8. Become an admin
Add your email to `adminEmails` in `config/retreats.json`, commit, push. The Admin link appears in the app header for that email.

## Sharing with attendees
Share the URL privately. They sign in with their email + name, click the magic link, pick a retreat, and start blocking time.

## How meetings work
- Mark slots **available** on the Schedule tab.
- On Attendees, tap a person to see overlapping availability. Tap a green slot to request a 1:1.
- The recipient accepts/declines on the Requests tab.
- Once accepted, the slot is locked for both people. Cancel from Requests.
- Export individual meetings or your full schedule as `.ics`.

## Admin
Admins (set via `adminEmails`) can:
- See all attendees and remove them (cancels their meetings, clears their availability).
- See all pending/accepted meetings and cancel any of them.
