/**
 * UserInfoPage logic — the <script> blocks of the original user-info.html, ported verbatim.
 *
 * Only mechanical SPA wiring differs from the original (see MIGRATION.md):
 *   • "page.html" links/redirects → routes, window.location.href = … → navigateTo(…)
 *   • DOMContentLoaded → onReady(…), document/window listeners → on(target, …)
 *   • timers, fetch and onAuthStateChanged come from the page scope, so they stop when you navigate away
 *     (a full page load used to do that). Classic scripts run first, then module scripts — same as before.
 */
import { auth, db } from '../../lib/firebase-config.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function mountUserInfoPage(scope) {
  const { onAuthStateChanged, navigateTo } = scope;
  scope.globals(['_saveAgeGenderDirect', 'proceedToAssessment']);

  // ───────────── <script type="module"> #1 ─────────────
  {
    let _firebaseUser = null;

    // Expose a direct save function that doesn't need window.currentUser
    window._saveAgeGenderDirect = async function(age, gender) {
        if (!_firebaseUser) return;
        try {
            await setDoc(doc(db, 'users', _firebaseUser.uid), { age, gender }, { merge: true });
        } catch(e) { console.error('Failed to save age/gender:', e); }
    };

    onAuthStateChanged(auth, async (user) => {
        _firebaseUser = user;
        const loginBtn = document.getElementById('login-signup-btn');
        const badgeWrap = document.getElementById('user-badge');
        const avatarNav = document.getElementById('user-avatar');
        const nameNavEl = document.getElementById('user-name');
        const resLink = document.getElementById('nav-results-link');

        if (!user) {
            if (loginBtn) loginBtn.style.display = '';
            if (badgeWrap) badgeWrap.classList.add('hidden');
            if (resLink) resLink.href = '/login';
            navigateTo('/login');
            return;
        }

        if (loginBtn) loginBtn.style.display = 'none';
        if (badgeWrap) badgeWrap.classList.replace('hidden', 'flex');
        const displayName = user.displayName || user.email || 'User';
        const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?background=bb000e&color=fff&name=${encodeURIComponent(displayName)}`;
        
        if (avatarNav) avatarNav.src = avatarUrl;
        if (nameNavEl) nameNavEl.textContent = displayName.split(' ')[0];
        if (resLink) resLink.href = '/results';

        const nameInput = document.getElementById('fullName');
        const ageInput = document.getElementById('age');
        const genderInput = document.getElementById('gender');
        const profileImg = document.getElementById('profile-img');

        // Profile image in form
        if (profileImg) profileImg.src = avatarUrl;

        // Auto-fill from Firestore
        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) {
                const data = snap.data();
                if (data.fullName && !nameInput.value) nameInput.value = data.fullName;
                if (data.age && !ageInput.value) ageInput.value = data.age;
                if (data.gender && !genderInput.value) genderInput.value = data.gender;
            } else if (user.displayName) {
                nameInput.value = user.displayName;
            }
        } catch (e) {
            if (user.displayName) nameInput.value = user.displayName;
        }
    });

    window.proceedToAssessment = function() {
        const name = document.getElementById('fullName').value.trim();
        const age = document.getElementById('age').value.trim();
        const gender = document.getElementById('gender').value;

        if (!name) {
            alert('Please enter a full name.');
            return;
        }

        sessionStorage.setItem('md_userInfo', JSON.stringify({ name, age, gender }));

        // Persist age & gender directly to Firestore (does not need window.currentUser)
        window._saveAgeGenderDirect(age, gender).catch(() => {});

        navigateTo('/analysis');
    };
  }

}
