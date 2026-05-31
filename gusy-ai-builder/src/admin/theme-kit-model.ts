import type { GusyThemeImportResponse, GusyThemeKitResponse, GusyThemeSettings } from './types';

export const DEFAULT_THEME_SETTINGS: GusyThemeSettings = {
  activeKit: '',
  language: 'en',
  styleVariation: 'editorial',
  density: 'comfortable',
  buttonStyle: 'solid',
  imageTone: 'natural',
  setHomeOnImport: true
};

export function normalizeThemeSettings(settings?: Partial<GusyThemeSettings>): GusyThemeSettings {
  return { ...DEFAULT_THEME_SETTINGS, ...(settings || {}) };
}

export function themeKitLoadStatus(response: Pick<GusyThemeKitResponse, 'available' | 'kits' | 'message'>): string {
  if (response.available) return `${response.kits.length} kits ready`;
  return response.message || 'Theme kits unavailable';
}

export function themeImportStatus(response: Pick<GusyThemeImportResponse, 'pages'>): string {
  return response.pages.length === 1 ? '1 page imported' : `${response.pages.length} pages imported`;
}

export function themeWorkflowError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
