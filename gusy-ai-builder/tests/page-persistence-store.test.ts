import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  pageLoadLink,
  pagePersistenceError,
  pageSaveStartStatus,
  shouldUseCachedPreview
} from '../src/admin/page-persistence-model';

describe('Gusy WordPress page persistence model', () => {
  it('prefers public links for loaded pages but keeps edit links as a fallback', () => {
    assert.equal(pageLoadLink({ viewLink: '/view', previewLink: '/preview', editLink: '/edit' }), '/view');
    assert.equal(pageLoadLink({ previewLink: '/preview', editLink: '/edit' }), '/preview');
    assert.equal(pageLoadLink({ editLink: '/edit' }), '/edit');
    assert.equal(pageLoadLink({}), '');
  });

  it('uses precise save statuses for draft and publish operations', () => {
    assert.equal(pageSaveStartStatus('draft'), 'Saving');
    assert.equal(pageSaveStartStatus('publish'), 'Publishing');
  });

  it('does not create draft previews when a cached preview link already exists', () => {
    assert.equal(shouldUseCachedPreview('/existing'), true);
    assert.equal(shouldUseCachedPreview('   '), false);
  });

  it('normalizes unknown persistence errors into useful UI statuses', () => {
    assert.equal(pagePersistenceError(new Error('REST rejected'), 'Fallback'), 'REST rejected');
    assert.equal(pagePersistenceError('nope', 'Fallback'), 'Fallback');
  });
});
