// Tailwind config for UserInfoPage — identical to the inline `tailwind.config` in user-info.html.
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
        "on-secondary-fixed-variant": "#3e399a",
        "surface-container-high": "#eae7e7",
        "tertiary-container": "#9b4000",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#e5e2e1",
        "secondary": "#5652b4",
        "error-container": "#ffdad6",
        "outline-variant": "#e6bdb8",
        "on-secondary-fixed": "#100069",
        "background": "#fcf9f8",
        "outline": "#916f6b",
        "on-tertiary-fixed-variant": "#793000",
        "on-surface-variant": "#5d3f3c",
        "on-error": "#ffffff",
        "secondary-fixed": "#e3dfff",
        "primary": "#8e0008",
        "on-tertiary-fixed": "#341100",
        "secondary-container": "#9b98ff",
        "error": "#ba1a1a",
        "surface-container": "#f0eded",
        "surface-tint": "#bf0611",
        "surface-dim": "#dcd9d9",
        "on-primary-fixed-variant": "#930008",
        "on-tertiary": "#ffffff",
        "primary-fixed": "#ffdad5",
        "on-primary": "#ffffff",
        "on-surface": "#1c1b1b",
        "on-error-container": "#93000a",
        "on-tertiary-container": "#ffc9b0",
        "on-secondary-container": "#30298c",
        "tertiary-fixed": "#ffdbcb",
        "inverse-on-surface": "#f3f0ef",
        "on-primary-fixed": "#410001",
        "surface-container-low": "#f6f3f2",
        "primary-container": "#bb000e",
        "surface-container-highest": "#e5e2e1",
        "on-secondary": "#ffffff",
        "inverse-primary": "#ffb4aa",
        "primary-fixed-dim": "#ffb4aa",
        "surface": "#fcf9f8",
        "secondary-fixed-dim": "#c3c0ff",
        "on-background": "#1c1b1b",
        "inverse-surface": "#313030",
        "tertiary-fixed-dim": "#ffb692",
        "tertiary": "#752f00",
        "on-primary-container": "#ffc7c0"
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
