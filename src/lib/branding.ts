export const APP_NAME = 'Összhang';

export const APP_TAGLINE = 'Pénzügyek, összhangban.';

export const APP_DESCRIPTION =
  'Bevételek, kiadások, rezsi, megtakarítások és tartozások — egyetlen letisztult, modern felületen.';

export const APP_META_TITLE = `${APP_NAME} | Családi pénzügyek`;

export const LEGACY_APP_NAMES = ['Aura', 'PénzPilot', 'PenzPilot'] as const;

export function resolveAppName(storedName?: string | null): string {
  if (!storedName || LEGACY_APP_NAMES.includes(storedName as (typeof LEGACY_APP_NAMES)[number])) {
    return APP_NAME;
  }
  return storedName;
}
