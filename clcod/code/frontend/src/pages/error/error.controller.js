/**
 * ErrorPage logic — the <script> blocks of the original error.html, ported verbatim.
 *
 * Only mechanical SPA wiring differs from the original (see MIGRATION.md):
 *   • "page.html" links/redirects → routes, window.location.href = … → navigateTo(…)
 *   • DOMContentLoaded → onReady(…), document/window listeners → on(target, …)
 *   • timers, fetch and onAuthStateChanged come from the page scope, so they stop when you navigate away
 *     (a full page load used to do that). Classic scripts run first, then module scripts — same as before.
 */
import { auth } from '../../lib/firebase-config.js';

export default function mountErrorPage(scope) {
  const { onAuthStateChanged } = scope;

  // ───────────── <script> #1 (classic) ─────────────
  const msg = sessionStorage.getItem('md_errorMessage');
  if (msg) {
    const el = document.getElementById('error-message');
    if (el) el.textContent = msg;
  }

  // ───────────── <script type="module"> #2 ─────────────
  {
  onAuthStateChanged(auth, user => {
    const loginBtn = document.getElementById('login-signup-btn');
    const badgeWrap = document.getElementById('user-badge');
    const avatarNav = document.getElementById('user-avatar');
    const nameNavEl = document.getElementById('user-name');
    const resLink = document.getElementById('nav-results-link');

    if (user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (badgeWrap) badgeWrap.classList.replace('hidden', 'flex');
      const displayName = user.displayName || user.email || 'User';
      const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?background=bb000e&color=fff&size=128&name=${encodeURIComponent(displayName)}`;
      
      if (avatarNav) avatarNav.src = avatarUrl;
      if (nameNavEl) nameNavEl.textContent = displayName.split(' ')[0];
      if (resLink) resLink.href = '/results';
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (badgeWrap) badgeWrap.classList.add('hidden');
      if (resLink) resLink.href = '/login';
    }
  });
  }

}
