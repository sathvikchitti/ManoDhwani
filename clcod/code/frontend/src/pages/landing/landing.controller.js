/**
 * LandingPage logic — the <script> blocks of the original index.html, ported verbatim.
 *
 * Only mechanical SPA wiring differs from the original (see MIGRATION.md):
 *   • "page.html" links/redirects → routes, window.location.href = … → navigateTo(…)
 *   • DOMContentLoaded → onReady(…), document/window listeners → on(target, …)
 *   • timers, fetch and onAuthStateChanged come from the page scope, so they stop when you navigate away
 *     (a full page load used to do that). Classic scripts run first, then module scripts — same as before.
 */
import { auth } from '../../lib/firebase-config.js';

export default function mountLandingPage(scope) {
  const { setTimeout, setInterval, clearInterval, fetch, onAuthStateChanged, navigateTo, onReady } = scope;
  scope.globals(['_mdUserLoggedIn', 'handleGetStarted']);

  // ───────────── <script> #1 (classic) ─────────────
    // Track whether the user is logged in (set by onAuthStateChanged below)
    window._mdUserLoggedIn = false;

    // Smart GET STARTED handler: logged-in → go straight to analysis; guest → show modal
    window.handleGetStarted = function () {
      if (window._mdUserLoggedIn) {
        sessionStorage.removeItem('md_userInfo');
        navigateTo('/analysis');
      } else {
        sessionStorage.removeItem('md_userInfo');
        navigateTo('/login');
      }
    };

    function closeInfoModal() {
      const m = document.getElementById('info-modal');
      m.style.opacity = '0';
      m.style.transition = 'opacity 0.25s';
      setTimeout(() => { m.classList.remove('open'); m.style.opacity = ''; m.style.transition = ''; }, 260);
    }

    function submitLandingModal() {
      const name = (document.getElementById('lp-modal-name').value || '').trim();
      const age = (document.getElementById('lp-modal-age').value || '').trim();
      const gender = document.getElementById('lp-modal-gender').value || '';
      const errEl = document.getElementById('lp-modal-error');
      if (!name) { errEl.classList.remove('hidden'); return; }
      errEl.classList.add('hidden');
      sessionStorage.setItem('md_userInfo', JSON.stringify({ name, age, gender }));
      navigateTo('/analysis');
    }

    // Backend status check
    const statusDot = document.getElementById('status-dot');
    const statusLabel = document.getElementById('status-label');
    const BACKEND_URL = 'https://sense123-psychsense.hf.space';

    async function checkBackendHealth() {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          statusDot.className = 'w-2 h-2 rounded-full bg-green-500 animate-pulse';
          statusLabel.textContent = 'System Active';
        } else { setStatusDown(); }
      } catch (_) { setStatusDown(); }
    }

    function setStatusDown() {
      statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
      statusLabel.textContent = 'System De-activated';
      statusLabel.style.color = '#b91c1c';
    }

    checkBackendHealth();
    setInterval(checkBackendHealth, 30000);

  // ───────────── <script> #2 (classic) ─────────────
    (function () {
      const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?';
      function scrambleText(el, finalText, duration) {
        const totalFrames = Math.round(duration / 40);
        const resolveAt = (i) => Math.floor(totalFrames * (i / finalText.length) * 0.75 + totalFrames * 0.25);
        let frame = 0;
        const iv = setInterval(() => {
          let out = '';
          for (let i = 0; i < finalText.length; i++) {
            if (finalText[i] === ' ') { out += ' '; continue; }
            if (frame >= resolveAt(i)) {
              out += finalText[i];
            } else {
              out += CHARS[Math.floor(Math.random() * CHARS.length)];
            }
          }
          el.textContent = out;
          if (++frame > totalFrames) {
            el.textContent = finalText;
            clearInterval(iv);
          }
        }, 40);
      }

      function initScramble() {
        const el = document.getElementById('precision-metrics-title');
        if (!el) return;
        const finalText = 'Precision Metrics';
        el.textContent = finalText;

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setTimeout(() => scrambleText(el, finalText, 1600), 150);
              observer.disconnect();
            }
          });
        }, { threshold: 0.3 });

        observer.observe(el);
      }

      if (document.readyState === 'loading') {
        onReady(initScramble);
      } else {
        initScramble();
      }
    })();

  // Top-level functions of classic <script>s were globals; inline handlers & innerHTML onclick="" rely on that.
  scope.expose({ closeInfoModal, submitLandingModal, checkBackendHealth, setStatusDown });

  // ───────────── <script type="module"> #3 ─────────────
  {
    // ─── AUTH SYNC LOGIC ───
    // Clear avatar immediately on page load to prevent stale previous-user data
    const _avatarEl = document.getElementById('user-avatar');
    const _nameEl = document.getElementById('user-name');
    if (_avatarEl) _avatarEl.src = '';
    if (_nameEl) _nameEl.textContent = '';

    onAuthStateChanged(auth, user => {
      const loginBtn = document.getElementById('login-signup-btn');
      const badgeWrap = document.getElementById('user-badge');
      const avatarNav = document.getElementById('user-avatar');
      const nameNavEl = document.getElementById('user-name');

      if (user) {
        window._mdUserLoggedIn = true;
        if (loginBtn) loginBtn.style.display = 'none';
        if (badgeWrap) { badgeWrap.classList.remove('hidden'); badgeWrap.classList.add('flex'); }
        const displayName = user.displayName || user.email || 'User';
        // Always use fresh photoURL from current auth session
        const avatarUrl = user.photoURL
          ? user.photoURL + (user.photoURL.includes('?') ? '&' : '?') + 't=' + Date.now()
          : `https://ui-avatars.com/api/?background=bb000e&color=fff&size=128&name=${encodeURIComponent(displayName)}`;
        if (avatarNav) { avatarNav.src = ''; avatarNav.src = avatarUrl; }
        if (nameNavEl) nameNavEl.textContent = displayName.split(' ')[0];
      } else {
        window._mdUserLoggedIn = false;
        if (loginBtn) loginBtn.style.display = '';
        if (badgeWrap) { badgeWrap.classList.add('hidden'); badgeWrap.classList.remove('flex'); }
        if (_avatarEl) _avatarEl.src = '';
        if (_nameEl) _nameEl.textContent = '';
      }
    });
  }

}
