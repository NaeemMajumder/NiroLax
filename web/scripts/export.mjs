/**
 * Static preview build (the shareable demo link). A static export cannot render pages on demand,
 * so the piece page is switched to "built pages only" for this build and switched back afterwards.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const page = 'src/app/pieces/[slug]/page.tsx';
const src = readFileSync(page, 'utf8');
writeFileSync(page, src.replace('export const dynamicParams = true;', 'export const dynamicParams = false;'));
try {
  execSync('next build --webpack', { stdio: 'inherit', env: { ...process.env, NEXT_EXPORT: '1' } });
  execSync('node scripts/fix-export.mjs', { stdio: 'inherit' });
} finally {
  writeFileSync(page, src);
}
