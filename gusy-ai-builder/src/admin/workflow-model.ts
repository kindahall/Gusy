import { dropIndexForSectionMove } from './canvas-dnd';
import { cloneSection, reorder } from './schema';
import { cloneBlueprint } from './storage';
import type { DropPlacement, GusyBlueprint, GusySection, GusyTemplate } from './types';

export type SaveWorkflowStatus = 'draft' | 'publish';

export function sectionFromTemplate(template: GusyTemplate, id: string): GusySection {
  return {
    ...cloneSection(template.section),
    id
  };
}

export function insertSection(
  blueprint: GusyBlueprint,
  section: GusySection,
  targetId?: string,
  placement: DropPlacement = 'after'
): GusyBlueprint {
  const next = cloneBlueprint(blueprint);
  const targetIndex = targetId ? next.page.sections.findIndex((item) => item.id === targetId) : -1;

  if (targetIndex >= 0) {
    next.page.sections.splice(placement === 'before' ? targetIndex : targetIndex + 1, 0, section);
  } else {
    next.page.sections.push(section);
  }

  return next;
}

export function patchSection(
  blueprint: GusyBlueprint,
  sectionId: string,
  patch: Partial<GusySection>
): GusyBlueprint {
  const next = cloneBlueprint(blueprint);
  next.page.sections = next.page.sections.map((section) =>
    section.id === sectionId ? { ...section, ...patch } : section
  );
  return next;
}

export function replaceSection(blueprint: GusyBlueprint, sectionId: string, replacement: GusySection): GusyBlueprint {
  const next = cloneBlueprint(blueprint);
  next.page.sections = next.page.sections.map((section) =>
    section.id === sectionId ? { ...cloneSection(replacement), id: sectionId } : section
  );
  return next;
}

export function moveSectionByDrop(
  blueprint: GusyBlueprint,
  draggedId: string,
  targetId: string,
  placement: DropPlacement = 'before'
): GusyBlueprint {
  if (draggedId === targetId) return blueprint;

  const from = blueprint.page.sections.findIndex((section) => section.id === draggedId);
  const targetIndex = blueprint.page.sections.findIndex((section) => section.id === targetId);
  if (from < 0 || targetIndex < 0) return blueprint;

  const to = dropIndexForSectionMove(from, targetIndex, placement);
  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      sections: reorder(blueprint.page.sections, from, to)
    }
  };
}

export function moveSectionToIndex(blueprint: GusyBlueprint, from: number, to: number): GusyBlueprint {
  if (from < 0 || to < 0 || from >= blueprint.page.sections.length || to >= blueprint.page.sections.length || from === to) {
    return blueprint;
  }

  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      sections: reorder(blueprint.page.sections, from, to)
    }
  };
}

export function wordpressSavePayload(
  blueprint: GusyBlueprint,
  postId: number | null,
  status: SaveWorkflowStatus
): { blueprint: GusyBlueprint; postId: number | null; status: SaveWorkflowStatus } {
  return { blueprint, postId, status };
}
