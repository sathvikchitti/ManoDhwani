/**
 * ProfilePage logic — the <script> blocks of the original profile.html, ported verbatim.
 *
 * Only mechanical SPA wiring differs from the original (see MIGRATION.md):
 *   • "page.html" links/redirects → routes, window.location.href = … → navigateTo(…)
 *   • DOMContentLoaded → onReady(…), document/window listeners → on(target, …)
 *   • timers, fetch and onAuthStateChanged come from the page scope, so they stop when you navigate away
 *     (a full page load used to do that). Classic scripts run first, then module scripts — same as before.
 */
import { auth, db } from '../../lib/firebase-config.js';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore';

export default function mountProfilePage(scope) {
  const { setTimeout, fetch, onAuthStateChanged, navigateTo, on } = scope;
  scope.globals(['goTo', '_cachedReports', 'pfSwitchTab', 'viewHistoricalReport', 'downloadHistoricalReport', 'openChartModal', 'closeChartModal', 'pfSwitchModalTab']);

  // ───────────── <script> #1 (classic) ─────────────
    // ── Resolve Firestore Timestamp or ISO string → JS Date ──────────
    function _toDate(v) {
      if (!v) return null;
      if (typeof v === 'object' && typeof v.seconds === 'number') return new Date(v.seconds * 1000);
      if (typeof v.toDate === 'function') return v.toDate();
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }

    // Minimal goTo shim so app.js can navigate
    window.goTo = function (page) {
      if (page === 'landing') { navigateTo('/'); return; }
      if (page === 'user-info' || page === 'assessment') { navigateTo('/analysis'); return; }
      if (page === 'results') { navigateTo('/results'); return; }
      if (page === 'profile') return; // already here
    };

    let _profileReportsCache = null;
    let _profileCurrentTab = 'daily';
    const userInfo = JSON.parse(sessionStorage.getItem('md_userInfo') || '{}');
    const aiResult = JSON.parse(sessionStorage.getItem('md_aiResult') || '{}');

    // Render the profile with Firebase data
    async function renderProfile(user) {
      const cu = window.currentUser;
      if (!cu) { navigateTo('/login'); return; }

      const displayName = cu.name || cu.email || 'User';
      const avatarUrl = cu.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=bb000e&color=fff&size=128`;

      // Header
      const headerName = document.getElementById('pf-header-name');
      if (headerName) headerName.textContent = displayName + '.';
      const headerDesc = document.getElementById('pf-header-desc');
      if (headerDesc) headerDesc.innerHTML = `Comprehensive behavioral analysis and ManoDhwani Probability Score tracking.`;

      // ID card
      const pfAvatar = document.getElementById('pf-avatar');
      if (pfAvatar) { pfAvatar.src = avatarUrl; pfAvatar.referrerPolicy = 'no-referrer'; }
      const pfName = document.getElementById('pf-name');
      if (pfName) pfName.textContent = userInfo.name || displayName;
      const pfEmail = document.getElementById('pf-email');
      if (pfEmail) pfEmail.textContent = cu.email || '';
      const pfAge = document.getElementById('pf-age');
      if (pfAge) pfAge.textContent = userInfo.age || cu.age || '—';
      const pfGender = document.getElementById('pf-gender');
      if (pfGender) pfGender.textContent = userInfo.gender || cu.gender || '—';

      // Load reports
      let _loadError = false;
      try {
        _profileReportsCache = (window.loadReports && window.currentUser) ? await window.loadReports() : [];
      } catch (_) {
        _profileReportsCache = [];
        _loadError = true;
        const errHtml = `<div style="text-align:center;padding:48px 24px;color:#64748b;"><div style="font-size:32px;margin-bottom:12px;">⚠️</div><div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;">Could not load session data. Check your connection and refresh.</div></div>`;
        const chartEl = document.getElementById('pf-chart-svg');
        if (chartEl) chartEl.innerHTML = errHtml;
        const histEl = document.getElementById('pf-history-list');
        if (histEl) histEl.innerHTML = errHtml;
      }
      window._cachedReports = _profileReportsCache;

      const totalEl = document.getElementById('pf-total-sessions');
      if (totalEl) totalEl.textContent = _profileReportsCache.length;

      _profileCurrentTab = 'daily';
      if (!_loadError) {
        _renderProfileTab('daily');
        _renderProfileHistory();
      }

      document.getElementById('profile-loading').style.display = 'none';
      document.getElementById('profile-content').style.display = 'block';
    }

    function _renderProfileTab(tab) {
      _profileCurrentTab = tab;
      ['hourly', 'daily', 'weekly', 'monthly'].forEach(t => {
        const btn = document.getElementById(`pf-tab-${t}`);
        if (!btn) return;
        btn.classList.toggle('active', t === tab);
      });

      const reports = _profileReportsCache || [];
      const now = new Date();
      let buckets = [];

      if (tab === 'hourly') {
        for (let h = 23; h >= 0; h--) { const d = new Date(now); d.setMinutes(0, 0, 0, 0); d.setHours(d.getHours() - h); buckets.push({ label: d.getHours() + ':00', hour: d.getHours(), dateStr: d.toDateString(), ts: d.getTime(), value: null, _latest: 0 }); }
        reports.forEach(r => { const dt = (_toDate(r.createdAt) || new Date()); const t = dt.getTime(); const age = now - t; if (age > 24 * 3600000) return; const b = buckets.find(x => x.hour === dt.getHours() && x.dateStr === dt.toDateString()); if (!b) return; const val = r.modelProb ?? r.confidenceScore ?? null; if (val !== null && (b.value === null || t > b._latest)) { b.value = val; b._latest = t; } });
      } else if (tab === 'daily') {
        for (let d = 6; d >= 0; d--) { const dt = new Date(now); dt.setDate(dt.getDate() - d); dt.setHours(0, 0, 0, 0); buckets.push({ label: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), dayStart: dt.getTime(), dayEnd: dt.getTime() + 86400000, value: null, _latest: 0 }); }
        reports.forEach(r => { const dt = (_toDate(r.createdAt)||new Date()); const t = dt.getTime(); const b = buckets.find(x => t >= x.dayStart && t < x.dayEnd); if (!b) return; const val = r.modelProb ?? r.confidenceScore ?? null; if (val !== null && (b.value === null || t > b._latest)) { b.value = val; b._latest = t; } });
      } else if (tab === 'weekly') {
        for (let w = 7; w >= 0; w--) { const dt = new Date(now); dt.setDate(dt.getDate() - w * 7); const ws = dt.getTime() - (dt.getDay()) * 86400000; buckets.push({ label: 'Wk ' + dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), weekStart: ws, weekEnd: ws + 7 * 86400000, value: null, _latest: 0 }); }
        reports.forEach(r => { const t = (_toDate(r.createdAt)||new Date()).getTime(); const b = buckets.find(x => t >= x.weekStart && t < x.weekEnd); if (!b) return; const val = r.modelProb ?? r.confidenceScore ?? null; if (val !== null && (b.value === null || t > b._latest)) { b.value = val; b._latest = t; } });
      } else {
        for (let m = 11; m >= 0; m--) { const dt = new Date(now.getFullYear(), now.getMonth() - m, 1); buckets.push({ label: dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), month: dt.getMonth(), year: dt.getFullYear(), value: null, _latest: 0 }); }
        reports.forEach(r => { const dt = (_toDate(r.createdAt)||new Date()); const b = buckets.find(x => x.month === dt.getMonth() && x.year === dt.getFullYear()); if (!b) return; const val = r.modelProb ?? r.confidenceScore ?? null; const t = dt.getTime(); if (val !== null && (b.value === null || t > b._latest)) { b.value = val; b._latest = t; } });
      }

      const chartEl = document.getElementById('pf-chart-svg');
      if (!chartEl) return;
      const filled = buckets.map((b, i) => ({ ...b, i })).filter(b => b.value !== null);
      if (filled.length === 0) {
        chartEl.innerHTML = `<div style="text-align:center;padding:48px 24px;color:#64748b;"><div style="font-size:32px;margin-bottom:12px;">📊</div><div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;">No sessions in this time range</div><div style="font-size:11px;margin-top:6px;color:#94a3b8;">Switch to a wider range or run a session</div></div>`;
        return;
      }

      const W = 780, H = 220, PAD = { top: 24, right: 32, bottom: 48, left: 48 };
      const innerW = W - PAD.left - PAD.right, innerH = H - PAD.top - PAD.bottom, n = buckets.length;
      const xScale = i => PAD.left + (i / (n - 1)) * innerW;
      const yScale = v => PAD.top + innerH - ((v - 0) / (100 - 0)) * innerH;
      const pts = filled.map(b => `${xScale(b.i)},${yScale(b.value)}`).join(' ');
      const areaPath = filled.map((b, fi) => { const x = xScale(b.i), y = yScale(b.value); return fi === 0 ? `M${x},${y}` : `L${x},${y}`; }).join(' ') + ` L${xScale(filled[filled.length - 1].i)},${PAD.top + innerH} L${xScale(filled[0].i)},${PAD.top + innerH} Z`;
      const yGuides = [0, 25, 50, 75, 100].map(v => `<line x1="${PAD.left}" y1="${yScale(v)}" x2="${PAD.left + innerW}" y2="${yScale(v)}" stroke="rgba(0,0,0,0.06)" stroke-width="1"/><text x="${PAD.left - 8}" y="${yScale(v) + 4}" text-anchor="end" fill="#94a3b8" font-size="9" font-family="Space Grotesk,sans-serif">${v}%</text>`).join('');
      const stepLabel = Math.ceil(n / 6);
      const xLabels = buckets.map((b, i) => { if (i % stepLabel !== 0 && i !== n - 1) return ''; return `<text x="${xScale(i)}" y="${H - 8}" text-anchor="middle" fill="#64748b" font-size="9" font-family="Space Grotesk,sans-serif">${b.label}</text>`; }).join('');
      const dots = filled.map(b => { const x = xScale(b.i), y = yScale(b.value); const clr = b.value >= 62 ? '#ef4444' : b.value >= 52 ? '#f59e0b' : '#22c55e'; return `<circle cx="${x}" cy="${y}" r="5" fill="${clr}" stroke="#d8d8d8" stroke-width="2"><title>${b.label}: ${Math.round(b.value)}% ManoDhwani Probability Score</title></circle>`; }).join('');
      const singleLabel = filled.length === 1 ? `<text x="${xScale(filled[0].i)}" y="${yScale(filled[0].value) - 12}" text-anchor="middle" fill="#64748b" font-size="10" font-family="Space Grotesk,sans-serif">${Math.round(filled[0].value)}% · ${filled[0].label}</text>` : '';

      chartEl.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="overflow:visible;" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="pf-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8e0008" stop-opacity="0.15"/><stop offset="100%" stop-color="#8e0008" stop-opacity="0.0"/></linearGradient></defs>
    <rect x="${PAD.left}" y="${yScale(100)}" width="${innerW}" height="${yScale(62) - yScale(100)}" fill="rgba(239,68,68,0.04)"/>
    <rect x="${PAD.left}" y="${yScale(62)}" width="${innerW}" height="${yScale(52) - yScale(62)}" fill="rgba(245,158,11,0.04)"/>
    <rect x="${PAD.left}" y="${yScale(52)}" width="${innerW}" height="${yScale(0) - yScale(52)}" fill="rgba(34,197,94,0.04)"/>
    ${yGuides}
    <path d="${areaPath}" fill="url(#pf-grad)"/>
    <polyline points="${pts}" fill="none" stroke="#8e0008" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${singleLabel}${xLabels}
    <text x="${PAD.left + innerW + 5}" y="${yScale(62) + 4}" fill="rgba(239,68,68,0.5)" font-size="8" font-family="Space Grotesk">High</text>
    <text x="${PAD.left + innerW + 5}" y="${yScale(52) + 4}" fill="rgba(245,158,11,0.5)" font-size="8" font-family="Space Grotesk">Mod</text>
  </svg>`;
    }

    window.pfSwitchTab = _renderProfileTab;

    function _renderProfileHistory() {
      const histEl = document.getElementById('pf-history-list');
      if (!histEl) return;
      const reports = _profileReportsCache || [];
      if (!reports.length) {
        histEl.innerHTML = `<div style="text-align:center;padding:48px 24px;color:#64748b;"><div style="font-size:32px;margin-bottom:12px;">🗂️</div><div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">No sessions yet</div><div style="font-size:11px;margin-top:6px;">Complete your first assessment to see history here</div></div>`;
        return;
      }
      histEl.innerHTML = reports.map((r, idx) => {
        const dt = (_toDate(r.createdAt)||new Date());
        const date = dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const time = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const risk = r.riskLevel || 'Low';
        const rClr = risk === 'High' ? '#b91c1c' : risk === 'Moderate' ? '#b45309' : '#166534';
        const rBg = risk === 'High' ? '#fee2e2' : risk === 'Moderate' ? '#fef3c7' : '#dcfce7';
        const rBdr = risk === 'High' ? '#fca5a5' : risk === 'Moderate' ? '#fcd34d' : '#86efac';
        const pb = r.modelProb != null ? Math.round(r.modelProb) : (r.confidenceScore ?? '?');
        const hasAudio = r.inputModes?.audio ?? false;
        const hasText = r.inputModes?.text ?? false;
        const depType = r.depressionType ? `<span style="font-size:11px;color:#64748b;">${r.depressionType}</span>` : '';
        const rIdx = idx;
        return `<div class="session-row">
      <div style="min-width:110px;"><div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:#111;">${date}</div><div style="font-size:11px;color:#64748b;margin-top:2px;">${time}</div></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${hasAudio ? `<span style="background:#e9d5ff;border:1px solid #c4b5fd;color:#6d28d9;padding:2px 10px;border-radius:9999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Audio</span>` : ''}
          ${hasText ? `<span style="background:#cffafe;border:1px solid #67e8f9;color:#0e7490;padding:2px 10px;border-radius:9999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Text</span>` : ''}
        </div>
        ${depType}
      </div>
      <div style="text-align:center;min-width:60px;"><div style="font-size:22px;font-weight:800;font-family:'Epilogue',sans-serif;color:#8e0008;">${pb}%</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">PROBABILITY</div></div>
      <span class="risk-pill" style="background:${rBg};border:1px solid ${rBdr};color:${rClr};">${risk} Risk</span>
      <div style="display:flex;gap:6px;align-items:center;">
        <button onclick="window.viewHistoricalReport(${rIdx})" style="display:flex;align-items:center;gap:6px;background:transparent;border:1px solid rgba(0,0,0,0.1);border-radius:9999px;padding:6px 14px;color:#64748b;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:11px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='transparent'">
          <span class="material-symbols-outlined" style="font-size:14px;">open_in_new</span>View
        </button>
        <button onclick="window.downloadHistoricalReport(${rIdx})" id="dl-btn-${rIdx}" style="display:flex;align-items:center;gap:6px;background:transparent;border:1px solid rgba(0,0,0,0.1);border-radius:9999px;padding:6px 14px;color:#64748b;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:11px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='transparent'">
          <span class="material-symbols-outlined" style="font-size:14px;">download</span>PDF
        </button>
      </div>
    </div>`;
      }).join('');
    }

    // ── Historical report helpers ──────────────────────────────────────────
    // Cache the loaded reports so View/Download can access them by index
    window._cachedReports = [];

    window.viewHistoricalReport = function(idx) {
      const r = window._cachedReports[idx];
      if (!r) return;
      // Store report data into sessionStorage so results.html can read it
      sessionStorage.setItem('md_aiResult', JSON.stringify(r));
      sessionStorage.setItem('md_historical_report', JSON.stringify(r));
      // Preserve userInfo but patch name from currentUser if blank
      const existing = JSON.parse(sessionStorage.getItem('md_userInfo') || '{}');
      if (!existing.name && window.currentUser?.name) {
        existing.name = window.currentUser.name;
        sessionStorage.setItem('md_userInfo', JSON.stringify(existing));
      }
      navigateTo('/results');
    };

    const FLASK_API_URL_PF = 'https://sense123-psychsense.hf.space';

    // ── Trajectory chart helpers (mirrors results.html) ────────────────
    function _toDate(v) {
      if (!v) return null;
      if (typeof v === 'object' && typeof v.seconds === 'number') return new Date(v.seconds * 1000);
      if (typeof v.toDate === 'function') return v.toDate();
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }

    async function generateAdetChartHtml(suffix = '') {
      let reports = [];
      if (window.loadReports && window.currentUser) {
        try { reports = await window.loadReports(); } catch(e) { console.error('[chart] loadReports error', e); }
      }
      if (!reports || reports.length === 0) return '';

      const withDates = reports.map(r => ({ ...r, _date: _toDate(r.createdAt) })).filter(r => r._date);
      const uniqueDates = new Set(withDates.map(r => r._date.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'})));
      if (withDates.length < 2 && uniqueDates.size !== 1) return '';

      const dailyMap = new Map();
      withDates.forEach(r => {
        const k = r._date.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
        if (!dailyMap.has(k) || r._date > dailyMap.get(k)._date) dailyMap.set(k, r);
      });
      const daily = [...dailyMap.values()].sort((a,b) => a._date - b._date).slice(-7);

      if (daily.length === 1) {
        const singleReport = daily[0];
        const val = singleReport.modelProb != null ? singleReport.modelProb : (singleReport.confidenceScore || 0);
        const dateLabel = singleReport._date.toLocaleDateString('en-GB', {day:'2-digit', month:'short'});
        const W=800, H=200, px=48, py=40;
        const pW = W-2*px, pH = H-2*py;
        const cx = W / 2;
        const cy = H - py - (val / 100 * pH);
        const c = val >= 62 ? '#ef4444' : val >= 52 ? '#f59e0b' : '#22c55e';
        let svg = `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible;font-family:'Arial','Helvetica',sans-serif;">`;
        svg += `<defs><linearGradient id="chartGrad${suffix}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bb000e" stop-opacity="0.18"/><stop offset="100%" stop-color="#bb000e" stop-opacity="0.01"/></linearGradient></defs>`;
        [0,25,50,75,100].forEach(l => {
          const y = H - py - (l / 100 * pH);
          svg += `<line x1="${px}" y1="${y}" x2="${W-px}" y2="${y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 3"/>`;
          svg += `<text x="${px-8}" y="${y+4}" fill="#94a3b8" font-size="10" text-anchor="end">${l}%</text>`;
        });
        svg += `<circle cx="${cx}" cy="${cy}" r="6" fill="${c}" stroke="#fff" stroke-width="2"/>`;
        svg += `<text x="${cx}" y="${cy-12}" fill="${c}" font-size="11" font-weight="700" text-anchor="middle">${Math.round(val)}%</text>`;
        svg += `<text x="${cx}" y="${H-py+18}" fill="#94a3b8" font-size="10" text-anchor="middle">${dateLabel}</text>`;
        svg += '</svg>';
        return `<div style="width:100%;overflow-x:auto;padding-bottom:4px;">${svg}</div>`;
      }

      if (daily.length < 2) return '';

      const W=800, H=200, px=48, py=40;
      const pW = W-2*px, pH = H-2*py;
      const stepX = pW / (daily.length - 1);
      const pts = daily.map((r, i) => {
        const val = r.modelProb != null ? r.modelProb : (r.confidenceScore || 0);
        const label = r._date.toLocaleDateString('en-GB', {day:'2-digit', month:'short'});
        return { x: px + i * stepX, y: H - py - (val / 100 * pH), val, label };
      });
      const areaPath = `M${pts[0].x},${H-py} ` + pts.map(p=>`L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length-1].x},${H-py} Z`;
      let svg = `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible;font-family:'Arial','Helvetica',sans-serif;">`;
      svg += `<defs><linearGradient id="chartGrad${suffix}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bb000e" stop-opacity="0.18"/><stop offset="100%" stop-color="#bb000e" stop-opacity="0.01"/></linearGradient></defs>`;
      [0,25,50,75,100].forEach(l => {
        const y = H - py - (l / 100 * pH);
        svg += `<line x1="${px}" y1="${y}" x2="${W-px}" y2="${y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 3"/>`;
        svg += `<text x="${px-8}" y="${y+4}" fill="#94a3b8" font-size="10" text-anchor="end">${l}%</text>`;
      });
      svg += `<path d="${areaPath}" fill="url(#chartGrad${suffix})"/>`;
      svg += `<polyline points="${pts.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="#bb000e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      pts.forEach(p => {
        const c = p.val >= 62 ? '#ef4444' : p.val >= 52 ? '#f59e0b' : '#22c55e';
        svg += `<circle cx="${p.x}" cy="${p.y}" r="6" fill="${c}" stroke="#fff" stroke-width="2"/>`;
        svg += `<text x="${p.x}" y="${p.y-12}" fill="${c}" font-size="11" font-weight="700" text-anchor="middle">${Math.round(p.val)}%</text>`;
        svg += `<text x="${p.x}" y="${H-py+18}" fill="#94a3b8" font-size="10" text-anchor="middle">${p.label}</text>`;
      });
      svg += '</svg>';
      return `<div style="width:100%;overflow-x:auto;padding-bottom:4px;">${svg}</div>`;
    }
    // ── End trajectory chart helpers ───────────────────────────────────

    window.downloadHistoricalReport = async function(idx) {
      const r = window._cachedReports[idx];
      if (!r) return;
      const btn = document.getElementById(`dl-btn-${idx}`);
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">hourglass_empty</span>…'; }

      // Build the same payload structure as results.html downloadReport()
      const DEPRESSION_INFO_FULL = {
        'Major Depressive Disorder (MDD)':            { desc: 'MDD is characterised by persistent low mood, loss of interest, and a range of physical and cognitive symptoms lasting at least two weeks.' },
        'Postpartum Depression':                       { desc: 'PPD occurs after childbirth, marked by intense sadness, anxiety, and exhaustion that interfere with caring for oneself or the baby.' },
        'Seasonal Affective Disorder (SAD)':           { desc: 'SAD is a recurrent depression tied to seasonal changes, typically emerging in autumn/winter when daylight hours shorten.' },
        'Atypical Depression':                         { desc: 'Atypical depression features mood reactivity along with hypersomnia and increased appetite.' },
        'Persistent Depressive Disorder (Dysthymia)': { desc: 'Dysthymia is a chronic, lower-grade depression lasting two or more years, causing significant long-term impairment.' },
        'Depressive Episode':                          { desc: 'A sustained period of depressed mood, reduced energy, and diminished interest in activities. Warrants a full clinical assessment.' },
      };

      const isDepressed = r.riskLevel === 'Moderate' || r.riskLevel === 'High';
      const displayPercent = isDepressed ? (r.modelProb ?? r.confidenceScore ?? '—') : null;
      const dt = (_toDate(r.createdAt)||new Date());
      const dateStr = dt.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
      const reportId = r.id ? `MD-${r.id.slice(0,8).toUpperCase()}` : ('MD-' + dt.getFullYear() + '-' + Math.floor(1000 + Math.random()*9000));
      const depType = (r.depressionType && r.depressionType !== '—') ? r.depressionType : (isDepressed ? 'Depressive Episode' : null);
      const riskClass = r.riskLevel || 'Low';
      const uName = window.currentUser?.name || 'Anonymous';
      const uInfo = JSON.parse(sessionStorage.getItem('md_userInfo') || '{}');
      const modes = ['Audio','Text'].filter(m => r.contributions?.[m.toLowerCase()] > 0).join(' · ') || (r.inputModes?.text ? 'Text' : r.inputModes?.audio ? 'Audio' : 'Text');
      const depInfoFull = depType ? (DEPRESSION_INFO_FULL[depType] || { desc: 'A depressive episode was identified. Clinical assessment is advised.' }) : null;
      const probPct = typeof displayPercent === 'number' ? displayPercent : 0;

      const insightDefs = [
        { key: 'audio',         type: 'audio',        icon: 'MIC', title: 'Voice & Audio Signals' },
        { key: 'text',          type: 'text',          icon: 'TXT', title: 'Language & Text Signals' },
        { key: 'cognitive',     type: 'facial',        icon: 'VID', title: 'Facial & Visual Cues' },
        { key: 'questionnaire', type: 'questionnaire', icon: 'QST', title: 'Questionnaire Insights' },
      ];
      const insights = insightDefs.map(def => {
        const ins = r.insights?.[def.key];
        let body;
        if (def.key === 'cognitive') {
          body = 'Visual modality (ViT) is trained and ready — video analysis will be available in a future update.';
        } else {
          const pts = (ins?.points || []).filter(p => p && p !== 'undefined');
          body = pts.join('. ') || (def.key === 'audio' ? 'No audio input provided — audio modality not analysed.' : 'Analysis complete.');
        }
        return { type: def.type, icon: def.icon, title: def.title, body };
      });

      const recs = r.recommendations || [];
      const chunk = Math.ceil(recs.length / 3);
      const recommendations = { immediate: recs.slice(0, chunk), professional: recs.slice(chunk, chunk*2), lifestyle: recs.slice(chunk*2) };

      const riskFactors = isDepressed ? [
        { label: `Severity score ≥ ${displayPercent || 60}%`, body: "The model's output crosses the clinical high-risk threshold established from validated depression screening benchmarks." },
        { label: 'Multimodal agreement', body: `${modes} signals are independently flagging distress, strengthening the reliability of the prediction.` },
        depInfoFull && depType ? { label: `${depType} context`, body: depInfoFull.desc } : null,
        { label: 'Negative cognitive patterns', body: 'Language analysis detected persistent distress framing and reduced future-oriented speech, associated with higher-risk presentations.' },
      ].filter(Boolean) : [];

      const nextSteps = isDepressed ? [
        { label: 'Today', body: 'Share this report with a family member, partner, or trusted friend. You do not need to face this alone.' },
        { label: 'Within 24–48 hours', body: 'Book an appointment with a psychiatrist or clinical psychologist. Bring this report to the appointment.' },
        { label: 'Seek urgent help immediately if', body: 'You experience thoughts of self-harm or a sudden worsening of symptoms. Call Tele MANAS: 14416 or 1800-89-14416, or go to your nearest emergency department.' },
        { label: 'Follow-up session', body: 'Schedule a re-assessment with ManoDhwani in 2–4 weeks to track progress after professional intervention begins.' },
      ] : [
        { label: 'Today', body: 'Share this report with a trusted friend or family member as a baseline record.' },
        { label: 'Follow-up session', body: 'Schedule a re-assessment with ManoDhwani in 2–4 weeks to track your wellbeing.' },
      ];

      const probRangeLabel = isDepressed ? (probPct >= 75 ? 'Severe range (≥ 75%)' : 'Moderate range (51–75%)') : 'Normal range (< 51%)';
      const disorderDesc = depInfoFull ? `<strong>${depType}</strong> — ${depInfoFull.desc}` : '';
      const disorderTags = depType ? [depType, ...(r.tags || [])] : ['No Disorder Detected'];

      // Pre-fetch trajectory chart SVG (poll until loadReports is ready, max 3 s)
      const trajectoryChartSvg = await (function waitChart(n) {
        if (window.loadReports && window.currentUser) return generateAdetChartHtml('_pdf');
        if (n <= 0) return Promise.resolve('');
        return new Promise(res => setTimeout(() => waitChart(n - 1).then(res), 300));
      })(10);

      const reportPayload = {
        report_id:           reportId,
        risk_level:          isDepressed ? `${riskClass} Risk` : 'Low Risk',
        risk_sub_label:      isDepressed ? (riskClass === 'High' ? 'Immediate action required' : 'Intervention advised') : 'Low levels',
        analysis_mode:       `Multimodal (${modes})`,
        probability_pct:     probPct,
        prob_range_label:    probRangeLabel,
        disorder_name:       depType || 'No disorder detected',
        disorder_short_desc: depInfoFull ? 'Detected via multimodal analysis' : '',
        disorder_desc:       disorderDesc,
        disorder_tags:       disorderTags,
        patient: { name: uName, age: uInfo.age || '—', gender: uInfo.gender || '—', session_date: dateStr },
        executive_summary: isDepressed
          ? `ManoDhwani's multimodal analysis identified significant markers of <strong>${depType || 'a depressive episode'}</strong>. The combined signal places this assessment in the <strong>${riskClass} Risk</strong> category, with an overall severity score of ${displayPercent}%.`
          : "ManoDhwani's multimodal analysis did not identify significant markers of depression. The combined signals placed this assessment in the <strong>Low Risk</strong> category.",
        risk_factors:   riskFactors,
        insights,
        recommendations,
        next_steps:     nextSteps,
        city:           'Hyderabad',
        doctors:        [],
        trajectory_chart_svg: trajectoryChartSvg,
      };

      try {
        const resp = await fetch(`${FLASK_API_URL_PF}/generate-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportPayload),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `ManoDhwani_Report_${uName.replace(/\s+/g,'_')}_${dateStr.replace(/\s/g,'_')}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('PDF generation failed. Please try again.');
        console.error('[ManoDhwani] PDF generation failed:', err);
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">download</span>PDF'; }
      }
    };

  // ───────────── <script> #2 (classic) ─────────────
    // Render chart into any container by id
    function _renderChartInto(containerId, tab) {
      ['hourly','daily','weekly','monthly'].forEach(t => {
        const btn = document.getElementById(`modal-tab-${t}`);
        if (btn) btn.classList.toggle('active', t === tab);
      });
      const reports = _profileReportsCache || [];
      const now = new Date();
      let buckets = [];
      if (tab === 'hourly') {
        for (let h = 23; h >= 0; h--) { const d = new Date(now); d.setMinutes(0,0,0,0); d.setHours(d.getHours()-h); buckets.push({label:d.getHours()+':00',hour:d.getHours(),dateStr:d.toDateString(),ts:d.getTime(),value:null,_latest:0}); }
        reports.forEach(r => { const dt=(_toDate(r.createdAt)||new Date()); const t=dt.getTime(); const age=now-t; if(age>24*3600000)return; const b=buckets.find(x=>x.hour===dt.getHours()&&x.dateStr===dt.toDateString()); if(!b)return; const val=r.modelProb??r.confidenceScore??null; if(val!==null&&(b.value===null||t>b._latest)){b.value=val;b._latest=t;} });
      } else if (tab === 'daily') {
        for (let d=6;d>=0;d--){const dt=new Date(now);dt.setDate(dt.getDate()-d);dt.setHours(0,0,0,0);buckets.push({label:dt.toLocaleDateString('en-US',{month:'short',day:'numeric'}),dayStart:dt.getTime(),dayEnd:dt.getTime()+86400000,value:null,_latest:0});}
        reports.forEach(r=>{const dt=(_toDate(r.createdAt)||new Date());const t=dt.getTime();const b=buckets.find(x=>t>=x.dayStart&&t<x.dayEnd);if(!b)return;const val=r.modelProb??r.confidenceScore??null;if(val!==null&&(b.value===null||t>b._latest)){b.value=val;b._latest=t;}});
      } else if (tab === 'weekly') {
        for (let w=7;w>=0;w--){const dt=new Date(now);dt.setDate(dt.getDate()-w*7);const ws=dt.getTime()-(dt.getDay())*86400000;buckets.push({label:'Wk '+dt.toLocaleDateString('en-US',{month:'short',day:'numeric'}),weekStart:ws,weekEnd:ws+7*86400000,value:null,_latest:0});}
        reports.forEach(r=>{const t=(_toDate(r.createdAt)||new Date()).getTime();const b=buckets.find(x=>t>=x.weekStart&&t<x.weekEnd);if(!b)return;const val=r.modelProb??r.confidenceScore??null;if(val!==null&&(b.value===null||t>b._latest)){b.value=val;b._latest=t;}});
      } else {
        for (let m=11;m>=0;m--){const dt=new Date(now.getFullYear(),now.getMonth()-m,1);buckets.push({label:dt.toLocaleDateString('en-US',{month:'short',year:'2-digit'}),month:dt.getMonth(),year:dt.getFullYear(),value:null,_latest:0});}
        reports.forEach(r=>{const dt=(_toDate(r.createdAt)||new Date());const b=buckets.find(x=>x.month===dt.getMonth()&&x.year===dt.getFullYear());if(!b)return;const val=r.modelProb??r.confidenceScore??null;const t=dt.getTime();if(val!==null&&(b.value===null||t>b._latest)){b.value=val;b._latest=t;}});
      }
      const chartEl = document.getElementById(containerId);
      if (!chartEl) return;
      const filled = buckets.map((b,i)=>({...b,i})).filter(b=>b.value!==null);
      if (filled.length === 0) {
        chartEl.innerHTML=`<div style="text-align:center;padding:48px 24px;color:#64748b;"><div style="font-size:32px;margin-bottom:12px;">📊</div><div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;">No sessions in this time range</div><div style="font-size:11px;margin-top:6px;color:#94a3b8;">Switch to a wider range or run a session</div></div>`;
        return;
      }
      const W=780,H=240,PAD={top:24,right:48,bottom:48,left:48};
      const innerW=W-PAD.left-PAD.right,innerH=H-PAD.top-PAD.bottom,n=buckets.length;
      const xScale=i=>PAD.left+(i/(n-1))*innerW;
      const yScale=v=>PAD.top+innerH-((v-0)/(100-0))*innerH;
      const pts=filled.map(b=>`${xScale(b.i)},${yScale(b.value)}`).join(' ');
      const areaPath=filled.map((b,fi)=>{const x=xScale(b.i),y=yScale(b.value);return fi===0?`M${x},${y}`:`L${x},${y}`;}).join(' ')+` L${xScale(filled[filled.length-1].i)},${PAD.top+innerH} L${xScale(filled[0].i)},${PAD.top+innerH} Z`;
      const yGuides=[0,25,50,75,100].map(v=>`<line x1="${PAD.left}" y1="${yScale(v)}" x2="${PAD.left+innerW}" y2="${yScale(v)}" stroke="rgba(0,0,0,0.06)" stroke-width="1"/><text x="${PAD.left-8}" y="${yScale(v)+4}" text-anchor="end" fill="#94a3b8" font-size="9" font-family="Space Grotesk,sans-serif">${v}%</text>`).join('');
      const stepLabel=Math.ceil(n/6);
      const xLabels=buckets.map((b,i)=>{if(i%stepLabel!==0&&i!==n-1)return '';return `<text x="${xScale(i)}" y="${H-8}" text-anchor="middle" fill="#64748b" font-size="9" font-family="Space Grotesk,sans-serif">${b.label}</text>`;}).join('');
      const dots=filled.map(b=>{const x=xScale(b.i),y=yScale(b.value);const clr=b.value>=62?'#ef4444':b.value>=52?'#f59e0b':'#22c55e';return `<circle cx="${x}" cy="${y}" r="6" fill="${clr}" stroke="#fff" stroke-width="2"><title>${b.label}: ${Math.round(b.value)}%</title></circle>`;}).join('');
      const singleLabel = filled.length === 1 ? `<text x="${xScale(filled[0].i)}" y="${yScale(filled[0].value) - 12}" text-anchor="middle" fill="#64748b" font-size="10" font-family="Space Grotesk,sans-serif">${Math.round(filled[0].value)}% · ${filled[0].label}</text>` : '';
      chartEl.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="100%" style="overflow:visible;" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="modal-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8e0008" stop-opacity="0.15"/><stop offset="100%" stop-color="#8e0008" stop-opacity="0.0"/></linearGradient></defs>
        <rect x="${PAD.left}" y="${yScale(100)}" width="${innerW}" height="${yScale(62)-yScale(100)}" fill="rgba(239,68,68,0.04)"/>
        <rect x="${PAD.left}" y="${yScale(62)}" width="${innerW}" height="${yScale(52)-yScale(62)}" fill="rgba(245,158,11,0.04)"/>
        <rect x="${PAD.left}" y="${yScale(52)}" width="${innerW}" height="${yScale(0)-yScale(52)}" fill="rgba(34,197,94,0.04)"/>
        ${yGuides}
        <path d="${areaPath}" fill="url(#modal-grad)"/>
        <polyline points="${pts}" fill="none" stroke="#8e0008" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}${singleLabel}${xLabels}
        <text x="${PAD.left+innerW+5}" y="${yScale(62)+4}" fill="rgba(239,68,68,0.5)" font-size="8" font-family="Space Grotesk">High</text>
        <text x="${PAD.left+innerW+5}" y="${yScale(52)+4}" fill="rgba(245,158,11,0.5)" font-size="8" font-family="Space Grotesk">Mod</text>
      </svg>`;
    }

    let _modalCurrentTab = 'daily';

    window.openChartModal = function() {
      const modal = document.getElementById('chart-modal');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      _modalCurrentTab = _profileCurrentTab || 'daily';
      ['hourly','daily','weekly','monthly'].forEach(t => {
        const btn = document.getElementById(`modal-tab-${t}`);
        if (btn) btn.classList.toggle('active', t === _modalCurrentTab);
      });
      _renderChartInto('modal-chart-svg', _modalCurrentTab);
    };

    window.closeChartModal = function() {
      document.getElementById('chart-modal').style.display = 'none';
      document.body.style.overflow = '';
    };

    window.pfSwitchModalTab = function(tab) {
      _modalCurrentTab = tab;
      _renderChartInto('modal-chart-svg', tab);
    };

    // Close on backdrop click
    document.getElementById('chart-modal').addEventListener('click', function(e) {
      if (e.target === this) window.closeChartModal();
    });

    // Close on Escape key
    on(document, 'keydown', function(e) {
      if (e.key === 'Escape') window.closeChartModal();
    });

  // Top-level functions of classic <script>s were globals; inline handlers & innerHTML onclick="" rely on that.
  scope.expose({ _toDate, renderProfile, _renderProfileTab, _renderProfileHistory, generateAdetChartHtml, _renderChartInto });

  // ───────────── <script type="module"> #3 ─────────────
  {
    window.firebaseSignOut = async () => {
      await signOut(auth);
      navigateTo('/');
    };

    onAuthStateChanged(auth, async (user) => {
      if (!user) { navigateTo('/login'); return; }

      window.currentUser = {
        uid: user.uid,
        name: user.displayName || user.email || 'User',
        email: user.email,
        photo: user.photoURL || null,
        gender: '', age: ''
      };

      // Load Firestore profile
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) { const s = snap.data(); if (s.gender) window.currentUser.gender = s.gender; if (s.age) window.currentUser.age = s.age; }
      } catch (e) { }

      // Expose loadReports
      window.loadReports = async () => {
        try {
          const q = query(collection(db, 'users', user.uid, 'reports'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) { return []; }
      };

      // Now render
      renderProfile(user);
    });
  }

}
