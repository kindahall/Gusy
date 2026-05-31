import apiFetch from './api';
import { DEFAULT_BUILD_PROMPT } from './builder-options';
import {
  generatedPageStatus,
  generatedSectionStatus,
  generationErrorMessage,
  transformedSectionStatus,
  type GusyGenerationSource
} from './generation-model';
import { normalizeBlueprint } from './schema';
import { replaceSection } from './workflow-model';
import type { GusyBlueprint, GusySection, GusySettings, LeftTab } from './types';

export function useGenerationWorkflow(
  settings: GusySettings,
  options: {
    blueprint: GusyBlueprint;
    sections: GusySection[];
    selected?: GusySection;
    prompt: string;
    replaceBlueprint: (blueprint: GusyBlueprint, options?: { recordHistory?: boolean; selectedId?: string; resetAudit?: boolean }) => void;
    updateBlueprint: (updater: (draft: GusyBlueprint) => void) => void;
    clearPageAnnotations: () => void;
    setBusy: (busy: boolean) => void;
    setStatus: (status: string) => void;
    setSelectedId: (sectionId: string) => void;
    setLeftTab: (tab: LeftTab) => void;
  }
) {
  async function generateSection(type: string) {
    const workingPrompt = options.prompt.trim() || DEFAULT_BUILD_PROMPT;
    options.setBusy(true);
    options.setStatus('Generating section');
    try {
      const response = await apiFetch<{ section: GusySection; source?: GusyGenerationSource }>({
        path: '/gusy/v1/section/generate',
        method: 'POST',
        data: { type, prompt: workingPrompt }
      });
      options.updateBlueprint((draft) => {
        draft.page.sections.push(response.section);
      });
      options.setSelectedId(response.section.id);
      options.setLeftTab('layers');
      options.setStatus(generatedSectionStatus(response.source));
    } catch (error) {
      options.setStatus(generationErrorMessage(error, 'Section failed'));
    } finally {
      options.setBusy(false);
    }
  }

  async function generatePage(promptOverride?: string) {
    const workingPrompt = (promptOverride ?? options.prompt).trim();
    if (!workingPrompt) {
      options.setStatus('Prompt required');
      return;
    }

    options.setBusy(true);
    options.setStatus('Generating');
    try {
      const response = await apiFetch<{ blueprint: GusyBlueprint; source?: GusyGenerationSource }>({
        path: '/gusy/v1/page/generate',
        method: 'POST',
        data: { prompt: workingPrompt, brandKit: options.blueprint.page.designSystem }
      });
      const normalized = normalizeBlueprint(response.blueprint, settings);
      options.replaceBlueprint(normalized, { recordHistory: true });
      options.clearPageAnnotations();
      options.setLeftTab('layers');
      options.setStatus(generatedPageStatus(response.source));
    } catch (error) {
      options.setStatus(generationErrorMessage(error, 'Failed'));
    } finally {
      options.setBusy(false);
    }
  }

  async function transformSectionById(sectionId: string, instruction: string) {
    const target = options.sections.find((section) => section.id === sectionId);
    if (!target) return;

    options.setBusy(true);
    options.setStatus('Editing');
    try {
      const response = await apiFetch<{ section: GusySection; source?: GusyGenerationSource }>({
        path: '/gusy/v1/block/transform',
        method: 'POST',
        data: { section: target, instruction }
      });
      options.replaceBlueprint(replaceSection(options.blueprint, target.id, response.section), {
        recordHistory: true,
        selectedId: target.id
      });
      options.setStatus(transformedSectionStatus(response.source));
    } catch (error) {
      options.setStatus(generationErrorMessage(error, 'Failed'));
    } finally {
      options.setBusy(false);
    }
  }

  async function transformSelected(instruction: string) {
    if (!options.selected) return;
    await transformSectionById(options.selected.id, instruction);
  }

  return {
    generatePage,
    generateSection,
    transformSectionById,
    transformSelected
  };
}
