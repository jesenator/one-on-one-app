import { Resend } from "resend";
import sgMail from "@sendgrid/mail";
import { formatSlotDay, formatSlotTime } from "./format";
import { appUrl } from "./url";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function send(to: string, subject: string, text: string, html: string) {
  // Prefer Resend if configured, fall back to SendGrid
  if (resend && process.env.RESEND_FROM_EMAIL) {
    try {
      await resend.emails.send({ to, from: process.env.RESEND_FROM_EMAIL, subject, text, html });
      console.log("[notif] sent via resend to", to);
    } catch (err) {
      console.error("[notif] resend failed for", to, err);
    }
    return;
  }
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    try {
      await sgMail.send({ to, from: process.env.SENDGRID_FROM_EMAIL, subject, text, html });
      console.log("[notif] sent via sendgrid to", to);
    } catch (err) {
      console.error("[notif] sendgrid failed for", to, err);
    }
    return;
  }
  console.log("[notif] no email provider configured, skipping email to", to, ":", subject);
}

function fmtSlot(d: Date) {
  return `${formatSlotDay(d)} at ${formatSlotTime(d)}`;
}

export function notifyNewRequest(toEmail: string, fromName: string, slotStart: Date, requestId: string) {
  const when = fmtSlot(slotStart);
  const acceptLink = `${appUrl()}/r/${requestId}/accept`;
  const declineLink = `${appUrl()}/r/${requestId}/decline`;
  const scheduleLink = `${appUrl()}/schedule`;
  const subject = `${fromName} wants to meet 1:1`;
  const text = `${fromName} requested a 1:1 with you on ${when}.\n\nAccept: ${acceptLink}\nDecline: ${declineLink}\n\nOr open your schedule: ${scheduleLink}`;
  const btn = (href: string, color: string, label: string) =>
    `<a href="${href}" style="display:inline-block;padding:10px 18px;margin-right:8px;background:${color};color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">${label}</a>`;
  const html = `<p><strong>${fromName}</strong> requested a 1:1 with you on <strong>${when}</strong>.</p><p>${btn(acceptLink, "#16a34a", "Accept")}${btn(declineLink, "#dc2626", "Decline")}</p><p style="font-size:12px;color:#666">Or <a href="${scheduleLink}">open your schedule</a> to respond.</p>`;
  send(toEmail, subject, text, html).catch(() => {});
}

export function notifyRequestAccepted(toEmail: string, accepterName: string, slotStart: Date) {
  const when = fmtSlot(slotStart);
  const link = `${appUrl()}/schedule`;
  const subject = `${accepterName} accepted your 1:1`;
  const text = `${accepterName} accepted your 1:1 on ${when}.\n\nView your schedule: ${link}`;
  const html = `<p><strong>${accepterName}</strong> accepted your 1:1 on <strong>${when}</strong>.</p><p><a href="${link}">View your schedule</a></p>`;
  send(toEmail, subject, text, html).catch(() => {});
}

export function notifyRequestDeclined(toEmail: string, declinerName: string, slotStart: Date) {
  const when = fmtSlot(slotStart);
  const link = `${appUrl()}/attendees`;
  const subject = `1:1 declined by ${declinerName}`;
  const text = `${declinerName} declined your 1:1 request for ${when}.\n\nFind another time: ${link}`;
  const html = `<p><strong>${declinerName}</strong> declined your 1:1 request for <strong>${when}</strong>.</p><p><a href="${link}">Browse attendees to find another time</a></p>`;
  send(toEmail, subject, text, html).catch(() => {});
}

export function notifyPendingReminder(toEmail: string, userName: string, pendingCount: number, retreatName: string) {
  const link = `${appUrl()}/schedule`;
  const subject = `You have ${pendingCount} pending one-on-one${pendingCount === 1 ? "" : "s"}`;
  const text = `Hi ${userName}, you have ${pendingCount} pending one-on-one request${pendingCount === 1 ? "" : "s"} for ${retreatName}.\n\nView your schedule to accept or decline: ${link}`;
  const html = `<p>Hi <strong>${userName}</strong>, you have <strong>${pendingCount}</strong> pending one-on-one request${pendingCount === 1 ? "" : "s"} for <strong>${retreatName}</strong>.</p><p><a href="${link}">Open your schedule to accept or decline</a></p>`;
  return send(toEmail, subject, text, html);
}

export function notifyAdminScheduled(toEmail: string, adminName: string, otherName: string, slotStart: Date) {
  const when = fmtSlot(slotStart);
  const link = `${appUrl()}/schedule`;
  const subject = `1:1 scheduled with ${otherName}`;
  const text = `${adminName} (admin) scheduled a 1:1 between you and ${otherName} on ${when}.\n\nView your schedule: ${link}`;
  const html = `<p><strong>${adminName}</strong> (admin) scheduled a 1:1 between you and <strong>${otherName}</strong> on <strong>${when}</strong>.</p><p><a href="${link}">View your schedule</a></p>`;
  send(toEmail, subject, text, html).catch(() => {});
}

export function notifyRetreatAdminAdded(toEmail: string, retreatName: string, retreatId: string, addedByName: string) {
  const joinLink = `${appUrl()}/join/${retreatId}`;
  const subject = `You're an admin for ${retreatName}`;
  const text = `${addedByName} made you an admin for ${retreatName}.\n\nSign in to manage the retreat: ${joinLink}`;
  const html = `<p><strong>${addedByName}</strong> made you an admin for <strong>${retreatName}</strong>.</p><p><a href="${joinLink}" style="display:inline-block;padding:10px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Sign in to ${retreatName}</a></p>`;
  send(toEmail, subject, text, html).catch(() => {});
}

export function notifyMeetingCancelled(toEmail: string, cancellerName: string, slotStart: Date) {
  const when = fmtSlot(slotStart);
  const link = `${appUrl()}/schedule`;
  const subject = `1:1 cancelled by ${cancellerName}`;
  const text = `${cancellerName} cancelled your 1:1 on ${when}.\n\nView your schedule: ${link}`;
  const html = `<p><strong>${cancellerName}</strong> cancelled your 1:1 on <strong>${when}</strong>.</p><p><a href="${link}">View your schedule</a></p>`;
  send(toEmail, subject, text, html).catch(() => {});
}
