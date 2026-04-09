import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat, generateSlots, groupSlotsByDay } from "@/lib/config";
import {
  getMyAvailability,
  getAcceptedMeetingSlots,
} from "@/lib/availability";
import ScheduleGrid from "./ScheduleGrid";

export default async function SchedulePage() {
  const s = await getSession();
  if (!s.userId || !s.retreatId) redirect("/login");
  const retreat = getRetreat(s.retreatId)!;
  const slots = generateSlots(retreat);
  const groups = groupSlotsByDay(slots);
  const mine = await getMyAvailability(s.userId, s.retreatId);
  const meetings = await getAcceptedMeetingSlots(s.userId, s.retreatId);
  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">My availability</h1>
      <p className="text-sm text-zinc-500 mb-5">
        Tap a slot to mark when you&apos;re free for 1:1s.
      </p>
      <ScheduleGrid
        groups={Object.fromEntries(
          Object.entries(groups).map(([k, v]) => [
            k,
            v.map((d) => d.toISOString()),
          ]),
        )}
        initialSelected={Array.from(mine)}
        bookedSlots={Array.from(meetings)}
      />
    </div>
  );
}
