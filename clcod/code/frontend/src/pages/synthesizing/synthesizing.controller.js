/**
 * SynthesizingPage logic — the <script> blocks of the original synthesizing.html, ported verbatim.
 *
 * Only mechanical SPA wiring differs from the original (see MIGRATION.md):
 *   • "page.html" links/redirects → routes, window.location.href = … → navigateTo(…)
 *   • DOMContentLoaded → onReady(…), document/window listeners → on(target, …)
 *   • timers, fetch and onAuthStateChanged come from the page scope, so they stop when you navigate away
 *     (a full page load used to do that). Classic scripts run first, then module scripts — same as before.
 */
import { auth, db } from '../../lib/firebase-config.js';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';

export default function mountSynthesizingPage(scope) {
  const { setTimeout, setInterval, clearInterval, fetch, onAuthStateChanged, navigateTo } = scope;

  // ───────────── <script> #1 (classic) ─────────────
    const FLASK_API_URL = 'https://sense123-psychsense.hf.space';

    // Cycle status messages
    const loadingMessages = ['Processing your inputs…', 'Running WavLM audio analysis…', 'Extracting RoBERTa text embeddings…', 'Analysing cognitive patterns…', 'Running fusion model inference…', 'Generating clinical report…'];
    let msgIdx = 0;
    const statusEl = document.getElementById('loading-status');
    const msgInterval = setInterval(() => {
      if (statusEl) statusEl.textContent = loadingMessages[msgIdx % loadingMessages.length];
      msgIdx++;
    }, 2500);

    // Read inputs saved by analysis.html
    const userInfo = JSON.parse(sessionStorage.getItem('md_userInfo') || '{"name":"","age":"","gender":""}');
    const textInputVal = sessionStorage.getItem('md_textInputVal') || '';
    const audioBase64 = sessionStorage.getItem('md_audioBase64') || null;

    async function analyzeWithFlask() {
      const emptyQ = { answers: { elevatedMood: false, reducedSleep: false, impulsivity: false, racingThoughts: false }, duration: 0, seasonalPattern: 'No seasonal pattern', postpartum: 'Not applicable', impairment: 30 };

      // ── Pre-flight guard: ensure at least one input modality is present ──
      const hasText = !!(textInputVal && textInputVal.trim());

      // Try to load from IndexedDB first (preferred for large audio)
      let audioBlob = null;
      try {
        audioBlob = await window.MD_Storage.loadFromIDB('audioBlob');
      } catch (e) { console.warn("IDB Load Failed", e); }

      const hasAudio = !!(audioBlob || audioBase64);

      if (!hasText && !hasAudio) {
        throw new Error(
          'No input provided. Please go back to the Assessment page and enter some text or record audio before running the analysis.'
        );
      }

      // ── Backend health check ──────────────────────────────────────────
      try {
        const ping = await fetch(`${FLASK_API_URL}/health`);
        if (!ping.ok && ping.status !== 206) throw new Error('Backend not reachable');
      } catch (err) {
        if (err.message === 'Backend not reachable') throw err;
        throw new Error(`Cannot reach the Flask backend at ${FLASK_API_URL}. Make sure the backend is running. (${err.message})`);
      }

      const formData = new FormData();
      formData.append('text', textInputVal || '');
      formData.append('questionnaire', JSON.stringify(emptyQ));
      formData.append('userInfo', JSON.stringify(userInfo));
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.wav');
      } else if (audioBase64) {
        try {
          const blob = await (await fetch(audioBase64)).blob();
          formData.append('audio', blob, 'recording.wav');
        } catch (e) {
          console.warn('[ManoDhwani] Failed to attach audio blob fallback (ignored):', e);
        }
      }

      const response = await fetch(`${FLASK_API_URL}/analyze`, { method: 'POST', body: formData });
      if (!response.ok && response.status !== 206) {
        let errMsg = `Server error ${response.status}`;
        try {
          const body = await response.text();
          errMsg = JSON.parse(body).error || errMsg;
        } catch (_) { }
        throw new Error(errMsg);
      }
      const rawText = await response.text();
      if (!rawText || !rawText.trim()) throw new Error('Empty response from server.');
      return { ...JSON.parse(rawText), timestamp: new Date().toISOString() };
    }

    (async () => {
      try {
        const result = await analyzeWithFlask();
        clearInterval(msgInterval);
        sessionStorage.setItem('md_aiResult', JSON.stringify(result));

        // Clean up input data from sessionStorage now that analysis is complete
        sessionStorage.removeItem('md_textInputVal');

        const isDepressed = result.riskLevel === 'Moderate' || result.riskLevel === 'High';

        if (!isDepressed) {
          // Low Risk — save directly here, skip questionnaire
          const maxWait = 8000;
          const start = Date.now();
          while (!window.saveReport && (Date.now() - start) < maxWait) {
            await new Promise(r => setTimeout(r, 100));
          }
          if (window.saveReport) {
            await window.saveReport({
              userInfo: { ...userInfo },
              riskLevel: result.riskLevel,
              confidenceScore: result.confidenceScore,
              modelProb: result.modelProb ?? null,
              emotionalSignals: result.emotionalSignals,
              contributions: result.contributions,
              recommendations: result.recommendations,
              insights: result.insights ?? null,
              adet: result.adet ?? null,
              depressionType: null,
              inputModes: { audio: !!audioBase64, text: !!(textInputVal && textInputVal.trim()) },
              questionnaire: null,
            });
          }
          sessionStorage.setItem('pendingPageTransition', 'results');
          navigateTo('/results');
        } else {
          // Moderate / High — collect questionnaire answers first
          sessionStorage.setItem('md_riskLevel', result.riskLevel);
          const prob = result.modelProb != null ? Math.round(result.modelProb) : Math.round(result.confidenceScore);
          sessionStorage.setItem('md_riskProb', String(prob));
          navigateTo('/questionnaire');
        }
      } catch (err) {
        clearInterval(msgInterval);
        console.error('Analysis failed:', err);
        sessionStorage.setItem('md_errorMessage', err.message || 'An unexpected error occurred.');
        navigateTo('/error');
      }
    })();

  // Top-level functions of classic <script>s were globals; inline handlers & innerHTML onclick="" rely on that.
  scope.expose({ analyzeWithFlask });

  // ───────────── <script type="module"> #2 ─────────────
  {
    onAuthStateChanged(auth, async (user) => {
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
      const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?background=bb000e&color=fff&size=128&name=${encodeURIComponent(displayName)}`;

      if (avatarNav) avatarNav.src = avatarUrl;
      if (nameNavEl) nameNavEl.textContent = displayName.split(' ')[0];
      if (resLink) resLink.href = '/results';

      window.currentUser = { uid: user.uid, name: displayName, email: user.email };
      window.saveUserProfile = async (profileData) => {
        try { await setDoc(doc(db, 'users', user.uid), profileData, { merge: true }); } catch (e) { }
      };
      window.saveReport = async (reportData) => {
        try { await addDoc(collection(db, 'users', user.uid, 'reports'), { ...reportData, createdAt: new Date().toISOString() }); } catch (e) { }
      };
      if (userInfo.name) {
        try { await window.saveUserProfile({ name: userInfo.name, age: userInfo.age, gender: userInfo.gender, email: user.email, updatedAt: new Date().toISOString() }); } catch (e) { }
      }
    });
  }

}
