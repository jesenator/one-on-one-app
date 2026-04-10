import sgMail from "@sendgrid/mail";
import { formatSlotDay, formatSlotTime } from "./format";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM = process.env.SENDGRID_FROM_EMAIL;

async function send(to: string, subject: string, text: string, html: string) {
  if (!process.env.SENDGRID_API_KEY || !FROM) {
    console.log("[notif] no sendgrid, skipping email to", to, ":", subject);
    return;
  }
  try {
    await sgMail.send({ to, from: FROM, subject, text, html });
    console.log("[notif] sent to", to, ":", subject);
  } catch (err) {
    console.error("[notif] failed to send to", to, err);
  }
}

function fmtSlot(d: Date) {
  return `${formatSlotDay(d)} at ${formatSlotTime(d)}`;
}

export function notifyNewRequest(toEmail: string, fromName: string, slotStart: Date) {
  const when = fmtSlot(slotStart);
  const link = `${APP_URL}/app/schedule`;
  const subject = `${fromName} wants to meet 1:1`;
  const text = `${fromName} requested a 1:1 with you on ${when}.\n\nAccept or decline: ${link}`;
  const html = `<p><strong>${fromName}</strong> requested a 1:1 with you on <strong>${when}</strong>.</p><p><a href="${link}">Open your schedule to respond</a></p>`;
  send(toEmail, subject, text, html).catch(() => {});
}

export function notifyRequestAccepted(toEmail: string, accepterName: string, slotStart: Date) {
  const when = fmtSlot(slotStart);
  const link = `${APP_URL}/app/schedule`;
  const subject = `${accepterName} accepted your 1:1`;
  const text = `${accepterName} accepted your 1:1 on ${when}.\n\nView your schedule: ${link}`;
  const html = `<p><strong>${accepterName}</strong> accepted your 1:1 on <strong>${when}</strong>.</p><p><a href="${link}">View your schedule</a></p>`;
  send(toEmail, subject, text, html).catch(() => {});
}

export function notifyRequestDeclined(toEmail: string, declinerName: string, slotStart: Date) {
  const when = fmtSlot(slotStart);
  const link = `${APP_URL}/app/attendees`;
  const subject = `1:1 declined by ${declinerName}`;
  const text = `${declinerName} declined your 1:1 request for ${when}.\n\nFind another time: ${link}`;
  const html = `<p><strong>${declinerName}</strong> declined your 1:1 request for <strong>${when}</strong>.</p><p><a href="${link}">Browse attendees to find another time</a></p>`;
  send(toEmail, subject, text, html).catch(() => {});
}

export function notifyMeetingCancelled(toEmail: string, cancellerName: string, slotStart: Date) {
  const when = fmtSlot(slotStart);
  const link = `${APP_URL}/app/schedule`;
  const subject = `1:1 cancelled by ${cancellerName}`;
  const text = `${cancellerName} cancelled your 1:1 on ${when}.\n\nView your schedule: ${link}`;
  const html = `<p><strong>${cancellerName}</strong> cancelled your 1:1 on <strong>${when}</strong>.</p><p><a href="${link}">View your schedule</a></p>`;
  send(toEmail, subject, text, html).catch(() => {});
}
