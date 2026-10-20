// Tailwind config for AnalysisPage — identical to the inline `tailwind.config` in analysis.html.
// Each page keeps its own config (the original pages differed, e.g. colours and border radii).
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: { relative: true, files: ['./**/*.{js,jsx}', '../../components/**/*.{js,jsx}'] },
  darkMode: "class",
  theme: {
    "extend": {
      "colors": {
        "surface-container-lowest": "#ffffff",
        "surface-container-highest": "#e5e2e1",
        "secondary-container": "#9b98ff",
        "surface-container": "#f0eded",
        "error": "#ba1a1a",
        "on-primary": "#ffffff",
        "on-error": "#ffffff",
        "surface-dim": "#dcd9d9",
        "inverse-on-surface": "#f3f0ef",
        "on-surface-variant": "#5d3f3c",
        "primary": "#8e0008",
        "outline-variant": "#e6bdb8",
        "background": "#fcf9f8",
        "tertiary-container": "#9b4000",
        "secondary": "#5652b4",
        "on-primary-container": "#ffc7c0",
        "on-tertiary": "#ffffff",
        "surface": "#fcf9f8",
        "error-container": "#ffdad6",
        "primary-fixed": "#ffdad5",
        "on-error-container": "#93000a",
        "surface-bright": "#fcf9f8",
        "primary-fixed-dim": "#ffb4aa",
        "outline": "#916f6b",
        "on-secondary": "#ffffff",
        "tertiary": "#752f00",
        "surface-tint": "#bf0611",
        "primary-container": "#bb000e",
        "surface-container-high": "#eae7e7",
        "tertiary-fixed": "#ffdbcb",
        "on-primary-fixed": "#410001",
        "surface-variant": "#e5e2e1",
        "inverse-primary": "#ffb4aa",
        "on-secondary-container": "#30298c",
        "on-tertiary-fixed": "#341100",
        "on-surface": "#1c1b1b",
        "surface-container-low": "#f6f3f2",
        "on-background": "#1c1b1b"
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
