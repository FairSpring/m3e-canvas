import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* The "@/" specifier is a bundler alias the test runner does not resolve, and
 * the menu's chrome is not what is under test here, so both are stood in for
 * the way the other component tests do it. */
vi.mock("@/lib/profiles", () => import("../lib/profiles"));
vi.mock("@/lib/tokens", () => import("../lib/tokens"));
vi.mock("./Menus", () => ({ Popover: "popover" }));
vi.mock("./M3Node", () => ({ Icon: "icon" }));
/* The menu reads the mode from the resolved theme in context; standing in for
   those two hooks is what lets it be called as a plain function here. */
const ui = vi.hoisted(() => ({ dark: false }));
vi.mock("@/lib/i18n", () => ({ useLang: () => "en" }));
vi.mock("@/lib/theme", () => ({ useTheme: () => ({ dark: ui.dark }) }));

const { BASE, DEMO, NIA, PROFILES } = await import("../lib/profiles");
const { DEFAULT_THEME, paletteOf } = await import("../lib/tokens");
const { ProfileMenu } = await import("./ProfileMenu");

/* ProfileMenu uses no hooks: it returns a Popover whose only child is a render
 * prop. Calling that render prop gives the menu's element tree directly, with
 * no React runtime and no DOM involved. */

const p = paletteOf("purple", null, DEFAULT_THEME);

type Row = ReactElement<{ "aria-checked": boolean; onClick: () => void }>;
type Note = ReactElement<{ "data-fidelity": string; children: unknown }> | false;
type Menu = ReactElement<{ children: (close: () => void) => ReactElement<{ children: [Row[], Note] }> }>;

function open(profileId: string, onProfile: (id: string) => void = vi.fn()) {
  const popover = ProfileMenu({ p, profileId, onProfile }) as Menu;
  const close = vi.fn();
  const [rows, note] = popover.props.children(close).props.children;
  return { rows, note, close, popover };
}

/* the note's rendered text, flattened out of its icon / text pair */
const noteText = (note: Note): string => {
  if (!note) return "";
  const kids = note.props.children as ReactElement<{ children: unknown }>[];
  return kids.map((k) => (typeof k?.props?.children === "string" ? k.props.children : "")).join("");
};

const checked = (id: string) => open(id).rows.map((row) => row.props["aria-checked"]);
const isProfile = (id: string) => PROFILES.map((profile) => profile.id === id);

describe("ProfileMenu", () => {
  it("offers every registered profile, in registry order", () => {
    expect(open(BASE.id).rows.map((row) => row.key)).toEqual(PROFILES.map((profile) => profile.id));
  });

  it("checks exactly the selected profile", () => {
    expect(checked(BASE.id)).toEqual(isProfile(BASE.id));
    expect(checked(DEMO.id)).toEqual(isProfile(DEMO.id));
  });

  it("falls back to the base profile when the selection is unknown", () => {
    expect(checked("no-such-profile")).toEqual(isProfile(BASE.id));
  });

  it("reports the chosen profile by id and closes the menu", () => {
    const onProfile = vi.fn();
    const { rows, close } = open(BASE.id, onProfile);
    rows[PROFILES.indexOf(DEMO)].props.onClick();
    expect(onProfile).toHaveBeenCalledWith(DEMO.id);
    expect(close).toHaveBeenCalled();
  });

  it("names the current profile on the rail button", () => {
    expect(open(DEMO.id).popover.props).toMatchObject({ title: `Profile: ${DEMO.label}` });
  });
});

describe("the fidelity affordance", () => {
  afterEach(() => {
    ui.dark = false;
  });

  it.each([
    ["light", false],
    ["dark", true],
  ])("says nothing for a profile that states no fidelity, in %s", (_mode, dark) => {
    ui.dark = dark as boolean;
    for (const profile of [BASE, DEMO]) expect(open(profile.id).note).toBeFalsy();
  });

  it("marks a partly derived light palette, and explains why", () => {
    ui.dark = false;
    const { note } = open(NIA.id);
    expect(note).toBeTruthy();
    expect((note as Exclude<Note, false>).props["data-fidelity"]).toBe("mixed");
    expect(noteText(note)).toBe(NIA.fidelity!.light!.note!.en!.join(" "));
  });

  it("marks a generated dark palette, and says it is not the source's own", () => {
    ui.dark = true;
    const { note } = open(NIA.id);
    expect(note).toBeTruthy();
    expect((note as Exclude<Note, false>).props["data-fidelity"]).toBe("generated");
    expect(noteText(note)).toBe(NIA.fidelity!.dark!.note!.en!.join(" "));
  });

  it("shows a different standing per mode for the same profile", () => {
    ui.dark = false;
    const inLight = open(NIA.id).note;
    ui.dark = true;
    const inDark = open(NIA.id).note;
    expect(noteText(inLight)).not.toBe(noteText(inDark));
  });
});
