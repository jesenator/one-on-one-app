import { createEvents, type EventAttributes } from "ics";

type MeetingForIcs = {
  id: string;
  slotStart: Date;
  durationMinutes: number;
  withName: string;
  withEmail: string;
  retreatName: string;
};

function toDateArray(d: Date): [number, number, number, number, number] {
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
  ];
}

export function meetingsToIcs(meetings: MeetingForIcs[]): string {
  const events: EventAttributes[] = meetings.map((m) => ({
    uid: `${m.id}@ea-retreat-1on1`,
    title: `1:1 with ${m.withName}`,
    description: `${m.retreatName} — 1:1`,
    start: toDateArray(m.slotStart),
    duration: { minutes: m.durationMinutes },
    attendees: [{ name: m.withName, email: m.withEmail }],
  }));
  const { error, value } = createEvents(events);
  if (error) throw error;
  return value || "";
}
