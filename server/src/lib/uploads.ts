import crypto from 'node:crypto';
import { env } from '../env.js';
import { bad } from './util.js';

/**
 * Images go straight from the browser to Cloudinary (already resized to WebP in the browser),
 * using a signature from this server — the API secret never reaches the browser.
 * Without Cloudinary keys, a small resized data URL is kept in the database instead (demo).
 */
export function signUpload(subfolder: string) {
  const c = env.cloudinary;
  if (!c) return null;
  const folder = `${c.folder}/${subfolder.replace(/[^a-z0-9/_-]/gi, '')}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp: String(timestamp) };
  const toSign = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const signature = crypto.createHash('sha1').update(toSign + c.secret).digest('hex');
  return { cloudName: c.cloud, apiKey: c.key, folder, timestamp, signature, url: `https://api.cloudinary.com/v1_1/${c.cloud}/image/upload` };
}

/** Accept a Cloudinary URL from our own account, or (without Cloudinary) a resized data URL */
export function checkImage(v: string): string {
  const c = env.cloudinary;
  if (c && v.startsWith(`https://res.cloudinary.com/${c.cloud}/image/upload/`)) return v;
  if (/^data:image\/(png|jpe?g|webp);base64,/.test(v)) {
    if (v.length > 2_500_000) throw bad('That photo is too large (keep it under ~1.8 MB).');
    return v;
  }
  if (v.startsWith('/') && !v.startsWith('//')) return v; // a built-in photograph shipped with the site
  throw bad('That image did not come from the atelier’s Cloudinary account.');
}
