import type { AgentActionCommand } from './agent-actions';
import type { GusySection, LeftTab } from './types';

type MaybePromise = void | Promise<unknown>;

export type AgentCommandExecutorActions = {
  selectedId?: string;
  selectTab: (tab: LeftTab) => void;
  openPageSettings: () => void;
  loadMigrationPages: () => MaybePromise;
  runAudit: () => MaybePromise;
  savePage: (status: 'draft' | 'publish') => MaybePromise;
  setPrompt: (prompt: string) => void;
  generatePage: (prompt: string) => MaybePromise;
  quickAddBlock: (sectionType: string) => void;
  transformSelected: (prompt: string) => MaybePromise;
  updateSelectedStyle: (sectionId: string, settings: Partial<GusySection['settings']>) => void;
  moveSelected: (sectionId: string, direction: -1 | 1) => void;
  applyThemeTokens: () => MaybePromise;
  saveProjectMemory: (prompt: string) => MaybePromise;
  buildBrandKit: (prompt: string) => MaybePromise;
  generateLocalSeo: () => void;
  appendAgentCritique: () => void;
  previewFirstElementorPage: () => MaybePromise;
  setCurrentAsHomepage: () => MaybePromise;
  finishPage: (prompt: string) => MaybePromise;
  runMission: (prompt: string) => MaybePromise;
  setStatus: (status: string) => void;
};

export function executeAgentCommand(command: AgentActionCommand, actions: AgentCommandExecutorActions): void {
  if (command.type === 'open_tab') {
    actions.selectTab(command.tab);
    return;
  }
  if (command.type === 'open_page_settings') {
    actions.openPageSettings();
    return;
  }
  if (command.type === 'scan_elementor') {
    actions.selectTab('migrate');
    void actions.loadMigrationPages();
    return;
  }
  if (command.type === 'run_audit') {
    void actions.runAudit();
    return;
  }
  if (command.type === 'save_page') {
    void actions.savePage(command.status);
    return;
  }
  if (command.type === 'generate_page') {
    actions.setPrompt(command.prompt);
    void actions.generatePage(command.prompt);
    return;
  }
  if (command.type === 'create_section') {
    actions.quickAddBlock(command.sectionType);
    return;
  }
  if (command.type === 'transform_selected') {
    void actions.transformSelected(command.prompt);
    return;
  }
  if (command.type === 'update_selected_style') {
    if (!actions.selectedId) {
      actions.setStatus('Select a section first');
      return;
    }
    actions.updateSelectedStyle(actions.selectedId, command.settings);
    return;
  }
  if (command.type === 'move_selected') {
    if (!actions.selectedId) {
      actions.setStatus('Select a section first');
      return;
    }
    actions.moveSelected(actions.selectedId, command.direction);
    return;
  }
  if (command.type === 'apply_theme_tokens') {
    void actions.applyThemeTokens();
    return;
  }
  if (command.type === 'save_project_memory') {
    void actions.saveProjectMemory(command.prompt);
    return;
  }
  if (command.type === 'build_brand_kit') {
    void actions.buildBrandKit(command.prompt);
    return;
  }
  if (command.type === 'generate_local_seo') {
    actions.generateLocalSeo();
    return;
  }
  if (command.type === 'critique_page') {
    actions.appendAgentCritique();
    return;
  }
  if (command.type === 'preview_first_elementor') {
    void actions.previewFirstElementorPage();
    return;
  }
  if (command.type === 'set_homepage') {
    void actions.setCurrentAsHomepage();
    return;
  }
  if (command.type === 'finish_page') {
    void actions.finishPage(command.prompt);
    return;
  }

  void actions.runMission(command.prompt);
}
