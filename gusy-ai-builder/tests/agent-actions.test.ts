import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAgentDirection,
  normalizeAgentSectionSettings,
  normalizeAgentSectionType,
  normalizeAgentTab,
  resolveAgentAction
} from '../src/admin/agent-actions';
import type { GusyAgentAction } from '../src/admin/types';

function action(type: GusyAgentAction['type'], patch: Partial<GusyAgentAction> = {}): GusyAgentAction {
  return { type, label: type, ...patch };
}

describe('Gusy agent action resolver', () => {
  it('turns impactful actions into explicit confirmations before execution', () => {
    const resolution = resolveAgentAction(action('publish'), {
      activePrompt: '',
      hasSelectedSection: false
    });

    assert.equal(resolution.type, 'confirm');
    if (resolution.type === 'confirm') {
      assert.equal(resolution.pendingAction.action.type, 'publish');
      assert.match(resolution.pendingAction.summary, /Publish/);
    }
  });

  it('maps confirmed actions to strict product commands', () => {
    assert.deepEqual(
      resolveAgentAction(action('publish'), { activePrompt: '', confirmed: true, hasSelectedSection: false }),
      { type: 'run', command: { type: 'save_page', status: 'publish' } }
    );
    assert.deepEqual(
      resolveAgentAction(action('save_draft'), { activePrompt: '', hasSelectedSection: false }),
      { type: 'run', command: { type: 'save_page', status: 'draft' } }
    );
  });

  it('guards invalid navigation targets instead of casting anything into a workspace', () => {
    assert.equal(normalizeAgentTab('brand'), 'brand');
    assert.equal(normalizeAgentTab('settings'), null);
    assert.deepEqual(
      resolveAgentAction(action('open_tab', { target: 'settings' }), { activePrompt: '', hasSelectedSection: false }),
      { type: 'blocked', status: 'Workspace unavailable' }
    );
  });

  it('requires a selected section before transforming content', () => {
    assert.deepEqual(
      resolveAgentAction(action('transform_selected'), { activePrompt: '', confirmed: true, hasSelectedSection: false }),
      { type: 'blocked', status: 'Select a section first' }
    );
    assert.deepEqual(
      resolveAgentAction(action('transform_selected'), { activePrompt: '', confirmed: true, hasSelectedSection: true }),
      { type: 'run', command: { type: 'transform_selected', prompt: 'Improve this section' } }
    );
  });

  it('resolves strict section creation, style and move tools', () => {
    assert.equal(normalizeAgentSectionType('services'), 'features');
    assert.equal(normalizeAgentSectionType('nope'), null);
    assert.equal(normalizeAgentDirection('up'), -1);
    assert.equal(normalizeAgentDirection('down'), 1);
    assert.deepEqual(
      normalizeAgentSectionSettings({ background: 'soft', spacing: 'xl', width: 'full', textAlign: 'center', headingScale: 'display', textWidth: 'wide', bodyScale: 'large', buttonStyle: 'outline', buttonSize: 'lg', buttonShape: 'rounded', imageAspect: 'portrait', imagePosition: 'bottom', imageShape: 'soft', videoMode: 'background', columns: 3, tabletColumns: 2, mobileColumns: 1, accent: 'bad' }),
      { background: 'soft', spacing: 'xl', width: 'full', textAlign: 'center', headingScale: 'display', textWidth: 'wide', bodyScale: 'large', buttonStyle: 'outline', buttonSize: 'lg', buttonShape: 'rounded', imageAspect: 'portrait', imagePosition: 'bottom', imageShape: 'soft', videoMode: 'background', columns: 3, tabletColumns: 2, mobileColumns: 1 }
    );

    assert.deepEqual(
      resolveAgentAction(action('create_section', { sectionType: 'faq' }), {
        activePrompt: '',
        confirmed: true,
        hasSelectedSection: false
      }),
      { type: 'run', command: { type: 'create_section', sectionType: 'faq' } }
    );
    assert.deepEqual(
      resolveAgentAction(action('update_selected_style', { settings: { background: 'hero', width: 'boxed' } }), {
        activePrompt: '',
        confirmed: true,
        hasSelectedSection: true
      }),
      { type: 'run', command: { type: 'update_selected_style', settings: { background: 'hero', width: 'boxed' } } }
    );
    assert.deepEqual(
      resolveAgentAction(action('move_selected', { direction: 'up' }), {
        activePrompt: '',
        confirmed: true,
        hasSelectedSection: true
      }),
      { type: 'run', command: { type: 'move_selected', direction: -1 } }
    );
  });

  it('blocks strict tools when required inputs are missing', () => {
    assert.deepEqual(
      resolveAgentAction(action('create_section', { sectionType: 'unknown' }), {
        activePrompt: '',
        confirmed: true,
        hasSelectedSection: false
      }),
      { type: 'blocked', status: 'Section type unavailable' }
    );
    assert.deepEqual(
      resolveAgentAction(action('update_selected_style', { settings: { background: 'bad' } }), {
        activePrompt: '',
        confirmed: true,
        hasSelectedSection: true
      }),
      { type: 'blocked', status: 'Style change unavailable' }
    );
    assert.deepEqual(
      resolveAgentAction(action('move_selected', { direction: 'down' }), {
        activePrompt: '',
        confirmed: true,
        hasSelectedSection: false
      }),
      { type: 'blocked', status: 'Select a section first' }
    );
  });

  it('prefers action prompts and falls back to the active prompt for generative tools', () => {
    assert.deepEqual(
      resolveAgentAction(action('generate_page', { prompt: 'Build a florist page' }), {
        activePrompt: 'Build a bakery page',
        confirmed: true,
        hasSelectedSection: false
      }),
      { type: 'run', command: { type: 'generate_page', prompt: 'Build a florist page' } }
    );
    assert.deepEqual(
      resolveAgentAction(action('finish_page'), {
        activePrompt: 'Use the current brief',
        confirmed: true,
        hasSelectedSection: true
      }),
      { type: 'run', command: { type: 'finish_page', prompt: 'Use the current brief' } }
    );
  });
});
