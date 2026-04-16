import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRetreat } from "@/lib/config";
import { meetingsToIcs } from "@/lib/ics";

export async function GET() {
  const s = await getSession();
  if (!s.userId || !s.retreatId) return new Response("unauth", { status: 401 });
  const retreat = await getRetreat(s.retreatId);
  const meetings = await prisma.meetingRequest.findMany({
    where: {
      retreatId: s.retreatId,
      status: "accepted",
      OR: [{ fromUserId: s.userId }, { toUserId: s.userId }],
    },
    include: {
      from: { select: { id: true, name: true, email: true } },
      to: { select: { id: true, name: true, email: true } },
    },
  });
  const ics = meetingsToIcs(
    meetings.map((m) => {
      const other = m.fromUserId === s.userId ? m.to : m.from;
      return {
        id: m.id,
        slotStart: m.slotStart,
        durationMinutes: retreat?.granularityMinutes ?? 30,
        withName: other.name,
        withEmail: other.email,
        retreatName: retreat?.name ?? "Retreat",
      };
    }),
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="my-1on1s.ics"',
    },
  });
}
