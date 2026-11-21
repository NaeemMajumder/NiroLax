# Nirolax — web

Storefront for Nirolax. Next.js 16 · React 19 · React Three Fiber · GSAP + Lenis · Tailwind v4.

**Status: Phases 1–6 built.** The site runs in one of two modes:

- **Server mode** — `API_URL` is set (see `.env.example`). Every order, fitting, sign-in and console
  change goes to the Express + MongoDB API in `../server` through the `/api/v1/*` rewrite.
- **Demo mode** — no `API_URL`. Everything runs on sample data saved in the browser
  (this is what the shareable preview link uses).

| Route | What it is |
|---|---|
| `/` | Home: opening, silk hero, the house, the Midnight Tuxedo story, Season index, fittings, portal preview |
| `/season`, `/pieces/[slug]` | The ten pieces; each with gallery, edition counter, MTM / RTW purchase |
| `/checkout` → `/pay` → `/order` | Reservation bag (24-hour hold), checkout (card / bKash / COD), demo gateway, confirmation with edition numbers |
| `/fittings` → `/fittings/confirmed` | Book an hour: purpose, day, hour, details, BDT 10,000 deposit for new pieces, invitation |
| `/faq` | Questions — search, topics, FAQPage structured data |
| `/contact` | Contact & visit — drawn map, hours, form (lands in the console's Messages tab) |
| `/portal` | Client portal — sign-in by phone + six-digit SMS code (in demo mode the code is shown on screen). Pieces in production with stage photos, certificate, measure sheet, appointments, orders |
| `/console` | Atelier Console — overview, fittings, production (move stages, add stage photos), orders, clients & measure sheets, editions |
| `/atelier`, `/journal`, `/care`, `/delivery`, `/privacy`, `/terms` | Content pages |

The header shows **Sign in** when signed out and the client's initial (with a menu: My portal, Book a fitting,
Sign out) when signed in — on phones too. Staff reach the console from the footer ("Atelier staff sign-in")
or the phone menu.

Demo logins (code always 222222):
- Client — `01700000000` or `tanvir@nirolax.demo` / `Demo@1234`, or "Enter as Tanvir Rahman". New visitors
  can create an account (name, email, mobile, password → SMS code) or reset a forgotten password.
- Console (each role sees its own tabs) — owner `atelier@nirolax.com / atelier2026`, manager
  `farah@nirolax.com / Manager@1234`, tailor `karim@nirolax.com / Tailor@1234`, orders
  `rina@nirolax.com / Orders@1234`, content `mitu@nirolax.com / Content@1234`.

## The Atelier Console (admin panel)

Overview · Fittings (walk-ins, move, deposit received) · Production (stages + photos) · Orders (detail
drawer: timeline, notes, courier booking, cancel + refund, printable invoice, search, date range,
Excel) · Clients (add, edit, delete on request, measure sheets) · **Catalogue** (add/edit pieces,
WebP photo upload to Cloudinary, publish, reorder) · Editions · Messages (+ Outbox of every SMS/email,
Letter list) · Reports (sales, deposits, pieces, payment mix, Excel exports, backup & restore) ·
Settings (atelier details, hours, closed days/dates, deposit, staff notifications) · Staff & roles ·
Activity (audit log with before/after).

The season is read from the API (`src/lib/catalogue.server.ts`, refreshed every 30 s, new pieces get a
page on first visit); the built-in `SEED_PIECES` are used when no API is connected.

## SEO

Title template, per-page description and canonical, Open Graph + Twitter card with a generated
`/opengraph-image`, JSON-LD (ClothingStore, Product + Offer, BreadcrumbList, Article, FAQPage),
`/sitemap.xml` (includes every published piece), `/robots.txt` (keeps the portal, console and checkout
out), web manifest. Security headers (CSP, HSTS, nosniff, frame-deny) are set in `next.config.ts`.

Lighthouse (production build, measured locally): desktop performance 98–100, SEO 100, best practices
100, accessibility 93–97; mobile (simulated slow 4G) performance 75–92. The home page intro and the
scroll-reveal of the manifesto text are deliberate and cost a few points.

`src/lib/actions.ts` is the only thing screens call to *do* something: it talks to the API in server mode
and to the in-browser store (`src/lib/store.ts`) in demo mode.

## Run it

```bash
# 1 — the API (in another terminal)
cd server && npm install && cp .env.example .env && npm run dev     # :5000

# 2 — the site
cd web && npm install && cp .env.example .env.local && npm run dev   # http://localhost:3000
```

Leave `API_URL` out of `.env.local` to run the site alone on demo data.

`npm run build` makes a production build. `npm run export` makes a static copy in `out/`
(used only for the shareable preview link).

## Where things are

```
src/
  app/                        layout (fonts, smooth scroll, cursor, reveals) and the home page
  components/
    gl/Silk.tsx               live satin shader — hero background and fabric previews
    motion/Motion.tsx         every scroll reveal: data-reveal="lines|fade|image|words"
    motion/Cursor.tsx         gold cursor; data-cursor="View" shows a label
    site/                     Intro, Nav, Hero, Manifesto, PieceStory, Collection,
                              Appointment, Portal, Footer, SmoothScroll
  lib/pieces.ts               Season I catalogue (sample data)
  lib/actions.ts              every action (order, book, sign in, console) — API or demo
  lib/store.ts                local copy of the data: cart, orders, fittings, clients, commissions, editions
  lib/stages.ts               the eleven production stages and the measure list
  lib/logo-paths.ts           logo path data (generated from public/brand)
public/
  pieces/<slug>/              photos (*.webp) and cut-outs (*-cut.webp)
  brand/                      logo files
scripts/
  fix-export.mjs              fixes font paths in the static export
  make-preview.sh             makes the artifact-hosting copy of out/
```

Old Sprint 0 files that are no longer used and can be deleted: `src/components/three/`,
`src/lib/stage.ts`, `src/components/site/Story.tsx`, `src/components/site/Atelier.tsx`,
`public/models/`, `public/posters/`.

## Adding photos for a piece

Put the four views in `public/pieces/<slug>/` as `front.webp`, `left.webp`, `back.webp`,
`right.webp`, plus cut-outs with a transparent background as `front-cut.webp` and so on, then set
`photo` for that piece in `src/lib/pieces.ts`.

## Notices (toasts)

Every action gives feedback through `sonner`, styled in `src/components/ui/Toaster.tsx` and called via
`notify` in `src/lib/toast.ts` (console actions announce themselves from `src/lib/actions.ts`).

## Demo wording

Hints like the on-screen sign-in code, "Enter as Tanvir Rahman", the console's sample login and
"Reset sample data" appear only while the API runs with `DEMO_MODE=true` (or on the static preview).
With `DEMO_MODE=false` they disappear on their own.
