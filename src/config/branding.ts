import config from '@/config/config';

export const APP_NAME = config.branding.appName;
export const APP_TAGLINE = config.branding.tagline;
export const APP_DESCRIPTION = config.branding.description;
export const APP_META_TITLE = `${config.branding.appName} | Családi pénzügyek`;
export const LEGACY_APP_NAMES = config.branding.legacyAppNames;

export function resolveAppName(storedName?: string | null): string {
  const { appName, legacyAppNames } = config.branding;
  if (!storedName || (legacyAppNames as readonly string[]).includes(storedName)) {
    return appName;
  }
  return storedName;
}

export function metaTitle(suffix: string): string {
  return `${suffix} | ${config.branding.appName}`;
}
