import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "./prisma";
import { appUrl } from "./url";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const TOKEN_TTL_MS = 1000 * 60 * 30; // 30 min

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createMagicLink(
  email: string,
  name: string,
  retreat?: string,
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
  let url = `${appUrl()}/api/auth/callback?token=${token}`;
  if (retreat) url += `&retreat=${encodeURIComponent(retreat)}`;
  return url;
}

export async function sendMagicLinkEmail(email: string, link: string) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resend || !from) {
    console.log("[dev] magic link for", email, ":", link);
    return;
  }
  try {
    await resend.emails.send({
      to: email,
      from,
      subject: "Your Pairwise login link",
      text: `Click to log in: ${link}\n\nThis link expires in 30 minutes.`,
      html: `<p><a href="${link}">Click here to log in to Pairwise</a></p><p>This link expires in 30 minutes.</p>`,
    });
    console.log("[resend] email sent to", email);
  } catch (err: unknown) {
    console.error("[resend] failed to send to", email, err);
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
  // Upsert user. If a stub record exists (name === email, e.g. pre-created
  // when added as a retreat admin before first login), populate the real name.
  const existing = await prisma.user.findUnique({ where: { email: record.email } });
  if (!existing) {
    return prisma.user.create({ data: { email: record.email, name: record.name } });
  }
  if (existing.name === existing.email) {
    return prisma.user.update({ where: { id: existing.id }, data: { name: record.name } });
  }
  return existing;
}
