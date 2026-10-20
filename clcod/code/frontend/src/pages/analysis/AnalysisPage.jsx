import { memo } from 'react';
import { usePageRuntime } from '../../lib/page-runtime.js';
import { initiallyDisabled } from '../../lib/dom-helpers.js';
import SiteFooter from '../../components/SiteFooter.jsx';
import TopNavBar from '../../components/TopNavBar.jsx';
import css from './analysis.css?inline';
import mountAnalysisPage from './analysis.controller.js';

// Markup moved from analysis.html <body>.
function AnalysisPage() {
  usePageRuntime({
    title: 'ManoDhwani - Assessment',
    htmlAttrs: { class: 'light', lang: 'en' },
    bodyAttrs: { class: 'text-on-background font-body antialiased min-h-screen' },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Amarante&family=Yatra+One&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ],
    css,
    controller: mountAnalysisPage,
  });
  return (
    <>
      {/* ══════════════════════════════════════════
     PAGE: ASSESSMENT — new stitch design
     ════════════════════════════════════════════ */}{' '}
      <div id="page-assessment" className="page active min-h-screen bg-fixed-image flex flex-col pt-24 pb-32">
        {' '}
        {/* ═══ USER INFO MODAL ═══ */}{' '}
        <div id="user-info-modal">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="modal-glass relative w-full max-w-md mx-4 p-8 flex flex-col gap-6">
            <div className="flex items-center gap-4 mb-2">
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
              id="modal-autofill-banner"
              className="hidden items-center gap-2 bg-green-500/10 border border-green-400/30 rounded-lg px-4 py-2.5"
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
                <input id="modal-name" type="text" className="modal-input" placeholder="Enter your full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label text-[11px] uppercase tracking-widest text-white/60">Age</label>
                  <input
                    id="modal-age"
                    type="number"
                    min="10"
                    max="100"
                    className="modal-input"
                    placeholder="e.g. 25"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label text-[11px] uppercase tracking-widest text-white/60">Gender</label>
                  <select id="modal-gender" className="modal-input" defaultValue="">
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
            <p id="modal-error" className="hidden font-label text-xs text-red-400 font-semibold">
              Please enter your full name to continue.
            </p>
            <button
              onClick={() => window.submitUserInfoModal()}
              className="star-border rounded-xl hover-float mt-2 shadow-[0_4px_20px_rgba(187,0,14,0.4)] w-full"
            >
              <div className="star-border-inner bg-primary rounded-xl text-white font-label font-bold text-sm uppercase tracking-wider py-4 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  start
                </span>
                Begin Assessment
              </div>
            </button>
          </div>
        </div>{' '}
        {/* TopNavBar */} <TopNavBar active="analysis" />{' '}
        <main className="flex-grow w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-10 relative z-10">
          {/* Step indicator */}
          <div className="flex items-center gap-4 py-4 w-full max-w-3xl">
            <div className="flex items-center gap-3 opacity-60">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="font-label text-sm text-white uppercase tracking-widest font-semibold">
                Step 1: Info
              </span>
            </div>
            <div className="flex-grow h-[1px] bg-white/30 max-w-[4rem]" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span className="font-headline font-bold text-white tracking-tight text-lg">Assessment</span>
            </div>
            <div className="flex-grow h-[1px] bg-white/20 max-w-[4rem]" />
            <div className="flex items-center gap-3 opacity-40">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="font-label text-sm text-white uppercase tracking-widest font-medium">Results</span>
            </div>
          </div>
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left: Text Expression */}
            <div className="lg:col-span-7 flex flex-col h-full">
              <div className="bg-stone-50/95 shadow-[0px_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-sm rounded-[2rem] p-8 lg:p-10 flex flex-col h-[600px] overflow-hidden border border-white/20">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-surface rounded-2xl">
                      <span
                        className="material-symbols-outlined text-primary text-2xl"
                        style={{ fontVariationSettings: "'wght' 300" }}
                      >
                        description
                      </span>
                    </div>
                    <h2 className="font-headline text-2xl lg:text-3xl text-on-surface font-semibold tracking-tighter">
                      Text Expression
                    </h2>
                  </div>
                  <div
                    id="char-count"
                    className="font-label text-xs font-semibold bg-surface-container text-on-surface-variant px-4 py-2 rounded-full tracking-wider"
                  >
                    0 / 2000
                  </div>
                </div>
                <div className="flex-grow relative">
                  <textarea
                    id="text-input"
                    maxLength="2000"
                    className="w-full h-full bg-surface/50 border border-outline-variant/20 focus:border-primary focus:bg-surface focus:ring-0 rounded-2xl p-6 lg:p-8 font-body text-lg text-on-surface placeholder:text-on-surface-variant/40 resize-none transition-all duration-300"
                    placeholder="Describe how you've been feeling lately… Share your thoughts, emotions, and any concerns you have."
                  />
                </div>
              </div>
            </div>
            {/* Right: Audio + Continue */}
            <div className="lg:col-span-5 flex flex-col gap-10">
              {/* Audio Card */}
              <div className="bg-stone-50/95 shadow-[0px_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-sm rounded-[2rem] p-8 lg:p-10 relative overflow-hidden border border-white/20">
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="p-3 bg-surface rounded-2xl">
                    <span
                      className="material-symbols-outlined text-primary text-2xl"
                      style={{ fontVariationSettings: "'wght' 300" }}
                    >
                      mic_external_on
                    </span>
                  </div>
                  <h2 className="font-headline text-2xl text-on-surface font-semibold tracking-tighter">
                    Audio Biomarkers
                  </h2>
                </div>
                {/* Audio Display */}
                <div
                  id="audio-display"
                  className="bg-surface-container-highest/40 backdrop-blur-md rounded-[1.5rem] p-8 flex flex-col items-center justify-center text-center gap-4 mb-8 border border-surface min-h-[160px] relative"
                >
                  <div className="w-24 h-24 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-[0px_20px_40px_rgba(40,20,43,0.04)] mb-2 relative">
                    <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
                    <span
                      className="material-symbols-outlined text-primary text-4xl"
                      style={{ fontVariationSettings: "'FILL' 1,'wght' 300" }}
                    >
                      mic
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl text-on-surface tracking-tight">Mic Ready</h3>
                    <p className="text-sm text-on-surface-variant font-body mt-2">Click record or upload a file</p>
                  </div>
                </div>
                {/* Audio Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    id="record-btn"
                    onClick={() => window.toggleRecording()}
                    className="star-border rounded-full hover:opacity-90 transition-all duration-300 w-full disabled:cursor-not-allowed"
                  >
                    <div className="star-border-inner bg-gradient-to-br from-primary to-primary-container rounded-full text-on-primary py-4 px-6 font-label font-semibold tracking-wide flex items-center justify-center gap-3">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        fiber_manual_record
                      </span>
                      Start Recording
                    </div>
                  </button>
                  <label className="w-full bg-surface-container text-on-surface rounded-full py-4 px-6 font-label font-semibold tracking-wide flex items-center justify-center gap-3 hover:bg-surface-container-high cursor-pointer transition-all duration-300 text-sm">
                    <span className="material-symbols-outlined text-primary">upload_file</span>Upload Audio File
                    <input
                      type="file"
                      accept="audio/*"
                      id="audio-upload-input"
                      className="hidden"
                      onChange={(event) => window.handleAudioUpload(event)}
                    />
                  </label>
                  <button
                    id="remove-audio-btn"
                    onClick={() => window.removeAudio()}
                    style={{ display: 'none' }}
                    className="w-full text-error font-label text-xs uppercase tracking-widest py-2 hover:underline transition-all"
                  >
                    ✕ Remove Audio
                  </button>
                </div>
              </div>
              {/* Recording Instructions */}
              <div className="bg-stone-50/95 shadow-[0px_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-sm rounded-[2rem] p-8 lg:p-10 border border-white/20">
                <div
                  className="flex justify-between items-center cursor-pointer group mb-6"
                  onClick={() => window.toggleVoiceInstructions()}
                >
                  <h3 className="font-headline font-bold text-xl text-on-surface tracking-tight group-hover:text-primary transition-colors">
                    Recording Instructions
                  </h3>
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center group-hover:bg-surface-container-highest transition-colors">
                    <span className="material-symbols-outlined text-primary">expand_less</span>
                  </div>
                </div>
                <div id="voice-instructions-body">
                  <h4 className="font-bold text-on-surface mb-4 font-body">What to Talk About:</h4>
                  <ul className="space-y-3 font-body text-on-surface-variant mb-6">
                    <li className="flex items-start gap-3">
                      <span
                        className="material-symbols-outlined text-primary/50 text-sm mt-1"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        circle
                      </span>
                      <span>Your current energy levels</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span
                        className="material-symbols-outlined text-primary/50 text-sm mt-1"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        circle
                      </span>
                      <span>Recent sleep patterns</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span
                        className="material-symbols-outlined text-primary/50 text-sm mt-1"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        circle
                      </span>
                      <span>General mood throughout the week</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span
                        className="material-symbols-outlined text-primary/50 text-sm mt-1"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        circle
                      </span>
                      <span>Any stressors or anxieties</span>
                    </li>
                  </ul>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-lowest p-4 rounded-2xl">
                      <h5 className="font-bold text-primary flex items-center gap-2 mb-2 text-sm">
                        <span
                          className="material-symbols-outlined text-base"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                        Do
                      </h5>
                      <ul className="text-on-surface-variant text-sm space-y-1">
                        <li>Speak naturally</li>
                        <li>Find a quiet space</li>
                      </ul>
                    </div>
                    <div className="bg-surface-container-lowest p-4 rounded-2xl">
                      <h5 className="font-bold text-error flex items-center gap-2 mb-2 text-sm">
                        <span
                          className="material-symbols-outlined text-base"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          cancel
                        </span>
                        Don't
                      </h5>
                      <ul className="text-on-surface-variant text-sm space-y-1">
                        <li>Read from a script</li>
                        <li>Have loud background</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>{' '}
        {/* Floating Action Buttons (Above Footer) */}{' '}
        <div className="fixed bottom-28 left-10 z-[60]">
          <a
            href="/user-info"
            className="hover-float inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-label text-sm uppercase tracking-widest font-semibold"
          >
            <span className="material-symbols-outlined">arrow_back</span>Back
          </a>
        </div>{' '}
        <div className="fixed bottom-28 right-10 z-[60]">
          <button
            id="assess-continue-btn"
            onClick={() => window.runInitialAnalysis()}
            ref={initiallyDisabled}
            className="star-border rounded-full hover-float transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xl shadow-primary/40"
          >
            <div className="star-border-inner bg-gradient-to-br from-primary to-primary-container rounded-full text-on-primary px-10 py-5 flex items-center gap-3 font-label text-sm uppercase tracking-widest font-bold">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                analytics
              </span>
              Run Analysis
            </div>
          </button>
        </div>{' '}
        {/* Standard Fixed Footer */} <SiteFooter variant="standard" />{' '}
      </div>{' '}
      {/* ══════════════════════════════════════════
     REMOVED: Synthesizing, Questionnaire, Error
     pages are now separate files:
       synthesizing.html
       questionnaire.html
     ════════════════════════════════════════════ */}{' '}
      {/* ═══════════════════════════════════════ ALL JS ══════════════════════════ */}{' '}
      {/* Firebase Auth Guard + Auto-prefill */}{' '}
    </>
  );
}

export default memo(AnalysisPage);
