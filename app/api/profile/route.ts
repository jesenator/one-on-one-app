import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const ALLOWED_FIELDS = [
  "name",
  "tagline",
  "careerStage",
  "aboutMe",
  "goals",
  "canHelpWith",
  "linkedinUrl",
  "websiteUrl",
  "photoUrl",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

function isValidUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const data: Partial<Record<AllowedField, string>> = {};

  for (const field of ALLOWED_FIELDS) {
    if (!(field in body)) continue;
    const val = body[field];

    if (val === null || val === "") {
      // Allow clearing optional fields (not name)
      if (field === "name") {
        return NextResponse.json({ error: "Name must not be empty" }, { status: 400 });
      }
      data[field] = "";
      continue;
    }

    if (typeof val !== "string") {
      return NextResponse.json({ error: `${field} must be a string` }, { status: 400 });
    }

    if (field === "name" && val.trim() === "") {
      return NextResponse.json({ error: "Name must not be empty" }, { status: 400 });
    }

    if ((field === "linkedinUrl" || field === "websiteUrl") && val !== "" && !isValidUrl(val)) {
      return NextResponse.json(
        { error: `${field} must start with http:// or https://` },
        { status: 400 },
      );
    }

    data[field] = field === "name" ? val.trim() : val;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: s.userId },
    data,
  });

  // Keep session name in sync if name was updated
  if (data.name) {
    s.name = data.name;
    await s.save();
  }

  return NextResponse.json(updated);
}
