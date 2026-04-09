import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import { prisma } from "./prisma";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const TOKEN_TTL_MS = 1000 * 60 * 30; // 30 min

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createMagicLink(
  email: string,
  name: string,
): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  await prisma.magicLinkToken.create({
    data: {
      tokenHash,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base}/api/auth/callback?token=${token}`;
}

export async function sendMagicLinkEmail(email: string, link: string) {
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!process.env.SENDGRID_API_KEY || !from) {
    console.log("[dev] magic link for", email, ":", link);
    return;
  }
  try {
    await sgMail.send({
      to: email,
      from,
      subject: "Your EA Retreat 1:1 login link",
      text: `Click to log in: ${link}\n\nThis link expires in 30 minutes.`,
      html: `<p>Click to log in to EA Retreat 1:1s:</p><p><a href="${link}">${link}</a></p><p>This link expires in 30 minutes.</p>`,
    });
    console.log("[sendgrid] email sent to", email);
  } catch (err: unknown) {
    console.error("[sendgrid] failed to send to", email, err);
    throw err;
  }
}

export async function consumeMagicLink(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.magicLinkToken.findUnique({ where: { tokenHash } });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt < new Date()) return null;
  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  // Upsert user
  const user = await prisma.user.upsert({
    where: { email: record.email },
    update: { name: record.name },
    create: { email: record.email, name: record.name },
  });
  return user;
}
