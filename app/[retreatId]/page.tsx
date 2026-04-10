import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat } from "@/lib/config";
import { prisma } from "@/lib/prisma";

async function joinRetreat(retreatId: string) {
  "use server";
  const session = await getSession();
  if (!session.userId) redirect(`/login?retreat=${retreatId}`);
  await prisma.retreatAttendance.upsert({
    where: { userId_retreatId: { userId: session.userId, retreatId } },
    update: {},
    create: { userId: session.userId, retreatId },
  });
  session.retreatId = retreatId;
  await session.save();
  redirect("/schedule");
}

export default async function RetreatJoinPage({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  const retreat = getRetreat(retreatId);
  if (!retreat || !retreat.active) notFound();

  const session = await getSession();
  if (!session.userId) {
    redirect(`/login?retreat=${retreatId}`);
  }

  const join = joinRetreat.bind(null, retreatId);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form action={join}>
        <button
          type="submit"
          className="px-6 py-3 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
        >
          Join {retreat.name}
        </button>
      </form>
    </div>
  );
}
