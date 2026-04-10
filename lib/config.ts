import retreatsJson from "@/config/retreats.json";

export type RetreatConfig = {
  id: string;
  name: string;
  timezone: string;
  active: boolean;
  slots: {
    start: string; // local "YYYY-MM-DDTHH:mm"
    end: string;
    dayStart: string; // "HH:mm"
    dayEnd: string; // "HH:mm"
    granularityMinutes: number;
  };
  highlightedSlots?: string[];
};

type ConfigFile = {
  retreats: RetreatConfig[];
  adminEmails: string[];
};

const config = retreatsJson as ConfigFile;

export function getActiveRetreats(): RetreatConfig[] {
  return config.retreats.filter((r) => r.active);
}

export function getRetreat(id: string): RetreatConfig | undefined {
  return config.retreats.find((r) => r.id === id);
}

export function isAdminEmail(email: string): boolean {
  return config.adminEmails
    .map((e) => e.toLowerCase())
    .includes(email.toLowerCase());
}

export function getAdminEmails(): string[] {
  return config.adminEmails;
}

/**
 * Generate the half-hour slot grid for a retreat.
 * Times are returned as ISO strings in UTC, but represent the wall-clock time
 * in the retreat's timezone.
 *
 * Note: this is a simple implementation that treats the local times as if
 * they were UTC for storage. For the EA retreat single-timezone case this
 * is fine — the UI always renders in retreat tz.
 */
export function generateSlots(retreat: RetreatConfig): Date[] {
  const { start, end, dayStart, dayEnd, granularityMinutes } = retreat.slots;
  const startDate = new Date(start + ":00Z");
  const endDate = new Date(end + ":00Z");
  const [dsH, dsM] = dayStart.split(":").map(Number);
  const [deH, deM] = dayEnd.split(":").map(Number);

  const slots: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor < endDate) {
    const h = cursor.getUTCHours();
    const m = cursor.getUTCMinutes();
    const minutesOfDay = h * 60 + m;
    const dayStartMin = dsH * 60 + dsM;
    const dayEndMin = deH * 60 + deM;
    if (minutesOfDay >= dayStartMin && minutesOfDay < dayEndMin) {
      slots.push(new Date(cursor));
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + granularityMinutes);
  }
  return slots;
}

/** Group slots by YYYY-MM-DD for column rendering. */
export function groupSlotsByDay(slots: Date[]): Record<string, Date[]> {
  const groups: Record<string, Date[]> = {};
  for (const s of slots) {
    const key = s.toISOString().slice(0, 10);
    (groups[key] ||= []).push(s);
  }
  return groups;
}
