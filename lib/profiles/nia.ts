import { schemeFromSeed } from "../color";
import type { AppProfile } from "./types";

/* A real-world profile, derived from Now in Android.
 *
 *   https://github.com/android/nowinandroid  (Apache License 2.0)
 *   Copyright 2022 The Android Open Source Project
 *   core/designsystem/src/main/kotlin/.../theme/{Color,Theme,Type,Background,Gradient}.kt
 *   read at commit 12f80da6518e161ed16a06a68e71fb8a873576d6
 *
 * Only that project's *default light* scheme is represented. It also ships an
 * authored dark scheme and a second "Android" green scheme; neither is
 * expressible here (see docs/APP_PROFILES.md).
 *
 * AUTHORED vs DERIVED. The nineteen roles listed explicitly below are values
 * that project sets by hand. It sets no value at all for the remaining six —
 * inversePrimary, the four surfaceContainer roles and outlineVariant — leaving
 * them to Compose's own defaults, which come from an unrelated baseline purple.
 * Rather than pass those off as its colors, the spread fills them from this
 * seed with the editor's own generator, so every one of the six is derived and
 * reproducible rather than asserted. keepChroma matches what resolveScheme uses
 * when it regenerates this palette for dark and higher contrast. */

const SEED = "#8B418F"; // the project's Purple40, its light `primary`
const LABEL = "Now in Android";

export const NIA: AppProfile = {
  id: "nia",
  label: LABEL,
  icon: "android",
  /* shape, font, emphasized, motion, dark and contrast are deliberately unset:
     that project supplies no Shapes and no fontFamily, and its bold title
     styles are not the same thing as the M3 Expressive emphasized styles. It
     does follow the system light / dark setting, which `bothModes` says. */
  theme: { bothModes: true },
  palette: {
    palette: {
      ...schemeFromSeed(SEED, LABEL, { keepChroma: true }),
      key: "nia",
      label: LABEL,
      seed: SEED,
      /* --- authored --- */
      primary: "#8B418F", // Purple40
      onPrimary: "#FFFFFF", // White
      primaryContainer: "#FFD6FA", // Purple90
      onPrimaryContainer: "#36003C", // Purple10
      secondary: "#A23F16", // Orange40
      secondaryContainer: "#FFDBCF", // Orange90
      onSecondaryContainer: "#380D00", // Orange10
      tertiaryContainer: "#B8EAFF", // Blue90
      onTertiaryContainer: "#001F28", // Blue10
      surface: "#FCFCFC", // DarkPurpleGray99
      onSurface: "#201A1B", // DarkPurpleGray10
      onSurfaceVariant: "#4D444C", // PurpleGray30
      outline: "#7F747C", // PurpleGray50
      inverseSurface: "#362F30", // DarkPurpleGray20
      inverseOnSurface: "#FAEEEF", // DarkPurpleGray95
      error: "#BA1A1A", // Red40
      onError: "#FFFFFF", // White
      errorContainer: "#FFDAD6", // Red90
      onErrorContainer: "#410002", // Red10
      /* inversePrimary, surfaceContainerLow, surfaceContainer,
         surfaceContainerHigh, surfaceContainerHighest and outlineVariant are
         intentionally absent: the spread above derives them from SEED. */
    },
  },
  /* What the theme and palette cannot carry: the type scale's weights, the
     background's tonal elevation and the decorative gradient, all read from the
     same source files. */
  context: {
    en: [
      "Use Material 3 with the default shape scale and the platform default font; this design system overrides neither.",
      "Set titleLarge (22sp) and titleMedium (18sp) to Bold, and titleSmall, labelLarge, labelMedium and labelSmall to Medium; leave the display, headline and body styles at Normal weight.",
      "Give the app background a tonal elevation of 2dp over the surface color.",
      "Where a screen carries a decorative gradient, run it from inverseOnSurface at the top to primaryContainer at the bottom, over the surface color.",
      "Support both light and dark, following the system setting.",
    ],
  },
  /* Light carries that project's own values for the roles it sets, and derived
     ones for the six it does not. Dark is generated wholesale: it ships an
     authored dark scheme, but nothing here can hold a second palette. */
  fidelity: {
    light: {
      level: "mixed",
      note: {
        en: [
          "Six roles — inversePrimary, the four surfaceContainer roles and outlineVariant — are derived from the primary color, because this design system does not specify them; every other role is its own value.",
        ],
      },
    },
    dark: {
      level: "generated",
      note: {
        en: [
          "The dark palette is generated from this design system's primary color. Its own authored dark scheme is not represented here, so no dark value should be treated as coming from it.",
        ],
      },
    },
  },
};
