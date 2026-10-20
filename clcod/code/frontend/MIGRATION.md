# Static HTML → React: what changed

Goal: same site, now React. No visual change, no change to the model or PDF pipeline.
The old static files (`clcod/code/*.html`, `js/`, `assets/`, `vercel.json`) were removed; this folder replaces them.
They remain in git history before this change if you ever need to compare.

## What did NOT change

- **Markup / design** — every page's `<body>` was converted to JSX from the browser-parsed DOM: same elements,
  classes, ids, inline styles, text and rendered whitespace. Tiles, navbar, tabs, modals and animations are the same.
- **Styles** — each page's `<style>` blocks are in `src/pages/<page>/<page>.css`, unchanged and in the original
  cascade order. Each page keeps **its own Tailwind config** (the originals differed: e.g. Profile uses default
  border radii, Synthesizing has a dark `background` colour).
- **Logic** — each page's `<script>` blocks are in `src/pages/<page>/<page>.controller.js`, verbatim:
  the analysis flow, questionnaire scoring/classification, results rendering, ADET chart, the
  `/analyze` and `/generate-pdf` request payloads, Firestore reads/writes, session/IndexedDB storage keys.
- **Backend** — untouched.

## What changed (only what an SPA needs)

| Static site | React app | Why |
|---|---|---|
| `window.location.href = 'analysis.html'` (26×) | `navigateTo('/analysis')` | client-side routing |
| `'login.html'` string literals, e.g. `resLink.href = …` (14×) | `'/login'` | new URLs |
| `onclick="window.location.href='profile.html'"` inside innerHTML strings (1×) | `onclick="mdNavigate('/profile')"` | same |
| `<a href="analysis.html">` | `<a href="/analysis">` (clicks are intercepted and routed) | same |
| `document.addEventListener('DOMContentLoaded', fn)` (3×) | `onReady(fn)` | the document has already loaded when a page mounts |
| `document.addEventListener('keydown', …)` (2×) | `on(document, 'keydown', …)` | removed when you leave the page |
| `setTimeout` / `setInterval` / `fetch` / `onAuthStateChanged` | same names, provided by the page scope | stopped/aborted/unsubscribed when you leave the page — a page unload used to do this |
| `import … from 'https://www.gstatic.com/firebasejs/11.0.0/…'` | `import … from 'firebase/…'` (npm, same 11.0.0) | bundling |
| Inline `onclick="…"` attributes (53) | React `onClick={…}` etc. with the same code (`this` → `event.currentTarget`) | JSX |
| `<script src="cdn.tailwindcss.com">` | Tailwind 3 compiled per page at build time | production build |

Buttons that start `disabled` and are enabled later by page code ("Run Analysis", questionnaire "Next") get their
initial state through `ref={initiallyDisabled}` instead of a `disabled` prop — React would otherwise keep ignoring
their clicks after the script enables them.

The login password field is rendered by `components/UnmanagedInput.jsx`: React re-applies an input's `type` on
every keystroke, which would undo the show/hide-password toggle (`input.type = 'text'`).

If you leave a page while one of its requests is in flight (e.g. during "Synthesizing"), the request is aborted
and its code simply stops, as on page unload. (The static site happened to still run the `catch` block during
unload, writing `md_errorMessage`; the React app doesn't — no visible effect.)

Three small additions, each marked `SPA addition` in the code:

1. **Analysis** — if you navigate away mid-recording, the microphone is released (an unload used to do it).
2. **Results** — the "Viewing Historical Report" banner is attached to `<body>`, so it's removed when you leave.
3. **Results** — `downloadReport()` located its button by the inline `onclick` attribute; the button now also has
   `data-onclick="window.downloadReport()"` and the selector matches either.

### How pages behave like separate documents — `src/lib/page-runtime.js`

When a page mounts it gets its own `<title>`, `<html>`/`<body>` attributes, Google Fonts links and CSS (Tailwind's
output is placed after the page's own styles, exactly where the Play CDN appended it). Then its classic scripts
run, then its module scripts, then the `DOMContentLoaded` handlers — the same order as before. Globals the page
defines (`window.goTo`, `window.downloadReport`, …) and the Firebase globals from `firebase-config.js` are reset
per page, as a fresh page load did. Every navigation remounts the target page, so its scripts run again.

## Verified

Built locally and compared in Chromium against the original HTML (served with the same Tailwind Play CDN engine),
with Firebase and the backend mocked identically for both:

- Every page, logged in and logged out, at 1440px and 390px wide: **pixel-identical** screenshots, identical
  text, titles, `<html>`/`<body>` classes and sessionStorage. (Only exception: the randomly generated report ID.)
- End-to-end flows on both versions: login (incl. wrong password), sign-up, user info, the full High-risk path
  (analysis → synthesizing → 12-question questionnaire → results → PDF), the Low-risk path with audio upload,
  backend failure → error page → Try Again, auth guards on every protected page, profile chart tabs and modal,
  historical report view and its PDF, sign out, and leaving mid-analysis. Routes, screenshots, sessionStorage,
  Firestore writes, `/analyze` request bodies and all `/generate-pdf` payloads were identical.
- One visible timing difference, in React's favour: Firebase initialises once instead of on every page load, so
  the navbar shows the signed-in user immediately instead of briefly flashing "Signup/Login".

## Pre-existing quirks that were kept as-is

- `results.html` has an unclosed `<div>`, so the (unused) in-page `#page-profile` section is nested inside
  `#page-results`. The browser's parse was reproduced exactly.
- `profile.html` defines `_toDate` twice; some variables are unused. Untouched.
- Login: after a failed attempt, the error handler replaces the submit button's contents (`btn.textContent`),
  removing `#auth-submit-txt`, so a second attempt throws until the page is reloaded. Same as before.

## Next steps for the redesign

- Navbar and footer: `src/components/TopNavBar.jsx`, `src/components/SiteFooter.jsx` (all footer variants are
  listed there — unify them in one place).
- Backgrounds: the silk image is set in each page's CSS (`body, .bg-fixed-image { background-image: … }`).
- Animations: keyframes live in each page's CSS (`star-border.css` for the button glow).
- To move toward a single design system, merge the per-page `tailwind.config.js` files into one and switch the
  pages' `@config` lines to it — check Profile (border radii) and Synthesizing (background colour) when you do.
- Page logic can be moved from controllers into React state/effects page by page; the controllers keep working
  meanwhile.
