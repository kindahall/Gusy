import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UI_LANGUAGE_KEY, getInitialUiLanguage, normalizeUiLanguage, translateUiValue } from '../src/admin/i18n';

describe('Gusy UI translations', () => {
  it('detects French WordPress locales', () => {
    assert.equal(normalizeUiLanguage('fr_FR'), 'fr');
    assert.equal(normalizeUiLanguage('en_US'), 'en');
    assert.equal(normalizeUiLanguage(undefined), 'en');
  });

  it('keeps English as the default app language even on French WordPress installs', () => {
    const previousWindow = (globalThis as { window?: unknown }).window;
    delete (globalThis as { window?: unknown }).window;
    assert.equal(getInitialUiLanguage({ locale: 'fr_FR' } as never), 'en');
    (globalThis as { window?: { localStorage: { getItem: (key: string) => string | null } } }).window = {
      localStorage: {
        getItem: (key: string) => key === UI_LANGUAGE_KEY ? 'fr' : null
      }
    };
    assert.equal(getInitialUiLanguage({ locale: 'en_US' } as never), 'fr');
    (globalThis as { window?: unknown }).window = previousWindow;
  });

  it('translates exact UI labels both ways', () => {
    assert.equal(translateUiValue('Ready', 'fr'), 'Prêt');
    assert.equal(translateUiValue('Prêt', 'en'), 'Ready');
    assert.equal(translateUiValue('Save Draft', 'fr'), 'Enregistrer le brouillon');
    assert.equal(translateUiValue('Enregistrer le brouillon', 'en'), 'Save Draft');
  });

  it('preserves surrounding whitespace and unknown text', () => {
    assert.equal(translateUiValue('  Ready  ', 'fr'), '  Prêt  ');
    assert.equal(translateUiValue('Custom section', 'fr'), 'Custom section');
    assert.equal(translateUiValue('', 'fr'), '');
  });

  it('handles dynamic annotation labels', () => {
    assert.equal(translateUiValue('Annotate Hero', 'fr'), 'Annoter Hero');
    assert.equal(translateUiValue('Annoter Hero', 'en'), 'Annotate Hero');
  });
});
