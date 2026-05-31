import type { DropPlacement } from './types';
import { BLOCK_DRAG_MIME, SECTION_DRAG_MIME } from './builder-options';

export type DragKindState = {
  section: boolean;
  block: boolean;
};

export function placementFromVerticalPoint(clientY: number, top: number, height: number): DropPlacement {
  return clientY < top + height / 2 ? 'before' : 'after';
}

export function dragTypesFromList(types: Iterable<string>): DragKindState {
  const list = Array.from(types);
  return {
    section: list.includes(SECTION_DRAG_MIME),
    block: list.includes(BLOCK_DRAG_MIME) || list.includes('text/plain')
  };
}

export function dropIndexForSectionMove(from: number, targetIndex: number, placement: DropPlacement): number {
  let to = placement === 'after' ? targetIndex + 1 : targetIndex;
  if (from < to) to -= 1;
  return to;
}
