import { memo } from 'react';
import { usePageRuntime } from '../../lib/page-runtime.js';
import SiteFooter from '../../components/SiteFooter.jsx';
import TopNavBar from '../../components/TopNavBar.jsx';
import css from './synthesizing.css?inline';
import mountSynthesizingPage from './synthesizing.controller.js';

// Markup moved from synthesizing.html <body>.
function SynthesizingPage() {
  usePageRuntime({
    title: 'Processing Result',
    htmlAttrs: { class: 'dark', lang: 'en' },
    bodyAttrs: {
      class: 'bg-background text-white antialiased selection:bg-cyan-500/30 bg-fixed-image pt-24 min-h-screen',
    },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Amarante&family=Yatra+One&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ],
    css,
    controller: mountSynthesizingPage,
  });
  return (
    <>
      {/* Navigation */}
      <TopNavBar active="analysis" />
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida/ADBb0ug7F-DLfs97RhAZEJ2KDkOi3ev9YcBv06cTW3MeD_4aO9NCfgKhr0oONAnia_GvKZ4ANweUP3ClX3W0s5qeEs1k03gAQmE8z_Z10BGPY0A6FSMO7I6rUlEorbM795eBJClAc4_r6TQQybImohVfpX0BvK98nT-YjR9I6XM1gjYRAWL31dEWI_RyT17BsgYxyM4JpWl9prN_M7vYRf7aO7aIRrYPcHPnFQ6fSk55VKTuzVX2Uy0NQiQXh14TDxfA_zTqFIsJa0ty2g')",
          }}
        />
        <div className="absolute inset-0 bg-black/85" />
      </div>
      <main className="relative z-10 flex flex-col items-center justify-center max-w-lg mx-auto p-8 text-center w-full min-h-screen">
        {/* Loading Animation Container */}
        {/* Typography Section */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="mb-8 flex flex-col items-center justify-center gap-6">
            <img
              alt="Neural Interface"
              className="w-48 h-48 md:w-64 md:h-64 object-contain animate-breathing opacity-90"
              src="assets/brain_nbg.png"
            />
            <div className="w-48 h-[2px] bg-white/10 overflow-hidden relative">
              <div id="progress-bar-fill" className="absolute inset-y-0 left-0 bg-primary animate-load-progress" />
            </div>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-[0.2em] uppercase text-primary mb-2 text-center">
            Synthesizing Data
          </h1>
          <p
            id="loading-status"
            className="font-body text-stone-300 text-sm md:text-base leading-relaxed max-w-md mx-auto tracking-wide text-center"
          >
            Aggregating multi-modal biomarkers and computing neural predictions...
          </p>
        </div>
        {/* Progress Indicator (Minimalist) */}
      </main>
      {/* Global Fixed Footer */}
      <SiteFooter variant="synthesizing" /> {/* Firebase Auth Guard */}{' '}
    </>
  );
}

export default memo(SynthesizingPage);
