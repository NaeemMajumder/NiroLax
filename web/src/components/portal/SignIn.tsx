'use client';

import { useState } from 'react';
import { DEMO_CLIENT_PASSWORD, DEMO_CLIENT_PHONE, load, normPhone } from '@/lib/store';
import { enterAsDemoClient, forgotPassword, login, register, requestOtp, resetPassword, useDemo, verifyOtp, verifyRegister } from '@/lib/actions';
import { notify } from '@/lib/toast';
import { Field, btnGold } from '@/components/ui/Form';

type Mode = 'signin' | 'register' | 'register-code' | 'forgot' | 'forgot-code' | 'otp' | 'otp-code';

const heading: Record<Mode, [string, string]> = {
  signin: ['Sign in', 'With your email or mobile number and your password.'],
  register: ['Create your account', 'Your orders, fittings and pieces in one place. We confirm your mobile number with a six-digit code.'],
  'register-code': ['Confirm your number', 'Enter the six-digit code we sent by SMS.'],
  forgot: ['Forgot your password', 'Enter the mobile number on your account. We send a code to set a new password.'],
  'forgot-code': ['Set a new password', 'Enter the code from the SMS and choose a new password.'],
  otp: ['Sign in with a code', 'No password needed — we send a six-digit code to your mobile.'],
  'otp-code': ['Enter the code', 'Sent by SMS. It works for five minutes.'],
};
const passwordProblem = (p: string) => (p.length < 8 ? 'At least 8 characters.' : !/[A-Za-z]/.test(p) || !/\d/.test(p) ? 'Use at least one letter and one number.' : '');

