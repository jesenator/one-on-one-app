import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  getMyAvailability,
  toggleAvailability,
} from "@/lib/availability";

export async function GET() {
  const s = await getSession();
  if (!s.userId || !s.retreatId)
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  const set = await getMyAvailability(s.userId, s.retreatId);
  return NextResponse.json({ slots: Array.from(set) });
}

const postSchema = z.object({
  slotStart: z.string(),
  available: z.boolean(),
});

export async function POST(req: Request) {
  const s = await getSession();
  if (!s.userId || !s.retreatId)
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "bad input" }, { status: 400 });
  await toggleAvailability(
    s.userId,
    s.retreatId,
    new Date(parsed.data.slotStart),
    parsed.data.available,
  );
  return NextResponse.json({ ok: true });
}
