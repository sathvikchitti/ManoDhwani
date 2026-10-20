import { memo } from 'react';
import { usePageRuntime } from '../../lib/page-runtime.js';
import { navigateTo } from '../../lib/navigation.js';
import SiteFooter from '../../components/SiteFooter.jsx';
import TopNavBar from '../../components/TopNavBar.jsx';
import css from './error.css?inline';
import mountErrorPage from './error.controller.js';

// Markup moved from error.html <body>.
function ErrorPage() {
  usePageRuntime({
    title: 'ManoDhwani - Error',
    htmlAttrs: { class: 'dark', lang: 'en' },
    bodyAttrs: {
      class:
        'font-body min-h-screen flex flex-col antialiased bg-black pt-24 selection:bg-primary-container selection:text-on-primary-container',
    },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap',
      'https://fonts.googleapis.com/css2?family=Amarante&family=Yatra+One&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ],
    css,
    controller: mountErrorPage,
  });
  return (
    <>
      {/* TopNavBar */}
      <TopNavBar />
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-10">
          <span className="material-symbols-outlined" style={{ fontSize: '800px', fontVariationSettings: "'FILL' 0" }}>
            warning
          </span>
        </div>
        {/* Glassmorphism Card */}
        <div className="z-10 w-full max-w-2xl bg-[#0a0a0a]/70 backdrop-blur-2xl rounded-xl p-10 md:p-16 flex flex-col items-center text-center shadow-[0_24px_64px_-12px_rgba(187,0,14,0.1)] border border-outline-variant/10">
          {/* Error Icon */}
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
            <span
              className="material-symbols-outlined text-primary text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
          </div>
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Analysis Failed
          </h1>
          <p className="font-body text-lg text-surface-dim max-w-md mb-10 leading-relaxed">
            Could not connect to the backend server. Please ensure the server is running.
          </p>
          {/* Terminal Block */}
          <div className="w-full bg-black/50 rounded-lg p-6 mb-10 border-l-4 border-primary text-left overflow-x-auto font-label text-sm text-surface-dim">
            <div className="flex items-center space-x-2 mb-3 opacity-50">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs uppercase tracking-widest">Error Detail</span>
            </div>
            <p id="error-message" style={{ color: 'rgba(255,255,255,0.8)' }}>
              An unexpected error occurred.
            </p>
          </div>
          {/* Action */}
          <button
            onClick={() => navigateTo('/analysis')}
            className="font-label uppercase tracking-widest text-sm bg-gradient-to-r from-primary to-primary-container text-white px-8 py-4 rounded-lg flex items-center gap-3 hover:translate-y-[-2px] transition-all duration-300 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>
              refresh
            </span>
            Try Again
          </button>
          <a
            onClick={() => navigateTo('/')}
            className="mt-8 font-label text-sm text-surface-dim hover:text-white transition-colors border-b border-transparent hover:border-white pb-1 cursor-pointer"
          >
            {' Return to Home '}
          </a>
        </div>
      </main>
      <SiteFooter variant="error" />
    </>
  );
}

export default memo(ErrorPage);
