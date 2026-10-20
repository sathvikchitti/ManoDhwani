/**
 * AnalysisPage logic — the <script> blocks of the original analysis.html, ported verbatim.
 *
 * Only mechanical SPA wiring differs from the original (see MIGRATION.md):
 *   • "page.html" links/redirects → routes, window.location.href = … → navigateTo(…)
 *   • DOMContentLoaded → onReady(…), document/window listeners → on(target, …)
 *   • timers, fetch and onAuthStateChanged come from the page scope, so they stop when you navigate away
 *     (a full page load used to do that). Classic scripts run first, then module scripts — same as before.
 */
import { auth, db } from '../../lib/firebase-config.js';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';

export default function mountAnalysisPage(scope) {
  const { setTimeout, setInterval, clearInterval, onAuthStateChanged, navigateTo, onReady } = scope;
  scope.globals(['goTo', 'closeInfoModal', 'updateAssessBtn', 'toggleVoiceInstructions', 'toggleRecording', 'runInitialAnalysis']);

  // ───────────── <script> #1 (classic) ─────────────
// ── State ──────────────────────────────────────────────────────────
let userInfo = JSON.parse(sessionStorage.getItem('md_userInfo') || '{"name":"","age":"","gender":""}');
let textInputVal = sessionStorage.getItem('md_textInputVal') || '';
let audioBase64 = sessionStorage.getItem('md_audioBase64') || null;
let audioUrl = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;
let recordingTime = 0;
let aiResult = JSON.parse(sessionStorage.getItem('md_aiResult') || 'null');
const FLASK_API_URL = 'https://sense123-psychsense.hf.space';

// ── Page Navigation ────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) { pg.classList.add('active'); window.scrollTo(0,0); }
}
window.goTo = function(page) {
  sessionStorage.setItem('md_userInfo', JSON.stringify(userInfo));
  sessionStorage.setItem('md_aiResult', JSON.stringify(aiResult));
  sessionStorage.setItem('md_textInputVal', textInputVal);
  if (audioBase64) { try { sessionStorage.setItem('md_audioBase64', audioBase64); } catch(e) {} }
  if (['results','profile'].includes(page)) {
    sessionStorage.setItem('pendingPageTransition', page);
    navigateTo('/results');
    return;
  }
  showPage(page);
};

// ── Init ───────────────────────────────────────────────────────────
onReady(() => {
  const textEl = document.getElementById('text-input');
  if (textEl && textInputVal) { textEl.value = textInputVal; updateCharCount(); }
  if (textEl) {
    textEl.addEventListener('input', () => { textInputVal = textEl.value; updateCharCount(); window.updateAssessBtn(); });
  }
  if (audioBase64) { showAudioRestored(); window.updateAssessBtn(); }
  else {
    // Check IndexedDB if sessionStorage failed earlier
    window.MD_Storage.loadFromIDB('audioBlob').then(blob => {
      if (blob) {
        showAudioRestored();
        window.updateAssessBtn();
      }
    });
  }
});

function updateCharCount() {
  const textEl = document.getElementById('text-input');
  const ccEl = document.getElementById('char-count');
  if (!textEl || !ccEl) return;
  const len = textEl.value.length;
  ccEl.textContent = `${len} / 2000`;
  ccEl.style.color = len > 1800 ? '#ba1a1a' : '';
}



// ── Assess Button ──────────────────────────────────────────────────
window.closeInfoModal = function() {
  const modal = document.getElementById('user-info-modal');
  if (modal) {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.30s';
    setTimeout(() => {
      modal.classList.remove('open');
      modal.style.opacity = '';
      modal.style.transition = '';
    }, 320);
  }
};

window.updateAssessBtn = function() {
  const btn = document.getElementById('assess-continue-btn');
  const textEl = document.getElementById('text-input');
  const hasText = (textEl && textEl.value.trim().length > 0) || (textInputVal && textInputVal.trim().length > 0);
  const audioReady = audioBase64 || !!window.restoredAudioBlob; // handle both
  if (btn) btn.disabled = !hasText && !audioReady;
};

// ── Toggle voice instructions ──────────────────────────────────────
window.toggleVoiceInstructions = function() {
  const body = document.getElementById('voice-instructions-body');
  if (!body) return;
  body.style.display = body.style.display === 'none' ? 'block' : 'none';
};

// ── Audio Recording ────────────────────────────────────────────────
window.toggleRecording = async function() {
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.onloadend = async () => { 
          audioBase64 = reader.result; 
          // Fallback: still try sessionStorage for small clips
          try { sessionStorage.setItem('md_audioBase64', audioBase64); } catch(e) {}
          
          // Primary: Save actual blob to IndexedDB for large files
          try { await window.MD_Storage.saveToIDB('audioBlob', blob); } catch(e) { console.error("IDB Save Failed", e); }
          
          window.updateAssessBtn(); 
          showAudioRecorded(); 
        };
        reader.readAsDataURL(blob);
        showAudioRecorded();
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      isRecording = true; recordingTime = 0;
      recordingTimer = setInterval(() => { recordingTime++; updateRecordingTimer(); }, 1000);
      showRecordingActive();
    } catch(err) { alert('Microphone access denied. Please allow microphone access in your browser settings.'); }
  } else {
    if (mediaRecorder) mediaRecorder.stop();
    isRecording = false; clearInterval(recordingTimer);
  }
};

