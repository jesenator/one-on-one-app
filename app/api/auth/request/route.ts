import { NextResponse } from "next/server";
import { z } from "zod";
import { createMagicLink, sendMagicLinkEmail } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  retreat: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const link = await createMagicLink(parsed.data.email, parsed.data.name, parsed.data.retreat);
  await sendMagicLinkEmail(parsed.data.email, link);
  return NextResponse.json({ ok: true });
}
