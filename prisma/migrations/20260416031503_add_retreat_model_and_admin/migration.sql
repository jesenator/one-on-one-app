-- AlterTable
ALTER TABLE "User" ADD COLUMN     "superAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Retreat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "slotsStart" TEXT NOT NULL,
    "slotsEnd" TEXT NOT NULL,
    "dayStart" TEXT NOT NULL DEFAULT '08:00',
    "dayEnd" TEXT NOT NULL DEFAULT '22:00',
    "granularityMinutes" INTEGER NOT NULL DEFAULT 30,
    "highlightedSlots" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Retreat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetreatAdmin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "retreatId" TEXT NOT NULL,

    CONSTRAINT "RetreatAdmin_pkey" PRIMARY KEY ("id")
);

-- Seed existing retreats before FK constraints
INSERT INTO "Retreat" ("id", "name", "timezone", "active", "slotsStart", "slotsEnd", "dayStart", "dayEnd", "granularityMinutes", "highlightedSlots") VALUES
  ('west-coast-ea-2026', 'West Coast EA Retreat', 'America/Los_Angeles', true, '2026-04-10T20:00', '2026-04-12T19:00', '08:00', '22:00', 30, ARRAY['2026-04-11T11:00:00.000Z','2026-04-11T11:30:00.000Z','2026-04-12T13:30:00.000Z','2026-04-12T14:00:00.000Z','2026-04-12T15:30:00.000Z']),
  ('midwest-ea-2026', 'Midwest EA Retreat', 'America/Chicago', true, '2026-04-17T17:00', '2026-04-19T19:00', '08:00', '22:00', 30, ARRAY[]::TEXT[]),
  ('northeast-ea-2026', 'Northeast EA Retreat', 'America/New_York', true, '2026-04-10T17:00', '2026-04-12T19:00', '08:00', '22:00', 30, ARRAY[]::TEXT[]),
  ('test-retreat', 'Test Retreat', 'America/Los_Angeles', true, '2026-04-15T08:00', '2026-04-17T22:00', '08:00', '22:00', 30, ARRAY['2026-04-15T14:00:00.000Z','2026-04-16T11:00:00.000Z','2026-04-17T10:00:00.000Z']);

-- Set superAdmin on existing admin users
UPDATE "User" SET "superAdmin" = true WHERE "email" IN ('jessewgilbert@gmail.com', 'saulsmunn@gmail.com', 'noahdbirnbaum@gmail.com');

-- Remove orphaned attendance rows
DELETE FROM "RetreatAttendance" WHERE "retreatId" NOT IN (SELECT "id" FROM "Retreat");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatAdmin_userId_retreatId_key" ON "RetreatAdmin"("userId", "retreatId");

-- AddForeignKey
ALTER TABLE "RetreatAdmin" ADD CONSTRAINT "RetreatAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatAdmin" ADD CONSTRAINT "RetreatAdmin_retreatId_fkey" FOREIGN KEY ("retreatId") REFERENCES "Retreat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatAttendance" ADD CONSTRAINT "RetreatAttendance_retreatId_fkey" FOREIGN KEY ("retreatId") REFERENCES "Retreat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
