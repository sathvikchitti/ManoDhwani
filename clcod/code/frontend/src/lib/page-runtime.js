/**
 * Page runtime — lets each original page's markup + scripts behave inside React exactly as they did
 * when the page was its own HTML document.
 *
 * On mount a page gets what a fresh page load used to give it:
 *   • its own <title>, <html>/<body> attributes, Google Fonts links and CSS (incl. its own Tailwind build)
 *   • scroll position at the top
 *   • fresh Firebase globals from firebase-config (window._authReady, saveReport, …) and no window.currentUser yet
 *   • its scripts (the page controller) run once the DOM exists, then the DOMContentLoaded handlers
 *
 * On unmount everything the page started is torn down — timers, rAF loops, fetches, document listeners,
 * auth listeners, globals it put on window, its <html>/<body> attribute changes — like leaving a page used to.
 */
import { useLayoutEffect } from 'react';
import { onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { installPageGlobals, CONFIG_GLOBALS } from './firebase-config.js';
import { navigateTo as routerNavigate } from './navigation.js';

let activeFontLinks = new Map(); // href → <link>

function syncFontLinks(hrefs) {
  const next = new Map();
  for (const href of hrefs) {
    let link = activeFontLinks.get(href);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.pageFont = '';
      document.head.appendChild(link);
    }
    next.set(href, link);
  }
  for (const [href, link] of activeFontLinks) if (!next.has(href)) link.remove();
  activeFontLinks = next;
}

function setAttrs(el, attrs) {
  for (const { name } of [...el.attributes]) el.removeAttribute(name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

function createScope() {
  let alive = true;
  const timeouts = new Set();
  const intervals = new Set();
  const frames = new Set();
  const listeners = [];
  const unsubscribers = [];
  const aborters = new Set();
  const readyQueue = [];
  const cleanups = [];
  const globals = new Set();

  const scope = {
    get alive() { return alive; },

    setTimeout(fn, ms, ...args) {
      const id = window.setTimeout(() => { timeouts.delete(id); if (typeof fn === 'function') fn(...args); }, ms);
      timeouts.add(id);
      return id;
    },
    clearTimeout(id) { timeouts.delete(id); window.clearTimeout(id); },
    setInterval(fn, ms, ...args) {
      const id = window.setInterval(fn, ms, ...args);
      intervals.add(id);
      return id;
    },
    clearInterval(id) { intervals.delete(id); window.clearInterval(id); },
    requestAnimationFrame(fn) {
      const id = window.requestAnimationFrame((t) => { frames.delete(id); fn(t); });
      frames.add(id);
      return id;
    },
    cancelAnimationFrame(id) { frames.delete(id); window.cancelAnimationFrame(id); },

    /** fetch that is aborted when the page unmounts; its promise then never settles (like an unloaded page). */
    fetch(input, init = {}) {
      const ctrl = new AbortController();
      let signal = ctrl.signal;
      if (init.signal) signal = typeof AbortSignal.any === 'function' ? AbortSignal.any([init.signal, ctrl.signal]) : init.signal;
      aborters.add(ctrl);
      return new Promise((resolve, reject) => {
        window.fetch(input, { ...init, signal }).then(
          (res) => { aborters.delete(ctrl); if (alive) resolve(res); },
          (err) => { aborters.delete(ctrl); if (alive) reject(err); },
        );
      });
    },

    onAuthStateChanged(auth, ...rest) {
      const unsub = firebaseOnAuthStateChanged(auth, ...rest);
      unsubscribers.push(unsub);
      return () => { unsub(); };
    },

    navigateTo(to) { if (alive) routerNavigate(to); },

    /** Replacement for document.addEventListener('DOMContentLoaded', fn). */
    onReady(fn) { readyQueue.push(fn); },

    /** Replacement for document/window.addEventListener — removed on unmount. */
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      listeners.push([target, type, fn, opts]);
    },

    /** Classic-script top-level functions were globals; inline handlers rely on that. */
    expose(fns) {
      for (const [k, v] of Object.entries(fns)) { window[k] = v; globals.add(k); }
    },
    /** window.* names the page assigns, removed on unmount. */
    globals(names) { names.forEach((n) => globals.add(n)); },

    onCleanup(fn) { cleanups.push(fn); },

    _runReady() {
      for (const fn of readyQueue.splice(0)) {
        try { fn.call(document, new Event('DOMContentLoaded')); } catch (e) { reportError(e); }
      }
    },

    _dispose() {
      alive = false;
      timeouts.forEach((id) => window.clearTimeout(id));
      intervals.forEach((id) => window.clearInterval(id));
      frames.forEach((id) => window.cancelAnimationFrame(id));
      listeners.forEach(([t, type, fn, opts]) => t.removeEventListener(type, fn, opts));
      unsubscribers.forEach((u) => u());
      aborters.forEach((c) => c.abort());
      for (const fn of cleanups) { try { fn(); } catch (e) { reportError(e); } }
      for (const name of globals) if (!CONFIG_GLOBALS.includes(name)) delete window[name];
      delete window.currentUser;
    },
  };
  return scope;
}

function reportError(e) {
  // Same visibility as an uncaught error in a page <script>.
  console.error(e);
}

export function usePageRuntime({ title, htmlAttrs, bodyAttrs, fonts = [], css, controller }) {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const savedHtml = Object.fromEntries([...html.attributes].map((a) => [a.name, a.value]));
    const savedBody = Object.fromEntries([...body.attributes].map((a) => [a.name, a.value]));

    document.title = title;
    setAttrs(html, htmlAttrs);
    setAttrs(body, bodyAttrs);
    syncFontLinks(fonts);
    const style = document.createElement('style');
    style.dataset.page = title;
    style.textContent = css;
    document.head.appendChild(style);
    window.scrollTo(0, 0);

    const scope = createScope();
    delete window.currentUser; // a fresh page load had no user until onAuthStateChanged fired
    installPageGlobals(scope);
    try {
      controller(scope);
    } catch (e) {
      reportError(e);
    }
    scope._runReady();

    return () => {
      scope._dispose();
      style.remove();
      setAttrs(html, savedHtml);
      setAttrs(body, savedBody);
    };
  }, []);
}
