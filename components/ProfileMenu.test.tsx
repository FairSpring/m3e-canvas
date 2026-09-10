import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

/* The "@/" specifier is a bundler alias the test runner does not resolve, and
 * the menu's chrome is not what is under test here, so both are stood in for
 * the way the other component tests do it. */
vi.mock("@/lib/profiles", () => import("../lib/profiles"));
vi.mock("@/lib/tokens", () => import("../lib/tokens"));
vi.mock("./Menus", () => ({ Popover: "popover" }));
vi.mock("./M3Node", () => ({ Icon: "icon" }));

const { BASE, DEMO, PROFILES } = await import("../lib/profiles");
const { DEFAULT_THEME, paletteOf } = await import("../lib/tokens");
const { ProfileMenu } = await import("./ProfileMenu");

/* ProfileMenu uses no hooks: it returns a Popover whose only child is a render
 * prop. Calling that render prop gives the menu's element tree directly, with
 * no React runtime and no DOM involved. */

const p = paletteOf("purple", null, DEFAULT_THEME);

type Row = ReactElement<{ "aria-checked": boolean; onClick: () => void }>;
type Menu = ReactElement<{ children: (close: () => void) => ReactElement<{ children: Row[] }> }>;

function open(profileId: string, onProfile: (id: string) => void = vi.fn()) {
  const popover = ProfileMenu({ p, profileId, onProfile }) as Menu;
  const close = vi.fn();
  return { rows: popover.props.children(close).props.children, close, popover };
}

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
