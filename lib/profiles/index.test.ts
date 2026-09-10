import { describe, expect, it } from "vitest";

import { schemeFromSeed } from "../color";
import { LANGS, type Lang } from "../i18n";
import { CONTRASTS, DEFAULT_THEME, PALETTES, normalizeTheme, paletteOf, type Contrast, type Palette, type Theme } from "../tokens";
import { BASE, DEFAULT_PROFILE_ID, DEMO, PROFILES, contextLines, paletteFor, profileOf, themeFor } from "./index";
import type { AppProfile } from "./types";

const langs = LANGS.map(({ key }) => key);

/* Every theme a palette can be resolved under: both modes at every contrast. */
const THEMES: Theme[] = [false, true].flatMap((dark) => CONTRASTS.map(({ key }) => ({ ...DEFAULT_THEME, dark, contrast: key as Contrast })));

/* A theme with every axis moved off its default, so an override is visible. */
const AUTHORED: Theme = { dark: true, bothModes: true, contrast: "high", shape: "full", font: "robotoSerif", emphasized: false, motion: "standard" };

const ROLES = Object.keys(paletteOf("purple", null, DEFAULT_THEME)) as (keyof Palette)[];
const COLOR_ROLES = ROLES.filter((role) => role !== "key" && role !== "label");

describe("the registry", () => {
  it("gives every profile a distinct id", () => {
    expect(PROFILES.map((p) => p.id)).toEqual([...new Set(PROFILES.map((p) => p.id))]);
  });

  it("defaults to the base profile", () => {
    expect(profileOf(DEFAULT_PROFILE_ID)).toBe(BASE);
  });

  it("falls back to the base profile when the id is missing or unknown", () => {
    for (const id of [undefined, null, "", "no-such-profile", "BASE"]) expect(profileOf(id)).toBe(BASE);
  });

  it("resolves a profile the registry has never seen, so registering one needs no resolver change", () => {
    const adhoc: AppProfile = { id: "adhoc", label: "Ad hoc", theme: { shape: "square" }, palette: { seed: "#804000" }, context: { en: ["one line"] } };
    expect(themeFor(adhoc, AUTHORED).shape).toBe("square");
    expect(paletteFor(adhoc, { paletteKey: "purple" }, DEFAULT_THEME).key).toBe("adhoc");
    expect(contextLines(adhoc, "ko")).toEqual(["one line"]);
  });
});

describe("the base profile", () => {
  it("resolves the authored theme unchanged", () => {
    for (const theme of [...THEMES, AUTHORED]) expect(themeFor(BASE, theme)).toEqual(normalizeTheme(theme));
  });

  it("normalizes a partial or missing authored theme the way the editor does", () => {
    expect(themeFor(BASE, undefined)).toEqual(DEFAULT_THEME);
    expect(themeFor(BASE, { shape: "square" })).toEqual(normalizeTheme({ shape: "square" }));
  });

  it("resolves every preset exactly as paletteOf does", () => {
    for (const preset of PALETTES)
      for (const theme of THEMES) expect(paletteFor(BASE, { paletteKey: preset.key }, theme)).toEqual(paletteOf(preset.key, null, theme));
  });

  it("resolves the author's own scheme exactly as paletteOf does", () => {
    const custom = schemeFromSeed("#7A5230", "Author");
    for (const theme of THEMES) expect(paletteFor(BASE, { paletteKey: "custom", customPalette: custom }, theme)).toEqual(paletteOf("custom", custom, theme));
  });

  it("contributes no prompt context", () => {
    for (const lang of langs) expect(contextLines(BASE, lang)).toEqual([]);
  });
});

