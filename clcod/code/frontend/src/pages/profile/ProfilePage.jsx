import { memo } from 'react';
import { usePageRuntime } from '../../lib/page-runtime.js';
import { navigateTo } from '../../lib/navigation.js';
import css from './profile.css?inline';
import mountProfilePage from './profile.controller.js';

// Markup moved from profile.html <body>.
function ProfilePage() {
  usePageRuntime({
    title: 'ManoDhwani - Profile',
    htmlAttrs: { lang: 'en' },
    bodyAttrs: { class: 'antialiased min-h-screen flex' },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Amarante&family=Yatra+One&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ],
    css,
    controller: mountProfilePage,
  });
  return (
    <>
      {/* SideNavBar */}
      <nav className="hidden md:flex bg-white/70 backdrop-blur-xl fixed left-0 top-0 h-full w-64 border-r border-black/10 flex-col p-6 z-40 shadow-xl">
        <div className="mb-8">
          <a
            href="/"
            className="flex items-center gap-1 transition-all duration-300 hover:-translate-y-1 hover:drop-shadow-[0_4px_8px_rgba(142,0,8,0.25)]"
          >
            <span className="amarante-regular font-bold text-2xl tracking-tighter text-stone-950">Mano</span>
            <span className="yatra-one-regular text-primary text-2xl tracking-tighter">{'ध्वनि '}</span>
          </a>
          <p className="font-label text-xs text-gray-600 mt-1 tracking-wider uppercase">Profile</p>
        </div>
        <button
          onClick={() => navigateTo('/analysis')}
          className="w-full bg-[#bb000e] text-white font-label text-sm font-bold uppercase tracking-wider py-3 px-4 rounded-sm hover:bg-primary-container transition-colors mb-8 flex justify-center items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>New Session
        </button>
        <ul className="flex-1 space-y-1 font-body text-sm font-medium">
          <li>
            <a
              href="/"
              className="flex items-center gap-3 text-gray-700 hover:bg-black/5 px-4 py-3 rounded-sm transition-colors hover:translate-x-1 duration-200"
            >
              <span className="material-symbols-outlined">home</span>Home
            </a>
          </li>
          <li>
            <a
              href="/analysis"
              className="flex items-center gap-3 text-gray-700 hover:bg-black/5 px-4 py-3 rounded-sm transition-colors hover:translate-x-1 duration-200"
            >
              <span className="material-symbols-outlined">analytics</span>Analysis
            </a>
          </li>
          <li>
            <a
              href="/results"
              className="flex items-center gap-3 text-gray-700 hover:bg-black/5 px-4 py-3 rounded-sm transition-colors hover:translate-x-1 duration-200"
            >
              <span className="material-symbols-outlined">fact_check</span>Results
            </a>
          </li>
          <li>
            <a href="/profile" className="flex items-center gap-3 bg-[#bb000e] text-white px-4 py-3 rounded-sm">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                person
              </span>
              Profile
            </a>
          </li>
        </ul>
        <div className="mt-auto border-t border-black/10 pt-6 space-y-1">
          <button
            onClick={() => window.firebaseSignOut && window.firebaseSignOut()}
            className="flex items-center gap-3 text-gray-700 hover:text-black px-4 py-2 font-label text-xs uppercase tracking-wider transition-colors w-full text-left"
          >
            <span className="material-symbols-outlined text-sm">logout</span>Sign Out
          </button>
        </div>
      </nav>
      {/* Mobile Top Nav */}
      <nav className="md:hidden bg-white/70 backdrop-blur-xl fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 border-b border-black/10 shadow-md">
        <a
          href="/"
          className="flex items-center gap-1 transition-all duration-300 hover:-translate-y-1 hover:drop-shadow-[0_4px_8px_rgba(142,0,8,0.25)]"
        >
          <span className="amarante-regular font-bold text-2xl tracking-tighter text-stone-950">Mano</span>
          <span className="yatra-one-regular text-primary text-2xl tracking-tighter">{'ध्वनि '}</span>
        </a>
        <div className="flex gap-3">
          <a
            href="/analysis"
            className="font-label text-xs uppercase tracking-wider text-gray-600 hover:text-primary transition-colors"
          >
            Analysis
          </a>
          <a
            href="/results"
            className="font-label text-xs uppercase tracking-wider text-gray-600 hover:text-primary transition-colors"
          >
            Results
          </a>
        </div>
      </nav>
      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-12 px-6 md:px-12 pb-24">
        {/* Loading state */}
        <div id="profile-loading" className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="font-label text-sm uppercase tracking-widest text-gray-500">Loading profile…</p>
        </div>
        {/* Profile content (hidden until loaded) */}
        <div id="profile-content" style={{ display: 'none' }}>
          {/* Header */}
          <header className="mb-12 max-w-5xl">
            <p className="font-label text-primary uppercase tracking-[0.2em] text-sm mb-4">Patient Profile</p>
            <h2
              id="pf-header-name"
              className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-4"
            >
              Loading…
            </h2>
            <p className="font-body text-lg text-gray-600 max-w-2xl leading-relaxed" id="pf-header-desc">
              Behavioral analysis and assessment history.
            </p>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-7xl">
            {/* Left: Identity Card */}
            <aside className="lg:col-span-4 space-y-6">
              {/* ID Card */}
              <div className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-50" />
                <div className="flex items-start gap-6 mb-8 relative z-10">
                  <img
                    id="pf-avatar"
                    src={'https://ui-avatars.com/api/?background=bb000e&color=fff&size=80'}
                    alt="Profile"
                    className="w-20 h-20 object-cover rounded-full border-2 border-primary/30"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.src = 'https://ui-avatars.com/api/?background=bb000e&color=fff&size=80';
                    }}
                  />
                  <div>
                    <h3 id="pf-name" className="font-headline text-2xl font-bold mb-1 text-black">
                      —
                    </h3>
                    <p id="pf-email" className="font-label text-xs text-gray-500 tracking-wider" />
                  </div>
                </div>
                <div className="space-y-5 relative z-10 border-t border-black/10 pt-6">
                  <div>
                    <p className="font-label text-xs text-gray-500 uppercase tracking-widest mb-1">Age</p>
                    <p id="pf-age" className="font-body text-lg text-black">
                      —
                    </p>
                  </div>
                  <div>
                    <p className="font-label text-xs text-gray-500 uppercase tracking-widest mb-1">Gender</p>
                    <p id="pf-gender" className="font-body text-lg text-black">
                      —
                    </p>
                  </div>
                  <div>
                    <p className="font-label text-xs text-gray-500 uppercase tracking-widest mb-1">Total Assessments</p>
                    <p id="pf-total-sessions" className="font-headline text-3xl font-bold text-primary">
                      0
                    </p>
                  </div>
                </div>
              </div>
              {/* Quick Actions */}
              <div className="glass-panel p-6 border border-black/5">
                <h4 className="font-label text-sm uppercase tracking-widest mb-6 border-b border-black/10 pb-4 text-black">
                  Quick Actions
                </h4>
                <ul className="space-y-4">
                  <li>
                    <button
                      onClick={() => navigateTo('/analysis')}
                      className="w-full text-left font-body text-base flex justify-between items-center group text-black"
                    >
                      <span className="group-hover:text-primary transition-colors">New Assessment</span>
                      <span className="material-symbols-outlined text-sm opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        arrow_forward
                      </span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigateTo('/results')}
                      className="w-full text-left font-body text-base flex justify-between items-center group text-black"
                    >
                      <span className="group-hover:text-primary transition-colors">View Latest Result</span>
                      <span className="material-symbols-outlined text-sm opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        arrow_forward
                      </span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => window.firebaseSignOut && window.firebaseSignOut()}
                      className="w-full text-left font-body text-base flex justify-between items-center group"
                    >
                      <span className="text-error font-medium">Sign Out</span>
                      <span className="material-symbols-outlined text-sm text-error">logout</span>
                    </button>
                  </li>
                </ul>
              </div>
            </aside>
            {/* Right: PBS Trend + History */}
            <div className="lg:col-span-8 space-y-10">
              {/* PBS Trend Chart */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-headline text-lg font-bold text-slate-800">
                    ManoDhwani Probability Score Trend Analysis
                  </h3>
                  <div className="flex gap-2">
                    <button className="pf-tab" id="pf-tab-hourly" onClick={() => window.pfSwitchTab('hourly')}>
                      24H
                    </button>
                    <button className="pf-tab active" id="pf-tab-daily" onClick={() => window.pfSwitchTab('daily')}>
                      7D
                    </button>
                    <button className="pf-tab" id="pf-tab-weekly" onClick={() => window.pfSwitchTab('weekly')}>
                      8W
                    </button>
                    <button className="pf-tab" id="pf-tab-monthly" onClick={() => window.pfSwitchTab('monthly')}>
                      12M
                    </button>
                  </div>
                </div>
                <div
                  className="glass-panel border border-black/10 p-6 relative overflow-hidden cursor-pointer"
                  style={{ minHeight: '260px' }}
                  onClick={() => window.openChartModal()}
                  title="Click to expand"
                >
                  <div id="pf-chart-svg" className="w-full" />
                  <div
                    style={{ position: 'absolute', top: '12px', right: '16px', opacity: '0.4', pointerEvents: 'none' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      open_in_full
                    </span>
                  </div>
                </div>
                {/* Risk legend */}
                <div className="flex gap-6 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="font-label text-xs text-gray-500">High (≥62%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-label text-xs text-gray-500">Moderate (52–62%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-label text-xs text-gray-500">{'Low (<52%)'}</span>
                  </div>
                </div>
              </section>
              {/* Session History */}
              <section>
                <div className="flex items-start gap-6 border-t border-black/10 pt-8">
                  <span className="font-label text-xs text-gray-500">02</span>
                  <h3 className="font-headline text-2xl font-bold tracking-tight text-black">Session History</h3>
                </div>
                <div id="pf-history-list" className="mt-6 space-y-3">
                  <div className="flex items-center justify-center py-16 text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-3">🗂️</div>
                      <p className="font-label text-sm uppercase tracking-widest">Loading sessions…</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      {/* Inject app.js logic for profile rendering */}
      {/* Chart Modal Popup */}
      <div
        id="chart-modal"
        style={{
          display: 'none',
          position: 'fixed',
          inset: '0',
          zIndex: '9999',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            background: 'rgba(248,246,245,0.97)',
            borderRadius: '2rem',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.22)',
            maxWidth: '900px',
            width: '100%',
            padding: '32px 32px 24px',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => window.closeChartModal()}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0,0,0,0.06)',
              border: 'none',
              borderRadius: '9999px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.background = 'rgba(0,0,0,0.12)';
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.background = 'rgba(0,0,0,0.06)';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#64748b' }}>
              close
            </span>
          </button>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <h3
              style={{
                fontFamily: "'Epilogue',sans-serif",
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0',
              }}
            >
              ManoDhwani Probability Score Trend Analysis
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="pf-tab" id="modal-tab-hourly" onClick={() => window.pfSwitchModalTab('hourly')}>
                24H
              </button>
              <button className="pf-tab active" id="modal-tab-daily" onClick={() => window.pfSwitchModalTab('daily')}>
                7D
              </button>
              <button className="pf-tab" id="modal-tab-weekly" onClick={() => window.pfSwitchModalTab('weekly')}>
                8W
              </button>
              <button className="pf-tab" id="modal-tab-monthly" onClick={() => window.pfSwitchModalTab('monthly')}>
                12M
              </button>
            </div>
          </div>
          {/* Chart */}
          <div
            style={{
              background: 'rgba(245,245,245,0.7)',
              borderRadius: '1.25rem',
              padding: '20px 16px 8px',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div id="modal-chart-svg" style={{ width: '100%' }} />
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '11px', color: '#64748b' }}>
                High (≥62%)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '11px', color: '#64748b' }}>
                Moderate (52–62%)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '11px', color: '#64748b' }}>
                {'Low (<52%)'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Firebase Auth Guard */}
    </>
  );
}

export default memo(ProfilePage);
