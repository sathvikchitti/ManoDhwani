/**
 * The fixed footer. The original pages each carried a slightly different copy of it; every variant is
 * kept here exactly as it was so nothing changes visually. When you redesign, unify them in this file.
 */
const VARIANTS = {
  // login, analysis
  standard: {
    footer: 'bg-stone-100/90 backdrop-blur-lg fixed bottom-0 left-0 right-0 z-50 w-full border-t border-stone-200 shadow-xl',
    team: 'font-headline font-bold text-neutral-900 text-sm tracking-widest',
    link: 'font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors font-bold',
    copy: 'font-label text-[10px] uppercase tracking-widest text-neutral-500 mt-4 md:mt-0',
  },
  questionnaire: {
    footer: 'bg-stone-100/90 backdrop-blur-lg fixed bottom-0 left-0 right-0 z-50 w-full border-t border-stone-200 shadow-xl',
    team: 'font-headline font-bold text-neutral-900 text-sm tracking-widest',
    link: 'font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors font-bold',
    copy: 'font-label text-[10px] uppercase tracking-widest text-neutral-500 mt-4 md:mt-0 text-center md:text-right',
  },
  'user-info': {
    footer: 'bg-stone-100/90 backdrop-blur-md fixed bottom-0 left-0 right-0 z-50 w-full border-t border-stone-200',
    team: 'font-headline font-bold text-stone-950 text-sm tracking-widest',
    link: 'font-label text-[10px] uppercase tracking-widest text-stone-500 hover:text-primary transition-colors font-bold',
    copy: 'font-label text-[10px] uppercase tracking-widest text-stone-400 mt-6 md:mt-0 text-center md:text-right',
  },
  synthesizing: {
    footer: 'bg-white/80 backdrop-blur-lg fixed bottom-0 left-0 right-0 z-50 w-full border-t border-surface-container-high shadow-xl',
    team: 'font-headline font-bold text-neutral-900 text-sm tracking-widest',
    link: 'font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors font-bold',
    copy: 'font-label text-[10px] uppercase tracking-widest text-neutral-500 mt-4 md:mt-0',
    label: 'PS-NEURO',
  },
  results: {
    footer: 'bg-white/70 backdrop-blur-md fixed bottom-0 left-0 right-0 z-50 w-full border-t border-surface-container',
    team: 'font-headline font-bold text-stone-950 text-sm tracking-widest',
    link: 'font-label text-[10px] uppercase tracking-widest text-stone-500 hover:text-primary transition-colors font-bold',
    copy: 'font-label text-[10px] uppercase tracking-widest text-stone-400 mt-4 md:mt-0',
  },
  error: {
    footer: 'bg-black fixed bottom-0 left-0 right-0 z-50 w-full border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]',
    overlay: 'absolute inset-0 bg-black/60 backdrop-blur-lg',
    team: 'font-headline font-bold text-white/90 text-sm tracking-widest',
    link: 'font-label text-[10px] uppercase tracking-widest text-white/40 hover:text-primary transition-colors font-bold',
    copy: 'font-label text-[10px] uppercase tracking-widest text-white/40 mt-4 md:mt-0',
  },
};

export default function SiteFooter({ variant = 'standard' }) {
  const v = VARIANTS[variant];
  return (
    <footer className={v.footer}>
      {v.overlay && <div className={v.overlay} />}
      <div className="relative flex flex-col md:flex-row justify-between items-center px-8 py-6 max-w-[1920px] mx-auto">
        <span className={v.team}>TEAM G-1107</span>
        <div className="flex flex-wrap justify-center gap-6">
          <a className={v.link} href="#">
            {v.label || 'MD-NEURO'}
          </a>
        </div>
        <span className={v.copy}>© 2026 MANODHWANI — CLINICAL AI</span>
      </div>
    </footer>
  );
}
