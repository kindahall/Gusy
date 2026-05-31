import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeAgentCommand, type AgentCommandExecutorActions } from '../src/admin/agent-command-executor';

function actions(selectedId = 'hero-1') {
  const calls: string[] = [];
  const base: AgentCommandExecutorActions = {
    selectedId,
    selectTab: (tab) => calls.push(`tab:${tab}`),
    openPageSettings: () => calls.push('settings'),
    loadMigrationPages: () => calls.push('scan'),
    runAudit: () => calls.push('audit'),
    savePage: (status) => calls.push(`save:${status}`),
    setPrompt: (prompt) => calls.push(`prompt:${prompt}`),
    generatePage: (prompt) => calls.push(`generate:${prompt}`),
    quickAddBlock: (type) => calls.push(`section:${type}`),
    transformSelected: (prompt) => calls.push(`transform:${prompt}`),
    updateSelectedStyle: (sectionId, settings) => calls.push(`style:${sectionId}:${settings.spacing ?? ''}`),
    moveSelected: (sectionId, direction) => calls.push(`move:${sectionId}:${direction}`),
    applyThemeTokens: () => calls.push('theme'),
    saveProjectMemory: (prompt) => calls.push(`memory:${prompt}`),
    buildBrandKit: (prompt) => calls.push(`brand:${prompt}`),
    generateLocalSeo: () => calls.push('seo'),
    appendAgentCritique: () => calls.push('critique'),
    previewFirstElementorPage: () => calls.push('preview-elementor'),
    setCurrentAsHomepage: () => calls.push('homepage'),
    finishPage: (prompt) => calls.push(`finish:${prompt}`),
    runMission: (prompt) => calls.push(`mission:${prompt}`),
    setStatus: (status) => calls.push(`status:${status}`)
  };

  return { calls, base };
}

describe('Gusy agent command executor', () => {
  it('dispatches strict agent tools to product actions', () => {
    const { calls, base } = actions();

    executeAgentCommand({ type: 'open_tab', tab: 'blocks' }, base);
    executeAgentCommand({ type: 'generate_page', prompt: 'Build pricing page' }, base);
    executeAgentCommand({ type: 'create_section', sectionType: 'faq' }, base);
    executeAgentCommand({ type: 'update_selected_style', settings: { spacing: 'xl' } }, base);
    executeAgentCommand({ type: 'move_selected', direction: 1 }, base);
    executeAgentCommand({ type: 'finish_page', prompt: 'Complete it' }, base);

    assert.deepEqual(calls, [
      'tab:blocks',
      'prompt:Build pricing page',
      'generate:Build pricing page',
      'section:faq',
      'style:hero-1:xl',
      'move:hero-1:1',
      'finish:Complete it'
    ]);
  });

  it('blocks selected-section tools when no section is selected', () => {
    const { calls, base } = actions('');

    executeAgentCommand({ type: 'update_selected_style', settings: { width: 'wide' } }, base);
    executeAgentCommand({ type: 'move_selected', direction: -1 }, base);

    assert.deepEqual(calls, ['status:Select a section first', 'status:Select a section first']);
  });

  it('routes broad mission commands through explicit workflows', () => {
    const { calls, base } = actions();

    executeAgentCommand({ type: 'scan_elementor' }, base);
    executeAgentCommand({ type: 'save_project_memory', prompt: 'Local restaurant in Paris' }, base);
    executeAgentCommand({ type: 'build_brand_kit', prompt: 'Premium but clear' }, base);
    executeAgentCommand({ type: 'generate_local_seo' }, base);
    executeAgentCommand({ type: 'start_mission', prompt: 'Full product page' }, base);

    assert.deepEqual(calls, [
      'tab:migrate',
      'scan',
      'memory:Local restaurant in Paris',
      'brand:Premium but clear',
      'seo',
      'mission:Full product page'
    ]);
  });
});
