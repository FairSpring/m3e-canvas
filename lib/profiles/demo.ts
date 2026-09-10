import type { AppProfile } from "./types";

/* A second profile, entirely invented, that exists to prove the shape. It fixes
 * some theme axes and not others, brings its own seed rather than a finished
 * scheme, and is written in two of the editor's four languages so the language
 * fallback has something to do. Nothing here describes a real product,
 * organisation or design system. */
export const DEMO: AppProfile = {
  id: "demo",
  label: "Demo Design System",
  icon: "deployed_code",
  /* dark, bothModes, contrast and font are left to the author on purpose */
  theme: { shape: "square", emphasized: true, motion: "expressive" },
  palette: { seed: "#2F6F5E", label: "Demo" },
  context: {
    en: [
      "Follow the Demo Design System: square corners, one accent color, and generous whitespace between sections.",
      "Write every label in sentence case, buttons and headings included.",
    ],
    ja: [
      "Demo Design System に従う。角は直角、アクセントは 1 色、セクション間の余白は広めにとる。",
      "ボタンや見出しを含め、ラベルはすべてセンテンスケースで書く。",
    ],
  },
};
