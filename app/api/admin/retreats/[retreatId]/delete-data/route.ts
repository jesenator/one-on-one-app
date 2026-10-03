import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { deleteRetreatData } from "@/lib/deletion"

export async function POST(_req: Request, { params }: { params: Promise<{ retreatId: string }> }) {
  const { retreatId } = await params

  const s = await getSession()
  if (!s.userId) return NextResponse.json({ error: "unauth" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: s.userId } })
  if (!user?.superAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  try {
    await deleteRetreatData(retreatId)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
