import type { GusyBlueprint } from './types';

export function brandKitSavedBlueprint(blueprint: GusyBlueprint, brandKit: Record<string, unknown>): GusyBlueprint {
  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      designSystem: brandKit
    }
  };
}

export function brandSaveErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Brand save failed';
}

export function themeAdaptationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Theme adaptation failed';
}

export function themeAppliedStatus(themeName: string): string {
  return `Theme applied: ${themeName || 'WordPress theme'}`;
}
