import { memo } from 'react';
import { usePageRuntime } from '../../lib/page-runtime.js';
import css from './test-star.css?inline';
import mountTestStarPage from './test-star.controller.js';

// Markup moved from test-star.html <body>.
function TestStarPage() {
  usePageRuntime({
    title: '',
    htmlAttrs: {},
    bodyAttrs: { class: 'bg-gray-900 p-20 flex flex-col gap-5' },
    fonts: [],
    css,
    controller: mountTestStarPage,
  });
  return (
    <>
      <button className="star-border hover:scale-105 transition-transform">
        <div className="star-border-inner bg-black text-white px-8 py-3 font-semibold tracking-wider">
          {' START ANALYSIS '}
        </div>
      </button>
      <a href="#" className="star-border">
        {' '}
        <div className="star-border-inner bg-blue-600 text-white px-6 py-2 rounded-full">{' LOGIN '}</div>{' '}
      </a>
    </>
  );
}

export default memo(TestStarPage);
