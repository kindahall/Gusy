import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyPendingPageName, prepareRenamedBlueprint, savedPageLink, savedPageStatusLabel, uniqueBlankPageTitle } from '../src/admin/page-workflow';
import type { GusyBlueprint } from '../src/admin/types';

function blueprint(title = 'Home', metaTitle = title): GusyBlueprint {
  return {
    schemaVersion: '1.0',
    page: {
      title,
      slug: title.toLowerCase(),
      language: 'en',
      seo: { metaTitle, metaDescription: '' },
      designSystem: {},
      sections: []
    }
  };
}

describe('Gusy page workflow model', () => {
  it('creates a unique blank page name from saved pages and current canvas', () => {
    assert.equal(uniqueBlankPageTitle([], 'Home'), 'Untitled page');
    assert.equal(
      uniqueBlankPageTitle([{ title: 'Untitled page' }, { title: 'Untitled page 2' }], 'Untitled page 3'),
      'Untitled page 4'
    );
  });

  it('renames a blueprint without mutating it and keeps custom SEO titles', () => {
    const current = blueprint('Old title', 'Custom SEO');
    const renamed = prepareRenamedBlueprint(current, ' New title ', 'new/custom!');

    assert.equal(current.page.title, 'Old title');
    assert.equal(renamed.page.title, 'New title');
    assert.equal(renamed.page.slug, 'new-custom');
    assert.equal(renamed.page.seo.metaTitle, 'Custom SEO');

    const autoSeo = prepareRenamedBlueprint(blueprint('Old title'), 'Landing', '');
    assert.equal(autoSeo.page.seo.metaTitle, 'Landing');
  });

  it('applies pending page names before a WordPress save', () => {
    const current = blueprint('Untitled page');
    const renamed = applyPendingPageName(current, 'Real business page', 'real-business-page');

    assert.notEqual(renamed, current);
    assert.equal(renamed.page.title, 'Real business page');
    assert.equal(renamed.page.slug, 'real-business-page');
    assert.equal(applyPendingPageName(renamed, 'Real business page', 'real-business-page'), renamed);
  });

  it('derives user-facing save state from WordPress responses', () => {
    assert.equal(savedPageLink({ viewLink: '/view', editLink: '/edit' }), '/view');
    assert.equal(savedPageLink({ editLink: '/edit' }), '/edit');
    assert.equal(savedPageStatusLabel('publish'), 'Published');
    assert.equal(savedPageStatusLabel('draft'), 'Draft');
  });
});
