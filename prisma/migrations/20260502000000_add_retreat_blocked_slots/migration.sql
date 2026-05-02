-- AlterTable
ALTER TABLE "Retreat" ADD COLUMN "blockedSlots" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
