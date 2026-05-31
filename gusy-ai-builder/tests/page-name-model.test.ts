import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanPageSlug, cleanPageTitle, nextSlugAfterTitleChange, pageNameChanged } from '../src/admin/page-name-model';

describe('Gusy page name model', () => {
  it('keeps a usable page title and slug even from empty input', () => {
    assert.equal(cleanPageTitle('   '), 'Untitled page');
    assert.equal(cleanPageSlug('', 'À propos Gusy !'), 'a-propos-gusy');
  });

  it('updates the slug from the title until the user edits the slug manually', () => {
    assert.equal(nextSlugAfterTitleChange('New Landing Page', 'old-slug', false), 'new-landing-page');
    assert.equal(nextSlugAfterTitleChange('New Landing Page', 'manual-slug', true), 'manual-slug');
  });

  it('detects whether a saved page name actually changed', () => {
    assert.equal(pageNameChanged('Home', 'home', 'Home', 'home'), false);
    assert.equal(pageNameChanged('Home', 'home', 'Home', 'homepage'), true);
    assert.equal(pageNameChanged('Home', 'home', 'Pricing', 'pricing'), true);
  });
});
