// Tailwind config for SynthesizingPage — identical to the inline `tailwind.config` in synthesizing.html.
// Each page keeps its own config (the original pages differed, e.g. colours and border radii).
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: { relative: true, files: ['./**/*.{js,jsx}', '../../components/**/*.{js,jsx}'] },
  darkMode: "class",
  theme: {
    "extend": {
      "colors": {
        "surface-bright": "#fcf9f8",
        "secondary-container": "#9b98ff",
        "secondary": "#5652b4",
        "on-background": "#1c1b1b",
        "on-surface-variant": "#5d3f3c",
        "on-primary-fixed-variant": "#930008",
        "on-tertiary-container": "#ffc9b0",
        "inverse-surface": "#313030",
        "inverse-on-surface": "#f3f0ef",
        "secondary-fixed": "#e3dfff",
        "on-tertiary-fixed-variant": "#793000",
        "on-error": "#ffffff",
        "surface-container-low": "#f6f3f2",
        "error-container": "#ffdad6",
        "tertiary-fixed": "#ffdbcb",
        "inverse-primary": "#ffb4aa",
        "primary": "#8e0008",
        "on-secondary-fixed-variant": "#3e399a",
        "surface-container-high": "#eae7e7",
        "on-surface": "#1c1b1b",
        "error": "#ba1a1a",
        "surface-dim": "#dcd9d9",
        "tertiary-fixed-dim": "#ffb692",
        "surface-container-highest": "#e5e2e1",
        "primary-fixed-dim": "#ffb4aa",
        "surface-container-lowest": "#ffffff",
        "secondary-fixed-dim": "#c3c0ff",
        "surface": "#fcf9f8",
        "surface-container": "#f0eded",
        "on-primary": "#ffffff",
        "tertiary": "#752f00",
        "on-error-container": "#93000a",
        "on-secondary-container": "#30298c",
        "on-primary-container": "#ffc7c0",
        "primary-fixed": "#ffdad5",
        "on-tertiary": "#ffffff",
        "surface-variant": "#e5e2e1",
        "on-secondary-fixed": "#100069",
        "background": "#05070A",
        "tertiary-container": "#9b4000",
        "primary-container": "#bb000e",
        "on-primary-fixed": "#410001",
        "surface-tint": "#bf0611",
        "on-secondary": "#ffffff",
        "outline": "#916f6b",
        "outline-variant": "#e6bdb8",
        "on-tertiary-fixed": "#341100"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
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
