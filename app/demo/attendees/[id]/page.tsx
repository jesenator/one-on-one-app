import Link from "next/link";
import { notFound } from "next/navigation";
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
import OverlapGrid from "../../../(main)/attendees/[id]/OverlapGrid";

export default async function DemoAttendeeProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const { id } = await params;
  const { slot: preselectedSlot } = await searchParams;
  const user = demoUserById(id);
  if (!user || user.id === DEMO_ME.id) notFound();

  const retreat = getDemoRetreat();
  const slots = generateSlots(retreat);
  const groups = groupSlotsByDay(slots);
  const mine = demoAvailability(DEMO_ME.id, slots);
  const theirs = demoAvailability(id, slots);
  const myMeetings = demoMyMeetings(retreat);
  const myBooked = myMeetings.map((m) => m.slotStart);
  const theirBooked = myMeetings
    .filter((m) => m.otherUserId === id)
    .map((m) => m.slotStart);
  const betweenUs = myMeetings
    .filter((m) => m.otherUserId === id)
    .map((m) => ({
      requestId: m.requestId,
      slotStart: m.slotStart,
      direction: m.direction,
      status: m.status,
    }));

  return (
    <div>
      <Link
        href="/demo/attendees"
        className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-accent-600 mb-4 font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        All attendees
      </Link>
      <h1 className="text-2xl font-bold text-stone-900">{user.name}</h1>
      <p className="text-sm text-stone-400 mt-0.5 mb-6">
        Tap a green slot to request a 1:1
      </p>
      <OverlapGrid
        toUserId={id}
        toUserName={user.name || "them"}
        groups={Object.fromEntries(
          Object.entries(groups).map(([k, v]) => [
            k,
            v.map((d) => d.toISOString()),
          ]),
        )}
        mine={Array.from(mine)}
        theirs={Array.from(theirs)}
        myBooked={myBooked}
        theirBooked={theirBooked}
        betweenUs={betweenUs}
        highlightedSlots={retreat.highlightedSlots ?? []}
        blockedSlots={retreat.blockedSlots ?? []}
        now={nowInRetreatTz(retreat).toISOString()}
        preselectedSlot={preselectedSlot}
        demoMode
      />
    </div>
  );
}
