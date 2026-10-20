# ManoDhwani — React frontend

ManoDhwani's web frontend: the former static HTML site, rewired as a React single-page app (Vite + React 19 + React Router 7).
Every page looks and behaves exactly as before: same markup, tiles, navbar, tabs, styles and animations,
and the same model (`/analyze`) and PDF (`/generate-pdf`) calls with identical request payloads.
The backend is untouched.

## Run it

```bash
cd clcod/code/frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build
```

Node 18+ is required. The backend URL is unchanged (`https://sense123-psychsense.hf.space`, set in the page
controllers exactly where it was in the HTML files).

## Deploy (Vercel)

Point the Vercel project's **Root Directory** at `clcod/code/frontend`. Vercel detects Vite automatically
(build `npm run build`, output `dist`). `vercel.json` sends every path to `index.html` so client routes work
on refresh. Old links such as `/analysis.html` redirect to `/analysis`.

If your HF Space restricts CORS with `ALLOWED_ORIGIN`, add the new origin (and `http://localhost:5173` for
local development).

## Routes

| Old file | Route |
|---|---|
| index.html | `/` |
| login.html | `/login` |
| user-info.html | `/user-info` |
| analysis.html | `/analysis` |
| synthesizing.html | `/synthesizing` |
| questionnaire.html | `/questionnaire` |
| results.html | `/results` |
| profile.html | `/profile` |
| error.html | `/error` |
| test-star.html | `/test-star` |

## Layout

```
frontend/
├── index.html                  Vite entry (fonts are added per page at runtime)
├── public/assets/              hero_silk_bg.png, brain_nbg.png
├── design-assets/              old assets no page used (animation.mp4, aquero.zip font, brain images) —
│                               not part of the build; move into public/ if the redesign needs them
└── src/
    ├── main.jsx, App.jsx        bootstrapping + router (one lazy chunk per page)
    ├── components/
    │   ├── TopNavBar.jsx        the shared top navbar (8 pages)
    │   └── SiteFooter.jsx       the footer, all original variants in one place
    ├── lib/
    │   ├── page-runtime.js      gives each page its own <head>/<body> state and cleans up on leave
    │   ├── navigation.js        navigateTo(), link interception, old-URL → route map
    │   ├── firebase-config.js   ported js/firebase-config.js (npm firebase 11.0.0)
    │   ├── storage-helper.js    ported js/storage-helper.js (IndexedDB audio storage)
    │   └── backgrounds.js       ported js/backgrounds.js (was unused; kept for the redesign)
    ├── styles/star-border.css   the star-border button effect
    └── pages/<page>/
        ├── <Page>Page.jsx       the page markup as JSX
        ├── <page>.controller.js the page's original <script> logic
        ├── <page>.css           the page's original <style> blocks, in cascade order
        └── tailwind.config.js   the page's original inline Tailwind config
```

See [MIGRATION.md](./MIGRATION.md) for exactly what changed and why, and for pointers on the redesign.
