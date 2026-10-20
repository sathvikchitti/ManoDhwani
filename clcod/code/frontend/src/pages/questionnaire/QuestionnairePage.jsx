import { memo } from 'react';
import { usePageRuntime } from '../../lib/page-runtime.js';
import { initiallyDisabled } from '../../lib/dom-helpers.js';
import SiteFooter from '../../components/SiteFooter.jsx';
import TopNavBar from '../../components/TopNavBar.jsx';
import css from './questionnaire.css?inline';
import mountQuestionnairePage from './questionnaire.controller.js';

// Markup moved from questionnaire.html <body>.
function QuestionnairePage() {
  usePageRuntime({
    title: 'ManoDhwani | Depression Screening',
    htmlAttrs: { class: 'light', lang: 'en' },
    bodyAttrs: {
      class:
        'text-on-background font-body selection:bg-primary-container selection:text-on-primary min-h-screen relative',
    },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;800;900&family=Plus+Jakarta+Sans:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Amarante&family=Yatra+One&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ],
    css,
    controller: mountQuestionnairePage,
  });
  return (
    <>
      {/* TopNavBar */}
      <TopNavBar active="analysis" />
      {/* Main Content Canvas */}
      <main className="min-h-screen pt-24 pb-48 px-6 max-w-4xl mx-auto flex flex-col relative z-10">
        {/* Progress Section */}
        <section className="mb-12 bg-stone-100/40 p-6 rounded-xl backdrop-blur-sm border border-white/50 shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="font-headline text-4xl md:text-6xl font-black tracking-tighter leading-none mt-1">
                Depression Type Classification
              </h1>
            </div>
            <div className="text-right">
              <span id="q-counter" className="font-label text-sm font-bold text-primary">
                1 / 12
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              id="q-progress-bar"
              className="h-full bg-primary transition-all duration-300"
              style={{ width: '8.3%' }}
            />
          </div>
        </section>
        {/* Risk Alert Banner */}
        <div
          id="questionnaire-banner"
          className="mb-12 p-5 bg-tertiary-fixed/90 backdrop-blur-md border-l-4 border-tertiary-container flex items-center gap-4 shadow-sm"
          style={{ display: 'none' }}
        >
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: '"FILL" 1' }}>
            warning
          </span>
          <p className="font-label text-sm tracking-tight text-on-tertiary-fixed font-bold">
            {'Risk Detected: '}
            <span id="banner-risk" className="text-error" />
            {' Risk · '}
            <span id="banner-confidence" />
            {' probability'}
          </p>
        </div>
        {/* Question Section */}
        <section className="bg-stone-50/90 p-8 md:p-12 rounded-2xl backdrop-blur-md border border-white shadow-xl flex flex-col md:flex-row gap-12 items-start mb-16">
          <div className="w-full md:w-1/2">
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-outline mb-4 block">
              Current Inquiry
            </span>
            <h2
              id="q-question-text"
              className="font-headline text-2xl md:text-3xl font-bold leading-tight tracking-tight"
            >
              Loading question…
            </h2>
          </div>
          <div id="q-options-container" className="w-full md:w-1/2 grid grid-cols-1 gap-3" />
        </section>
      </main>
      {/* Global Fixed Footer */}
      <SiteFooter variant="questionnaire" />
      <div className="fixed bottom-28 left-10 z-[60]">
        <button
          id="q-back-btn"
          onClick={() => window.qPrev()}
          style={{ visibility: 'hidden' }}
          className="hover-float flex items-center gap-3 px-8 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white font-label text-sm uppercase font-bold tracking-[0.2em] rounded-full shadow-2xl transition-all"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span>Back</span>
        </button>
      </div>
      <div className="fixed bottom-28 right-10 z-[60]">
        <button
          id="q-next-btn"
          onClick={() => window.qNext()}
          ref={initiallyDisabled}
          className="star-border rounded-full hover-float transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none shadow-[0_20px_40px_rgba(187,0,14,0.4)]"
        >
          <div className="star-border-inner bg-primary text-on-primary flex items-center gap-4 px-10 py-5 font-label text-sm uppercase font-black tracking-[0.2em] rounded-full">
            <span id="next-btn-text">Next</span>
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </div>
        </button>
      </div>{' '}
      {/* Firebase Auth Guard */}{' '}
    </>
  );
}

export default memo(QuestionnairePage);