/** Accounts as in Ruposhi: email or phone + password, a code by SMS to confirm or recover. */
export function SignIn() {
  const [mode, setMode] = useState<Mode>('signin');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const isDemo = useDemo();

  const go = (m: Mode) => {
    setMode(m);
    setError('');
    setCode('');
  };
  const run = (f: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    f()
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusy(false));
  };
  const welcome = (extra?: string) => {
    const d = load();
    const me = d.clients.find((c) => c.id === d.session?.clientId);
    notify.ok(me ? `Welcome, ${me.name.split(' ')[0]}` : 'You are signed in', extra ?? 'Your pieces, appointments and orders are below.');
  };
  const sent = (to: string, c?: string) => {
    setDemoCode(c ?? '');
    notify.ok(`Code sent to ${to}`, c ? `Demo — your code is ${c}.` : 'It arrives by SMS and works for five minutes.');
  };
  const needPhone = (v: string) => {
    const p = normPhone(v);
    if (!p) setError('A Bangladeshi mobile number, e.g. 01700 000000.');
    return p;
  };

  const submit = () => {
    switch (mode) {
      case 'signin':
        if (!id.trim() || !password) return setError('Your email or mobile, and your password.');
        return run(async () => {
          await login(id.trim(), password);
          welcome();
        });
      case 'register': {
        if (name.trim().length < 2) return setError('Your full name, please.');
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError('This email looks incomplete.');
        const p = needPhone(phone);
        if (!p) return;
        const w = passwordProblem(password);
        if (w) return setError(w);
        return run(async () => {
          const r = await register({ name: name.trim(), email: email.trim(), phone: p, password });
          sent(p, r.demoCode);
          go('register-code');
        });
      }
      case 'register-code':
        if (!/^\d{6}$/.test(code)) return setError('The code has six digits.');
        return run(async () => {
          const attached = await verifyRegister(normPhone(phone)!, code);
          welcome(attached ? 'Your earlier orders and fittings are already in your portal.' : 'Your account is ready.');
        });
      case 'forgot': {
        const p = needPhone(phone);
        if (!p) return;
        return run(async () => {
          const r = await forgotPassword(p);
          sent(p, r.demoCode);
          go('forgot-code');
        });
      }
      case 'forgot-code': {
        if (!/^\d{6}$/.test(code)) return setError('The code has six digits.');
        const w = passwordProblem(password);
        if (w) return setError(w);
        return run(async () => {
          await resetPassword(normPhone(phone)!, code, password);
          welcome('Your new password is set. Other devices were signed out.');
        });
      }
      case 'otp': {
        const p = needPhone(phone);
        if (!p) return;
        return run(async () => {
          const r = await requestOtp(p);
          sent(p, r.demoCode);
          go('otp-code');
        });
      }
      case 'otp-code':
        if (!/^\d{6}$/.test(code)) return setError('The code has six digits.');
        return run(async () => {
          await verifyOtp(normPhone(phone)!, code);
          welcome();
        });
    }
  };

  const codeField = (
    <Field
      label="Six-digit code"
      value={code}
      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      hint={demoCode ? `Demo: no SMS is sent — your code is ${demoCode}.` : 'Sent by SMS. It expires in five minutes.'}
    />
  );
  const passwordField = (label: string, auto: string) => (
    <div className="relative">
      <Field label={label} type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={auto} hint={auto === 'new-password' ? 'At least 8 characters, with a letter and a number.' : undefined} />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-7 right-0 text-[10px] tracking-[0.2em] text-bone/60 uppercase hover:text-ivory">
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
  const link = (label: string, m: Mode) => (
    <button type="button" onClick={() => go(m)} className="text-[12px] text-gold underline-offset-4 hover:underline">
      {label}
    </button>
  );
  const cta: Record<Mode, string> = { signin: 'Sign in', register: 'Send the code', 'register-code': 'Create my account', forgot: 'Send the code', 'forgot-code': 'Save and sign in', otp: 'Send the code', 'otp-code': 'Open my portal' };

  return (
    <div className="mx-auto grid min-h-svh max-w-[1440px] items-center gap-12 px-5 pt-28 pb-24 md:grid-cols-2 md:gap-[6vw] md:px-[6vw] md:pt-32">
      <div>
        <p className="kicker">Client portal</p>
        <h1 className="mt-5 font-display text-[clamp(40px,5.6vw,88px)] leading-[1.0] text-ivory">
          Your pieces, <em className="text-champagne">as they are made.</em>
        </h1>
        <p className="mt-8 max-w-md text-[16px] leading-relaxed text-bone/60">Measurements in your tailor&rsquo;s hand, a photograph of every stage, your appointments and your certificates of edition.</p>
      </div>

      <div className="border border-ivory/10 bg-graphite/40 p-6 sm:p-8 md:p-12">
        {(mode === 'signin' || mode === 'register') && (
          <div className="mb-8 grid grid-cols-2 border border-ivory/15" role="tablist">
            {(['signin', 'register'] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => go(m)} className={`py-3 text-[11px] tracking-[0.22em] uppercase transition-colors ${mode === m ? 'bg-ivory text-noir' : 'text-bone/60 hover:text-ivory'}`}>
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
        )}
        <p className="font-display text-[28px] text-ivory">{heading[mode][0]}</p>
        <p className="mt-2 text-[14px] text-bone/60">{heading[mode][1]}</p>

        <form
          noValidate
          className="mt-8 space-y-7"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {mode === 'signin' && (
            <>
              <Field label="Email or mobile" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" />
              {passwordField('Password', 'current-password')}
            </>
          )}
          {mode === 'register' && (
            <>
              <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <Field label="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01XXX XXXXXX" hint="If you have ordered or booked with this number, it all comes with you." />
              {passwordField('Password', 'new-password')}
            </>
          )}
          {(mode === 'forgot' || mode === 'otp') && <Field label="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01XXX XXXXXX" />}
          {(mode === 'register-code' || mode === 'otp-code') && codeField}
          {mode === 'forgot-code' && (
            <>
              {codeField}
              {passwordField('New password', 'new-password')}
            </>
          )}

          {error && (
            <p role="alert" className="text-[13px] text-[#d98597]">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className={`${btnGold} w-full disabled:opacity-60`}>
            {busy ? 'One moment…' : cta[mode]}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          {mode === 'signin' && (
            <>
              {link('Forgot your password?', 'forgot')}
              {link('Sign in with a code instead', 'otp')}
            </>
          )}
          {mode !== 'signin' && mode !== 'register' && link('← Back to sign in', 'signin')}
          {(mode === 'register-code' || mode === 'otp-code' || mode === 'forgot-code') && link('Use another number', mode === 'register-code' ? 'register' : mode === 'otp-code' ? 'otp' : 'forgot')}
        </div>

        {isDemo && (
          <div className="mt-10 border-t border-ivory/10 pt-6 text-[12px] leading-relaxed text-bone/60">
            <p>
              Showing the demo? Sample client: <span className="text-bone/70">01700000000</span> · <span className="text-bone/70">{DEMO_CLIENT_PASSWORD}</span> — the code is always <span className="text-bone/70">222222</span>.
            </p>
            <button
              onClick={() =>
                run(async () => {
                  setPhone(DEMO_CLIENT_PHONE);
                  await enterAsDemoClient();
                  welcome();
                })
              }
              disabled={busy}
              className="mt-3 text-[11px] tracking-[0.24em] text-gold uppercase hover:text-gold-light"
            >
              Enter as Tanvir Rahman →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
