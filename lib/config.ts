import { prisma } from "./prisma";
import type { Retreat } from "@prisma/client";

export type RetreatConfig = Retreat;

export async function getActiveRetreats(): Promise<RetreatConfig[]> {
  return prisma.retreat.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
}

export async function getRetreat(id: string): Promise<RetreatConfig | null> {
  return prisma.retreat.findUnique({ where: { id } });
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { superAdmin: true } });
  return user?.superAdmin ?? false;
}

export async function isRetreatAdmin(userId: string, retreatId: string): Promise<boolean> {
  const [user, ra] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { superAdmin: true } }),
    prisma.retreatAdmin.findUnique({ where: { userId_retreatId: { userId, retreatId } } }),
  ]);
  return (user?.superAdmin ?? false) || !!ra;
}

export function generateSlots(retreat: RetreatConfig): Date[] {
  const startDate = new Date(retreat.slotsStart + ":00Z");
  const endDate = new Date(retreat.slotsEnd + ":00Z");
  const [dsH, dsM] = retreat.dayStart.split(":").map(Number);
  const [deH, deM] = retreat.dayEnd.split(":").map(Number);

  const slots: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor < endDate) {
    const h = cursor.getUTCHours();
    const m = cursor.getUTCMinutes();
    const minutesOfDay = h * 60 + m;
    const dayStartMin = dsH * 60 + dsM;
    const dayEndMin = deH * 60 + deM;
    if (minutesOfDay >= dayStartMin && minutesOfDay < dayEndMin) {
      slots.push(new Date(cursor));
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + retreat.granularityMinutes);
  }
  return slots;
}

export function nowInRetreatTz(retreat: RetreatConfig): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: retreat.timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`
  );
}

export function isValidTimezone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function groupSlotsByDay(slots: Date[]): Record<string, Date[]> {
  const groups: Record<string, Date[]> = {};
  for (const s of slots) {
    const key = s.toISOString().slice(0, 10);
    (groups[key] ||= []).push(s);
  }
  return groups;
}
