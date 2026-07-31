/**
 * Explicit CMS module bootstrap.
 *
 * The root package is aggressively tree-shaken in production. A side-effect
 * only import can therefore be removed, leaving the admin route with an empty
 * registry. Import the registration markers as live values and call the
 * bootstrap function from the route so these four editors are always retained.
 */
import { NEWS_MODULE_REGISTERED } from "./news";
import { HONOR_MODULE_REGISTERED } from "./honor";
import { ACHIEVEMENTS_MODULE_REGISTERED } from "./achievements";
import { ACTIVITIES_MODULE_REGISTERED } from "./activities";

export const REGISTERED_CMS_UI_MODULE_IDS = [
  "news",
  "honor",
  "achievements",
  "activities",
] as const;

const REGISTRATION_MARKERS = [
  NEWS_MODULE_REGISTERED,
  HONOR_MODULE_REGISTERED,
  ACHIEVEMENTS_MODULE_REGISTERED,
  ACTIVITIES_MODULE_REGISTERED,
] as const;

export function ensureCmsUiModulesRegistered(): void {
  if (!REGISTRATION_MARKERS.every((registered) => registered === true)) {
    throw new Error("[cms] One or more required admin modules failed to register.");
  }
}
