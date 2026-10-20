import { navigateTo } from '../lib/navigation.js';

/**
 * The fixed top navigation bar shared by Landing, Login, User Info, Analysis, Synthesizing,
 * Questionnaire, Results and Error. Markup is identical to the original pages.
 *
 * Page scripts still drive it imperatively by id (#user-badge, #user-avatar, #user-name,
 * #login-signup-btn, #nav-results-link), exactly as before.
 *
 * @param {'home'|'analysis'|'results'} [active]  which pill is highlighted
 * @param {'standard'|'landing'} [variant]        the landing page's copy had no pill ids,
 *                                                alt="Profile" on the avatar and no #auth-section wrapper
 */
export default function TopNavBar({ active, variant = 'standard' }) {
  const landing = variant === 'landing';
  const pill = (key) => (active === key ? 'nav-pill active' : 'nav-pill');

  const loginButton = (
    <a id="login-signup-btn" href="/login" className="star-border rounded-sm transition-all duration-300 hover:-translate-y-[2px]">
      <div className="star-border-inner bg-primary rounded-sm text-on-primary font-label text-sm uppercase tracking-wider px-6 py-3">
        Signup/Login
      </div>
    </a>
  );

  return (
    <nav
      className="bg-stone-100/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 w-full border-b border-stone-200 shadow-sm"
      style={{ zIndex: '50' }}
    >
      <div className="relative flex items-center w-full px-8 py-4 max-w-[1920px] mx-auto">
        <a
          className="text-2xl tracking-tighter text-stone-950 flex-shrink-0 flex items-center gap-1 transition-all duration-300 hover:-translate-y-1 hover:drop-shadow-[0_4px_8px_rgba(142,0,8,0.25)]"
          href="/"
        >
          <span className="amarante-regular font-bold">Mano</span>
          <span className="yatra-one-regular text-primary">{'ध्वनि '}</span>
        </a>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-3">
          <a className={pill('home')} id={landing ? undefined : 'nav-home-link'} href="/">
            HOME
          </a>
          <a className={pill('analysis')} id={landing ? undefined : 'nav-analysis-link'} href="/analysis">
            Analysis
          </a>
          <a className={pill('results')} id={landing ? undefined : 'nav-results-link'} href="/results">
            Result
          </a>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          {/* Profile badge (shown when logged in) */}
          <div id="user-badge" className="hidden items-center gap-3 cursor-pointer" onClick={() => navigateTo('/profile')}>
            <img
              id="user-avatar"
              alt={landing ? 'Profile' : ''}
              className="w-9 h-9 rounded-full border-2 border-primary object-cover"
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.src = 'https://ui-avatars.com/api/?background=bb000e&color=fff&size=64';
              }}
            />
            <span id="user-name" className="font-label text-xs uppercase tracking-widest text-on-surface hidden md:block" />
          </div>
          {/* Login button (shown when logged out) */}
          {landing ? loginButton : <div id="auth-section">{loginButton}</div>}
        </div>
      </div>
    </nav>
  );
}
