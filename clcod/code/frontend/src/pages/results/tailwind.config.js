// Tailwind config for ResultsPage — identical to the inline `tailwind.config` in results.html.
// Each page keeps its own config (the original pages differed, e.g. colours and border radii).
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: { relative: true, files: ['./**/*.{js,jsx}', '../../components/**/*.{js,jsx}'] },
  darkMode: "class",
  theme: {
    "extend": {
      "colors": {
        "error": "#ba1a1a",
        "on-primary": "#ffffff",
        "on-error": "#ffffff",
        "on-surface-variant": "#5d3f3c",
        "primary": "#8e0008",
        "outline-variant": "#e6bdb8",
        "background": "#fcf9f8",
        "on-primary-container": "#ffc7c0",
        "on-tertiary": "#ffffff",
        "surface": "#fcf9f8",
        "error-container": "#ffdad6",
        "primary-fixed": "#ffdad5",
        "primary-container": "#bb000e",
        "surface-container-high": "#eae7e7",
        "tertiary-fixed": "#ffdbcb",
        "on-primary-fixed": "#410001",
        "surface-variant": "#e5e2e1",
        "inverse-primary": "#ffb4aa",
        "on-surface": "#1c1b1b",
        "surface-container-low": "#f6f3f2",
        "surface-container": "#f0eded",
        "surface-container-lowest": "#ffffff",
        "surface-container-highest": "#e5e2e1",
        "on-background": "#1c1b1b",
        "outline": "#916f6b",
        "secondary": "#5652b4"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "fontFamily": {
        "headline": [
          "Epilogue"
        ],
        "body": [
          "Plus Jakarta Sans"
        ],
        "label": [
          "Space Grotesk"
        ],
        "display": "Epilogue"
      }
    }
  },
  plugins: [forms, containerQueries],
};
