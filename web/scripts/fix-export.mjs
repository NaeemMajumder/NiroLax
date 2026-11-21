// Post-processing for the static preview export (npm run export).
// 1. CSS files live in _next/static/css/, so their font URLs must point one folder up.
// 2. Pages in sub-folders (pieces/x.html, journal/y.html) get a <base> tag pointing back to the
//    export root, so the relative asset prefix ("./") works at any depth and wherever it is hosted.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const cssDir = 'out/_next/static/css';
for (const f of readdirSync(cssDir).filter((f) => f.endsWith('.css'))) {
  const p = join(cssDir, f);
  writeFileSync(p, readFileSync(p, 'utf8').replace(/url\((?:\.\/)?_next\/static\/media\//g, 'url(../media/'));
}

const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? (f === '_next' ? [] : walk(p)) : [p];
  });

let based = 0;
for (const p of walk('out').filter((p) => p.endsWith('.html'))) {
  const depth = relative('out', p).split(sep).length - 1;
  if (depth === 0) continue;
  const html = readFileSync(p, 'utf8').replace('<head>', `<head><base href="${'../'.repeat(depth)}">`);
  writeFileSync(p, html);
  based++;
}
console.log(`export: css asset paths fixed, <base> added to ${based} nested pages`);
