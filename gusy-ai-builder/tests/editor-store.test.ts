import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlueprintDraft,
  firstSectionId,
  pushHistory,
  redoHistory,
  replaceBlueprintState,
  restoreHistory,
  type CoreEditorState
} from '../src/admin/editor-store';
import type { GusyBlueprint, GusySection } from '../src/admin/types';

function section(id: string, type = 'hero'): GusySection {
  return {
    id,
    type,
    variant: 'default',
    label: type,
    kicker: '',
    title: id,
    body: '',
    items: [],
    settings: {
      background: 'plain',
      spacing: 'lg',
      columns: 2,
      mobileStack: true
    }
  };
}

function blueprint(title: string, sections: GusySection[] = []): GusyBlueprint {
  return {
    schemaVersion: '1.0',
    page: {
      title,
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      language: 'en',
      seo: { metaTitle: title, metaDescription: '' },
      designSystem: {},
      sections
    }
  };
}

function state(current: GusyBlueprint): CoreEditorState {
  return {
    blueprint: current,
    selectedId: firstSectionId(current),
    versions: [],
    redoVersions: [],
    audit: null
  };
}

describe('Gusy editor store primitives', () => {
  it('creates editable drafts without mutating the current blueprint', () => {
    const current = blueprint('Home', [section('hero')]);
    const next = createBlueprintDraft(current, (draft) => {
      draft.page.title = 'Changed';
      draft.page.sections[0].title = 'Changed hero';
    });

    assert.equal(current.page.title, 'Home');
    assert.equal(current.page.sections[0].title, 'hero');
    assert.equal(next.page.title, 'Changed');
    assert.equal(next.page.sections[0].title, 'Changed hero');
  });

  it('pushes, restores and redoes blueprint history predictably', () => {
    const first = blueprint('First', [section('a')]);
    const second = blueprint('Second', [section('b')]);
    const withHistory = pushHistory(state(first));
    const edited = { ...withHistory, blueprint: second, selectedId: 'b' };
    const restored = restoreHistory(edited);
    const redone = redoHistory(restored);

    assert.equal(withHistory.versions[0].page.title, 'First');
    assert.equal(restored.blueprint.page.title, 'First');
    assert.equal(restored.selectedId, 'a');
    assert.equal(restored.redoVersions[0].page.title, 'Second');
    assert.equal(redone.blueprint.page.title, 'Second');
    assert.equal(redone.selectedId, 'b');
  });

  it('replaces blueprints while controlling history, selection and audit reset', () => {
    const oldBlueprint = blueprint('Old', [section('old')]);
    const newBlueprint = blueprint('New', [section('new')]);
    const current = { ...state(oldBlueprint), audit: { summary: {}, issues: ['x'], sectionCount: 1, types: ['hero'], score: 50 } };

    const replaced = replaceBlueprintState(current, newBlueprint, { recordHistory: true });
    const keepAudit = replaceBlueprintState(current, newBlueprint, { resetAudit: false, selectedId: 'manual' });

    assert.equal(replaced.blueprint.page.title, 'New');
    assert.equal(replaced.versions[0].page.title, 'Old');
    assert.equal(replaced.selectedId, 'new');
    assert.equal(replaced.audit, null);
    assert.equal(keepAudit.audit?.score, 50);
    assert.equal(keepAudit.selectedId, 'manual');
  });
});
