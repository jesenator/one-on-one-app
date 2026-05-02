import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { respondToRequest } from "@/lib/requests";

const schema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s.userId)
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "bad input" }, { status: 400 });

  const result = await respondToRequest(id, s.userId, parsed.data.action);
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
