import { prisma } from "./prisma";

export async function getMyAvailability(userId: string, retreatId: string) {
  const [retreat, rows] = await Promise.all([
    prisma.retreat.findUnique({
      where: { id: retreatId },
      select: { blockedSlots: true },
    }),
    prisma.availability.findMany({
      where: { userId, retreatId },
      select: { slotStart: true },
    }),
  ]);
  const blocked = new Set(retreat?.blockedSlots ?? []);
  return new Set(rows.map((r) => r.slotStart.toISOString()).filter((iso) => !blocked.has(iso)));
}

export async function ensureDefaultAvailability(
  userId: string,
  retreatId: string,
  allSlots: Date[],
) {
  const retreat = await prisma.retreat.findUnique({
    where: { id: retreatId },
    select: { blockedSlots: true },
  });
  const blocked = new Set(retreat?.blockedSlots ?? []);
  const openSlots = allSlots.filter((slotStart) => !blocked.has(slotStart.toISOString()));
  const existing = await prisma.availability.findMany({
    where: { userId, retreatId },
    select: { slotStart: true },
  });
  // If any existing record aligns with the current slot grid, the user has
  // a real (or partially-real) customization; leave it alone.
  const gridIsos = new Set(allSlots.map((s) => s.toISOString()));
  const anyAligned = existing.some((r) => gridIsos.has(r.slotStart.toISOString()));
  if (anyAligned) return;
  // All records (if any) are orphaned from a prior slot grid — clear them
  // out so this user defaults back to "all open slots available".
  if (existing.length > 0) {
    await prisma.availability.deleteMany({ where: { userId, retreatId } });
  }
  await prisma.availability.createMany({
    data: openSlots.map((slotStart) => ({ userId, retreatId, slotStart })),
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
    const retreat = await prisma.retreat.findUnique({
      where: { id: retreatId },
      select: { blockedSlots: true },
    });
    if (retreat?.blockedSlots.includes(slotStart.toISOString())) return;
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
