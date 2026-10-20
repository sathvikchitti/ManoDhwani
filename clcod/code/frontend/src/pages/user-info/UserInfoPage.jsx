import { memo } from 'react';
import { usePageRuntime } from '../../lib/page-runtime.js';
import SiteFooter from '../../components/SiteFooter.jsx';
import TopNavBar from '../../components/TopNavBar.jsx';
import css from './user-info.css?inline';
import mountUserInfoPage from './user-info.controller.js';

// Markup moved from user-info.html <body>.
function UserInfoPage() {
  usePageRuntime({
    title: 'ManoDhwani - User Info Assessment',
    htmlAttrs: { class: 'light', lang: 'en' },
    bodyAttrs: { class: 'bg-background text-on-background min-h-screen flex flex-col font-body bg-fixed-image pt-24' },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400;0,700;0,900;1,900&family=Plus+Jakarta+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Amarante&family=Yatra+One&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ],
    css,
    controller: mountUserInfoPage,
  });
  return (
    <>
      {/* TopNavBar */}
      <TopNavBar active="analysis" />
      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-start w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="w-full max-w-4xl mb-16 flex flex-col items-start relative pl-12 md:pl-24">
          <span className="absolute top-0 left-0 label-sm text-outline">01</span>
          <h1 className="display-lg text-on-surface mb-6">User Info</h1>
        </div>
        {/* Main Form Card */}
        <div className="w-full max-w-2xl bg-stone-50/95 backdrop-blur-md relative p-8 md:p-12 z-10 shadow-[0_24px_48px_-12px_rgba(28,27,27,0.12)] rounded-2xl border border-white/20">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            {/* Profile Photo Area */}
            <div className="flex flex-col items-center gap-4 flex-shrink-0">
              <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-full bg-surface-container overflow-hidden relative">
                  <img
                    id="profile-img"
                    alt="Subject Placeholder"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    src={'https://ui-avatars.com/api/?background=8e0008&color=fff&name=MD'}
                  />
                  <div className="absolute inset-0 bg-on-surface/10 group-hover:bg-on-surface/0 transition-colors" />
                </div>
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-surface-container-lowest rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#4ade80] rounded-full" />
                </div>
              </div>
              <span className="label-sm hover:text-primary cursor-pointer transition-colors">Profile Ready</span>
            </div>
            {/* Form Fields */}
            <div className="w-full flex flex-col gap-8 flex-grow pt-2">
              <div className="flex flex-col gap-2">
                <label className="label-sm" htmlFor="fullName">
                  Full Name
                </label>
                <div className="relative bg-surface-container-low px-4 py-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                  <input
                    className="bg-transparent border-none p-0 w-full text-on-surface focus:ring-0 body-md placeholder:text-outline/50"
                    id="fullName"
                    placeholder="Enter subject name"
                    type="text"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col gap-2 w-full md:w-1/2">
                  <label className="label-sm" htmlFor="age">
                    Age
                  </label>
                  <div className="relative bg-surface-container-low px-4 py-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
                    <input
                      className="bg-transparent border-none p-0 w-full text-on-surface focus:ring-0 body-md placeholder:text-outline/50"
                      id="age"
                      placeholder="Years"
                      type="number"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-1/2">
                  <label className="label-sm" htmlFor="gender">
                    Gender
                  </label>
                  <div className="relative bg-surface-container-low px-4 py-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">wc</span>
                    <select
                      className="bg-transparent border-none p-0 w-full text-on-surface focus:ring-0 body-md appearance-none"
                      id="gender"
                      defaultValue=""
                    >
                      <option disabled value="">
                        Select
                      </option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 pointer-events-none text-on-surface-variant">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="mt-16 flex items-center justify-end gap-6 pt-8 bg-transparent border-t border-stone-200/50">
            <button
              onClick={() => window.history.back()}
              className="label-md px-6 py-3 border border-outline-variant/20 text-on-background hover:bg-surface-container-low transition-colors rounded-DEFAULT"
            >
              CANCEL
            </button>
            <button
              onClick={() => window.proceedToAssessment()}
              className="star-border rounded-DEFAULT shadow-[0_4px_14px_0_rgba(187,0,14,0.39)] transition-all transform hover:-translate-y-0.5"
              style={{ border: 'none' }}
            >
              <div className="star-border-inner bg-primary text-on-primary label-md px-8 py-3 rounded-DEFAULT flex items-center gap-2 hover:bg-primary-container">
                PROCEED<span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </button>
          </div>
        </div>
      </main>
      <SiteFooter variant="user-info" />
    </>
  );
}

export default memo(UserInfoPage);
