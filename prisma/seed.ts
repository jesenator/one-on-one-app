import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RETREAT_ID = "west-coast-ea-2026";

const people = [
  { email: "alice@example.com", name: "Alice Chen" },
  { email: "bob@example.com", name: "Bob Martinez" },
  { email: "carol@example.com", name: "Carol Nguyen" },
  { email: "david@example.com", name: "David Park" },
  { email: "emma@example.com", name: "Emma Thompson" },
  { email: "frank@example.com", name: "Frank Williams" },
  { email: "grace@example.com", name: "Grace Kim" },
  { email: "henry@example.com", name: "Henry Adams" },
];

function slot(day: number, hour: number, min: number = 0): Date {
  return new Date(`2026-04-${day}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00Z`);
}

async function main() {
  console.log("Seeding...");

  const users = await Promise.all(
    people.map((p) =>
      prisma.user.upsert({
        where: { email: p.email },
        update: { name: p.name },
        create: { email: p.email, name: p.name },
      }),
    ),
  );
  console.log(`  ${users.length} users upserted`);

  await Promise.all(
    users.map((u) =>
      prisma.retreatAttendance.upsert({
        where: { userId_retreatId: { userId: u.id, retreatId: RETREAT_ID } },
        update: {},
        create: { userId: u.id, retreatId: RETREAT_ID },
      }),
    ),
  );
  console.log(`  ${users.length} retreat attendances`);

  const availabilityData: { userId: string; slots: Date[] }[] = [
    { userId: users[0].id, slots: [slot(11, 8), slot(11, 8, 30), slot(11, 9), slot(11, 9, 30), slot(11, 10), slot(11, 14), slot(11, 14, 30), slot(11, 15), slot(12, 9), slot(12, 9, 30), slot(12, 10), slot(12, 14)] },
    { userId: users[1].id, slots: [slot(11, 9), slot(11, 9, 30), slot(11, 10), slot(11, 10, 30), slot(11, 15), slot(11, 15, 30), slot(12, 8), slot(12, 8, 30), slot(12, 9), slot(12, 14), slot(12, 14, 30)] },
    { userId: users[2].id, slots: [slot(11, 8), slot(11, 8, 30), slot(11, 11), slot(11, 11, 30), slot(11, 14), slot(11, 14, 30), slot(12, 10), slot(12, 10, 30), slot(12, 11), slot(12, 15)] },
    { userId: users[3].id, slots: [slot(11, 10), slot(11, 10, 30), slot(11, 11), slot(11, 14), slot(11, 15), slot(12, 8), slot(12, 8, 30), slot(12, 9), slot(12, 9, 30), slot(12, 15), slot(12, 15, 30)] },
    { userId: users[4].id, slots: [slot(11, 8), slot(11, 9), slot(11, 9, 30), slot(11, 14), slot(11, 14, 30), slot(11, 15), slot(12, 10), slot(12, 10, 30), slot(12, 14), slot(12, 14, 30)] },
    { userId: users[5].id, slots: [slot(11, 10), slot(11, 10, 30), slot(11, 11), slot(11, 11, 30), slot(12, 8), slot(12, 8, 30), slot(12, 9), slot(12, 9, 30), slot(12, 14), slot(12, 14, 30), slot(12, 15)] },
    { userId: users[6].id, slots: [slot(11, 8), slot(11, 8, 30), slot(11, 9), slot(11, 14), slot(11, 15), slot(11, 15, 30), slot(12, 9), slot(12, 10), slot(12, 10, 30), slot(12, 15)] },
    { userId: users[7].id, slots: [slot(11, 9), slot(11, 9, 30), slot(11, 10), slot(11, 11), slot(11, 14, 30), slot(11, 15), slot(12, 8), slot(12, 9), slot(12, 14), slot(12, 14, 30)] },
  ];

  let avCount = 0;
  for (const { userId, slots } of availabilityData) {
    for (const slotStart of slots) {
      await prisma.availability.upsert({
        where: { userId_retreatId_slotStart: { userId, retreatId: RETREAT_ID, slotStart } },
        update: {},
        create: { userId, retreatId: RETREAT_ID, slotStart },
      });
      avCount++;
    }
  }
  console.log(`  ${avCount} availability slots`);

  const [alice, bob, carol, david, emma] = users;

  const meetings = [
    { from: alice.id, to: bob.id, slot: slot(11, 9), status: "accepted" as const },
    { from: carol.id, to: alice.id, slot: slot(11, 14), status: "accepted" as const },
    { from: david.id, to: emma.id, slot: slot(11, 14), status: "pending" as const },
    { from: bob.id, to: carol.id, slot: slot(12, 10), status: "pending" as const },
    { from: emma.id, to: alice.id, slot: slot(12, 14), status: "pending" as const },
  ];

  for (const m of meetings) {
    const existing = await prisma.meetingRequest.findFirst({
      where: {
        retreatId: RETREAT_ID,
        fromUserId: m.from,
        toUserId: m.to,
        slotStart: m.slot,
      },
    });
    if (!existing) {
      await prisma.meetingRequest.create({
        data: {
          retreatId: RETREAT_ID,
          fromUserId: m.from,
          toUserId: m.to,
          slotStart: m.slot,
          status: m.status,
        },
      });
    }
  }
  console.log(`  ${meetings.length} meeting requests`);

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
