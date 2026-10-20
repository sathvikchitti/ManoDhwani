import { memo } from 'react';
import { usePageRuntime } from '../../lib/page-runtime.js';
import { navigateTo } from '../../lib/navigation.js';
import SiteFooter from '../../components/SiteFooter.jsx';
import TopNavBar from '../../components/TopNavBar.jsx';
import css from './results.css?inline';
import mountResultsPage from './results.controller.js';

// Markup moved from results.html <body>.
function ResultsPage() {
  usePageRuntime({
    title: 'ManoDhwani - Mental Health Report',
    htmlAttrs: { lang: 'en' },
    bodyAttrs: { class: 'text-neutral-900 font-body antialiased min-h-screen pt-24 pb-32 bg-fixed-image' },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Amarante&family=Yatra+One&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ],
    css,
    controller: mountResultsPage,
  });
  return (
    <>
      {/* Decorative blobs */}
      <div className="blob-tl" />
      <div className="blob-br" />
      {/* ══════════════════════════════════════════
     PAGE: RESULTS
════════════════════════════════════════════ */}{' '}
      <div id="page-results" className="page active relative z-10">
        {' '}
        {/* TopNavBar */} <TopNavBar active="results" />{' '}
        <div className="pt-24 min-h-screen">
          {/* Loading Fallback (shown while JS hydrates) */}
          <div id="results-loading" className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="font-label text-sm uppercase tracking-widest text-neutral-500">Loading your report…</p>
          </div>
          {/* Actual Report Content (hidden until hydrated) */}
          <div id="results-content" style={{ display: 'none' }} className="max-w-7xl mx-auto px-8 py-12 pb-32">
            {/* Alert Banner */}
            <div
              id="results-alert-banner"
              className="w-full border-l-4 p-4 mb-12 flex items-start gap-4 shadow-sm rounded-sm"
            >
              <span className="material-symbols-outlined mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                info
              </span>
              <div>
                <p className="text-sm font-body">Initialising…</p>
              </div>
            </div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-2xl">
                <p id="results-patient" className="font-label text-neutral-500 text-xs tracking-[0.2em] uppercase mb-4">
                  Patient Assessment
                </p>
                <h2 className="font-headline text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-neutral-900 mb-6">
                  Mental Health
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-400">
                    Report
                  </span>
                </h2>
                <p id="results-report-meta" className="font-label text-neutral-500 text-xs tracking-widest" />
                {/* Patient Info Grid */}
                <div id="patient-info-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8" />
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  data-onclick="window.downloadReport()"
                  onClick={() => window.downloadReport()}
                  className="px-6 py-3 border border-neutral-300 text-neutral-700 font-label text-xs uppercase tracking-widest rounded-DEFAULT hover:bg-white bg-white/50 backdrop-blur-sm transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>Download PDF
                </button>
                <button
                  onClick={() => navigateTo('/analysis')}
                  className="star-border rounded-DEFAULT transition-colors"
                >
                  <div className="star-border-inner bg-primary text-on-primary rounded-DEFAULT px-6 py-3 font-label text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">refresh</span>New Analysis
                  </div>
                </button>
              </div>
            </div>
            {/* Executive Summary + Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
              {/* Exec Summary */}
              <div className="lg:col-span-5 glass-panel p-8 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full mix-blend-multiply filter blur-[40px] translate-x-1/2 -translate-y-1/2" />
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-label text-xs uppercase tracking-widest text-neutral-500">About Condition</h3>
                    <span
                      id="depression-type-badge"
                      style={{ display: 'none' }}
                      className="bg-error/10 text-error font-label text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-error/20"
                    >
                      —
                    </span>
                  </div>
                  <p id="ring-desc" className="font-body text-neutral-800 text-base leading-relaxed font-light">
                    Analysing…
                  </p>
                  <p
                    id="depression-type-label"
                    className="font-label text-xs mt-4 text-primary font-bold uppercase tracking-widest"
                  />
                </div>
              </div>
              {/* 3 Metric Tiles */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Probability */}
                <div className="glass-panel p-6 flex flex-col justify-between">
                  <p className="font-label text-neutral-500 text-[10px] uppercase tracking-widest mb-4">
                    ManoDhwani Probability Score
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span id="results-confidence" className="font-headline text-5xl font-black">
                      —
                    </span>
                    <span className="text-neutral-500 font-label text-xs">%</span>
                  </div>
                  <div className="contrib-bar mt-4">
                    <div id="severity-bar-fill" className="contrib-fill bg-gradient-to-r from-[#bb000e] to-[#ffb4aa]" />
                  </div>
                  <p id="severity-range-label" className="font-label text-[10px] text-neutral-400 mt-1">
                    —
                  </p>
                </div>
                {/* Risk Level */}
                <div className="glass-panel p-6 flex flex-col justify-between">
                  <p className="font-label text-neutral-500 text-[10px] uppercase tracking-widest mb-4">Risk Level</p>
                  <span id="results-risk" className="font-headline text-3xl font-bold leading-tight mt-auto">
                    —
                  </span>
                  <p id="results-risk-sub" className="font-label text-[10px] text-neutral-400 mt-1">
                    —
                  </p>
                </div>
                {/* Depression Type */}
                <div className="glass-panel p-6 flex flex-col justify-between">
                  <p className="font-label text-neutral-500 text-[10px] uppercase tracking-widest mb-4">Condition</p>
                  <span id="results-dep-type-name" className="font-headline text-xl font-bold leading-tight mt-auto">
                    —
                  </span>
                  <p
                    id="results-dep-type-desc"
                    className="font-body text-[11px] text-neutral-500 mt-2 leading-relaxed"
                  />
                </div>
              </div>
            </div>
            {/* Signal Contributions */}
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-label text-xs uppercase tracking-widest text-neutral-500">Signal Contributions</h3>
                <div className="h-px bg-neutral-300 flex-1" />
                <span className="font-label text-[10px] text-neutral-400">01</span>
              </div>
              <div className="glass-panel p-8">
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-label text-xs text-neutral-600">Text / Linguistic</span>
                      <span id="contrib-text-val" className="font-label text-xs font-bold text-neutral-900">
                        —%
                      </span>
                    </div>
                    <div className="contrib-bar">
                      <div id="contrib-text" className="contrib-fill bg-blue-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-label text-xs text-neutral-600">Audio / Vocal</span>
                      <span id="contrib-audio-val" className="font-label text-xs font-bold text-neutral-900">
                        —%
                      </span>
                    </div>
                    <div className="contrib-bar">
                      <div id="contrib-audio" className="contrib-fill bg-purple-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-label text-xs text-neutral-600">Questionnaire</span>
                      <span id="contrib-quest-val" className="font-label text-xs font-bold text-neutral-900">
                        —%
                      </span>
                    </div>
                    <div className="contrib-bar">
                      <div id="contrib-quest" className="contrib-fill bg-amber-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Emotional Signals */}
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-label text-xs uppercase tracking-widest text-neutral-500">Emotional Signals</h3>
                <div className="h-px bg-neutral-300 flex-1" />
                <span className="font-label text-[10px] text-neutral-400">02</span>
              </div>
              <div id="signals-container" className="flex flex-wrap gap-3" />
            </div>
            {/* Insights Grid */}
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-label text-xs uppercase tracking-widest text-neutral-500">Clinical Insights</h3>
                <div className="h-px bg-neutral-300 flex-1" />
                <span className="font-label text-[10px] text-neutral-400">03</span>
              </div>
              <div id="insights-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4" />
            </div>
            {/* Longitudinal Trajectory */}
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-label text-xs uppercase tracking-widest text-neutral-500">
                  ADET — Adaptive Emotional Digital Twin
                </h3>
                <div className="h-px bg-neutral-300 flex-1" />
                <span className="font-label text-[10px] text-neutral-400">04</span>
              </div>
              {/* What is ADET — dropdown */}
              <div className="mb-4">
                <button
                  onClick={(event) =>
                    (function (btn) {
                      const body = document.getElementById('adet-explainer');
                      const arrow = document.getElementById('adet-arrow');
                      const open = body.style.display === 'block';
                      body.style.display = open ? 'none' : 'block';
                      arrow.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
                    })(event.currentTarget)
                  }
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(142,0,8,0.04)',
                    border: '1px solid rgba(142,0,8,0.12)',
                    borderRadius: '1rem',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(event) => {
                    event.currentTarget.style.background = 'rgba(142,0,8,0.07)';
                  }}
                  onMouseOut={(event) => {
                    event.currentTarget.style.background = 'rgba(142,0,8,0.04)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🧠</span>
                    <span
                      className="font-label"
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#8e0008',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      What is ADET?
                    </span>
                  </div>
                  <span id="adet-arrow" style={{ fontSize: '18px', color: '#8e0008', transition: 'transform 0.25s' }}>
                    ▼
                  </span>
                </button>
                <div
                  id="adet-explainer"
                  style={{
                    display: 'none',
                    marginTop: '2px',
                    background: 'rgba(255,255,255,0.92)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: '1rem',
                    padding: '24px 28px',
                  }}
                >
                  {/* Simple headline */}
                  <p
                    className="font-headline"
                    style={{ fontSize: '1.1rem', fontWeight: '800', color: '#111', marginBottom: '16px' }}
                  >
                    Think of ADET as your mental health diary — but smarter. 📓
                  </p>
                  {/* Three plain-English cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                      gap: '12px',
                      marginBottom: '20px',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(34,197,94,0.06)',
                        border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: '0.875rem',
                        padding: '16px',
                      }}
                    >
                      <div style={{ fontSize: '22px', marginBottom: '8px' }}>📅</div>
                      <p
                        className="font-label"
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color: '#166534',
                          marginBottom: '6px',
                        }}
                      >
                        Every time you check in
                      </p>
                      <p className="font-body" style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                        ManoDhwani gives you a score from 0–100 based on how your voice, words, and answers sound that
                        day. Higher score = more signs of distress.
                      </p>
                    </div>
                    <div
                      style={{
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: '0.875rem',
                        padding: '16px',
                      }}
                    >
                      <div style={{ fontSize: '22px', marginBottom: '8px' }}>📈</div>
                      <p
                        className="font-label"
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color: '#92400e',
                          marginBottom: '6px',
                        }}
                      >
                        ADET remembers your history
                      </p>
                      <p className="font-body" style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                        Each check-in is a dot on your chart. Over time, these dots form a line that shows whether you
                        are getting better 📉, staying the same ➡️, or need more support 📈.
                      </p>
                    </div>
                    <div
                      style={{
                        background: 'rgba(142,0,8,0.05)',
                        border: '1px solid rgba(142,0,8,0.15)',
                        borderRadius: '0.875rem',
                        padding: '16px',
                      }}
                    >
                      <div style={{ fontSize: '22px', marginBottom: '8px' }}>🔮</div>
                      <p
                        className="font-label"
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color: '#8e0008',
                          marginBottom: '6px',
                        }}
                      >
                        It even predicts ahead
                      </p>
                      <p className="font-body" style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                        {'The dashed line and open circle show where your score is '}
                        <em>trending</em>
                        {' — so you and your doctor can act early, before things get harder.'}
                      </p>
                    </div>
                  </div>
                  {/* One-line colour key in plain English */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.03)',
                      borderRadius: '0.75rem',
                      padding: '14px 18px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '14px',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      className="font-label"
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: '#64748b',
                        fontWeight: '700',
                      }}
                    >
                      Dot colour means:
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          background: '#22c55e',
                          display: 'inline-block',
                        }}
                      />
                      <span className="font-body" style={{ fontSize: '12px', color: '#374151' }}>
                        {"🟢 Green — you're doing well (score < 52)"}
                      </span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          background: '#f59e0b',
                          display: 'inline-block',
                        }}
                      />
                      <span className="font-body" style={{ fontSize: '12px', color: '#374151' }}>
                        🟡 Amber — worth keeping an eye on (52–61)
                      </span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          display: 'inline-block',
                        }}
                      />
                      <span className="font-body" style={{ fontSize: '12px', color: '#374151' }}>
                        🔴 Red — please talk to someone (62+)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              {/* Chart panel */}
              <div className="glass-panel p-8">
                {/* Chart */}
                <div id="adet-chart-container" className="flex items-center justify-center min-h-[120px]">
                  <p className="font-label text-xs text-neutral-400 uppercase tracking-widest">
                    Complete multiple assessments to see your trend
                  </p>
                </div>
                {/* What this chart shows — below the chart */}
                <div className="mt-6 pt-5 border-t border-neutral-100">
                  <p className="font-label text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    Reading this chart
                  </p>
                  <p className="font-body text-sm text-neutral-600 leading-relaxed">
                    {
                      'This graph plots your ManoDhwani probability score across each assessment session over time. Each '
                    }
                    <strong>filled dot</strong>
                    {' is one real session — coloured '}
                    <span style={{ color: '#22c55e', fontWeight: '700' }}>green</span>
                    {' if your score was low, '}
                    <span style={{ color: '#f59e0b', fontWeight: '700' }}>amber</span>
                    {' if moderate, or '}
                    <span style={{ color: '#ef4444', fontWeight: '700' }}>red</span>
                    {' if high. The '}
                    <strong style={{ color: '#16a34a' }}>green dashed line</strong>
                    {
                      ' is a 3-session rolling average — it smooths out single-day spikes so you can see the real direction. The '
                    }
                    <strong style={{ color: '#d97706' }}>amber dashed line</strong>
                    {
                      " is the overall trend — if it's climbing, that's a signal to check in with a clinician sooner. The "
                    }
                    <strong style={{ color: '#94a3b8' }}>open circle</strong>
                    {
                      ' is where your score is projected to land next session based on your current trend. Tracking these scores week over week helps you and your clinician observe whether things are improving, stable, or escalating.'
                    }
                  </p>
                </div>
              </div>
            </div>
            {/* Risk Factors */}
            <div id="risk-analysis-card" style={{ display: 'none' }} className="mb-20">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-label text-xs uppercase tracking-widest text-neutral-500">Risk Analysis</h3>
                <div className="h-px bg-neutral-300 flex-1" />
                <span className="font-label text-[10px] text-neutral-400">06</span>
              </div>
              <div className="glass-panel p-8">
                <div id="risk-factors-list" className="flex flex-col gap-3" />
              </div>
            </div>
            {/* Recommendations */}
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-label text-xs uppercase tracking-widest text-neutral-500">
                  Personalised Recommendations
                </h3>
                <div className="h-px bg-neutral-300 flex-1" />
                <span className="font-label text-[10px] text-neutral-400">07</span>
              </div>
              <div id="recommendations-container" className="grid grid-cols-1 md:grid-cols-3 gap-4" />
            </div>
            {/* Next Steps */}
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-label text-xs uppercase tracking-widest text-neutral-500">Next Steps</h3>
                <div className="h-px bg-neutral-300 flex-1" />
                <span className="font-label text-[10px] text-neutral-400">08</span>
              </div>
              <div className="glass-panel p-8">
                <div id="next-steps-list" className="flex flex-col gap-5" />
              </div>
            </div>
            {/* Doctors */}
            <div id="doctors-card" style={{ display: 'none' }} className="mb-20">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-label text-xs uppercase tracking-widest text-neutral-500">
                  Recommended Specialists
                </h3>
                <div className="h-px bg-neutral-300 flex-1" />
              </div>
              <div className="glass-panel p-8">
                <p
                  id="doctors-city-label"
                  className="font-label text-sm font-bold text-neutral-800 mb-2 uppercase tracking-widest"
                />
                <p id="doctors-city-subtitle" className="font-body text-sm text-neutral-500 mb-6" />
                <div id="doctors-list" />
              </div>
            </div>
            {/* Disclaimer */}
            <div className="bg-neutral-100 border border-neutral-200 p-6">
              <p className="font-label text-xs uppercase tracking-widest text-neutral-500 mb-2">Ethical Disclaimer</p>
              <p className="font-body text-xs text-neutral-500 leading-relaxed">
                {
                  'This report is generated by ManoDhwani, an AI-powered mental health screening tool. It is intended for informational and supportive purposes only and does '
                }
                <strong>not</strong>
                {
                  ' constitute a clinical diagnosis, medical advice, or a substitute for professional psychiatric evaluation. Always consult a licensed mental health professional before making any decisions regarding treatment. If you are in immediate danger, contact emergency services or a crisis helpline.'
                }
              </p>
            </div>
          </div>
          <SiteFooter variant="results" />
        </div>{' '}
        {/* ══════════════════════════════════════════
     PAGE: PROFILE
════════════════════════════════════════════ */}{' '}
        <div id="page-profile" className="page min-h-screen bg-[#f5f5f5] relative z-10">
          {' '}
          <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl flex justify-between items-center w-full px-8 py-4 border-b border-neutral-200">
            <a href="/" className="text-2xl font-black tracking-tighter text-[#bb000e] uppercase font-headline">
              MANODHWANI
            </a>
            <button
              onClick={() => window.showPage('results')}
              className="font-label text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>Back to Results
            </button>
          </header>{' '}
          <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-3">
              <div className="glass-panel p-6">
                <div
                  id="profile-user-card"
                  className="flex flex-col items-center text-center mb-6 pb-6 border-b border-black/10"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden mb-4 flex items-center justify-center">
                    <img
                      id="profile-photo"
                      src={'https://ui-avatars.com/api/?background=bb000e&color=fff&size=80'}
                      alt=""
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <h3 id="profile-name" className="font-headline text-lg font-bold text-neutral-900 mb-1">
                    —
                  </h3>
                  <p id="profile-email" className="font-label text-xs text-neutral-500 uppercase tracking-widest">
                    —
                  </p>
                </div>
                <nav className="space-y-2">
                  <button
                    onClick={() => window.showProfileTab('overview')}
                    className="w-full text-left font-label text-xs uppercase tracking-widest px-3 py-2 rounded hover:bg-neutral-100 transition-colors text-neutral-700"
                  >
                    Overview
                  </button>{' '}
                  <button
                    onClick={() => window.showProfileTab('history')}
                    className="w-full text-left font-label text-xs uppercase tracking-widest px-3 py-2 rounded hover:bg-neutral-100 transition-colors text-neutral-700"
                  >
                    Assessment History
                  </button>
                </nav>
                <div className="mt-6 pt-6 border-t border-black/10">
                  <button
                    onClick={() => window.firebaseSignOut && window.firebaseSignOut()}
                    className="w-full font-label text-xs uppercase tracking-widest text-error hover:opacity-80 transition-opacity py-2"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </aside>
            {/* Main */}
            <main className="lg:col-span-9 space-y-8">
              {/* Overview */}
              <div id="profile-tab-overview">
                <h2 className="font-headline text-3xl font-bold text-neutral-900 mb-8 tracking-tight">Your Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="glass-panel p-6">
                    <p className="font-label text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
                      Total Assessments
                    </p>
                    <p id="stat-total" className="font-headline text-4xl font-black text-neutral-900">
                      —
                    </p>
                  </div>
                  <div className="glass-panel p-6">
                    <p className="font-label text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
                      Latest Risk
                    </p>
                    <p id="stat-latest-risk" className="font-headline text-3xl font-black text-neutral-900">
                      —
                    </p>
                  </div>
                  <div className="glass-panel p-6">
                    <p className="font-label text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
                      Latest Score
                    </p>
                    <p id="stat-latest-score" className="font-headline text-4xl font-black text-neutral-900">
                      —<span className="text-2xl">%</span>
                    </p>
                  </div>
                </div>
                <div className="glass-panel p-6">
                  <p className="font-label text-xs uppercase tracking-widest text-neutral-500 mb-4">
                    Probability Trend
                  </p>
                  <div id="profile-chart" className="min-h-[180px] flex items-center justify-center">
                    <p className="font-label text-xs text-neutral-400">
                      Complete multiple assessments to see your trend.
                    </p>
                  </div>
                </div>
              </div>
              {/* History */}
              <div id="profile-tab-history" style={{ display: 'none' }}>
                <h2 className="font-headline text-3xl font-bold text-neutral-900 mb-8 tracking-tight">
                  Assessment History
                </h2>
                <div id="history-list" className="space-y-4">
                  <p className="font-label text-xs text-neutral-400 uppercase tracking-widest">Loading history…</p>
                </div>
              </div>
            </main>
          </div>{' '}
        </div>{' '}
        {/* ══════════════════════════════════════════
     JAVASCRIPT
════════════════════════════════════════════ */}{' '}
        {/* Firebase Auth Guard + User Badge */}{' '}
      </div>
    </>
  );
}

export default memo(ResultsPage);
