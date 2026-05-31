import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAgentAction } from '../src/admin/agent-actions';
import { createBlankBlueprint } from '../src/admin/schema';
import {
  insertSection,
  moveSectionByDrop,
  patchSection,
  replaceSection,
  sectionFromTemplate,
  wordpressSavePayload
} from '../src/admin/workflow-model';
import type { GusySection, GusySettings, GusyTemplate } from '../src/admin/types';

function section(type: string, title: string): GusySection {
  return {
    id: `template-${type}`,
    type,
    variant: 'default',
    label: title,
    kicker: '',
    title,
    body: `${title} body`,
    cta: { label: 'Continue', url: '#contact' },
    items: [{ title: `${title} item`, body: `${title} detail` }],
    settings: {
      background: 'plain',
      spacing: 'lg',
      columns: 2,
      accent: 'accent',
      width: 'wide',
      mobileStack: true,
      interactive: false
    }
  };
}

function template(id: string, type: string, title: string): GusyTemplate {
  return {
    id,
    category: type,
    title,
    type,
    variant: 'default',
    intent: title,
    preview: '',
    section: section(type, title)
  };
}

const templates = [
  template('hero-local', 'hero', 'Hero'),
  template('services-grid', 'services', 'Services'),
  template('contact-form', 'form', 'Form')
];

const settings: GusySettings = {
  restBase: '/wp-json/gusy/v1',
  nonce: 'nonce',
  templates,
  brandKit: { colors: { primary: '#102336', accent: '#2563eb' } },
  siteName: 'Workflow Test',
  adminUrl: '/wp-admin/',
  canPublish: true,
  pluginVersion: 'test',
  locale: 'en_US'
};

describe('Gusy workflow E2E model', () => {
  it('creates, edits, reorders, saves, publishes and lets the agent modify a section', () => {
    let blueprint = createBlankBlueprint(settings, 'Gusy Workflow');

    const hero = sectionFromTemplate(templates[0], 'hero-1');
    blueprint = insertSection(blueprint, hero);
    blueprint = patchSection(blueprint, hero.id, {
      title: 'Launch faster with Gusy',
      body: 'A real WordPress page builder workflow.'
    });

    const services = sectionFromTemplate(templates[1], 'services-1');
    const form = sectionFromTemplate(templates[2], 'form-1');
    blueprint = insertSection(blueprint, services, hero.id, 'after');
    blueprint = insertSection(blueprint, form, services.id, 'after');

    assert.deepEqual(blueprint.page.sections.map((item) => item.id), ['hero-1', 'services-1', 'form-1']);

    blueprint = moveSectionByDrop(blueprint, form.id, services.id, 'before');
    assert.deepEqual(blueprint.page.sections.map((item) => item.id), ['hero-1', 'form-1', 'services-1']);

    const draftPayload = wordpressSavePayload(blueprint, null, 'draft');
    assert.equal(draftPayload.status, 'draft');
    assert.equal(draftPayload.blueprint.page.sections.length, 3);

    const agentResolution = resolveAgentAction(
      { type: 'transform_selected', label: 'Improve hero', prompt: 'Make the hero more direct.' },
      { activePrompt: '', confirmed: true, hasSelectedSection: true }
    );
    assert.deepEqual(agentResolution, {
      type: 'run',
      command: { type: 'transform_selected', prompt: 'Make the hero more direct.' }
    });

    assert.deepEqual(
      resolveAgentAction(
        { type: 'update_selected_style', label: 'Make roomy', settings: { spacing: 'xl', columns: 2 } },
        { activePrompt: '', confirmed: true, hasSelectedSection: true }
      ),
      { type: 'run', command: { type: 'update_selected_style', settings: { spacing: 'xl', columns: 2 } } }
    );

    assert.deepEqual(
      resolveAgentAction(
        { type: 'move_selected', label: 'Move down', direction: 'down' },
        { activePrompt: '', confirmed: true, hasSelectedSection: true }
      ),
      { type: 'run', command: { type: 'move_selected', direction: 1 } }
    );

    const improvedHero = {
      ...blueprint.page.sections[0],
      title: 'Launch your WordPress page in minutes',
      body: 'Gusy turns a brief into editable sections, ready to publish.'
    };
    blueprint = replaceSection(blueprint, hero.id, improvedHero);

    assert.equal(blueprint.page.sections[0].id, hero.id);
    assert.equal(blueprint.page.sections[0].title, 'Launch your WordPress page in minutes');
    assert.equal(blueprint.page.sections[0].body, 'Gusy turns a brief into editable sections, ready to publish.');

    const publishPayload = wordpressSavePayload(blueprint, 42, 'publish');
    assert.equal(publishPayload.postId, 42);
    assert.equal(publishPayload.status, 'publish');
    assert.equal(publishPayload.blueprint.page.sections[0].title, 'Launch your WordPress page in minutes');
  });
});
