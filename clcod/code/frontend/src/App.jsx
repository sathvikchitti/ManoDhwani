import { Fragment, useRef } from 'react';
import { createBrowserRouter, Navigate, useLocation, useOutlet } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { attachRouter, installLinkInterception, ROUTES } from './lib/navigation.js';

// Each page is its own chunk, loaded on first visit (like the separate .html files were).
const page = (load) => async () => ({ Component: (await load()).default });

const pages = [
  { path: '/', lazy: page(() => import('./pages/landing/LandingPage.jsx')) },
  { path: '/login', lazy: page(() => import('./pages/login/LoginPage.jsx')) },
  { path: '/user-info', lazy: page(() => import('./pages/user-info/UserInfoPage.jsx')) },
  { path: '/analysis', lazy: page(() => import('./pages/analysis/AnalysisPage.jsx')) },
  { path: '/synthesizing', lazy: page(() => import('./pages/synthesizing/SynthesizingPage.jsx')) },
  { path: '/questionnaire', lazy: page(() => import('./pages/questionnaire/QuestionnairePage.jsx')) },
  { path: '/results', lazy: page(() => import('./pages/results/ResultsPage.jsx')) },
  { path: '/profile', lazy: page(() => import('./pages/profile/ProfilePage.jsx')) },
  { path: '/error', lazy: page(() => import('./pages/error/ErrorPage.jsx')) },
  { path: '/test-star', lazy: page(() => import('./pages/test-star/TestStarPage.jsx')) },
];

// Old URLs such as /analysis.html keep working.
const legacyRedirects = Object.entries(ROUTES).map(([file, to]) => ({
  path: `/${file}`,
  element: <Navigate to={to} replace />,
}));

/**
 * Renders the current page and remounts it on every navigation to it (a fresh "page load"),
 * but not for in-page hash changes such as clicking href="#".
 */
function PageHost() {
  const location = useLocation();
  const outlet = useOutlet();
  const visit = useRef({ path: null, nav: undefined, key: 0 });
  const nav = location.state?.mdNav;
  if (visit.current.path !== location.pathname || (nav !== undefined && nav !== visit.current.nav)) {
    visit.current = { path: location.pathname, nav, key: visit.current.key + 1 };
  }
  return <Fragment key={visit.current.key}>{outlet}</Fragment>;
}

const router = createBrowserRouter([
  {
    element: <PageHost />,
    HydrateFallback: () => null,
    children: [...pages, ...legacyRedirects, { path: '*', element: <Navigate to="/" replace /> }],
  },
]);

attachRouter(router);
installLinkInterception();

// Warm the other pages' chunks once the first page is up, so later navigations don't wait on the network.
window.addEventListener('load', () => setTimeout(() => pages.forEach((p) => p.lazy()), 1000), { once: true });

export default function App() {
  return <RouterProvider router={router} />;
}
