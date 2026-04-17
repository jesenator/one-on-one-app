import type { Prisma } from "@prisma/client";

// Serializes booking operations touching the same (user, slotStart) pair.
// Takes transaction-scoped pg advisory locks in sorted order to avoid
// deadlocks. Locks release automatically on commit or rollback.
export async function lockSlot(
  tx: Prisma.TransactionClient,
  retreatId: string,
  slotStart: Date,
  userIds: string[],
) {
  const keys = [...new Set(userIds)]
    .map((u) => `${retreatId}:${slotStart.toISOString()}:${u}`)
    .sort();
  for (const k of keys) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${k}, 0))`;
  }
}
