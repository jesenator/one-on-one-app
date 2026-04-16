import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRetreat } from "@/lib/config";
import { meetingsToIcs } from "@/lib/ics";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s.userId) return new Response("unauth", { status: 401 });
  const { id } = await params;
  const m = await prisma.meetingRequest.findUnique({
    where: { id },
    include: {
      from: { select: { id: true, name: true, email: true } },
      to: { select: { id: true, name: true, email: true } },
    },
  });
  if (!m || m.status !== "accepted")
    return new Response("not found", { status: 404 });
  if (m.fromUserId !== s.userId && m.toUserId !== s.userId)
    return new Response("forbidden", { status: 403 });
  const retreat = await getRetreat(m.retreatId);
  const other = m.fromUserId === s.userId ? m.to : m.from;
  const ics = meetingsToIcs([
    {
      id: m.id,
      slotStart: m.slotStart,
      durationMinutes: retreat?.granularityMinutes ?? 30,
      withName: other.name,
      withEmail: other.email,
      retreatName: retreat?.name ?? "Retreat",
    },
  ]);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="1on1-${m.id}.ics"`,
    },
  });
}
