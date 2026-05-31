import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  exportFilename,
  exportPayload,
  exportRecord,
  exportWorkflowError,
  importPayloadReady,
  prependExportHistory,
  prettyExportPayload
} from '../src/admin/export-model';
import type { GusyBlueprint } from '../src/admin/types';

function blueprint(slug = 'home'): GusyBlueprint {
  return {
    schemaVersion: '1.0',
    page: {
      title: 'Home',
      slug,
      language: 'en',
      seo: { metaTitle: 'Home', metaDescription: '' },
      designSystem: {},
      sections: []
    }
  };
}

describe('Gusy export workflow model', () => {
  it('derives stable JSON filenames from page slugs', () => {
    assert.equal(exportFilename(blueprint('pricing')), 'pricing.json');
    assert.equal(exportFilename(blueprint('')), 'gusy-page.json');
  });

  it('uses generated export text first and falls back to a blueprint payload', () => {
    assert.equal(exportPayload('{"ready":true}', blueprint()), '{"ready":true}');
    const fallback = JSON.parse(exportPayload('', blueprint('landing')));

    assert.equal(fallback.blueprint.page.slug, 'landing');
  });

  it('formats export payloads consistently for inspector and workspace textareas', () => {
    assert.equal(prettyExportPayload({ a: 1 }), '{\n  "a": 1\n}');
  });

  it('prepends bounded export history records', () => {
    const current = Array.from({ length: 12 }, (_, index) =>
      exportRecord(`old-${index}`, 'JSON', 'Local', `2026-05-26T00:00:${String(index).padStart(2, '0')}.000Z`)
    );
    const next = prependExportHistory(current, exportRecord('new', 'JSON File', 'Download', 'now', '{"blueprint":true}'));

    assert.equal(next.length, 12);
    assert.equal(next[0].name, 'new');
    assert.equal(next[0].payload, '{"blueprint":true}');
    assert.equal(next.at(-1)?.name, 'old-10');
  });

  it('guards empty imports and normalizes export errors', () => {
    assert.equal(importPayloadReady('  '), false);
    assert.equal(importPayloadReady('{"blueprint":{}}'), true);
    assert.equal(exportWorkflowError(new Error('REST failed'), 'Fallback'), 'REST failed');
    assert.equal(exportWorkflowError('nope', 'Fallback'), 'Fallback');
  });
});
