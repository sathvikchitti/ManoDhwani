// Tailwind config for QuestionnairePage — identical to the inline `tailwind.config` in questionnaire.html.
// Each page keeps its own config (the original pages differed, e.g. colours and border radii).
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: { relative: true, files: ['./**/*.{js,jsx}', '../../components/**/*.{js,jsx}'] },
  darkMode: "class",
  theme: {
    "extend": {
      "colors": {
        "inverse-on-surface": "#f3f0ef",
        "tertiary-fixed-dim": "#ffb692",
        "on-error-container": "#93000a",
        "secondary-fixed": "#e3dfff",
        "primary-container": "#bb000e",
        "secondary-container": "#9b98ff",
        "tertiary-fixed": "#ffdbcb",
        "primary-fixed-dim": "#ffb4aa",
        "error-container": "#ffdad6",
        "error": "#ba1a1a",
        "surface-tint": "#bf0611",
        "on-secondary-container": "#30298c",
        "on-secondary-fixed-variant": "#3e399a",
        "surface-container-low": "#f6f3f2",
        "surface-container": "#f0eded",
        "on-primary": "#ffffff",
        "on-tertiary-container": "#ffc9b0",
        "on-secondary-fixed": "#100069",
        "tertiary-container": "#9b4000",
        "on-secondary": "#ffffff",
        "primary-fixed": "#ffdad5",
        "outline-variant": "#e6bdb8",
        "surface-container-high": "#eae7e7",
        "on-tertiary-fixed": "#341100",
        "surface-container-lowest": "#ffffff",
        "on-tertiary": "#ffffff",
        "secondary": "#5652b4",
        "on-primary-fixed": "#410001",
        "on-surface-variant": "#5d3f3c",
        "surface-bright": "#fcf9f8",
        "background": "#fcf9f8",
        "outline": "#916f6b",
        "inverse-primary": "#ffb4aa",
        "surface-variant": "#e5e2e1",
        "on-primary-fixed-variant": "#930008",
        "surface-container-highest": "#e5e2e1",
        "on-surface": "#1c1b1b",
        "on-primary-container": "#ffc7c0",
        "on-error": "#ffffff",
        "on-background": "#1c1b1b",
        "tertiary": "#752f00",
        "on-tertiary-fixed-variant": "#793000",
        "surface-dim": "#dcd9d9",
        "inverse-surface": "#313030",
        "secondary-fixed-dim": "#c3c0ff",
        "primary": "#8e0008",
        "surface": "#fcf9f8"
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
        ]
      }
    }
  },
  plugins: [forms, containerQueries],
};
