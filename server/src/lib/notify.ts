/**
 * Outgoing SMS and email. Every message is written to the `outbox` collection
 * (the console shows it), and actually sent when a gateway is configured.
 * A failure here never breaks an order or a booking.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { db } from '../db.js';
import { env } from '../env.js';
import { uid } from './util.js';
import type { OutboxEntry } from '../types.js';

async function log(e: Omit<OutboxEntry, '_id' | 'at'>) {
  try {
    await db().outbox.insert({ _id: 'out-' + uid(), at: Date.now(), ...e });
  } catch {
    /* the log is best-effort */
  }
}

export async function sendSms(to: string, message: string, kind = 'sms'): Promise<boolean> {
  if (!env.SMS_API_URL || !env.SMS_API_KEY) {
    if (env.NODE_ENV !== 'test') console.info(`[sms] (not configured) to ${to}: ${message}`);
    await log({ channel: 'sms', to, body: message, status: 'logged', kind });
    return false;
  }
  const u = new URL(env.SMS_API_URL);
  u.searchParams.set('api_key', env.SMS_API_KEY);
  if (env.SMS_SENDER_ID) u.searchParams.set('senderid', env.SMS_SENDER_ID);
  u.searchParams.set('number', '88' + to);
  u.searchParams.set('message', message);
  const r = await fetch(u, { signal: AbortSignal.timeout(8000) }).catch(() => null);
  await log({ channel: 'sms', to, body: message, status: r?.ok ? 'sent' : 'failed', kind });
  return !!r?.ok;
}

let transport: Transporter | null = null;
export async function sendEmail(to: string, subject: string, text: string, kind = 'email'): Promise<boolean> {
  if (!to) return false;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    await log({ channel: 'email', to, subject, body: text, status: 'logged', kind });
    return false;
  }
  transport ??= nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } });
  const ok = await transport
    .sendMail({ from: env.MAIL_FROM, to, subject, text })
    .then(() => true)
    .catch(() => false);
  await log({ channel: 'email', to, subject, body: text, status: ok ? 'sent' : 'failed', kind });
  return ok;
}

/** Fire and forget */
export const later = (p: Promise<unknown>) => void p.catch(() => {});
