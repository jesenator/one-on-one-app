# Implementation Spec: Profile, Export/Import, Photo, and Data Deletion

This document is a complete implementation spec to be handed to Claude Code. Work through
each section in order, as later sections depend on earlier ones.

---

## 0. Overview of Changes

1. **Schema** — add profile fields to `User`
2. **Profile edit page** — `/profile`
3. **Profile view page** — `/users/[userId]`
4. **Photo preview endpoint** — `POST /api/profile/photo-preview`
5. **CSV export endpoint** — `GET /api/user/export`
6. **CSV import at signup** — extend the magic-link login flow
7. **Data deletion** — `deleteRetreatData()` function + admin button

---

## 1. Schema Changes

### 1a. User model — add profile fields

Add the following optional fields to the `User` model in `prisma/schema.prisma`:

```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String
  superAdmin Boolean  @default(false)
  createdAt  DateTime @default(now())

  // --- NEW PROFILE FIELDS ---
  tagline     String?   // short blurb shown under name
  careerStage String?   // free text, e.g. "PhD student", "Senior researcher"
  aboutMe     String?   // general about me
  goals       String?   // "What are you hoping to get out of the event?"
  canHelpWith String?   // "How can you help others?"
  linkedinUrl String?
  websiteUrl  String?
  photoUrl    String?   // resolved display URL (thumbnail if Drive, direct otherwise)
  // --- END NEW FIELDS ---

  attendances      RetreatAttendance[]
  availability     Availability[]
  requestsSent     MeetingRequest[]    @relation("from")
  requestsReceived MeetingRequest[]    @relation("to")
  retreatAdmins    RetreatAdmin[]
}
```

### 1b. Run migration

```bash
npx prisma migrate dev --name add_profile_fields
```

---

## 2. Profile Edit Page — `app/profile/page.tsx`

This is a protected page (redirect to login if no session).

### Behaviour
- On load: fetch current user from session, pre-populate all fields
- Form fields (all optional except name):
  - **Name** (text input, required)
  - **Tagline** (text input, max 100 chars, placeholder: "e.g. AI safety researcher at Anthropic")
  - **Career Stage** (text input, placeholder: "e.g. PhD student, Early career researcher, Senior professional")
  - **About Me** (textarea)
  - **What are you hoping to get out of the event?** (textarea)
  - **How can you help others?** (textarea)
  - **LinkedIn URL** (text input)
  - **Website URL** (text input)
  - **Photo** (see Section 4 for the preview flow)
- On submit: `PATCH /api/profile`
- Show success/error feedback inline

### API route — `app/api/profile/route.ts`

```typescript
// PATCH /api/profile
// Requires session. Updates the logged-in user's profile fields.
// Validate: name is non-empty, URLs look like URLs if provided.
// Returns updated user object.
```

Only update fields that are present in the request body (partial update). Do not allow
updating `email`, `superAdmin`, or `createdAt` through this endpoint.

---

## 3. Profile View Page — `app/users/[userId]/page.tsx`

