import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export type SessionData = {
  userId?: string;
  email?: string;
  name?: string;
  retreatId?: string;
};

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "dev-only-insecure-password-must-be-32-chars-min!!",
  cookieName: "ea_retreat_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const s = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (s.userId) {
    const user = await prisma.user.findUnique({ where: { id: s.userId } });
    if (!user) {
      delete s.userId;
      delete s.email;
      delete s.name;
      delete s.retreatId;
    }
  }
  return s;
}

export async function requireSession() {
  const s = await getSession();
  if (!s.userId) throw new Error("UNAUTHORIZED");
  return s;
}
