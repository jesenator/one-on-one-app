import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat, generateSlots, groupSlotsByDay, nowInRetreatTz } from "@/lib/config";
import {
  getMyAvailability,
  ensureDefaultAvailability,
} from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import CalendarView from "./CalendarView";

export default async function SchedulePage() {
  const s = await getSession();
  if (!s.userId || !s.retreatId) redirect("/login");
  const retreat = getRetreat(s.retreatId)!;
  const slots = generateSlots(retreat);
  const groups = groupSlotsByDay(slots);
  await ensureDefaultAvailability(s.userId, s.retreatId, slots);

  const [mine, allRequests] = await Promise.all([
    getMyAvailability(s.userId, s.retreatId),
    prisma.meetingRequest.findMany({
      where: {
        retreatId: s.retreatId,
        OR: [{ fromUserId: s.userId }, { toUserId: s.userId }],
        status: { in: ["pending", "accepted"] },
      },
      include: {
        from: { select: { id: true, name: true, email: true } },
        to: { select: { id: true, name: true, email: true } },
      },
      orderBy: { slotStart: "asc" },
    }),
  ]);

  const slotMeetings: Record<
    string,
    {
      requestId: string;
      otherPersonName: string;
      otherPersonId: string;
      type: "confirmed" | "incoming" | "outgoing";
    }
  > = {};

  for (const r of allRequests) {
    const iso = r.slotStart.toISOString();
    const isIncoming = r.toUserId === s.userId && r.status === "pending";
    const isOutgoing = r.fromUserId === s.userId && r.status === "pending";
    const isConfirmed = r.status === "accepted";

    if (!isIncoming && !isOutgoing && !isConfirmed) continue;

    const other = r.fromUserId === s.userId ? r.to : r.from;
    slotMeetings[iso] = {
      requestId: r.id,
      otherPersonName: other.name || "someone",
      otherPersonId: other.id,
      type: isConfirmed ? "confirmed" : isIncoming ? "incoming" : "outgoing",
    };
  }

  return (
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
      now={nowInRetreatTz(retreat).toISOString()}
    />
  );
}
