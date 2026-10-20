import { memo } from 'react';
import { usePageRuntime } from '../../lib/page-runtime.js';
import SiteFooter from '../../components/SiteFooter.jsx';
import TopNavBar from '../../components/TopNavBar.jsx';
import UnmanagedInput from '../../components/UnmanagedInput.jsx';
import css from './login.css?inline';
import mountLoginPage from './login.controller.js';

// Markup moved from login.html <body>.
function LoginPage() {
  usePageRuntime({
    title: 'ManoDhwani - Sign In',
    htmlAttrs: { class: 'light', lang: 'en' },
    bodyAttrs: {
      class: 'bg-background text-on-background font-body antialiased min-h-screen flex flex-col bg-fixed-image pt-24',
    },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Amarante&family=Yatra+One&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ],
    css,
    controller: mountLoginPage,
  });
  return (
    <>
      {/* TopNavBar */}
      <TopNavBar />
      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md fade-in">
          {/* Logo mark */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychology
              </span>
            </div>
            <h1 className="font-headline text-3xl font-black tracking-tighter text-on-surface uppercase">
              Welcome to ManoDhwani
            </h1>
            <p className="font-body text-sm text-on-surface-variant mt-2 text-center">
              Sign in to begin your mental health assessment
            </p>
          </div>
          {/* Card */}
          <div className="bg-stone-50/95 backdrop-blur-md shadow-[0_24px_64px_rgba(28,27,27,0.12)] rounded-3xl p-8 border border-white/20">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid #e6bdb8' }}>
              <button className="auth-tab-btn active" id="tab-login" onClick={() => window.switchTab('login')}>
                Login
              </button>
              <button className="auth-tab-btn" id="tab-signup" onClick={() => window.switchTab('signup')}>
                Sign Up
              </button>
            </div>
            {/* Name (signup only) */}
            <div id="auth-name-field" style={{ display: 'none' }}>
              <input className="auth-input" id="auth-name" placeholder="Full Name" type="text" />
            </div>
            <input className="auth-input" id="auth-email" placeholder="Email address" type="email" />
            <div style={{ position: 'relative' }}>
              <UnmanagedInput
                attrs={{
                  class: 'auth-input',
                  id: 'auth-password',
                  placeholder: 'Password',
                  type: 'password',
                  style: 'padding-right:44px;',
                }}
              />{' '}
              <button
                onClick={() => window.togglePwd()}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <svg
                  id="eye-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <div id="auth-confirm-field" style={{ display: 'none' }}>
              <input className="auth-input" id="auth-confirm" placeholder="Confirm Password" type="password" />
            </div>
            {/* Error */}
            <div
              id="auth-error"
              style={{
                display: 'none',
                color: '#ba1a1a',
                fontSize: '13px',
                marginBottom: '10px',
                fontFamily: "'Space Grotesk',sans-serif",
                padding: '10px',
                background: '#ffdad6',
                borderRadius: '6px',
              }}
            />
            {/* Submit */}{' '}
            <button
              id="auth-submit-btn"
              onClick={() => window.handleAuthSubmit()}
              className="star-border rounded-md w-full mb-3"
              style={{ border: 'none' }}
            >
              <div
                className="star-border-inner w-full flex items-center justify-center transition-colors duration-200"
                style={{
                  background: '#8e0008',
                  color: '#fff',
                  padding: '13px',
                  borderRadius: '6px',
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
                onMouseOver={(event) => {
                  event.currentTarget.style.background = '#bb000e';
                }}
                onMouseOut={(event) => {
                  event.currentTarget.style.background = '#8e0008';
                }}
              >
                <span id="auth-submit-txt">Login</span>
              </div>
            </button>{' '}
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
              <div style={{ flex: '1', height: '1px', background: '#e6bdb8' }} />
              <span
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: '11px',
                  color: '#916f6b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                or
              </span>
              <div style={{ flex: '1', height: '1px', background: '#e6bdb8' }} />
            </div>
            {/* Google */}{' '}
            <button
              id="google-btn"
              onClick={() => window.googleSignIn()}
              className="star-border rounded-md w-full"
              style={{ border: 'none' }}
            >
              <div
                className="star-border-inner"
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#f6f3f2',
                  color: '#1c1b1b',
                  border: '1px solid #e6bdb8',
                  borderRadius: '6px',
                  padding: '13px',
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(event) => {
                  event.currentTarget.style.background = '#eae7e7';
                }}
                onMouseOut={(event) => {
                  event.currentTarget.style.background = '#f6f3f2';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </div>
            </button>
            <p className="font-body text-xs text-on-surface-variant text-center mt-5">
              Google sign-in automatically fills your name, photo, and profile details.
            </p>
          </div>
          <p className="text-center font-label text-xs text-on-surface-variant mt-6 uppercase tracking-widest">
            Your data is processed privately and securely.
          </p>
        </div>
      </main>
      {/* Standard Fixed Footer */}
      <SiteFooter variant="standard" />
    </>
  );
}

export default memo(LoginPage);
