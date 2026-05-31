import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { actionSummary, isImpactfulAction } from '../src/admin/agent-policy';
import type { GusyAgentAction } from '../src/admin/types';

function action(type: GusyAgentAction['type']): GusyAgentAction {
  return { type, label: type };
}

describe('Gusy agent policy', () => {
  it('requires confirmation for destructive or broad agent actions', () => {
    assert.equal(isImpactfulAction(action('publish')), true);
    assert.equal(isImpactfulAction(action('generate_page')), true);
    assert.equal(isImpactfulAction(action('create_section')), true);
    assert.equal(isImpactfulAction(action('update_selected_style')), true);
    assert.equal(isImpactfulAction(action('move_selected')), true);
    assert.equal(isImpactfulAction(action('set_homepage')), true);
  });

  it('allows navigational and diagnostic actions without confirmation', () => {
    assert.equal(isImpactfulAction(action('open_tab')), false);
    assert.equal(isImpactfulAction(action('run_audit')), false);
    assert.equal(isImpactfulAction(action('scan_elementor')), false);
  });

  it('describes agent actions in product language', () => {
    assert.match(actionSummary(action('apply_theme_tokens')), /WordPress theme/);
    assert.match(actionSummary(action('create_section')), /new section/);
    assert.match(actionSummary(action('update_selected_style')), /visual settings/);
    assert.match(actionSummary(action('save_project_memory')), /project memory/);
  });
});
