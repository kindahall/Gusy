import apiFetch from './api';
import { resolveAgentAction } from './agent-actions';
import { executeAgentCommand } from './agent-command-executor';
import { AGENT_CRITIQUE_ACTIONS, AGENT_MISSION_ACTIONS, buildPageSeo } from './agent-page-model';
import {
  AGENT_MISSION_COMPLETE_MESSAGE,
  agentCritiqueText,
  missingMissionSectionTypes,
  resolveFixWithAiRoute
} from './agent-workflow-model';
import { DEFAULT_BUILD_PROMPT } from './builder-options';
import type {
  AgentMessage,
  GusyAgentAction,
  GusyAgentMemory,
  GusyAudit,
  GusyBlueprint,
  GusySection,
  GusyThemeContext,
  LeftTab,
  PendingAgentAction
} from './types';

type MaybePromise = void | Promise<unknown>;

type UseAgentWorkflowOptions = {
  agentMemory: GusyAgentMemory;
  appendAgentMessage: (message: AgentMessage) => void;
  applyThemeTokens: () => MaybePromise;
  askProductAgent: (message: string) => MaybePromise;
  blueprint: GusyBlueprint;
  clearPendingAgentAction: () => void;
  generatePage: (prompt: string) => MaybePromise;
  inferMemoryFromText: (text: string) => GusyAgentMemory;
  loadMigrationPages: () => MaybePromise;
  localAudit: GusyAudit;
  makeSectionFromTemplate: (type: string, index: number) => GusySection | null;
  moveSectionById: (sectionId: string, direction: -1 | 1) => void;
  openPageSettings: () => void;
  pendingAgentAction: PendingAgentAction | null;
  previewFirstElementorPage: () => MaybePromise;
  prompt: string;
  queuePendingAgentAction: (pendingAction: PendingAgentAction) => void;
  quickAddBlock: (sectionType: string) => void;
  runAudit: () => MaybePromise;
  saveAgentMemory: (memory: GusyAgentMemory) => Promise<GusyAgentMemory>;
  savePage: (status: 'draft' | 'publish') => MaybePromise;
  sections: GusySection[];
  selectTab: (tab: LeftTab) => void;
  selected?: GusySection;
  setAudit: (audit: GusyAudit | null) => void;
  setBusy: (busy: boolean) => void;
  setCurrentAsHomepage: () => MaybePromise;
  setLeftTab: (tab: LeftTab) => void;
  setPrompt: (prompt: string) => void;
  setStatus: (status: string) => void;
  transformSelected: (prompt: string) => MaybePromise;
  updateBlueprint: (updater: (draft: GusyBlueprint) => void) => void;
  updateSectionSettingsById: (sectionId: string, patch: Partial<GusySection['settings']>, message?: string) => void;
};

