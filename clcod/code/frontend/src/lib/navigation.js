/**
 * Navigation glue between the original imperative page code and React Router.
 *
 * The static site navigated with `window.location.href = 'analysis.html'` and plain <a href> links.
 * In the React app those become client-side route changes:
 *   • page code calls navigateTo('/analysis')
 *   • onclick="" strings that page code writes into innerHTML call window.mdNavigate('/profile')
 *   • same-origin <a href="/route"> clicks (including links whose href page code changes at runtime,
 *     e.g. #nav-results-link) are intercepted below.
 * Every navigation remounts the target page, just like a full page load used to.
 */

// Old file → new route. Old URLs (/analysis.html etc.) also keep working via redirects in App.jsx.
export const ROUTES = {
  'index.html': '/',
  'login.html': '/login',
  'user-info.html': '/user-info',
  'analysis.html': '/analysis',
  'synthesizing.html': '/synthesizing',
  'questionnaire.html': '/questionnaire',
  'results.html': '/results',
  'profile.html': '/profile',
  'error.html': '/error',
  'test-star.html': '/test-star',
};
const APP_PATHS = new Set([...Object.values(ROUTES), ...Object.keys(ROUTES).map((f) => '/' + f)]);

let router = null;
let navCounter = 0;

export function attachRouter(r) {
  router = r;
}

/** Go to a route as a fresh page visit (the page component remounts and its scripts run again). */
export function navigateTo(to, { replace = false } = {}) {
  if (!router) throw new Error('navigateTo called before the router was attached');
  router.navigate(to, { replace, state: { mdNav: ++navCounter } });
}

// For onclick="..." attributes inside HTML strings built by page code.
window.mdNavigate = (to) => navigateTo(to);

export function installLinkInterception() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const raw = a.getAttribute('href');
    if (raw.startsWith('#')) return; // in-page anchor such as href="#": let the browser handle it, as before
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin || !APP_PATHS.has(url.pathname)) return;
    e.preventDefault();
    navigateTo(url.pathname + url.search + url.hash);
  });
}
