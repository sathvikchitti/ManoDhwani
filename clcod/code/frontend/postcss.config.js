// Tailwind 3 (same major as the Play CDN the static pages used). Each page CSS file selects its own
// config with `@config "./tailwind.config.js"`, so pages keep their individual Tailwind themes.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