function showRecordingActive() {
  const display = document.getElementById('audio-display');
  if (!display) return;
  display.innerHTML = `<div class="flex flex-col items-center justify-center gap-4 py-4">
    <div class="recording-bars">${Array(8).fill('<div class="recording-bar"></div>').join('')}</div>
    <div class="flex items-center gap-3">
      <div class="w-3 h-3 bg-error rounded-full animate-pulse"></div>
      <span id="rec-time" class="font-label text-sm font-bold tracking-widest">0:00</span>
      <span class="font-label text-xs text-on-surface-variant uppercase tracking-widest">Recording…</span>
    </div>
  </div>`;
  const btn = document.getElementById('record-btn');
  if (btn) {
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">stop_circle</span> Stop Recording`;
    btn.classList.add('!from-error','!to-error/80');
  }
}

function updateRecordingTimer() {
  const mins = Math.floor(recordingTime / 60), secs = recordingTime % 60;
  const el = document.getElementById('rec-time');
  if (el) el.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
  if (recordingTime >= 300) window.toggleRecording();
}

function showAudioRecorded() {
  const display = document.getElementById('audio-display');
  if (!display) return;
  display.innerHTML = `<div class="flex flex-col items-center justify-center gap-4 py-4">
    <div class="flex items-center gap-3">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span class="font-label text-sm text-[#22c55e] font-bold uppercase tracking-widest">Voice Recorded</span>
    </div>
    <audio src="${audioUrl}" controls class="h-8 w-52 opacity-80"></audio>
  </div>`;
  const removeBtn = document.getElementById('remove-audio-btn');
  if (removeBtn) removeBtn.style.display = 'block';
  const btn = document.getElementById('record-btn');
  if (btn) {
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">fiber_manual_record</span> Re-record`;
    btn.classList.remove('!from-error','!to-error/80');
  }
}

function showAudioRestored() {
  const display = document.getElementById('audio-display');
  if (!display) return;
  display.innerHTML = `<div class="flex flex-col items-center justify-center gap-3 py-4">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    <span class="font-label text-sm text-[#22c55e] font-bold uppercase tracking-widest">Audio Loaded</span>
  </div>`;
  const removeBtn = document.getElementById('remove-audio-btn');
  if (removeBtn) removeBtn.style.display = 'block';
}

function handleAudioUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  audioUrl = URL.createObjectURL(file);
  const reader = new FileReader();
  reader.onloadend = async () => { 
    audioBase64 = reader.result; 
    try { sessionStorage.setItem('md_audioBase64', audioBase64); } catch(e) {}
    try { await window.MD_Storage.saveToIDB('audioBlob', file); } catch(e) { console.error("IDB Save Failed", e); }
    window.updateAssessBtn(); 
    showAudioRecorded(); 
  };
  reader.readAsDataURL(file);
}

function removeAudio() {
  audioBase64 = null; audioUrl = null;
  sessionStorage.removeItem('md_audioBase64');
  if (window.MD_Storage) window.MD_Storage.clearFromIDB('audioBlob');
  const display = document.getElementById('audio-display');
  if (display) display.innerHTML = `<div class="flex flex-col items-center justify-center gap-4 py-6">
    <div class="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center">
      <span class="material-symbols-outlined text-primary text-4xl" style="font-variation-settings:'FILL' 1;">mic</span>
    </div>
    <p class="text-sm text-on-surface-variant font-body">Click record or upload a file</p>
  </div>`;
  const removeBtn = document.getElementById('remove-audio-btn');
  if (removeBtn) removeBtn.style.display = 'none';
  window.updateAssessBtn();
}