export function useAgentWorkflow(options: UseAgentWorkflowOptions) {
  function runAgentAction(action: GusyAgentAction, confirmed = false) {
    const resolution = resolveAgentAction(action, {
      activePrompt: options.prompt,
      confirmed,
      hasSelectedSection: Boolean(options.selected)
    });

    if (resolution.type === 'confirm') {
      options.queuePendingAgentAction(resolution.pendingAction);
      return;
    }
    if (resolution.type === 'blocked') {
      options.setStatus(resolution.status);
      return;
    }

    executeAgentCommand(resolution.command, {
      selectedId: options.selected?.id,
      selectTab: options.selectTab,
      openPageSettings: options.openPageSettings,
      loadMigrationPages: options.loadMigrationPages,
      runAudit: options.runAudit,
      savePage: options.savePage,
      setPrompt: options.setPrompt,
      generatePage: options.generatePage,
      quickAddBlock: options.quickAddBlock,
      transformSelected: options.transformSelected,
      updateSelectedStyle: (sectionId, settingsPatch) => {
        options.updateSectionSettingsById(sectionId, settingsPatch, 'Section style updated');
      },
      moveSelected: options.moveSectionById,
      applyThemeTokens: options.applyThemeTokens,
      saveProjectMemory: (commandPrompt) => options.saveAgentMemory(options.inferMemoryFromText(commandPrompt)),
      buildBrandKit,
      generateLocalSeo,
      appendAgentCritique,
      previewFirstElementorPage: options.previewFirstElementorPage,
      setCurrentAsHomepage: options.setCurrentAsHomepage,
      finishPage,
      runMission,
      setStatus: options.setStatus
    });
  }

  function applyPendingAgentAction() {
    if (!options.pendingAgentAction) return;
    const action = options.pendingAgentAction.action;
    options.clearPendingAgentAction();
    runAgentAction(action, true);
  }

  function askAgent(message = options.prompt) {
    void options.askProductAgent(message);
  }

  async function buildBrandKit(instruction: string) {
    options.setBusy(true);
    options.setStatus('Building brand');
    try {
      const response = await apiFetch<{ theme: GusyThemeContext }>({ path: '/gusy/v1/theme/context' });
      const memory = instruction.trim() ? options.inferMemoryFromText(instruction) : options.agentMemory;
      await options.saveAgentMemory(memory);
      options.updateBlueprint((draft) => {
        draft.page.designSystem = {
          ...response.theme.tokens,
          style: 'agent-brand',
          brandVoice: memory.brandVoice || 'Clear, confident and practical.',
          audience: memory.audience,
          offer: memory.offer
        };
      });
      options.setLeftTab('brand');
      options.setStatus('Brand kit applied');
    } catch (error) {
      options.setStatus(error instanceof Error ? error.message : 'Brand kit failed');
    } finally {
      options.setBusy(false);
    }
  }

  function generateLocalSeo(memory = options.agentMemory) {
    options.updateBlueprint((draft) => {
      draft.page.seo = buildPageSeo(draft, memory);
    });
    options.setLeftTab('audit');
    options.setStatus('SEO ready');
  }

  function appendAgentCritique() {
    options.appendAgentMessage({
      id: `agent-critique-${Date.now()}`,
      role: 'agent' as const,
      text: agentCritiqueText(options.blueprint, options.localAudit),
      actions: AGENT_CRITIQUE_ACTIONS
    });
    options.setStatus('Critique ready');
  }

  async function finishPage(instruction = options.prompt, memoryOverride?: GusyAgentMemory) {
    options.setBusy(true);
    options.setStatus('Finishing page');
    const memory = memoryOverride ?? (instruction.trim() ? options.inferMemoryFromText(instruction) : options.agentMemory);
    let themeTokens: Record<string, unknown> | null = null;

    try {
      const response = await apiFetch<{ theme: GusyThemeContext }>({ path: '/gusy/v1/theme/context' });
      themeTokens = response.theme.tokens;
    } catch {
      themeTokens = null;
    }

    try {
      options.updateBlueprint((draft) => {
        if (themeTokens) {
          draft.page.designSystem = themeTokens;
        }
        missingMissionSectionTypes(draft).forEach((type, index) => {
          const section = options.makeSectionFromTemplate(type, index);
          if (section) {
            draft.page.sections.push(section);
          }
        });
        draft.page.seo = buildPageSeo(draft, memory);
      });
      options.setAudit(null);
      options.setLeftTab('audit');
      options.setStatus('Page finished');
    } finally {
      options.setBusy(false);
    }
  }

  async function runMission(instruction = options.prompt) {
    const memory = await options.saveAgentMemory(options.inferMemoryFromText(instruction));
    await finishPage(instruction, memory);
    options.appendAgentMessage({
      id: `agent-mission-${Date.now()}`,
      role: 'agent' as const,
      text: AGENT_MISSION_COMPLETE_MESSAGE,
      actions: AGENT_MISSION_ACTIONS
    });
  }

  function fixWithAI() {
    const route = resolveFixWithAiRoute({
      audit: options.localAudit,
      sectionCount: options.sections.length,
      hasSelectedSection: Boolean(options.selected)
    });

    if (route === 'finish_page') {
      void finishPage(options.prompt || DEFAULT_BUILD_PROMPT);
      return;
    }

    if (route === 'generate_seo') {
      generateLocalSeo();
      return;
    }

    if (route === 'critique') {
      appendAgentCritique();
      options.setLeftTab('audit');
      options.setStatus(options.localAudit.issues.length ? 'Fix plan ready' : 'No issues');
      return;
    }

    void options.transformSelected('Fix SEO, accessibility, and conversion issues for this selected section.');
  }

  return {
    appendAgentCritique,
    applyPendingAgentAction,
    askAgent,
    buildBrandKit,
    finishPage,
    fixWithAI,
    generateLocalSeo,
    runAgentAction,
    runMission
  };
}
