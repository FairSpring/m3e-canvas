import { schemeFromSeed } from "../color";
import { LANGS, type Lang } from "../i18n";
import { normalizeTheme, paletteOf, type Palette, type Theme } from "../tokens";
import { BASE } from "./base";
import { DEMO } from "./demo";
import type { AppProfile, ProfilePalette } from "./types";

export type { AppProfile, ProfileContext, ProfilePalette } from "./types";
export { BASE } from "./base";
export { DEMO } from "./demo";

/** Every profile the editor knows. Registering one is a data change: none of
 *  the resolvers below branch on a profile's identity, so this array is the
 *  only place a new profile has to appear. */
export const PROFILES: readonly AppProfile[] = [BASE, DEMO];

/** the profile used when a document names none, or names one that is gone */
export const DEFAULT_PROFILE_ID = BASE.id;

/** What the author made, which a profile resolves over rather than replaces. */
export type AuthoredScheme = {
  readonly paletteKey: string;
  readonly customPalette?: Palette | null;
};

/** the profile with this id, or BASE when the id is missing or unknown */
export function profileOf(id: string | null | undefined): AppProfile {
  return PROFILES.find((profile) => profile.id === id) ?? BASE;
}

/** the entries whose value is actually set, so an explicit `undefined` in a
 *  profile reads as "not configured" rather than clearing the author's value */
const configured = <T extends object>(value: T): Partial<T> =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;

/** The theme to render with: the author's, with only the axes this profile
 *  fixes replaced. `authored` is read, never written, and the result is always
 *  a fresh object, so switching profiles cannot disturb the authored state. */
export function themeFor(profile: AppProfile, authored: Partial<Theme> | undefined): Theme {
  const base = normalizeTheme(authored);
  if (!profile.theme) return base;
  return normalizeTheme({ ...base, ...configured(profile.theme) });
}

/** paletteOf's own tail, for a scheme the registry supplied rather than one
 *  tokens.ts can look up by key. A light standard scheme is used as authored;
 *  dark and higher-contrast variants are generated from the same seed.
 *
 *  This mirrors paletteOf (lib/tokens.ts) on purpose: paletteOf honours a
 *  supplied palette only under the key "custom", and silently falls back to the
 *  first preset for any other key, which would discard a profile's scheme.
 *  Keep the two in step. */
function resolveScheme(base: Palette, theme: Theme, keepChroma: boolean): Palette {
  if (!theme.dark && theme.contrast === "standard") {
    /* a scheme authored before the secondary role existed still gets one */
    return base.secondary ? base : { ...base, secondary: schemeFromSeed(base.seed ?? base.primary).secondary };
  }
  return {
    ...schemeFromSeed(base.seed ?? base.primary, base.label, { dark: theme.dark, contrast: theme.contrast, keepChroma }),
    key: base.key,
    label: base.label,
  };
}

/** a profile's own scheme as a complete palette, before the theme is applied */
function baseSchemeOf(profile: AppProfile, spec: ProfilePalette): { base: Palette; keepChroma: boolean } {
  /* a scheme authored role by role is deliberate, like a preset: its hues and
   * its chroma are kept. A seed is treated the way an author's own seed is,
   * where a muted color is lifted far enough to work as an accent. */
  if ("palette" in spec) return { base: spec.palette, keepChroma: true };
  const label = spec.label ?? profile.label;
  return { base: { ...schemeFromSeed(spec.seed, label), key: spec.key ?? profile.id }, keepChroma: false };
}

/** The palette to render with: the profile's scheme when it has one, otherwise
 *  the author's, resolved exactly as the editor resolves it today. */
export function paletteFor(profile: AppProfile, authored: AuthoredScheme, theme: Theme): Palette {
  if (!profile.palette) return paletteOf(authored.paletteKey, authored.customPalette, theme);
  const { base, keepChroma } = baseSchemeOf(profile, profile.palette);
  return resolveScheme(base, theme, keepChroma);
}

/** The prompt lines this profile contributes in `lang`: its own, else English,
 *  else the first language it does define, else none. A profile is not required
 *  to be written in every language the editor speaks. */
export function contextLines(profile: AppProfile, lang: Lang): readonly string[] {
  const context = profile.context;
  if (!context) return [];
  for (const candidate of [lang, "en" as Lang, ...LANGS.map((l) => l.key)]) {
    const lines = context[candidate];
    if (lines && lines.length > 0) return lines;
  }
  return [];
}
