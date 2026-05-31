import apiFetch from './api';
import { BRAND_PRESETS, type BrandPresetKey } from './brand';
import {
  brandKitSavedBlueprint,
  brandSaveErrorMessage,
  themeAdaptationErrorMessage,
  themeAppliedStatus
} from './brand-workflow-model';
import { mergeDesignSystem, type GusyDesignSystem } from './schema';
import type { GusyBlueprint, GusyThemeContext, LeftTab } from './types';

type UseBrandWorkflowOptions = {
  blueprint: GusyBlueprint;
  setBlueprint: (updater: (current: GusyBlueprint) => GusyBlueprint) => void;
  setBusy: (busy: boolean) => void;
  setLeftTab: (tab: LeftTab) => void;
  setStatus: (status: string) => void;
  updateBlueprint: (updater: (draft: GusyBlueprint) => void) => void;
};

export function useBrandWorkflow({
  blueprint,
  setBlueprint,
  setBusy,
  setLeftTab,
  setStatus,
  updateBlueprint
}: UseBrandWorkflowOptions) {
  function updateDesignTokens(patch: GusyDesignSystem, message = 'Brand updated') {
    updateBlueprint((draft) => {
      draft.page.designSystem = mergeDesignSystem(draft.page.designSystem, patch);
    });
    setStatus(message);
  }

  function updateDesignColor(key: string, value: string) {
    updateDesignTokens({ colors: { [key]: value } }, 'Color updated');
  }

  function applyBrandPreset(key: BrandPresetKey) {
    const preset = BRAND_PRESETS[key];
    updateDesignTokens(preset.tokens, `${preset.label} kit applied`);
    setLeftTab('brand');
  }

  async function saveBrandKit() {
    setBusy(true);
    setStatus('Saving brand');
    try {
      const response = await apiFetch<{ brandKit: Record<string, unknown> }>({
        path: '/gusy/v1/brand-kit',
        method: 'POST',
        data: { brandKit: blueprint.page.designSystem }
      });
      setBlueprint((current) => brandKitSavedBlueprint(current, response.brandKit));
      setStatus('Brand kit saved');
    } catch (error) {
      setStatus(brandSaveErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function applyThemeTokens() {
    setBusy(true);
    setStatus('Reading theme');
    try {
      const response = await apiFetch<{ theme: GusyThemeContext }>({ path: '/gusy/v1/theme/context' });
      updateBlueprint((draft) => {
        draft.page.designSystem = response.theme.tokens;
      });
      setLeftTab('brand');
      setStatus(themeAppliedStatus(response.theme.name));
    } catch (error) {
      setStatus(themeAdaptationErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return {
    applyBrandPreset,
    applyThemeTokens,
    saveBrandKit,
    updateDesignColor,
    updateDesignTokens
  };
}
