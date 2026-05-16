import { Suspense } from "react";
import {
  generateSlots,
  groupSlotsByDay,
  nowInRetreatTz,
} from "@/lib/config";
import {
  DEMO_ME,
  demoAvailability,
  demoMyMeetings,
  demoUserById,
  getDemoRetreat,
} from "@/lib/demo";
import CalendarView from "../../(main)/schedule/CalendarView";
import Toast from "../../(main)/schedule/Toast";

export default function DemoSchedulePage() {
  const retreat = getDemoRetreat();
  const slots = generateSlots(retreat);
  const groups = groupSlotsByDay(slots);
  const mine = demoAvailability(DEMO_ME.id, slots);
  const meetings = demoMyMeetings(retreat);

  const slotMeetings: Record<
    string,
    {
      requestId: string;
      otherPersonName: string;
      otherPersonId: string;
      type: "confirmed" | "incoming" | "outgoing";
    }
  > = {};
  for (const m of meetings) {
    const other = demoUserById(m.otherUserId);
    if (!other) continue;
    slotMeetings[m.slotStart] = {
      requestId: m.requestId,
      otherPersonName: other.name,
      otherPersonId: other.id,
      type:
        m.status === "accepted"
          ? "confirmed"
          : m.direction === "incoming"
            ? "incoming"
            : "outgoing",
    };
  }

  return (
    <>
      <Suspense fallback={null}>
        <Toast />
      </Suspense>
      <CalendarView
        groups={Object.fromEntries(
          Object.entries(groups).map(([k, v]) => [
            k,
            v.map((d) => d.toISOString()),
          ]),
        )}
        availableSlots={Array.from(mine)}
        slotMeetings={slotMeetings}
        highlightedSlots={retreat.highlightedSlots ?? []}
        blockedSlots={retreat.blockedSlots ?? []}
        now={nowInRetreatTz(retreat).toISOString()}
        basePath="/demo"
        demoMode
      />
    </>
  );
}
