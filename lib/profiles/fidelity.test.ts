import { describe, expect, it } from "vitest";

import { LANGS, type Lang } from "../i18n";
import { DEFAULT_THEME, type Theme } from "../tokens";
import { BASE, DEMO, NIA, fidelityNote, fidelityOf, provenanceLines } from "./index";
import type { AppProfile } from "./types";

const langs = LANGS.map(({ key }) => key);
const mode = (dark: boolean, bothModes = false): Theme => ({ ...DEFAULT_THEME, dark, bothModes });

/* Not in the registry. Every assertion it passes is a statement that the
 * readers work on profile data alone, with nothing keyed to a known profile. */
const ADHOC: AppProfile = {
  id: "adhoc",
  label: "Ad hoc",
  fidelity: {
    light: { level: "exact" },
    dark: { level: "mixed", note: { en: ["only the dark neutrals are derived here"], ja: ["ダークのニュートラルのみ導出"] } },
  },
};

describe("reading fidelity", () => {
  it.each([BASE, DEMO])("treats a profile that states none as exact ($id)", (profile) => {
    expect(fidelityOf(profile, false)).toBe("exact");
    expect(fidelityOf(profile, true)).toBe("exact");
    for (const lang of langs) {
      expect(fidelityNote(profile, false, lang)).toEqual([]);
      expect(fidelityNote(profile, true, lang)).toEqual([]);
    }
  });

  it("reads each mode separately", () => {
    expect(fidelityOf(NIA, false)).toBe("mixed");
    expect(fidelityOf(NIA, true)).toBe("generated");
  });

  it("gives each mode its own explanation", () => {
    const inLight = fidelityNote(NIA, false, "en");
    const inDark = fidelityNote(NIA, true, "en");
    expect(inLight.length).toBeGreaterThan(0);
    expect(inDark.length).toBeGreaterThan(0);
    expect(inLight).not.toEqual(inDark);
  });

  it("falls back to English for a language a note does not have", () => {
    for (const lang of ["zh", "ko"] as Lang[]) expect(fidelityNote(NIA, true, lang)).toBe(NIA.fidelity?.dark?.note?.en);
    expect(fidelityNote(ADHOC, true, "ja")).toBe(ADHOC.fidelity?.dark?.note?.ja);
  });

  it("works on a profile the registry has never seen", () => {
    expect(fidelityOf(ADHOC, false)).toBe("exact");
    expect(fidelityOf(ADHOC, true)).toBe("mixed");
  });
});

describe("provenance for a coding agent", () => {
  it.each([BASE, DEMO])("says nothing for a profile that states none ($id)", (profile) => {
    for (const lang of langs) {
      expect(provenanceLines(profile, mode(false), lang)).toEqual([]);
      expect(provenanceLines(profile, mode(true), lang)).toEqual([]);
      expect(provenanceLines(profile, mode(false, true), lang)).toEqual([]);
    }
  });

  it("says nothing about a mode that is exact", () => {
    expect(provenanceLines(ADHOC, mode(false), "en")).toEqual([]);
    expect(provenanceLines(ADHOC, mode(true), "en").length).toBeGreaterThan(0);
  });

  it.each(langs)("caveats only the mode the prompt describes, in %s", (lang) => {
    const inLight = provenanceLines(NIA, mode(false), lang);
    const inDark = provenanceLines(NIA, mode(true), lang);
    expect(inLight).not.toEqual(inDark);
    expect(inLight).toEqual(expect.arrayContaining([...fidelityNote(NIA, false, lang)]));
    expect(inDark).toEqual(expect.arrayContaining([...fidelityNote(NIA, true, lang)]));
    /* the light caveat must not leak the dark explanation, or vice versa */
    for (const line of fidelityNote(NIA, true, lang)) expect(inLight).not.toContain(line);
  });

  it.each(langs)("caveats both modes when the design follows the system, in %s", (lang) => {
    const both = provenanceLines(NIA, mode(false, true), lang);
    for (const dark of [false, true]) for (const line of fidelityNote(NIA, dark, lang)) expect(both).toContain(line);
    /* two framings, each led by the mode it belongs to */
    expect(both.length).toBe(fidelityNote(NIA, false, lang).length + fidelityNote(NIA, true, lang).length + 2);
  });

  it("names no profile in its own wording", () => {
    const said = provenanceLines(NIA, mode(false, true), "en").join("\n");
    const framing = said.split("\n").filter((l) => !fidelityNote(NIA, false, "en").includes(l) && !fidelityNote(NIA, true, "en").includes(l));
    for (const line of framing) expect(line.toLowerCase()).not.toContain("android");
  });
});
