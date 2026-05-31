import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMigrationPreview } from '../src/admin/migration-model';
import type { GusyAudit, GusyBlueprint, GusyElementorPage } from '../src/admin/types';

const blueprint: GusyBlueprint = {
  schemaVersion: '1.0',
  page: {
    title: 'Imported',
    slug: 'imported',
    language: 'en',
    seo: {
      metaTitle: 'Imported',
      metaDescription: ''
    },
    designSystem: {},
    sections: []
  }
};

const audit: GusyAudit = {
  summary: {},
  issues: [],
  sectionCount: 0,
  types: [],
  score: 76
};

const sourcePage: GusyElementorPage = {
  id: 12,
  title: 'Source',
  type: 'page',
  status: 'publish',
  modifiedAt: '2026-05-26',
  hasElementorData: true,
  source: 'elementor',
  compatibility: 88,
  textCount: 34,
  widgetCount: 9,
  warnings: ['Unsupported carousel']
};

describe('Gusy migration workflow model', () => {
  it('builds migration previews from response metrics first', () => {
    const preview = buildMigrationPreview(
      {
        blueprint,
        audit,
        original: { id: 12, title: 'Converted', viewLink: '/converted' },
        metrics: {
          source: 'wordpress',
          compatibility: 91,
          textCount: 40,
          widgetCount: 3,
          warnings: []
        }
      },
      blueprint,
      [sourcePage]
    );

    assert.equal(preview.title, 'Converted');
    assert.equal(preview.source, 'wordpress');
    assert.equal(preview.compatibility, 91);
    assert.equal(preview.textCount, 40);
    assert.equal(preview.widgetCount, 3);
    assert.deepEqual(preview.warnings, []);
    assert.equal(preview.viewLink, '/converted');
  });

  it('falls back to scanned page data and audit score', () => {
    const preview = buildMigrationPreview(
      {
        blueprint,
        audit,
        original: { id: 12, title: 'Converted' }
      },
      blueprint,
      [sourcePage]
    );

    assert.equal(preview.source, 'elementor');
    assert.equal(preview.compatibility, 88);
    assert.equal(preview.textCount, 34);
    assert.equal(preview.widgetCount, 9);
    assert.deepEqual(preview.warnings, ['Unsupported carousel']);

    const unknown = buildMigrationPreview({ blueprint, audit, original: { id: 99, title: 'Unknown' } }, blueprint, []);
    assert.equal(unknown.source, 'wordpress');
    assert.equal(unknown.compatibility, 76);
    assert.deepEqual(unknown.warnings, []);
  });
});
