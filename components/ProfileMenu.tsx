"use client";

import { useLang } from "@/lib/i18n";
import { PROFILES, fidelityNote, fidelityOf, profileOf } from "@/lib/profiles";
import { useTheme } from "@/lib/theme";
import { Palette } from "@/lib/tokens";
import { Icon } from "./M3Node";
import { Popover } from "./Menus";

/** The application profile the canvas is rendered under.
 *
 *  Built the way LangMenu is: one Popover holding a column of radio rows. Each
 *  row is labelled from the profile's own data, so registering a profile in
 *  lib/profiles is enough to make it appear here.
 *
 *  The labels are deliberately untranslated, as the profiles themselves are:
 *  keeping them out of the UI dictionary means adding a profile never touches
 *  the four-language tables or the parity test that guards them. */
export function ProfileMenu({
  p,
  profileId,
  onProfile,
  side,
  size,
}: {
  p: Palette;
  profileId: string;
  onProfile: (id: string) => void;
  side?: "down" | "right";
  size?: number;
}) {
  const current = profileOf(profileId);
  const lang = useLang();
  /* The mode the canvas is drawing right now, from the resolved theme the page
     puts in context — so the standing shown is the one actually on screen. */
  const { dark } = useTheme();
  const level = fidelityOf(current, dark);
  const why = level === "exact" ? [] : fidelityNote(current, dark, lang);
  return (
    <Popover p={p} icon="apps" title={`Profile: ${current.label}`} side={side} size={size}>
      {(close) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 200 }}>
          {PROFILES.map((profile) => {
            const on = profile.id === current.id;
            return (
              <button
                key={profile.id}
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  onProfile(profile.id);
                  close();
                }}
                className="m3-press"
                style={{
                  height: 40,
                  padding: "0 14px 0 10px",
                  borderRadius: 12,
                  border: "none",
                  background: on ? p.secondaryContainer : "transparent",
                  color: on ? p.onSecondaryContainer : p.onSurface,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ width: 18, display: "inline-flex" }}>{on && <Icon name="check" size={18} />}</span>
                {profile.icon && <Icon name={profile.icon} size={18} />}
                {profile.label}
              </button>
            );
          })}
          {level !== "exact" && (
            <div
              role="note"
              data-fidelity={level}
              style={{
                display: "flex",
                gap: 8,
                margin: "6px 4px 2px",
                paddingTop: 8,
                borderTop: `1px solid ${p.outlineVariant}`,
                fontSize: 11,
                lineHeight: 1.5,
                color: p.onSurfaceVariant,
                maxWidth: 260,
              }}
            >
              <span style={{ flex: "0 0 auto", color: level === "generated" ? p.error : p.onSurfaceVariant, paddingTop: 1 }}>
                <Icon name={level === "generated" ? "warning" : "info"} size={14} />
              </span>
              <span>{why.length ? why.join(" ") : null}</span>
            </div>
          )}
        </div>
      )}
    </Popover>
  );
}
