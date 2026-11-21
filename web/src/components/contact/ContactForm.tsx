'use client';

import { useMemo, useState } from 'react';
import { normPhone, useDB, type MessageTopic } from '@/lib/store';
import { sendMessage } from '@/lib/actions';
import { notify } from '@/lib/toast';
import { Field, Select, TextArea, btnInk } from '@/components/ui/Form';

const TOPICS: [MessageTopic, string][] = [
  ['made-to-measure', 'A made-to-measure piece'],
  ['appointment', 'An appointment'],
  ['order', 'An order I have placed'],
  ['press', 'Press & collaborations'],
  ['other', 'Something else'],
];

export function ContactForm() {
  const me = useDB((d) => {
    const s = d.session;
    return s?.role === 'client' ? d.clients.find((c) => c.id === s.clientId) : undefined;
  });
  const [name, setName] = useState(me?.name ?? '');
  const [phone, setPhone] = useState(me?.phone ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [topic, setTopic] = useState<MessageTopic>('made-to-measure');
  const [message, setMessage] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'How should we address you?';
    if (phone && !normPhone(phone)) e.phone = 'A Bangladeshi mobile number, e.g. 01700 000000.';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = 'This email looks incomplete.';
    if (!phone && !email) e.phone = 'Leave a mobile number or an email so we can reply.';
    if (message.trim().length < 10) e.message = 'A line or two more, please.';
    return e;
  }, [name, phone, email, message]);
  const err = (k: string) => (tried ? errors[k] : undefined);

  if (sent) {
    return (
      <div className="border border-noir/10 bg-ivory px-6 py-14 text-center md:px-12">
        <p className="text-[10px] tracking-[0.3em] text-antique uppercase">Received</p>
        <p className="mt-5 font-display text-[32px] leading-tight">Thank you, {sent}.</p>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-stone">
          Your note is with the atelier. We reply within one working day — usually the same afternoon.
        </p>
        <button
          onClick={() => {
            setSent(null);
            setMessage('');
            setTried(false);
          }}
          className="mt-8 text-[11px] tracking-[0.22em] text-antique uppercase hover:underline"
        >
          Write another note
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (Object.keys(errors).length) return notify.err('A few details need another look', 'They are marked in the form.');
        setBusy(true);
        sendMessage({ name: name.trim(), phone: phone ? normPhone(phone)! : '', email: email.trim(), topic, message: message.trim() })
          .then(
            () => {
              notify.ok('Your note is with the atelier', 'We reply within one working day.');
              setSent(name.trim().split(' ')[0]);
            },
            (x: Error) => notify.err('Your note was not sent', x.message),
          )
          .finally(() => setBusy(false));
      }}
    >
      <Field tone="light" label="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" error={err('name')} />
      <div className="grid gap-8 sm:grid-cols-2">
        <Field tone="light" label="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01XXX XXXXXX" error={err('phone')} />
        <Field tone="light" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" error={err('email')} />
      </div>
      <Select tone="light" label="About" value={topic} onChange={(e) => setTopic(e.target.value as MessageTopic)}>
        {TOPICS.map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </Select>
      <div>
        <TextArea tone="light" label="Your note" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us the occasion, the date, or the piece you have in mind." />
        {err('message') && <span className="mt-1.5 block text-[12px] text-bordeaux">{err('message')}</span>}
      </div>
      <button type="submit" disabled={busy} className={`${btnInk} w-full sm:w-auto sm:px-14`}>
        {busy ? 'Sending…' : 'Send to the atelier'}
      </button>
    </form>
  );
}
