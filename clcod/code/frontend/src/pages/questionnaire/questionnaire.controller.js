/**
 * QuestionnairePage logic — the <script> blocks of the original questionnaire.html, ported verbatim.
 *
 * Only mechanical SPA wiring differs from the original (see MIGRATION.md):
 *   • "page.html" links/redirects → routes, window.location.href = … → navigateTo(…)
 *   • DOMContentLoaded → onReady(…), document/window listeners → on(target, …)
 *   • timers, fetch and onAuthStateChanged come from the page scope, so they stop when you navigate away
 *     (a full page load used to do that). Classic scripts run first, then module scripts — same as before.
 */
import { auth, db } from '../../lib/firebase-config.js';
import { doc, addDoc, collection } from 'firebase/firestore';

export default function mountQuestionnairePage(scope) {
  const { setTimeout, onAuthStateChanged, navigateTo } = scope;

  // ───────────── <script> #1 (classic) ─────────────
const FLASK_API_URL = 'https://sense123-psychsense.hf.space';

// Show risk banner from synthesizing.html data
const riskLevel = sessionStorage.getItem('md_riskLevel');
const riskProb  = sessionStorage.getItem('md_riskProb');
if (riskLevel && riskProb) {
  const banner = document.getElementById('questionnaire-banner');
  if (banner) {
    banner.style.display = 'flex';
    document.getElementById('banner-risk').textContent = riskLevel;
    document.getElementById('banner-confidence').textContent = riskProb + '%';
  }
}

const DEPRESSION_QUESTIONS = [
  {text:"Over the past 2 weeks, how often have you felt sad, hopeless, empty, or like a failure?",options:["Not at all","Several days","More than half the days","Nearly every day"],key:"sadness"},
  {text:"How often have you had little interest or pleasure in things you used to enjoy?",options:["Not at all","Several days","More than half the days","Nearly every day"],key:"anhedonia"},
  {text:"How often have you had trouble falling or staying asleep, or waking too early?",options:["Not at all","Several days","More than half the days","Nearly every day"],key:"insomnia"},
  {text:"How often have you been sleeping MUCH MORE than usual (hard to get out of bed even after long sleep)?",options:["Not at all — sleep is normal or reduced","Several days — slightly more than usual","More than half the days — clearly oversleeping","Nearly every day — excessive sleep most days"],key:"hypersomnia"},
  {text:"How often have you felt exhausted or had very little energy, even for small tasks?",options:["Not at all","Several days","More than half the days","Nearly every day"],key:"fatigue"},
  {text:"How often have you had noticeably INCREASED appetite — especially craving carbs, sweets, or comfort food?",options:["Not at all — appetite normal or reduced","Several days — mild cravings","More than half the days — noticeable carb/sweet cravings","Nearly every day — strong cravings, possible weight gain"],key:"appetite"},
  {text:"How often have you had trouble concentrating, felt mentally foggy, or struggled to make decisions?",options:["Not at all","Several days","More than half the days","Nearly every day"],key:"concentration"},
  {text:"Do your symptoms follow a seasonal pattern — clearly worse in autumn/winter and better in spring/summer?",options:["No clear seasonal pattern","Possibly slightly worse in winter","Yes — clearly worse in autumn/winter","Definitely — happens every year without exception"],key:"seasonal"},
  {text:"How long have you been experiencing these depressive symptoms most days?",options:["Less than a few weeks (recent onset)","A few weeks to several months","Around 1–2 years (persistent, may fluctuate)","2 or more years almost continuously (chronic)"],key:"duration"},
  {text:"When something genuinely good happens, does your mood noticeably lift — even if only temporarily?",options:["No — mood stays low regardless of positive events","Slightly — very minor lifts that fade immediately","Yes — I do feel meaningfully better during good events","Definitely — positive events clearly brighten my mood"],key:"moodReactivity"},
  {text:"Did your depressive symptoms begin within 4 weeks of giving birth (or within the first year postpartum)?",options:["No / Not applicable","Possibly — symptoms worsened after childbirth","Yes — symptoms clearly started after giving birth","Yes — severe symptoms starting shortly after delivery"],key:"postpartum"},
  {text:"How often have you had thoughts of being better off dead, or of hurting yourself?",options:["Not at all","Several days — fleeting thoughts, no plan","More than half the days — recurring thoughts","Nearly every day — frequent or distressing thoughts"],key:"suicidality"}
];

let qCurrentIndex = 0;
let qAnswers = new Array(12).fill(null);

function qRender() {
  const q = DEPRESSION_QUESTIONS[qCurrentIndex];
  const total = DEPRESSION_QUESTIONS.length;
  document.getElementById('q-counter').textContent = `${qCurrentIndex+1} / ${total}`;
  document.getElementById('q-progress-bar').style.width = `${((qCurrentIndex+1)/total)*100}%`;
  document.getElementById('q-question-text').textContent = q.text;

  const container = document.getElementById('q-options-container');
  container.innerHTML = '';
  q.options.forEach((opt, i) => {
    const isSelected = qAnswers[qCurrentIndex] === i;
    const btn = document.createElement('button');
    btn.className = 'q-opt' + (isSelected ? ' selected' : '');
    btn.innerHTML = `<span>${opt}</span><span class="material-symbols-outlined text-sm">${isSelected ? 'check' : 'arrow_forward'}</span>`;
    btn.onclick = () => {
      qAnswers[qCurrentIndex] = i;
      document.getElementById('q-next-btn').disabled = false;
      qRender();
    };
    container.appendChild(btn);
  });

  document.getElementById('q-back-btn').style.visibility = qCurrentIndex === 0 ? 'hidden' : 'visible';
  const nextBtn = document.getElementById('q-next-btn');
  nextBtn.disabled = qAnswers[qCurrentIndex] === null;
  const isLast = qCurrentIndex === total - 1;
  document.getElementById('next-btn-text').textContent = isLast ? 'Submit' : 'Next';
  const icon = nextBtn.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = isLast ? 'task_alt' : 'arrow_forward';
}

function qNext() {
  if (qCurrentIndex < DEPRESSION_QUESTIONS.length - 1) { qCurrentIndex++; qRender(); }
  else { completeQuestionnaire(); }
}
function qPrev() { if (qCurrentIndex > 0) { qCurrentIndex--; qRender(); } }

function classifyDepressionType(answers) {
  const riskLevel = sessionStorage.getItem('md_riskLevel');
  if (!riskLevel || riskLevel === 'Low') return null;
  const get = (key) => { const idx = DEPRESSION_QUESTIONS.findIndex(q=>q.key===key); return idx>=0?(answers[idx]??0):0; };
  if (get('postpartum') >= 2) return 'Postpartum Depression';
  if (get('seasonal') >= 2) return 'Seasonal Affective Disorder (SAD)';
  if (get('moodReactivity') >= 2 && (get('hypersomnia') >= 2 || get('appetite') >= 2)) return 'Atypical Depression';
  if (get('duration') >= 3) return 'Persistent Depressive Disorder (Dysthymia)';
  if (get('sadness') >= 2 && get('anhedonia') >= 2) return 'Major Depressive Disorder (MDD)';
  return 'Depressive Episode';
}

async function completeQuestionnaire() {
  const aiResult = JSON.parse(sessionStorage.getItem('md_aiResult') || 'null');
  const userInfo = JSON.parse(sessionStorage.getItem('md_userInfo') || '{}');
  const textInputVal = sessionStorage.getItem('md_textInputVal') || '';
  const audioBase64 = sessionStorage.getItem('md_audioBase64') || null;

  const depressionType = classifyDepressionType(qAnswers);
  const getScore = (key) => { const idx = DEPRESSION_QUESTIONS.findIndex(q=>q.key===key); return idx>=0?(qAnswers[idx]??0):0; };

  // Derive functional impairment (0–100) from suicidality + core symptom burden
  // rather than hardcoding 30 regardless of answers.
  const suicidalityScore = getScore('suicidality');
  const coreSymptomSum   = getScore('sadness') + getScore('anhedonia') + getScore('fatigue') + getScore('concentration');
  const suicidalityImpact = [0, 20, 50, 80][suicidalityScore] || 0;
  const symptomImpact     = Math.min(Math.round((coreSymptomSum / 12) * 60), 60);
  const derivedImpairment = Math.min(suicidalityImpact + symptomImpact, 100);

  const questionnaireData = {
    answers:{elevatedMood:false,reducedSleep:getScore('insomnia')>=2,impulsivity:false,racingThoughts:false},
    duration:getScore('duration'), seasonalPattern:getScore('seasonal')>=2?'Winter onset':'No seasonal pattern',
    postpartum:getScore('postpartum')>=2?'Within 4 weeks postpartum':'Not applicable',
    scores:Object.fromEntries(DEPRESSION_QUESTIONS.map((q,i)=>[q.key,qAnswers[i]??0])),
    impairment: derivedImpairment
  };

  if (aiResult) {
    // Wait for Firebase auth to be ready before saving (fixes race on first session)
    const maxWait = 8000;
    const start = Date.now();
    while (!window.saveReport && (Date.now() - start) < maxWait) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (window.saveReport) {
      try {
        await window.saveReport({ userInfo:{...userInfo}, riskLevel:aiResult.riskLevel, confidenceScore:aiResult.confidenceScore, modelProb:aiResult.modelProb??null, emotionalSignals:aiResult.emotionalSignals, contributions:aiResult.contributions, recommendations:aiResult.recommendations, insights:aiResult.insights??null, adet:aiResult.adet??null, depressionType, inputModes:{audio:!!audioBase64,text:!!(textInputVal&&textInputVal.trim())}, questionnaire:questionnaireData });
      } catch(e) {
        console.error('SAVE FAILED:', e.code, e.message);
        alert('Warning: Could not save your assessment. Error: ' + (e.code || e.message));
      }
    }
  }

  if (aiResult) {
    aiResult.depressionType = depressionType;
    aiResult.questionnaireData = questionnaireData;
    sessionStorage.setItem('md_aiResult', JSON.stringify(aiResult));
  }
  sessionStorage.setItem('pendingPageTransition', 'results');
  navigateTo('/results');
}

// Init
qRender();

  // Top-level functions of classic <script>s were globals; inline handlers & innerHTML onclick="" rely on that.
  scope.expose({ qRender, qNext, qPrev, classifyDepressionType, completeQuestionnaire });

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

    window.saveReport = async (reportData) => {
      try { await addDoc(collection(db, 'users', user.uid, 'reports'), { ...reportData, createdAt: new Date().toISOString() }); } catch(e) { console.error('saveReport failed:', e); throw e; }
    };
  });
  }

}
