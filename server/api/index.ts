// Vercel entry: every request is handled by the Express app.
// It loads the app compiled by `npm run build` (dist/), so Vercel does not
// re-compile the TypeScript sources with its own, different settings.
// @ts-ignore -- dist/ is plain JavaScript without type declarations
export { default } from '../dist/app.js';
