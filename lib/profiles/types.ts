import type { Lang } from "../i18n";
import type { Palette, Theme } from "../tokens";

/* An application profile is data, not behavior: a named bundle of theme and
 * palette preferences plus a little prompt context. Every profile is read by
 * the same resolvers in ./index, so registering a new one is a data change and
 * never means adding a branch to them.
 *
 * A profile resolves *over* what the author made; it does not replace it.
 * Whatever a profile leaves unset stays exactly as the author left it, which is
 * why selecting the base profile hands the authored state straight back. */

/** A profile's scheme, given either as a seed color or as a finished palette. */
export type ProfilePalette =
  | {
      /** "#RRGGBB"; the whole scheme is generated from it */
      readonly seed: string;
      /** shown as the scheme's name; the profile's label when unset */
      readonly label?: string;
      /** the resolved palette's key; the profile's id when unset */
      readonly key?: string;
    }
  | {
      /** a scheme authored role by role, treated the way a preset is */
      readonly palette: Palette;
    };

/** Prompt guidance per language. A profile need not be written in every
 *  language the editor speaks; see contextLines for what fills the gaps. */
export type ProfileContext = Partial<Record<Lang, readonly string[]>>;

export type AppProfile = {
  /** stable identifier; safe to store in a document, never translated */
  readonly id: string;
  /** shown to the author as authored. Deliberately a plain string rather than
   *  an i18n key, so adding a profile never touches the four-language UI
   *  dictionary or the parity test that guards it. */
  readonly label: string;
  /** Material Symbols Rounded name, for a picker */
  readonly icon?: string;
  /** the theme axes this profile fixes; every unset axis keeps the author's */
  readonly theme?: Partial<Theme>;
  /** the scheme this profile imposes; unset keeps the author's scheme */
  readonly palette?: ProfilePalette;
  /** the lines this profile adds to a generated prompt */
  readonly context?: ProfileContext;
};
