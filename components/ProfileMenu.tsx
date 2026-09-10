"use client";

import { PROFILES, profileOf } from "@/lib/profiles";
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
        </div>
      )}
    </Popover>
  );
}
