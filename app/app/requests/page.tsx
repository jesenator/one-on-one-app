import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import RequestsClient from "./RequestsClient";

export default async function RequestsPage() {
  const s = await getSession();
  if (!s.userId || !s.retreatId) redirect("/login");

  const all = await prisma.meetingRequest.findMany({
    where: {
      retreatId: s.retreatId,
      OR: [{ fromUserId: s.userId }, { toUserId: s.userId }],
    },
    include: {
      from: { select: { id: true, name: true, email: true } },
      to: { select: { id: true, name: true, email: true } },
    },
    orderBy: { slotStart: "asc" },
  });

  const incoming = all.filter(
    (r) => r.toUserId === s.userId && r.status === "pending",
  );
  const outgoing = all.filter(
    (r) => r.fromUserId === s.userId && r.status === "pending",
  );
  const confirmed = all.filter((r) => r.status === "accepted");

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Requests</h1>
      <RequestsClient
        incoming={incoming.map(serialize)}
        outgoing={outgoing.map(serialize)}
        confirmed={confirmed.map(serialize)}
        meId={s.userId}
      />
    </div>
  );
}

function serialize(r: {
  id: string;
  slotStart: Date;
  status: string;
  fromUserId: string;
  toUserId: string;
  from: { id: string; name: string; email: string };
  to: { id: string; name: string; email: string };
}) {
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
