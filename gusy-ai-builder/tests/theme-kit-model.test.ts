import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_THEME_SETTINGS,
  normalizeThemeSettings,
  themeImportStatus,
  themeKitLoadStatus,
  themeWorkflowError
} from '../src/admin/theme-kit-model';
import type { GusyThemeKitResponse } from '../src/admin/types';

function response(patch: Partial<GusyThemeKitResponse> = {}): GusyThemeKitResponse {
  return {
    available: true,
    kits: [],
    settings: DEFAULT_THEME_SETTINGS,
    ...patch
  };
}

describe('Gusy theme kit workflow model', () => {
  it('normalizes partial theme settings for durable state', () => {
    assert.deepEqual(normalizeThemeSettings({ language: 'fr', setHomeOnImport: false }), {
      ...DEFAULT_THEME_SETTINGS,
      language: 'fr',
      setHomeOnImport: false
    });
    assert.equal(normalizeThemeSettings().language, 'en');
  });

  it('turns theme kit load responses into product statuses', () => {
    assert.equal(themeKitLoadStatus(response({ kits: [{ id: 'one' } as never, { id: 'two' } as never] })), '2 kits ready');
    assert.equal(themeKitLoadStatus(response({ available: false, message: 'Install the base theme' })), 'Install the base theme');
    assert.equal(themeKitLoadStatus(response({ available: false, message: '' })), 'Theme kits unavailable');
  });

  it('reports imports and unknown errors without leaking implementation detail', () => {
    assert.equal(themeImportStatus({ pages: [{ id: 1, type: 'home', title: 'Home', status: 'publish' }] }), '1 page imported');
    assert.equal(themeImportStatus({ pages: [] }), '0 pages imported');
    assert.equal(themeWorkflowError(new Error('Network failed'), 'Fallback'), 'Network failed');
    assert.equal(themeWorkflowError('bad', 'Fallback'), 'Fallback');
  });
});
