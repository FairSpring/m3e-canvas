import { afterEach, describe, expect, it } from "vitest";

import { LANGS, setGlobalLang, type Lang } from "./i18n";
import { BASE, DEMO, contextLines, paletteFor, themeFor } from "./profiles";
import { buildPrompt } from "./prompt";
import { BACK_TARGET, defaultTabs, makeItem, type Doc, type Item } from "./tokens";

/* What a profile adds to a prompt, and — more to the point — what it must not
 * add. The rest of the prompt's structure is already covered by prompt.test.ts;
 * these are equivalence checks against that same output, so nothing here has to
 * carry a copy of it. */

const langs = LANGS.map(({ key }) => key);

/* the fixture prompt.test.ts uses, minus its platform pin */
function fixture(profileId?: string): Doc {
  const bar: Item = { ...makeItem("topAppBar"), id: "bar", label: "Home" };
  const save: Item = { ...makeItem("button"), id: "save", label: "Save", action: { to: BACK_TARGET, transition: "fade" } };
  const nav: Item = { ...makeItem("bottomNav"), id: "nav", tabs: defaultTabs() };
  return {
    groups: [
      { id: "g-bar", x: 16, y: 24, axis: "x", items: [bar] },
      { id: "g-nav", x: 16, y: 812, axis: "x", items: [nav] },
      { id: "g-row", x: 16, y: 400, axis: "x", items: [save] },
    ],
    frames: [{ id: "f-home", name: "Home", x: 0, y: 0 }],
    paletteKey: "purple",
    frame: "phone",
    platform: "android",
    title: "Notes",
    brief: "",
    ...(profileId === undefined ? {} : { profileId }),
  };
}

const build = (lang: Lang, profileId?: string) => {
  setGlobalLang(lang);
  return buildPrompt(fixture(profileId), {}, undefined, lang);
};

const headings = (prompt: string) => prompt.split("\n").filter((l) => l.startsWith("## "));
/* A profile changes the color and theme sections too, so its guidance is found
   at the end of the prompt rather than by measuring against the plain one. */
const bullets = (lines: readonly string[]) => lines.map((line) => `- ${line}`).join("\n");

describe("profile context in the prompt", () => {
  afterEach(() => setGlobalLang("ja")); // restore the module default

  it.each(langs)("says exactly what it said before when no profile is named, in %s", (lang) => {
    expect(build(lang, BASE.id)).toBe(build(lang));
  });

  it.each(langs)("falls back to the base profile for an unknown id, in %s", (lang) => {
    expect(build(lang, "a-profile-from-a-later-build")).toBe(build(lang));
  });

  it.each(langs)("adds nothing at all for a profile with no context, in %s", (lang) => {
    /* not just equal output: the base profile must contribute zero lines, so a
       blank line or a lead-in can never creep in ahead of the bullets */
    expect(contextLines(BASE, lang)).toEqual([]);
    expect(build(lang, BASE.id).split("\n").length).toBe(build(lang).split("\n").length);
  });

  /* An equivalence check cannot see a line added to both sides at once, so the
     shape of the ending is pinned directly: the prompt closes on a guidance
     bullet, which a stray blank line or lead-in ahead of the profile's lines
     would break. */
  it.each(langs)("ends on a guidance bullet when the profile is silent, in %s", (lang) => {
    const ls = build(lang).split("\n");
    expect(ls[ls.length - 1]).toMatch(/^- /);
  });

  it("writes a profile's guidance as the last lines of the prompt", () => {
    expect(build("en", DEMO.id).endsWith(`\n${bullets(DEMO.context!.en!)}`)).toBe(true);
  });

  it.each(langs)("writes the guidance in the language it has, falling back to English, in %s", (lang) => {
    expect(build(lang, DEMO.id).endsWith(`\n${bullets(contextLines(DEMO, lang))}`)).toBe(true);
  });

  it.each(["ja", "zh", "ko"] as Lang[])("uses the English guidance where the profile has no %s", (lang) => {
    const expected = DEMO.context?.[lang] ?? DEMO.context!.en!;
    expect(build(lang, DEMO.id).endsWith(`\n${bullets(expected)}`)).toBe(true);
  });

  /* The brief has to describe the design the canvas shows. Before this, it
     described the authored theme and palette while the canvas drew the
     profile's, so the two contradicted each other. */
  it.each([DEMO])("describes $id's own palette rather than the authored one", (profile) => {
    const doc = fixture(profile.id);
    const resolved = paletteFor(profile, { paletteKey: doc.paletteKey }, themeFor(profile, doc.theme));
    const authored = paletteFor(BASE, { paletteKey: doc.paletteKey }, themeFor(BASE, doc.theme));
    const prompt = build("en", profile.id);
    expect(prompt).toContain(resolved.primary);
    expect(resolved.primary).not.toBe(authored.primary); // the fixture would prove nothing otherwise
    expect(prompt).not.toContain(authored.primary);
  });

  it.each(langs)("introduces no section of its own, in %s", (lang) => {
    expect(headings(build(lang, DEMO.id))).toEqual(headings(build(lang)));
  });
});