describe("theme resolution", () => {
  it("replaces only the axes a profile configures", () => {
    const resolved = themeFor(DEMO, AUTHORED);
    /* the axes DEMO fixes */
    expect(resolved.shape).toBe("square");
    expect(resolved.emphasized).toBe(true);
    expect(resolved.motion).toBe("expressive");
    /* everything DEMO leaves alone stays as the author left it */
    expect(resolved.dark).toBe(AUTHORED.dark);
    expect(resolved.bothModes).toBe(AUTHORED.bothModes);
    expect(resolved.contrast).toBe(AUTHORED.contrast);
    expect(resolved.font).toBe(AUTHORED.font);
  });

  it("treats an explicitly undefined axis as unconfigured", () => {
    const loose = { id: "loose", label: "Loose", theme: { shape: undefined, font: "system" } } as AppProfile;
    const resolved = themeFor(loose, AUTHORED);
    expect(resolved.shape).toBe(AUTHORED.shape);
    expect(resolved.font).toBe("system");
  });

  it("never mutates the authored theme", () => {
    const authored: Theme = { ...AUTHORED };
    const before = JSON.stringify(authored);
    for (const profile of PROFILES) themeFor(profile, authored);
    expect(JSON.stringify(authored)).toBe(before);
  });

  it("returns a fresh object rather than the authored one", () => {
    const authored: Theme = { ...AUTHORED };
    for (const profile of PROFILES) expect(themeFor(profile, authored)).not.toBe(authored);
  });

  it("restores the authored theme when the base profile is selected again", () => {
    const authored: Theme = { ...AUTHORED };
    themeFor(DEMO, authored);
    expect(themeFor(BASE, authored)).toEqual(normalizeTheme(authored));
  });
});

describe("palette resolution", () => {
  it("builds a complete, valid palette from a seed", () => {
    for (const theme of THEMES) {
      const palette = paletteFor(DEMO, { paletteKey: "purple" }, theme);
      for (const role of ROLES) expect(palette[role], role).toBeDefined();
      for (const role of COLOR_ROLES) expect(String(palette[role]), role).toMatch(/^#[0-9A-F]{6}$/);
      expect(palette.key).toBe(DEMO.id);
      expect(palette.label).toBe("Demo");
    }
  });

  it("ignores the authored scheme once a profile brings its own", () => {
    const mine = paletteFor(DEMO, { paletteKey: "purple" }, DEFAULT_THEME);
    const other = paletteFor(DEMO, { paletteKey: "teal" }, DEFAULT_THEME);
    expect(mine).toEqual(other);
    expect(mine.primary).not.toBe(paletteOf("purple", null, DEFAULT_THEME).primary);
  });

  it("restores the authored scheme when the base profile is selected again", () => {
    const authored = { paletteKey: "teal" } as const;
    paletteFor(DEMO, authored, DEFAULT_THEME);
    expect(paletteFor(BASE, authored, DEFAULT_THEME)).toEqual(paletteOf("teal", null, DEFAULT_THEME));
  });

  it("keeps a role-by-role scheme as authored in light standard, and reseeds it for dark", () => {
    const authored: Palette = { ...schemeFromSeed("#3B5BA5", "Fixed"), key: "fixed" };
    const fixed: AppProfile = { id: "fixed", label: "Fixed", palette: { palette: authored } };
    expect(paletteFor(fixed, { paletteKey: "purple" }, DEFAULT_THEME)).toEqual(authored);
    const dark = paletteFor(fixed, { paletteKey: "purple" }, { ...DEFAULT_THEME, dark: true });
    expect(dark.key).toBe("fixed");
    expect(dark.label).toBe("Fixed");
    expect(dark.surface).not.toBe(authored.surface);
  });

  it("never mutates the authored scheme", () => {
    const custom = schemeFromSeed("#7A5230", "Author");
    const authored = { paletteKey: "custom", customPalette: custom };
    const before = JSON.stringify(authored);
    for (const profile of PROFILES) for (const theme of THEMES) paletteFor(profile, authored, theme);
    expect(JSON.stringify(authored)).toBe(before);
  });
});

describe("prompt context", () => {
  it("uses the language asked for when the profile has it", () => {
    expect(contextLines(DEMO, "en")).toBe(DEMO.context?.en);
    expect(contextLines(DEMO, "ja")).toBe(DEMO.context?.ja);
  });

  it("falls back to English for a language the profile does not define", () => {
    for (const lang of ["zh", "ko"] as Lang[]) expect(contextLines(DEMO, lang)).toBe(DEMO.context?.en);
  });

  it("falls back to a language the profile does define when English is missing", () => {
    const jaOnly = { id: "ja-only", label: "JA only", context: { ja: ["日本語だけ"] } } as AppProfile;
    for (const lang of langs) expect(contextLines(jaOnly, lang)).toEqual(["日本語だけ"]);
  });

  it("returns nothing for a profile with no context, and never undefined", () => {
    const empty = { id: "empty", label: "Empty", context: { en: [] } } as AppProfile;
    for (const lang of langs) {
      expect(contextLines(BASE, lang)).toEqual([]);
      expect(contextLines(empty, lang)).toEqual([]);
    }
  });
});
