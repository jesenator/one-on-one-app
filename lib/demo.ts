import type { Retreat } from "@prisma/client";
import { generateSlots, groupSlotsByDay, nowInRetreatTz } from "./config";

export const DEMO_RETREAT_ID = "demo-retreat";

export const DEMO_ME = {
  id: "demo-me",
  name: "Alex (You)",
  email: "you@example.com",
};

export type DemoUser = { id: string; name: string; email: string };

export const DEMO_OTHERS: DemoUser[] = [
  { id: "demo-priya", name: "Priya Shah", email: "priya@example.com" },
  { id: "demo-jordan", name: "Jordan Lee", email: "jordan@example.com" },
  { id: "demo-mei", name: "Mei Tanaka", email: "mei@example.com" },
  { id: "demo-sam", name: "Sam Okafor", email: "sam@example.com" },
  { id: "demo-rosa", name: "Rosa Hernandez", email: "rosa@example.com" },
  { id: "demo-yusuf", name: "Yusuf Khan", email: "yusuf@example.com" },
  { id: "demo-lena", name: "Lena Petrova", email: "lena@example.com" },
  { id: "demo-aditi", name: "Aditi Rao", email: "aditi@example.com" },
  { id: "demo-tomas", name: "Tomás Silva", email: "tomas@example.com" },
  { id: "demo-claire", name: "Claire Dubois", email: "claire@example.com" },
  { id: "demo-noah", name: "Noah Andersson", email: "noah@example.com" },
  { id: "demo-fatima", name: "Fatima Al-Sayed", email: "fatima@example.com" },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng01(seed: string): number {
  return hash(seed) / 0xffffffff;
}

/**
 * Build a 3-day demo retreat running Friday through Sunday, always
 * anchored to the *upcoming* Friday. We jump ahead even when today is
 * Fri/Sat/Sun so the entire retreat is in the future — that way the
 * accept/decline/cancel controls (which are hidden for past slots) are
 * all interactive in the demo.
 */
export function getDemoRetreat(): Retreat {
  const timezone = "America/Los_Angeles";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date());
  const yr = parts.find((p) => p.type === "year")!.value;
  const mo = parts.find((p) => p.type === "month")!.value;
  const dy = parts.find((p) => p.type === "day")!.value;
  const wdShort = parts.find((p) => p.type === "weekday")!.value;
  const wdMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const wd = wdMap[wdShort] ?? 5;

  // Days until the next Friday. If today is Friday, jump to next week.
  const fridayOffset = ((5 - wd + 7) % 7) || 7;

  const todayLA = new Date(`${yr}-${mo}-${dy}T00:00:00Z`);
  const start = new Date(todayLA);
  start.setUTCDate(start.getUTCDate() + fridayOffset);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 2);

  const dateStr = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate(),
    ).padStart(2, "0")}`;

  return {
    id: DEMO_RETREAT_ID,
    name: "Demo Retreat",
    timezone,
    active: true,
    slotsStart: `${dateStr(start)}T09:00`,
    slotsEnd: `${dateStr(end)}T20:00`,
    dayStart: "09:00",
    dayEnd: "20:00",
    granularityMinutes: 30,
    highlightedSlots: [],
    blockedSlots: [],
    createdAt: new Date(),
  };
}

/**
 * Deterministic availability for a fake user: each user has a baseline
 * "free rate" plus per-slot jitter so the calendar feels realistic.
 */
export function demoAvailability(userId: string, slots: Date[]): Set<string> {
  const baseRate = 0.55 + (hash(userId) % 30) / 100;
  const out = new Set<string>();
  for (const s of slots) {
    const iso = s.toISOString();
    if (rng01(`${userId}:${iso}`) < baseRate) out.add(iso);
  }
  return out;
}

export type DemoMeeting = {
  requestId: string;
  slotStart: string;
  otherUserId: string;
  status: "pending" | "accepted";
  direction: "incoming" | "outgoing";
};

/**
 * Meetings involving DEMO_ME, bucketed per day so incoming requests
 * (which the visitor can accept/decline) are spread across Saturday and
 * Sunday rather than all clustered on one day.
 */
export function demoMyMeetings(retreat: Retreat): DemoMeeting[] {
  const slots = generateSlots(retreat);
  if (slots.length === 0) return [];
  const nowMs = nowInRetreatTz(retreat).getTime();
  const byDay = groupSlotsByDay(slots);
  const dayKeys = Object.keys(byDay).sort();
  const isFuture = (s: Date) => s.getTime() > nowMs + 60 * 60 * 1000;
  const futureByDay = dayKeys.map((k) => (byDay[k] ?? []).filter(isFuture));

  const meetings: DemoMeeting[] = [];
  const used = new Set<string>();
  let counter = 0;

  const tryAdd = (
    dayIdx: number,
    preferredIdx: number,
    spec: Omit<DemoMeeting, "slotStart" | "requestId">,
  ) => {
    const pool = futureByDay[dayIdx];
    if (!pool || pool.length === 0) return;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[(preferredIdx + i) % pool.length];
      const iso = candidate.toISOString();
      if (used.has(iso)) continue;
      used.add(iso);
      counter++;
      meetings.push({
        requestId: `demo-mtg-${counter}`,
        ...spec,
        slotStart: iso,
      });
      return;
    }
  };

  // Friday
  tryAdd(0, 2, { otherUserId: "demo-priya", status: "accepted", direction: "outgoing" });
  tryAdd(0, 6, { otherUserId: "demo-noah", status: "pending", direction: "incoming" });
  tryAdd(0, 12, { otherUserId: "demo-yusuf", status: "pending", direction: "outgoing" });

  // Saturday
  tryAdd(1, 1, { otherUserId: "demo-mei", status: "accepted", direction: "outgoing" });
  tryAdd(1, 4, { otherUserId: "demo-jordan", status: "pending", direction: "incoming" });
  tryAdd(1, 12, { otherUserId: "demo-lena", status: "pending", direction: "incoming" });

  // Sunday
  tryAdd(2, 2, { otherUserId: "demo-aditi", status: "accepted", direction: "outgoing" });
  tryAdd(2, 5, { otherUserId: "demo-tomas", status: "accepted", direction: "incoming" });
  tryAdd(2, 8, { otherUserId: "demo-rosa", status: "pending", direction: "incoming" });
  tryAdd(2, 12, { otherUserId: "demo-fatima", status: "pending", direction: "incoming" });
  tryAdd(2, 16, { otherUserId: "demo-claire", status: "pending", direction: "outgoing" });

  return meetings;
}

export function demoUserById(id: string): DemoUser | null {
  if (id === DEMO_ME.id) return DEMO_ME;
  return DEMO_OTHERS.find((u) => u.id === id) ?? null;
}
