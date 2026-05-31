import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ANNOTATIONS_STORAGE_KEY, EXPORT_HISTORY_KEY, STORAGE_KEY } from '../src/admin/builder-options';
import {
  persistAnnotations,
  persistExportHistory,
  readAnnotations,
  readDevice,
  readExportHistory,
  readInitialBlueprint
} from '../src/admin/storage';
import type { GusySettings } from '../src/admin/types';

type TestWindow = { localStorage: Storage };

const originalWindow = (globalThis as unknown as { window?: TestWindow }).window;

function installStorage(seed: Record<string, string> = {}): Record<string, string> {
  const values = { ...seed };
  const localStorage = {
    getItem: (key: string) => values[key] ?? null,
    setItem: (key: string, value: string) => {
      values[key] = value;
    },
    removeItem: (key: string) => {
      delete values[key];
    },
    clear: () => {
      Object.keys(values).forEach((key) => delete values[key]);
    },
    key: (index: number) => Object.keys(values)[index] ?? null,
    get length() {
      return Object.keys(values).length;
    }
  } as Storage;

  (globalThis as unknown as { window: TestWindow }).window = { localStorage };
  return values;
}

const settings: GusySettings = {
  restBase: '/wp-json/gusy/v1',
  nonce: 'nonce',
  templates: [],
  brandKit: {},
  siteName: 'Test',
  adminUrl: '/wp-admin/',
  canPublish: true,
  pluginVersion: 'test',
  locale: 'en_US'
};

afterEach(() => {
  if (originalWindow) {
    (globalThis as unknown as { window: TestWindow }).window = originalWindow;
  } else {
    delete (globalThis as unknown as { window?: TestWindow }).window;
  }
});

describe('Gusy browser storage', () => {
  it('falls back cleanly when localStorage is unavailable', () => {
    delete (globalThis as unknown as { window?: TestWindow }).window;

    assert.equal(readDevice(), 'desktop');
    assert.equal(readInitialBlueprint(settings).page.title, 'Untitled page');
  });

  it('filters corrupted annotations and export records', () => {
    installStorage({
      [ANNOTATIONS_STORAGE_KEY]: JSON.stringify([
        { id: 'a1', sectionId: 'hero', sectionLabel: 'Hero', note: 'Fix copy', status: 'open', createdAt: 'now' },
        { id: 'bad' }
      ]),
      [EXPORT_HISTORY_KEY]: JSON.stringify([
        { name: 'Home', type: 'JSON', destination: 'Local', date: 'today' },
        { name: 'Broken' }
      ])
    });

    assert.equal(readAnnotations().length, 1);
    assert.equal(readExportHistory().length, 1);
  });

  it('does not show stale browser drafts while opening a WordPress post in Gusy', () => {
    installStorage({
      [STORAGE_KEY]: JSON.stringify({
        schemaVersion: '1.0',
        page: {
          title: 'Stale local draft',
          slug: 'stale-local-draft',
          language: 'en',
          seo: { metaTitle: 'Stale local draft', metaDescription: '' },
          designSystem: {},
          sections: []
        }
      })
    });

    assert.equal(readInitialBlueprint({ ...settings, initialPostId: 123 }).page.title, 'Untitled page');
    assert.equal(readInitialBlueprint({ ...settings, initialEdit: true }).page.title, 'Untitled page');
  });

  it('persists bounded annotation and export history lists', () => {
    const storage = installStorage();
    persistAnnotations(Array.from({ length: 82 }, (_, index) => ({
      id: `a${index}`,
      sectionId: 'hero',
      sectionLabel: 'Hero',
      note: `Note ${index}`,
      status: 'open' as const,
      createdAt: 'now'
    })));
    persistExportHistory(Array.from({ length: 14 }, (_, index) => ({
      name: `Export ${index}`,
      type: 'JSON',
      destination: 'Local',
      date: 'today'
    })));

    assert.equal(JSON.parse(storage[ANNOTATIONS_STORAGE_KEY]).length, 80);
    assert.equal(JSON.parse(storage[EXPORT_HISTORY_KEY]).length, 12);
  });
});
