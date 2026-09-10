import type { AppProfile } from "./types";

/* The editor as it stands: Material 3 Expressive, imposing nothing on the
 * author. It fixes no theme axis, brings no scheme of its own and contributes
 * no prompt lines, so resolving through it is the identity. Selecting it gives
 * the authored theme and palette straight back, with nothing to reconstruct. */
export const BASE: AppProfile = {
  id: "base",
  label: "Material 3 Expressive",
  icon: "palette",
};
