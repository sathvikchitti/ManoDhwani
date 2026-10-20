// Tailwind config for ProfilePage — identical to the inline `tailwind.config` in profile.html.
// Each page keeps its own config (the original pages differed, e.g. colours and border radii).
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: { relative: true, files: ['./**/*.{js,jsx}', '../../components/**/*.{js,jsx}'] },
  theme: {
    "extend": {
      "colors": {
        "primary": "#8e0008",
        "primary-container": "#bb000e",
        "on-primary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3f2",
        "surface-container": "#f0eded",
        "surface-container-high": "#eae7e7",
        "surface-container-highest": "#e5e2e1",
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#5d3f3c",
        "outline": "#916f6b",
        "outline-variant": "#e6bdb8",
        "background": "#fcf9f8",
        "surface": "#fcf9f8",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "secondary": "#5652b4"
      },
      "fontFamily": {
        "headline": [
          "Epilogue",
          "sans-serif"
        ],
        "body": [
          "Plus Jakarta Sans",
          "sans-serif"
        ],
        "label": [
          "Space Grotesk",
          "sans-serif"
        ]
      }
    }
  },
  plugins: [forms, containerQueries],
};
