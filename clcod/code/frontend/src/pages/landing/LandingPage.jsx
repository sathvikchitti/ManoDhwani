import { memo } from 'react';
import { usePageRuntime } from '../../lib/page-runtime.js';
import TopNavBar from '../../components/TopNavBar.jsx';
import css from './landing.css?inline';
import mountLandingPage from './landing.controller.js';

// Markup moved from index.html <body>.
function LandingPage() {
  usePageRuntime({
    title: 'ManoDhwani - AI Powered Multi-Modal Depression Detection System',
    htmlAttrs: { lang: 'en' },
    bodyAttrs: {
      class:
        'bg-background text-on-background font-body antialiased selection:bg-primary-container selection:text-on-primary-container pb-32',
    },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Amarante&family=Yatra+One&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ],
    css,
    controller: mountLandingPage,
  });
  return (
    <>
      {/* ═══ MAIN SITE CONTENT ═══ */}
      <div id="main-content">
        {/* User Info Modal */}
        <div id="info-modal">
          <div
            id="modal-overlay"
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => window.closeInfoModal()}
          />
          <div className="modal-glass relative w-full max-w-md mx-4 p-8 flex flex-col gap-6 z-10">
            <div className="flex items-center gap-4 mb-1">
              <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  person
                </span>
              </div>
              <div>
                <p className="font-label text-[10px] uppercase tracking-widest text-white/50 mb-0.5">Before We Begin</p>
                <h2 className="font-headline font-bold text-white text-xl leading-tight">Patient Information</h2>
              </div>
              <button
                onClick={() => window.closeInfoModal()}
                className="ml-auto text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div
              id="lp-autofill-banner"
              className="hidden items-center gap-2 bg-green-500/10 border border-green-400/30 rounded-xl px-4 py-2.5"
            >
              <span
                className="material-symbols-outlined text-green-400 text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>{' '}
              <span className="font-label text-[11px] text-green-300 font-semibold uppercase tracking-wider">
                Auto-filled from your profile
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label text-[11px] uppercase tracking-widest text-white/60">Full Name</label>
                <input id="lp-modal-name" type="text" className="modal-input" placeholder="Enter your full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label text-[11px] uppercase tracking-widest text-white/60">Age</label>
                  <input
                    id="lp-modal-age"
                    type="number"
                    min="10"
                    max="100"
                    className="modal-input"
                    placeholder="e.g. 25"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label text-[11px] uppercase tracking-widest text-white/60">Gender</label>
                  <select id="lp-modal-gender" className="modal-input" defaultValue="">
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
            <p id="lp-modal-error" className="hidden font-label text-xs text-red-400 font-semibold">
              Please enter your full name to continue.
            </p>
            <button
              onClick={() => window.submitLandingModal()}
              className="star-border rounded-xl hover-float mt-1 shadow-[0_4px_20px_rgba(187,0,14,0.4)] w-full"
            >
              <div className="star-border-inner bg-primary rounded-xl text-white font-label font-bold text-sm uppercase tracking-wider py-4 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  start
                </span>
                Begin Assessment
              </div>
            </button>
          </div>
        </div>
        {/* Top Nav Bar */}
        <TopNavBar active="home" variant="landing" />
        {/* Hero Section */}
        <section className="hero-section relative w-full min-h-screen flex items-center justify-center pt-20 pb-32">
          <div className="max-w-4xl mx-auto px-8 w-full relative z-10 flex flex-col items-center text-center gap-8">
            <div
              id="status-badge"
              className="inline-flex items-center gap-3 bg-surface-container-highest px-4 py-2 rounded-xl transition-all duration-500"
            >
              <span id="status-dot" className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
              <span id="status-label" className="font-label text-xs uppercase tracking-widest text-on-surface">
                Checking…
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="font-label text-sm md:text-base uppercase tracking-[0.2em] text-primary">
                AI POWERED MULTI-MODAL DEPRESSION DETECTION SYSTEM
              </h2>
              <h1 className="text-6xl md:text-8xl lg:text-[100px] tracking-tighter leading-[0.9] text-on-surface transition-all duration-500 hover:-translate-y-2 hover:drop-shadow-[0_20px_40px_rgba(142,0,8,0.2)]">
                <span className="amarante-regular uppercase">
                  <i>Mano</i>
                </span>
                <br className="md:hidden" />
                <span className="yatra-one-regular text-[0.85em] md:text-[0.9em]">{' ध्वनि'}</span>
              </h1>
            </div>
            <p className="font-body text-xl md:text-2xl text-on-surface-variant max-w-2xl leading-relaxed">
              Analyzing micro-fluctuations in voice and linguistic patterns to provide objective, clinical-grade mental
              health assessments.
            </p>
            <div className="flex items-center gap-6">
              <button
                id="get-started-btn"
                onClick={() => window.handleGetStarted()}
                className="star-border rounded-sm transition-all duration-300 hover:-translate-y-[2px]"
              >
                <div className="star-border-inner bg-primary rounded-sm text-on-primary font-label text-base uppercase tracking-wider px-10 py-5 flex items-center justify-center gap-3">
                  GET STARTED
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    arrow_forward
                  </span>
                </div>
              </button>
            </div>
          </div>
        </section>
        {/* Precision Metrics Section */}
        <section className="py-32 w-full">
          <div className="max-w-[1920px] mx-auto px-8 w-full">
            <div className="flex items-start gap-8 mb-24">
              <span className="font-label text-sm text-on-surface-variant">01</span>
              <h2
                id="precision-metrics-title"
                className="font-headline text-4xl md:text-6xl font-bold tracking-tight text-on-surface uppercase w-full md:w-auto text-left"
              >
                Precision Metrics
              </h2>
              <div className="h-[1px] bg-outline-variant/20 flex-grow mt-6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-10">
              <div className="metric-card group flex flex-col items-start text-left gap-6 p-10">
                <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center text-primary mb-4 shadow-[0_8px_24px_rgba(142,0,8,0.12)] group-hover:shadow-[0_12px_32px_rgba(142,0,8,0.2)] transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl">graphic_eq</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-on-surface uppercase">Vocal Biomarkers</h3>
                <p className="font-body text-base text-on-surface-variant leading-relaxed">
                  Detecting imperceptible micro-fluctuations, analyzing pitch variance, and measuring speech latency
                  with millisecond precision.
                </p>
                <div className="mt-auto pt-8 flex flex-wrap justify-start gap-2">
                  <span className="bg-surface-container-highest px-3 py-1 rounded-xl font-label text-xs uppercase tracking-wider text-on-surface">
                    Micro-fluctuations
                  </span>
                  <span className="bg-surface-container-highest px-3 py-1 rounded-xl font-label text-xs uppercase tracking-wider text-on-surface">
                    Pitch Variance
                  </span>
                  <span className="bg-surface-container-highest px-3 py-1 rounded-xl font-label text-xs uppercase tracking-wider text-on-surface">
                    Speech Latency
                  </span>
                </div>
              </div>
              <div className="metric-card group flex flex-col items-start text-left gap-6 p-10 lg:-translate-y-8 border border-primary/10">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 shadow-[0_8px_24px_rgba(142,0,8,0.15)] group-hover:shadow-[0_12px_32px_rgba(142,0,8,0.25)] transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-on-surface uppercase">Linguistic Patterns</h3>
                <p className="font-body text-base text-on-surface-variant leading-relaxed">
                  Evaluating complex syntax structures, identifying subtle vocabulary shifts, and tracking specific word
                  frequency indicative of cognitive state.
                </p>
                <div className="mt-auto pt-8 flex flex-wrap justify-start gap-2">
                  <span className="bg-surface-container-highest px-3 py-1 rounded-xl font-label text-xs uppercase tracking-wider text-on-surface">
                    Syntax Analysis
                  </span>
                  <span className="bg-surface-container-highest px-3 py-1 rounded-xl font-label text-xs uppercase tracking-wider text-on-surface">
                    Vocabulary Shifts
                  </span>
                  <span className="bg-surface-container-highest px-3 py-1 rounded-xl font-label text-xs uppercase tracking-wider text-on-surface">
                    Word Frequency
                  </span>
                </div>
              </div>
              <div className="metric-card group flex flex-col items-start text-left gap-6 p-10">
                <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center text-primary mb-4 shadow-[0_8px_24px_rgba(142,0,8,0.12)] group-hover:shadow-[0_12px_32px_rgba(142,0,8,0.2)] transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl">monitor_heart</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-on-surface uppercase">Clinical Assessment</h3>
                <p className="font-body text-base text-on-surface-variant leading-relaxed">
                  Utilizing validated PHQ-9 framework and integrating dual-channel analysis to generate structured
                  clinical reports for healthcare providers.
                </p>
                <div className="mt-auto pt-8 flex flex-wrap justify-start gap-2">
                  <span className="bg-surface-container-highest px-3 py-1 rounded-xl font-label text-xs uppercase tracking-wider text-on-surface">
                    PHQ-9 Framework
                  </span>
                  <span className="bg-surface-container-highest px-3 py-1 rounded-xl font-label text-xs uppercase tracking-wider text-on-surface">
                    Dual-Channel
                  </span>
                  <span className="bg-surface-container-highest px-3 py-1 rounded-xl font-label text-xs uppercase tracking-wider text-on-surface">
                    Clinical Reports
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* /#main-content */} {/* Scramble Text Animation for Precision Metrics */}{' '}
      {/* Firebase Auth: swap login button with profile pic on login */}{' '}
    </>
  );
}

export default memo(LandingPage);
