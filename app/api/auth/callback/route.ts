import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isRetreatJoinable } from "@/lib/config";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

function r(path: string) {
  return NextResponse.redirect(new URL(path, APP_URL));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return r("/login?error=missing");

  const user = await consumeMagicLink(token);
  if (!user) return r("/login?error=invalid");

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;

  const retreatId = url.searchParams.get("retreat");
  if (retreatId) {
    const retreat = await prisma.retreat.findUnique({ where: { id: retreatId } });
    if (retreat) {
      const existing = await prisma.retreatAttendance.findUnique({
        where: { userId_retreatId: { userId: user.id, retreatId } },
      });
      if (existing || isRetreatJoinable(retreat)) {
        await prisma.retreatAttendance.upsert({
          where: { userId_retreatId: { userId: user.id, retreatId } },
          update: {},
          create: { userId: user.id, retreatId },
        });
        session.retreatId = retreatId;
        await session.save();
        const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
        const hasProfile = freshUser && (freshUser.tagline || freshUser.careerStage || freshUser.aboutMe || freshUser.goals || freshUser.canHelpWith || freshUser.linkedinUrl || freshUser.websiteUrl || freshUser.photoUrl);
        if (!hasProfile) return r(`/import-profile?retreat=${retreatId}`);
        return r("/schedule");
      }
    }
  }

  const recent = await prisma.retreatAttendance.findFirst({
    where: { userId: user.id, retreat: { active: true } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    session.retreatId = recent.retreatId;
    await session.save();
    const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
    const hasProfile = freshUser && (freshUser.tagline || freshUser.careerStage || freshUser.aboutMe || freshUser.goals || freshUser.canHelpWith || freshUser.linkedinUrl || freshUser.websiteUrl || freshUser.photoUrl);
    if (!hasProfile) return r(`/import-profile?retreat=${recent.retreatId}`);
    return r("/schedule");
  }

  await session.save();
  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
  const hasProfile = freshUser && (freshUser.tagline || freshUser.careerStage || freshUser.aboutMe || freshUser.goals || freshUser.canHelpWith || freshUser.linkedinUrl || freshUser.websiteUrl || freshUser.photoUrl);
  if (!hasProfile) return r("/import-profile");
  return r("/no-retreat");
}
