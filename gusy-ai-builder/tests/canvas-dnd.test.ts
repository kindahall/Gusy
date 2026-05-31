import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK_DRAG_MIME, SECTION_DRAG_MIME } from '../src/admin/builder-options';
import { dragTypesFromList, dropIndexForSectionMove, placementFromVerticalPoint } from '../src/admin/canvas-dnd';

describe('Gusy canvas drag and drop rules', () => {
  it('chooses before or after from the vertical pointer position', () => {
    assert.equal(placementFromVerticalPoint(99, 100, 80), 'before');
    assert.equal(placementFromVerticalPoint(120, 100, 80), 'before');
    assert.equal(placementFromVerticalPoint(141, 100, 80), 'after');
  });

  it('detects section and block drags from data transfer types', () => {
    assert.deepEqual(dragTypesFromList([SECTION_DRAG_MIME]), { section: true, block: false });
    assert.deepEqual(dragTypesFromList([BLOCK_DRAG_MIME]), { section: false, block: true });
    assert.deepEqual(dragTypesFromList(['text/plain']), { section: false, block: true });
    assert.deepEqual(dragTypesFromList(['Files']), { section: false, block: false });
  });

  it('keeps reorder indices stable when moving up or down', () => {
    assert.equal(dropIndexForSectionMove(0, 2, 'before'), 1);
    assert.equal(dropIndexForSectionMove(0, 2, 'after'), 2);
    assert.equal(dropIndexForSectionMove(3, 1, 'before'), 1);
    assert.equal(dropIndexForSectionMove(3, 1, 'after'), 2);
  });
});
