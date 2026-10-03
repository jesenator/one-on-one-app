import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string | null | undefined): string {
  const s = value ?? "";
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET() {
  const s = await getSession();
  if (!s.userId) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const headers = [
    "name",
    "email",
    "tagline",
    "careerStage",
    "aboutMe",
    "goals",
    "canHelpWith",
    "linkedinUrl",
    "websiteUrl",
    "photoUrl",
  ];

  const row = [
    user.name,
    user.email,
    user.tagline,
    user.careerStage,
    user.aboutMe,
    user.goals,
    user.canHelpWith,
    user.linkedinUrl,
    user.websiteUrl,
    user.photoUrl,
  ];

  const csv = [headers.join(","), row.map(csvEscape).join(",")].join("\n");

  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="profile-export-${date}.csv"`,
    },
  });
}
