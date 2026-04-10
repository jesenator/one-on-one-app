import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat, generateSlots, groupSlotsByDay } from "@/lib/config";
import {
  getMyAvailability,
  getAcceptedMeetingSlots,
  ensureDefaultAvailability,
} from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import ScheduleGrid from "./ScheduleGrid";
import MeetingsList from "./MeetingsList";

export default async function SchedulePage() {
  const s = await getSession();
  if (!s.userId || !s.retreatId) redirect("/login");
  const retreat = getRetreat(s.retreatId)!;
  const slots = generateSlots(retreat);
  const groups = groupSlotsByDay(slots);
  await ensureDefaultAvailability(s.userId, s.retreatId, slots);

  const [mine, meetings, allRequests] = await Promise.all([
    getMyAvailability(s.userId, s.retreatId),
    getAcceptedMeetingSlots(s.userId, s.retreatId),
    prisma.meetingRequest.findMany({
      where: {
        retreatId: s.retreatId,
        OR: [{ fromUserId: s.userId }, { toUserId: s.userId }],
      },
      include: {
        from: { select: { id: true, name: true, email: true } },
        to: { select: { id: true, name: true, email: true } },
      },
      orderBy: { slotStart: "asc" },
    }),
  ]);

  const incoming = allRequests.filter(
    (r) => r.toUserId === s.userId && r.status === "pending",
  );
  const outgoing = allRequests.filter(
    (r) => r.fromUserId === s.userId && r.status === "pending",
  );
  const confirmed = allRequests.filter((r) => r.status === "accepted");

  function serialize(r: typeof allRequests[number]) {
    return {
      id: r.id,
      slotStart: r.slotStart.toISOString(),
      status: r.status,
      fromUserId: r.fromUserId,
      toUserId: r.toUserId,
      from: r.from,
      to: r.to,
    };
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(340px,420px)] gap-6 items-start">
      <section>
        <h1 className="text-xl font-semibold mb-3">Your 1:1s</h1>
        <MeetingsList
          incoming={incoming.map(serialize)}
          outgoing={outgoing.map(serialize)}
          confirmed={confirmed.map(serialize)}
          meId={s.userId}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold mb-0.5">Your availability</h2>
        <p className="text-xs text-zinc-500 mb-3">
          Tap to turn off times you&apos;re not free.
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
          now={new Date().toISOString()}
        />
      </section>
    </div>
  );
}
