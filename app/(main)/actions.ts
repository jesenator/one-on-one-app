"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function switchRetreat(formData: FormData) {
  const retreatId = String(formData.get("retreatId") || "");
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const attendance = await prisma.retreatAttendance.findUnique({
    where: { userId_retreatId: { userId: session.userId, retreatId } },
  });
  if (!attendance) redirect("/profile");
  session.retreatId = retreatId;
  await session.save();
  redirect("/schedule");
}
