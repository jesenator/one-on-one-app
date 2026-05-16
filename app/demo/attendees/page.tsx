import {
  DEMO_ME,
  DEMO_OTHERS,
  demoAvailability,
  demoMyMeetings,
  getDemoRetreat,
} from "@/lib/demo";
import { generateSlots } from "@/lib/config";
import AttendeeList from "../../(main)/attendees/AttendeeList";

export default async function DemoAttendeesPage({
  searchParams,
}: {
  searchParams: Promise<{ slot?: string }>;
}) {
  const { slot } = await searchParams;
  const retreat = getDemoRetreat();

  let others = DEMO_OTHERS;

  if (slot) {
    const slots = generateSlots(retreat);
    const meetings = demoMyMeetings(retreat);
    const meetingByIso = new Map(meetings.map((m) => [m.slotStart, m]));
    const myMeeting = meetingByIso.get(slot);
    const myBusyUserId = myMeeting ? myMeeting.otherUserId : null;
    others = DEMO_OTHERS.filter((u) => {
      if (u.id === myBusyUserId) return false;
      const avail = demoAvailability(u.id, slots);
      return avail.has(slot);
    }).sort((a, b) => a.name.localeCompare(b.name));
  } else {
    others = [...DEMO_OTHERS].sort((a, b) => a.name.localeCompare(b.name));
  }

  const visible = others.filter((u) => u.id !== DEMO_ME.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Attendees</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {visible.length} {visible.length === 1 ? "person" : "people"} at this retreat
        </p>
      </div>
      <AttendeeList attendees={visible} slotFilter={slot} basePath="/demo" />
    </div>
  );
}
