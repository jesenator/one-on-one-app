import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat } from "@/lib/config";
import { prisma } from "@/lib/prisma";

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

  await prisma.retreatAttendance.upsert({
    where: { userId_retreatId: { userId: session.userId, retreatId } },
    update: {},
    create: { userId: session.userId, retreatId },
  });
  session.retreatId = retreatId;
  await session.save();
  redirect("/schedule");
}
