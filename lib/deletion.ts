import { prisma } from "@/lib/prisma"

export async function deleteRetreatData(retreatId: string) {
  const attendances = await prisma.retreatAttendance.findMany({
    where: { retreatId },
    select: { userId: true }
  })
  const userIds = attendances.map(a => a.userId)

  const multiRetreatUsers = await prisma.retreatAttendance.findMany({
    where: {
      userId: { in: userIds },
      retreatId: { not: retreatId }
    },
    select: { userId: true }
  })
  const multiRetreatUserIds = new Set(multiRetreatUsers.map(a => a.userId))
  const usersToDelete = userIds.filter(id => !multiRetreatUserIds.has(id))

  await prisma.$transaction(async (tx) => {
    await tx.meetingRequest.deleteMany({ where: { retreatId } })
    await tx.availability.deleteMany({ where: { retreatId } })
    await tx.retreatAttendance.deleteMany({ where: { retreatId } })
    await tx.retreatAdmin.deleteMany({ where: { retreatId } })
    await tx.user.deleteMany({ where: { id: { in: usersToDelete } } })
    await tx.retreat.delete({ where: { id: retreatId } })
  })
}
