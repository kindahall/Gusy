import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  brandKitSavedBlueprint,
  brandSaveErrorMessage,
  themeAdaptationErrorMessage,
  themeAppliedStatus
} from '../src/admin/brand-workflow-model';
import type { GusyBlueprint } from '../src/admin/types';

function blueprint(): GusyBlueprint {
  return {
    schemaVersion: '1.0',
    page: {
      title: 'Brand page',
      slug: 'brand-page',
      language: 'en',
      seo: { metaTitle: 'Brand page', metaDescription: '' },
      designSystem: { colors: { primary: '#111111' } },
      sections: []
    }
  };
}

describe('Gusy brand workflow model', () => {
  it('applies saved brand kits without mutating the current blueprint', () => {
    const current = blueprint();
    const next = brandKitSavedBlueprint(current, { colors: { primary: '#2563eb' }, radius: { lg: '16px' } });

    assert.notEqual(next, current);
    assert.deepEqual(current.page.designSystem, { colors: { primary: '#111111' } });
    assert.deepEqual(next.page.designSystem, { colors: { primary: '#2563eb' }, radius: { lg: '16px' } });
  });

  it('keeps brand and theme statuses explicit', () => {
    assert.equal(brandSaveErrorMessage(new Error('REST failed')), 'REST failed');
    assert.equal(brandSaveErrorMessage('nope'), 'Brand save failed');
    assert.equal(themeAdaptationErrorMessage(new Error('Theme unavailable')), 'Theme unavailable');
    assert.equal(themeAdaptationErrorMessage(null), 'Theme adaptation failed');
    assert.equal(themeAppliedStatus('Twenty Twenty-Six'), 'Theme applied: Twenty Twenty-Six');
    assert.equal(themeAppliedStatus(''), 'Theme applied: WordPress theme');
  });
});
