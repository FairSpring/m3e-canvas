import { LANGS, type Lang } from "../i18n";
import type { Theme } from "../tokens";
import type { AppProfile, Fidelity, ProfileContext } from "./types";

/* Reading a profile's fidelity, and turning it into words for a coding agent.
 *
 * Nothing here knows about any particular profile: the framing sentences are
 * keyed by the three states alone, and everything specific comes from the
 * profile's own notes. A profile that states no fidelity produces no lines. */

/** the lines a per-language block holds in `lang`: its own, else English, else
 *  the first language it defines, else none */
export function linesFor(block: ProfileContext | undefined, lang: Lang): readonly string[] {
  if (!block) return [];
  for (const candidate of [lang, "en" as Lang, ...LANGS.map((l) => l.key)]) {
    const lines = block[candidate];
    if (lines && lines.length > 0) return lines;
  }
  return [];
}

/** How faithfully this profile's palette represents its source in this mode.
 *  A profile that says nothing is exact, so an unannotated one is unchanged. */
export function fidelityOf(profile: AppProfile, dark: boolean): Fidelity {
  return (dark ? profile.fidelity?.dark : profile.fidelity?.light)?.level ?? "exact";
}

/** the profile's own explanation for this mode, or none */
export function fidelityNote(profile: AppProfile, dark: boolean, lang: Lang): readonly string[] {
  return linesFor((dark ? profile.fidelity?.dark : profile.fidelity?.light)?.note, lang);
}

/** the closing framing for each state a caveat is needed for */
const FRAMING: Record<Lang, Record<Exclude<Fidelity, "exact">, string>> = {
  ja: {
    mixed: "上のカラースキームの一部の値は、このデザインシステムが定めているものではなく、機械的に導出したものです。仕様ではなく近似として扱ってください。",
    generated: "上のカラースキームは、このデザインシステムの色から生成したもので、そこに定められた値ではありません。仕様ではなく近似として扱ってください。",
  },
  en: {
    mixed: "Some of the color values above are derived rather than taken from this design system; treat them as an approximation, not as its specification.",
    generated: "The color values above are generated from this design system's colors rather than taken from it; treat them as an approximation, not as its specification.",
  },
  zh: {
    mixed: "上面配色中的部分数值并非该设计系统所规定，而是机械推导得出的；请将其视为近似值，而不是规范。",
    generated: "上面的配色是根据该设计系统的颜色生成的，并非其规定的数值；请将其视为近似值，而不是规范。",
  },
  ko: {
    mixed: "위 색상 값의 일부는 이 디자인 시스템이 지정한 값이 아니라 기계적으로 도출한 값이다. 규격이 아니라 근사치로 다룰 것.",
    generated: "위 색상 값은 이 디자인 시스템의 색에서 생성한 것이며 그것이 지정한 값이 아니다. 규격이 아니라 근사치로 다룰 것.",
  },
};

/** said before each mode's caveat, but only when the prompt covers both */
const MODE: Record<Lang, { light: string; dark: string }> = {
  ja: { light: "ライトモードについて:", dark: "ダークモードについて:" },
  en: { light: "For light mode:", dark: "For dark mode:" },
  zh: { light: "关于浅色模式：", dark: "关于深色模式：" },
  ko: { light: "라이트 모드에 대해:", dark: "다크 모드에 대해:" },
};

/** The provenance a generated prompt should carry: a caveat for each mode the
 *  prompt describes whose values are not the design system's own, followed by
 *  the profile's explanation of it. Empty when every mode described is exact,
 *  so a profile without fidelity leaves the prompt untouched. */
export function provenanceLines(profile: AppProfile, theme: Theme, lang: Lang): readonly string[] {
  const modes: boolean[] = theme.bothModes ? [false, true] : [theme.dark];
  const both = modes.length > 1;
  const out: string[] = [];
  for (const dark of modes) {
    const level = fidelityOf(profile, dark);
    if (level === "exact") continue;
    const lead = both ? `${MODE[lang][dark ? "dark" : "light"]} ` : "";
    out.push(`${lead}${FRAMING[lang][level]}`);
    out.push(...fidelityNote(profile, dark, lang));
  }
  return out;
}
