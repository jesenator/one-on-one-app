import { prisma } from "./prisma";

export async function getMyAvailability(userId: string, retreatId: string) {
  const rows = await prisma.availability.findMany({
    where: { userId, retreatId },
    select: { slotStart: true },
  });
  return new Set(rows.map((r) => r.slotStart.toISOString()));
}

export async function ensureDefaultAvailability(
  userId: string,
  retreatId: string,
  allSlots: Date[],
) {
  const count = await prisma.availability.count({
    where: { userId, retreatId },
  });
  if (count > 0) return;
  await prisma.availability.createMany({
    data: allSlots.map((slotStart) => ({ userId, retreatId, slotStart })),
    skipDuplicates: true,
  });
}

export async function toggleAvailability(
  userId: string,
  retreatId: string,
  slotStart: Date,
  available: boolean,
) {
  if (available) {
    await prisma.availability.upsert({
      where: {
        userId_retreatId_slotStart: { userId, retreatId, slotStart },
      },
      update: {},
      create: { userId, retreatId, slotStart },
    });
  } else {
    await prisma.availability
      .delete({
        where: {
          userId_retreatId_slotStart: { userId, retreatId, slotStart },
        },
      })
      .catch(() => null);
  }
}

export async function getAcceptedMeetingSlots(
  userId: string,
  retreatId: string,
): Promise<Set<string>> {
  const rows = await prisma.meetingRequest.findMany({
    where: {
      retreatId,
      status: "accepted",
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
    select: { slotStart: true },
  });
  return new Set(rows.map((r) => r.slotStart.toISOString()));
}
