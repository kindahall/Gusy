import type { AnnotationDraft, GusyAnnotation, GusySection } from './types';

export function liveAnnotationsForSections(annotations: GusyAnnotation[], sections: GusySection[]): GusyAnnotation[] {
  const sectionIds = new Set(sections.map((section) => section.id));
  return annotations.filter((annotation) => sectionIds.has(annotation.sectionId));
}

export function buildAnnotationInstruction(annotation: GusyAnnotation): string {
  return `Page note for the "${annotation.sectionLabel}" section: ${annotation.note}. Apply the requested change directly to this section. Keep the section useful, concrete, and in English.`;
}

export function annotationFromDraft(options: {
  draft: AnnotationDraft | null;
  sections: GusySection[];
  existingAnnotations: GusyAnnotation[];
  nextStatus: GusyAnnotation['status'];
  now?: Date;
  idFactory?: () => string;
}): { annotation: GusyAnnotation | null; error?: string } {
  if (!options.draft) return { annotation: null };

  const note = options.draft.note.trim();
  const section = options.sections.find((item) => item.id === options.draft?.sectionId);
  if (!section) return { annotation: null, error: 'Section missing' };
  if (!note) return { annotation: null, error: 'Write the annotation' };

  const existing = options.draft.id
    ? options.existingAnnotations.find((item) => item.id === options.draft?.id)
    : undefined;
  const timestamp = (options.now ?? new Date()).toISOString();

  return {
    annotation: {
      id: existing?.id ?? options.idFactory?.() ?? `gusy-annotation-${Date.now()}`,
      sectionId: section.id,
      sectionLabel: section.label,
      note,
      status: options.nextStatus,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    }
  };
}

export function upsertAnnotation(annotations: GusyAnnotation[], annotation: GusyAnnotation): GusyAnnotation[] {
  return [...annotations.filter((item) => item.id !== annotation.id), annotation];
}

export function explicitAnnotationPatch(
  annotation: GusyAnnotation,
  sections: GusySection[]
): Partial<GusySection> | null {
  const quoted = annotation.note.match(/["“”]([^"“”]{3,140})["“”]/u)?.[1]?.trim();
  if (!quoted) return null;

  const lower = annotation.note.toLowerCase();
  const patch: Partial<GusySection> = {};

  if (lower.includes('title') || lower.includes('headline') || lower.includes('titre')) {
    patch.title = quoted;
  } else if (lower.includes('button') || lower.includes('cta') || lower.includes('bouton')) {
    const currentSection = sections.find((section) => section.id === annotation.sectionId);
    patch.cta = { ...(currentSection?.cta ?? {}), label: quoted };
  } else if (lower.includes('text') || lower.includes('body') || lower.includes('texte')) {
    patch.body = quoted;
  }

  return Object.keys(patch).length ? patch : null;
}
