import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInitialPostId } from '../src/admin/settings';

describe('Gusy localized settings', () => {
  it('does not treat WordPress-localized zero strings as a page id', () => {
    assert.equal(normalizeInitialPostId('0'), 0);
    assert.equal(normalizeInitialPostId(0), 0);
    assert.equal(normalizeInitialPostId(undefined), 0);
  });

  it('accepts real initial page ids from WordPress URLs', () => {
    assert.equal(normalizeInitialPostId('42'), 42);
    assert.equal(normalizeInitialPostId(42), 42);
  });
});
