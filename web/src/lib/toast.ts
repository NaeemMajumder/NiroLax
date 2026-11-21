'use client';

import { toast } from 'sonner';

/** One place for every notice the site shows */
export const notify = {
  ok: (title: string, description?: string, action?: { label: string; onClick: () => void }) => toast.success(title, { description, action }),
  info: (title: string, description?: string) => toast.info(title, { description }),
  err: (title: string, description?: string) => toast.error(title, { description, duration: 6000 }),
  /** Show a spinner while `p` runs, then success or the error's own message */
  run: <T,>(p: Promise<T>, msg: { loading: string; ok: string | ((v: T) => string); okDetail?: string }) =>
    toast.promise(p, {
      loading: msg.loading,
      success: (v: T) => ({ message: typeof msg.ok === 'function' ? msg.ok(v) : msg.ok, description: msg.okDetail }),
      error: (e: Error) => e.message || 'Something went wrong. Please try again.',
    }),
};
