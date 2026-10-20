/**
 * LoginPage logic — the <script> blocks of the original login.html, ported verbatim.
 *
 * Only mechanical SPA wiring differs from the original (see MIGRATION.md):
 *   • "page.html" links/redirects → routes, window.location.href = … → navigateTo(…)
 *   • DOMContentLoaded → onReady(…), document/window listeners → on(target, …)
 *   • timers, fetch and onAuthStateChanged come from the page scope, so they stop when you navigate away
 *     (a full page load used to do that). Classic scripts run first, then module scripts — same as before.
 */
import { auth, db, provider } from '../../lib/firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function mountLoginPage(scope) {
  const { onAuthStateChanged, navigateTo, on } = scope;
  scope.globals(['_mdIsNewSignup', '_mdJustLoggedIn', 'switchTab', 'togglePwd', 'handleAuthSubmit', 'googleSignIn']);

  // ───────────── <script type="module"> #1 ─────────────
  {
  // Logic for unified header
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

      // Redirect: new signups go to user-info to fill profile, logins go straight to analysis
      if (window._mdIsNewSignup) {
        window._mdIsNewSignup = false;
        sessionStorage.removeItem('md_userInfo');
        navigateTo('/analysis');
      } else if (window._mdJustLoggedIn) {
        window._mdJustLoggedIn = false;
        sessionStorage.removeItem('md_userInfo');
        navigateTo('/analysis');
      }
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (badgeWrap) badgeWrap.classList.add('hidden');
      if (resLink) resLink.href = '/login';
    }
  });

  let currentTab = 'login';

  window.switchTab = function(tab) {
    currentTab = tab;
    document.getElementById('auth-name-field').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('auth-confirm-field').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('auth-submit-txt').textContent = tab === 'login' ? 'Login' : 'Create Account';
    document.getElementById('tab-login').className = 'auth-tab-btn' + (tab === 'login' ? ' active' : '');
    document.getElementById('tab-signup').className = 'auth-tab-btn' + (tab === 'signup' ? ' active' : '');
    clearError();
  };

  window.togglePwd = function() {
    const input = document.getElementById('auth-password');
    const icon = document.getElementById('eye-icon');
    if (input.type === 'password') {
      input.type = 'text';
      icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
    } else {
      input.type = 'password';
      icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
  };

  function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.style.display = 'block';
  }
  function clearError() {
    const el = document.getElementById('auth-error');
    el.textContent = '';
    el.style.display = 'none';
  }

  window.handleAuthSubmit = async function() {
    clearError();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-submit-btn');

    if (!email || !password) { showError('Please fill in all fields.'); return; }

    if (currentTab === 'signup') {
      const name = document.getElementById('auth-name').value.trim();
      const confirm = document.getElementById('auth-confirm').value;
      if (!name) { showError('Please enter your full name.'); return; }
      if (password !== confirm) { showError('Passwords do not match.'); return; }
      if (password.length < 6) { showError('Password must be at least 6 characters.'); return; }
    }

    document.getElementById('auth-submit-txt').textContent = currentTab === 'login' ? 'Signing in…' : 'Creating account…';
    btn.disabled = true;

    try {
      if (currentTab === 'login') {
        window._mdJustLoggedIn = true;
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const name = document.getElementById('auth-name').value.trim();
        window._mdIsNewSignup = true;
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
      }
      // onAuthStateChanged will redirect based on flags above
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      };
      showError(msgs[err.code] || 'Something went wrong. Please try again.');
      btn.textContent = currentTab === 'login' ? 'Login' : 'Create Account';
      btn.disabled = false;
    }
  };

  window.googleSignIn = async function() {
    const btn = document.getElementById('google-btn');
    btn.textContent = 'Connecting to Google…';
    btn.disabled = true;
    try {
      const { signInWithPopup } = await import('firebase/auth');
      window._mdJustLoggedIn = true;
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will redirect
    } catch (err) {
      if (err.code === 'auth/popup-blocked') {
        showError('Please allow popups for this site to sign in with Google.');
      } else {
        showError('Google sign-in failed. Please try again.');
      }
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Continue with Google`;
      btn.disabled = false;
    }
  };

  // Allow Enter key to submit
  on(document, 'keydown', e => {
    if (e.key === 'Enter') window.handleAuthSubmit();
  });
  }

}