Public within the app (any logged-in retreat attendee can view any other attendee's profile).

### Layout
- Photo (if set) — circular, ~80px. Fallback: initials avatar using first letter of name,
  coloured deterministically from user ID.
- Name, large
- Tagline, small muted text below name
- Career Stage — labelled field
- About Me — labelled section
- "Hoping to get out of the event" — labelled section, shown with the full question as heading
- "How I can help others" — labelled section
- LinkedIn / Website links — icon + link, open in new tab
- A "Request 1:1" button if the viewer is viewing someone else's profile, linking to the
  schedule tab with that person pre-selected (or however the existing request flow works)

### Data fetching
Server component. Fetch user by `userId` from Prisma. If user not found, 404. No need for
an API route — fetch directly in the server component.

### Wire into attendee browse view
Wherever attendee names are listed (the overlap/browse UI), wrap each name in a link to
`/users/[userId]`.

---

## 4. Photo Preview Endpoint — `app/api/profile/photo-preview/route.ts`

```typescript
// POST /api/profile/photo-preview
// Body: { url: string }
// Returns: { displayUrl: string, warning?: string }
```

### Logic

1. **Detect Google Drive links.** Patterns to match:
   - `https://drive.google.com/file/d/FILE_ID/view`
   - `https://drive.google.com/open?id=FILE_ID`
   - `https://drive.google.com/uc?id=FILE_ID`
   
   Extract `FILE_ID` and rewrite to thumbnail URL:
   ```
   https://drive.google.com/thumbnail?id=FILE_ID&sz=w300
   ```
   Set `warning` if the thumbnail request returns a non-image content-type (means file
   isn't publicly shared).

2. **Detect Dropbox links.** Replace `?dl=0` with `?raw=1` to get direct image URL.

3. **All other URLs.** Do a `HEAD` request server-side:
   - If `content-type` does not start with `image/`, return error "URL does not point to an image"
   - If `content-length` > 5MB, return `warning: "Image is large and may load slowly"`
   - Otherwise return URL as-is

4. **Store `displayUrl`**, not the original URL, when the user saves their profile.
   This means Drive thumbnails are resolved once at preview time, not on every page load.

### UI on the profile edit page
- Text input for URL
- "Preview" button (does not auto-fire on input change)
- On click: POST to this endpoint, show the returned image in a small preview box
- If warning, show it below the preview
- If error, show error, don't update the stored value
- "Clear" button to remove the photo

---

## 5. CSV Export — `app/api/user/export/route.ts`

```typescript
// GET /api/user/export
// Requires session.
// Returns a CSV file download of the logged-in user's profile data.
```

### CSV columns (in this order)

```
name,email,tagline,careerStage,aboutMe,goals,canHelpWith,linkedinUrl,websiteUrl,photoUrl
```

- One header row, one data row (this user only — not all users)
- Filename: `profile-export-YYYY-MM-DD.csv`
- Response headers:
  ```
  Content-Type: text/csv
  Content-Disposition: attachment; filename="profile-export-2026-05-19.csv"
  ```
- Properly escape fields containing commas or newlines (wrap in double quotes, escape
  internal double quotes as `""`)

### UI placement
Add an "Export my data" button on the profile edit page, below the form. Small, unobtrusive.

---

## 6. CSV Import at Signup

The magic-link flow currently collects email + name at the token creation step. Extend this
with an optional CSV upload.

### Where to add it
After the user clicks their magic link and is authenticated (i.e. on first load after
token validation, before redirecting to the main app), check if this is a new user
(no existing profile data beyond name/email). If so, show a one-time "Import your profile"
step.

### UI
- "Welcome! You can optionally upload a profile CSV from a previous retreat to pre-fill
  your profile."
- File input accepting `.csv` only
- "Skip" link to proceed without importing
- On upload: parse client-side, match columns by header name (case-insensitive), pre-fill
  the profile form fields
- User reviews and edits, then submits to `PATCH /api/profile` as normal

### Parsing logic (client-side)
- Read first row as headers
- Find the data row (row index 1)
- Map columns: `name`, `email` (ignore — don't overwrite session email), `tagline`,
  `careerStage`, `aboutMe`, `goals`, `canHelpWith`, `linkedinUrl`, `websiteUrl`, `photoUrl`
- Unknown columns are silently ignored
- Missing columns are left blank
- If the CSV has zero data rows or cannot be parsed, show an inline error

### Note on email matching
Do NOT use the email column in the CSV to look up or overwrite anything. The session already
knows who the user is. The CSV is purely a field pre-filler — the user still reviews
everything before it's saved.

---

## 7. Data Deletion

### 7a. Deletion function — `lib/deletion.ts`

Extract as a reusable function `deleteRetreatData(retreatId: string)`.

```typescript
async function deleteRetreatData(retreatId: string) {
  // 1. Find all userIds who attended ONLY this retreat (no other retreats)
  // 2. Delete MeetingRequests for this retreat
  // 3. Delete Availability for this retreat
  // 4. Delete RetreatAttendance for this retreat
  // 5. Delete RetreatAdmin rows for this retreat
  // 6. Delete User rows found in step 1 (users with no other retreat attendance)
  // 7. Delete the Retreat itself
  // All in a Prisma transaction.
}
```

**Important:** step 1 must identify users who ONLY attended this retreat. Users who have
attended multiple retreats should have their attendance/availability/meetings deleted
for this retreat, but their `User` row should remain.

```typescript
// Finding single-retreat users:
const attendances = await prisma.retreatAttendance.findMany({
  where: { retreatId },
  select: { userId: true }
})
const userIds = attendances.map(a => a.userId)

const multiRetreatUsers = await prisma.retreatAttendance.findMany({
  where: {
    userId: { in: userIds },
    retreatId: { not: retreatId }  // has attendance elsewhere
  },
  select: { userId: true }
})
const multiRetreatUserIds = new Set(multiRetreatUsers.map(a => a.userId))
const usersToDelete = userIds.filter(id => !multiRetreatUserIds.has(id))
```

### 7b. API route — `app/api/admin/retreats/[retreatId]/delete-data/route.ts`

```typescript
// POST /api/admin/retreats/[retreatId]/delete-data
// Requires session AND superAdmin = true.
// Calls deleteRetreatData(retreatId).
// Returns { success: true } or error.
```

### 7c. Admin UI

On the retreat admin page (`/admin/[retreatId]`), add a "Danger Zone" section at the
bottom containing a single **"Delete all retreat data"** button.

Interaction:
1. First click: button text changes to "Are you sure? This will permanently delete all
   profiles, availability, and meetings for this retreat." with a red "Yes, delete
   everything" confirm button and a "Cancel" link.
2. Confirm click: POST to the API route above, show a loading state, then redirect to
   `/admin` with a success message on completion.

No cron, no emails, no tokens. The super admin does this manually ~30 days after the
retreat ends.

---

## 8. Environment Variables to Add

None. All required variables (`DATABASE_URL`, `SESSION_SECRET`, `SENDGRID_API_KEY`,
`SENDGRID_FROM_EMAIL`, `APP_URL`) already exist in the codebase.

---

## 9. Suggested Implementation Order

1. Schema migration (Section 1) — everything depends on this
2. Profile API route `PATCH /api/profile` (Section 2)
3. Profile edit page `/profile` (Section 2) — without photo for now
4. Profile view page `/users/[userId]` (Section 3)
5. Wire attendee browse view to link to profile pages
6. Photo preview endpoint (Section 4) + add photo UI to profile edit page
7. CSV export endpoint (Section 5) + button on profile page
8. CSV import at signup (Section 6)
9. Deletion function `lib/deletion.ts` + API route (Section 7a, 7b)
10. Admin UI delete button (Section 7c)

---

## 10. Notes for Claude Code

- The existing codebase uses **Next.js App Router**, **TypeScript**, **Prisma**, **Tailwind CSS 4**,
  **iron-session** for auth, and **SendGrid** for email. Match these patterns throughout.
- For session access, follow the pattern already used in existing API routes.
- All API routes that mutate data must verify the user is authenticated via session.
  The deletion route additionally requires `superAdmin = true`.
- Keep all new UI consistent with the existing Tailwind styling in the app.
- Textarea fields for `aboutMe`, `goals`, `canHelpWith` should have a reasonable `rows`
  attribute (4–6) and no hard character limit in the DB, but show a soft character count
  hint in the UI (e.g. "recommended: under 300 words").
- `slotsStart` on `Retreat` is a string like `"2026-04-15T08:00"`, not a `DateTime`.
  Parse it with `new Date(retreat.slotsStart)` where needed.
