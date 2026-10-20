// Tailwind config for TestStarPage — identical to the inline `tailwind.config` in test-star.html.
// Each page keeps its own config (the original pages differed, e.g. colours and border radii).

export default {
  content: { relative: true, files: ['./**/*.{js,jsx}', '../../components/**/*.{js,jsx}'] },
  plugins: [],
};
