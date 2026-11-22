import crypto from "crypto";
import { esc, sendMail } from "./mail";
import { SITE_URL } from "./site";
import type { BioLink } from "./types";

/** A signature that lets the buyer reschedule from the link in their email, without an account. */
export function rescheduleKey(bookingId: string): string {
  const secret = process.env.SESSION_SECRET || "dev_makemylink_session_secret_default_key_32_bytes_min";
  return crypto.createHmac("sha256", `reschedule:${secret}`).update(bookingId).digest("base64url").slice(0, 32);
}

export function rescheduleOk(bookingId: string, key: string): boolean {
  const a = Buffer.from(rescheduleKey(bookingId));
  const b = Buffer.from(String(key));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const icsDate = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");

/** A calendar file (.ics) that Google Calendar, Apple Calendar and Outlook all open. */
export function calendarFile(o: { id: string; title: string; host: string; start: number; minutes: number; meetingUrl: string }): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Showz//Bookings//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${o.id}@showz`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(o.start)}`,
    `DTEND:${icsDate(o.start + o.minutes * 60_000)}`,
    `SUMMARY:${icsText(`${o.title} with ${o.host}`)}`,
    `DESCRIPTION:${icsText(`Join: ${o.meetingUrl}`)}`,
    `LOCATION:${icsText(o.meetingUrl)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your session starts in 15 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export interface BookingMailInput {
  id: string;
  buyerName: string;
  buyerEmail: string;
  slot: number;
  handle: string;
  hostName: string;
  link: BioLink;
}

const wrap = (body: string) => `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;line-height:1.55;color:#111">${body}<p style="color:#888;font-size:12px;margin-top:28px">Booked with Showz</p></div>`;
const btn = (href: string, label: string, dark = true) => `<a href="${href}" style="background:${dark ? "#111" : "#fff"};color:${dark ? "#fff" : "#111"};border:1px solid #111;padding:11px 18px;border-radius:10px;text-decoration:none;display:inline-block;margin:4px 6px 4px 0">${label}</a>`;

/** The email a buyer gets once a booking is confirmed: when, the join link, a calendar file, and a reschedule link. */
export async function sendBookingConfirmed(b: BookingMailInput, kind: "confirmed" | "paid" | "rescheduled" = "confirmed") {
  const cfg = b.link.booking!;
  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: cfg.timeZone }).format(new Date(b.slot));
  const resched = `${SITE_URL}/${b.handle}/${b.link.id}?reschedule=${b.id}&k=${rescheduleKey(b.id)}`;
  const lead = kind === "paid" ? "Payment received. You are booked" : kind === "rescheduled" ? "Your new time is booked" : "You are booked";
  const subject = kind === "rescheduled" ? `New time: ${b.link.title}` : `Confirmed: ${b.link.title}`;
  return sendMail(
    b.buyerEmail,
    subject,
    wrap(`<h2 style="margin:0 0 8px">${esc(lead)}</h2><p><b>${esc(b.link.title)}</b> with ${esc(b.hostName)}<br>${esc(when)} (${esc(cfg.timeZone)})</p><p>${btn(esc(cfg.meetingUrl), "Join the call")}${btn(resched, "Change the time", false)}</p><p style="font-size:13px;color:#555">The attached calendar file adds it to Google, Apple or Outlook calendar. We will also remind you a day before and an hour before.</p>`),
    [{ filename: "booking.ics", text: calendarFile({ id: b.id, title: b.link.title, host: b.hostName, start: b.slot, minutes: cfg.durationMin, meetingUrl: cfg.meetingUrl }) }],
  );
}

export async function sendBookingReminder(b: BookingMailInput, hours: 24 | 1) {
  const cfg = b.link.booking!;
  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: cfg.timeZone }).format(new Date(b.slot));
  const resched = `${SITE_URL}/${b.handle}/${b.link.id}?reschedule=${b.id}&k=${rescheduleKey(b.id)}`;
  return sendMail(
    b.buyerEmail,
    hours === 24 ? `Tomorrow: ${b.link.title}` : `In 1 hour: ${b.link.title}`,
    wrap(`<h2 style="margin:0 0 8px">${hours === 24 ? "Your session is tomorrow" : "Your session starts in an hour"}</h2><p><b>${esc(b.link.title)}</b> with ${esc(b.hostName)}<br>${esc(when)} (${esc(cfg.timeZone)})</p><p>${btn(esc(cfg.meetingUrl), "Join the call")}${hours === 24 ? btn(resched, "Change the time", false) : ""}</p>`),
  );
}