// ── Analysis — navigates to synthesizing.html ──────────────────────
window.runInitialAnalysis = async function() {
  userInfo.name   = document.getElementById('input-name')?.value || userInfo.name;
  userInfo.age    = document.getElementById('input-age')?.value || userInfo.age;
  userInfo.gender = document.getElementById('input-gender')?.value || userInfo.gender;
  textInputVal    = document.getElementById('text-input')?.value || textInputVal;

  // Hard guard — must have text OR audio before proceeding
  const hasText  = !!(textInputVal && textInputVal.trim());
  const hasAudio = !!(audioBase64);
  if (!hasText && !hasAudio) {
    alert('Please enter some text or record / upload an audio clip before running the analysis.');
    return;
  }

  // Persist to sessionStorage so synthesizing.html can pick it up
  sessionStorage.setItem('md_userInfo', JSON.stringify(userInfo));
  sessionStorage.setItem('md_textInputVal', textInputVal);

  // Note: audio is already in IndexedDB from the recording/upload step.
  // Clear UI inputs for display only — do NOT remove from sessionStorage here;
  // synthesizing.html needs md_textInputVal to run the analysis.
  const textEl2 = document.getElementById('text-input');
  if (textEl2) textEl2.value = '';

  // We just ensure location transition happens after a small tick
  setTimeout(() => {
    navigateTo('/synthesizing');
  }, 100);
};

  // ───────────── <script> #3 (classic) ─────────────
  function submitUserInfoModal() {
    const name = (document.getElementById('modal-name').value || '').trim();
    const age  = (document.getElementById('modal-age').value  || '').trim();
    const gender = document.getElementById('modal-gender').value || '';
    const errEl = document.getElementById('modal-error');
    if (!name) { errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');
    const info = { name, age, gender };
    sessionStorage.setItem('md_userInfo', JSON.stringify(info));
    // Persist to Firestore profile so profile page stays updated
    if (window.saveUserProfile) {
      window.saveUserProfile({ name, age, gender }).catch(() => {});
    }
    const modal = document.getElementById('user-info-modal');
    if (modal) { modal.style.opacity='0'; modal.style.transition='opacity 0.3s'; setTimeout(()=>{ modal.classList.remove('open'); modal.style.opacity=''; modal.style.transition=''; },300); }
    // Also fill legacy inputs if they exist
    const ni = document.getElementById('input-name'); if(ni) ni.value = name;
    const ai = document.getElementById('input-age');  if(ai) ai.value = age;
    const gi = document.getElementById('input-gender'); if(gi) gi.value = gender;
  }

  // Top-level functions of classic <script>s were globals; inline handlers & innerHTML onclick="" rely on that.
  // SPA addition: navigating away used to unload the page and release the microphone.
  // Drop the recording (like an unload did) without running onstop, which would save it.
  scope.onCleanup(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
  });

  scope.expose({ showPage, updateCharCount, showRecordingActive, updateRecordingTimer, showAudioRecorded, showAudioRestored, handleAudioUpload, removeAudio, submitUserInfoModal });

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
    const avatarUrl = user.photoURL
      ? user.photoURL + (user.photoURL.includes('?') ? '&' : '?') + 't=' + Date.now()
      : `https://ui-avatars.com/api/?background=bb000e&color=fff&size=128&name=${encodeURIComponent(displayName)}`;
    
    if (avatarNav) { avatarNav.src = ''; avatarNav.src = avatarUrl; }
    if (nameNavEl) nameNavEl.textContent = displayName.split(' ')[0];
    if (resLink) resLink.href = '/results';

    window.currentUser = { uid:user.uid, name:displayName, email:user.email, photo:user.photoURL||null, gender:'', age:'' };

    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) { const s = snap.data(); if (s.gender) window.currentUser.gender = s.gender; if (s.age) window.currentUser.age = s.age; }
    } catch(e) {}

    const cu = window.currentUser;

    // ─── User Info Modal Logic ───
    const savedInfo = null; // always show modal so user can confirm/update info each session
    if (!savedInfo) {
      // Pre-fill modal from Firebase profile
      const modalName = document.getElementById('modal-name');
      const modalAge = document.getElementById('modal-age');
      const modalGender = document.getElementById('modal-gender');
      const modalBanner = document.getElementById('modal-autofill-banner');
      if (modalName) modalName.value = cu.name || '';
      if (modalAge && cu.age) modalAge.value = cu.age;
      if (modalGender && cu.gender) modalGender.value = cu.gender;
      if (cu.photo && modalBanner) { modalBanner.classList.remove('hidden'); modalBanner.classList.add('flex'); }
      const modal = document.getElementById('user-info-modal');
      if (modal) modal.classList.add('open');
    } else {
      // Already have info — populate old inputs too for backward compat
      try {
        const info = JSON.parse(savedInfo);
        const nameInput = document.getElementById('input-name');
        if (nameInput && !nameInput.value) nameInput.value = info.name || '';
        const ageInput = document.getElementById('input-age');
        if (ageInput && !ageInput.value) ageInput.value = info.age || '';
        const genderSel = document.getElementById('input-gender');
        if (genderSel && !genderSel.value) genderSel.value = info.gender || '';
      } catch(e) {}
    }

    // Firestore helpers
    window.saveUserProfile = async (profileData) => {
      try { await setDoc(doc(db, 'users', user.uid), profileData, { merge:true }); } catch(e) { console.error(e); }
    };
    window.saveReport = async (reportData) => {
      try { await addDoc(collection(db, 'users', user.uid, 'reports'), { ...reportData, createdAt: new Date().toISOString() }); } catch(e) { console.error(e); }
    };
  });
  }

}
