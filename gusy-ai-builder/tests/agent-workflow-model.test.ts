import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_MISSION_COMPLETE_MESSAGE,
  agentCritiqueText,
  missingMissionSectionTypes,
  resolveFixWithAiRoute
} from '../src/admin/agent-workflow-model';
import type { GusyAudit, GusyBlueprint, GusySection } from '../src/admin/types';

function section(type: string): GusySection {
  return {
    id: `${type}-1`,
    type,
    variant: 'default',
    label: type,
    kicker: '',
    title: type,
    body: `${type} body`,
    items: [],
    settings: {
      background: 'plain',
      spacing: 'lg',
      columns: 2,
      mobileStack: true
    }
  };
}

function blueprint(types: string[] = []): GusyBlueprint {
  return {
    schemaVersion: '1.0',
    page: {
      title: 'Gusy page',
      slug: 'gusy-page',
      language: 'en',
      seo: { metaTitle: '', metaDescription: '' },
      designSystem: {},
      sections: types.map(section)
    }
  };
}

const audit: GusyAudit = {
  summary: {},
  issues: [],
  sectionCount: 0,
  types: [],
  score: 0
};

describe('Gusy agent workflow model', () => {
  it('detects only the sections still needed to finish a page', () => {
    assert.deepEqual(missingMissionSectionTypes(blueprint(['hero', 'faq'])), ['features', 'form']);
  });

  it('turns page critique into concise agent text', () => {
    assert.match(agentCritiqueText(blueprint(), audit), /The page has no sections yet/);
    assert.ok(AGENT_MISSION_COMPLETE_MESSAGE.includes('Run Audit'));
  });

  it('routes fix with AI to strict product actions', () => {
    assert.equal(resolveFixWithAiRoute({ audit, sectionCount: 0, hasSelectedSection: false }), 'finish_page');
    assert.equal(
      resolveFixWithAiRoute({
        audit: { ...audit, issues: ['Missing meta description'] },
        sectionCount: 2,
        hasSelectedSection: false
      }),
      'generate_seo'
    );
    assert.equal(resolveFixWithAiRoute({ audit, sectionCount: 2, hasSelectedSection: false }), 'critique');
    assert.equal(resolveFixWithAiRoute({ audit, sectionCount: 2, hasSelectedSection: true }), 'transform_selected');
  });
});
