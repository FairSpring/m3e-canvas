import { describe, expect, it } from "vitest";

import { schemeFromSeed } from "../color";
import { DEFAULT_THEME, type Palette, type Theme } from "../tokens";
import { NIA, PROFILES, contextLines, paletteFor, profileOf, themeFor } from "./index";

/* The nineteen roles Now in Android sets by hand, restated here so a typo in
 * the profile is caught rather than copied. Source: that project's
 * LightDefaultColorScheme (Apache-2.0); see nia.ts for the full attribution. */
const AUTHORED: Partial<Palette> = {
  primary: "#8B418F",
  onPrimary: "#FFFFFF",
  primaryContainer: "#FFD6FA",
  onPrimaryContainer: "#36003C",
  secondary: "#A23F16",
  secondaryContainer: "#FFDBCF",
  onSecondaryContainer: "#380D00",
  tertiaryContainer: "#B8EAFF",
  onTertiaryContainer: "#001F28",
  surface: "#FCFCFC",
  onSurface: "#201A1B",
  onSurfaceVariant: "#4D444C",
  outline: "#7F747C",
  inverseSurface: "#362F30",
  inverseOnSurface: "#FAEEEF",
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",
};

/* The six that project does not set, which the profile derives from its seed. */
const DERIVED = ["inversePrimary", "surfaceContainerLow", "surfaceContainer", "surfaceContainerHigh", "surfaceContainerHighest", "outlineVariant"] as const;

const authoredScheme = { paletteKey: "purple" } as const;
const light = () => paletteFor(NIA, authoredScheme, DEFAULT_THEME);

describe("the Now in Android profile", () => {
  it("is reachable through the registry by id", () => {
    expect(PROFILES).toContain(NIA);
    expect(profileOf("nia")).toBe(NIA);
  });

  it("renders every authored role exactly, in light standard", () => {
    /* also pins the spread order: were the generator spread applied last, it
       would overwrite all nineteen of these */
    expect(light()).toMatchObject(AUTHORED);
  });

  it("derives the six roles that project leaves unset", () => {
    const generated = schemeFromSeed("#8B418F", "Now in Android", { keepChroma: true });
    const resolved = light();
    for (const role of DERIVED) expect(resolved[role], role).toBe(generated[role]);
  });

  it("accounts for every role: each is authored or derived, none invented", () => {
    const resolved = light();
    const roles = (Object.keys(resolved) as (keyof Palette)[]).filter((r) => r !== "key" && r !== "label" && r !== "seed");
    for (const role of roles) expect(role in AUTHORED || (DERIVED as readonly string[]).includes(role), role).toBe(true);
    expect(Object.keys(AUTHORED).length + DERIVED.length).toBe(roles.length);
  });

  it("ignores the authored scheme, and keeps its own identity", () => {
    expect(paletteFor(NIA, { paletteKey: "teal" }, DEFAULT_THEME)).toEqual(light());
    expect(light().key).toBe("nia");
  });

  it("fixes only the light / dark axis, leaving the rest to the author", () => {
    const authored: Theme = { ...DEFAULT_THEME, shape: "full", font: "robotoSerif", contrast: "high", emphasized: true, motion: "expressive" };
    const resolved = themeFor(NIA, authored);
    expect(resolved.bothModes).toBe(true);
    expect(resolved).toMatchObject({ shape: "full", font: "robotoSerif", contrast: "high", emphasized: true, motion: "expressive" });
  });

  it("contributes prompt guidance, in English for every language it lacks", () => {
    expect(contextLines(NIA, "en").length).toBeGreaterThan(0);
    for (const lang of ["ja", "zh", "ko"] as const) expect(contextLines(NIA, lang)).toBe(NIA.context?.en);
  });
});
