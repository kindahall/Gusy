import { useEffect, useMemo, useState } from 'react';
import {
  annotationFromDraft,
  buildAnnotationInstruction,
  explicitAnnotationPatch,
  liveAnnotationsForSections,
  upsertAnnotation
} from './annotation-model';
import { persistAnnotations, readAnnotations } from './storage';
import type { AnnotationDraft, GusyAnnotation, GusySection, LeftTab } from './types';

export function useAnnotationWorkflow(options: {
  sections: GusySection[];
  setSelectedId: (sectionId: string) => void;
  setLeftTab: (tab: LeftTab) => void;
  setStatus: (status: string) => void;
  transformSectionById: (sectionId: string, instruction: string) => Promise<void>;
  patchSectionById: (sectionId: string, patch: Partial<GusySection>) => void;
}) {
  const [annotationMode, setAnnotationMode] = useState(false);
  const [annotationDraft, setAnnotationDraft] = useState<AnnotationDraft | null>(null);
  const [annotations, setAnnotations] = useState<GusyAnnotation[]>(() => readAnnotations());
  const liveAnnotations = useMemo(
    () => liveAnnotationsForSections(annotations, options.sections),
    [annotations, options.sections]
  );

  useEffect(() => {
    persistAnnotations(annotations);
  }, [annotations]);

  function clearPageAnnotations() {
    setAnnotations([]);
    setAnnotationDraft(null);
    setAnnotationMode(false);
  }

  function removeAnnotationsForSection(sectionId: string) {
    setAnnotations((current) => current.filter((annotation) => annotation.sectionId !== sectionId));
    setAnnotationDraft((current) => current?.sectionId === sectionId ? null : current);
  }

  function toggleAnnotationMode() {
    if (!options.sections.length) {
      options.setLeftTab('layers');
      options.setStatus('Add a section first');
      return;
    }
    options.setLeftTab('layers');
    setAnnotationDraft(null);
    setAnnotationMode((current) => {
      const next = !current;
      options.setStatus(next ? 'Annotate a section' : 'Ready');
      return next;
    });
  }

  function startAnnotation(sectionId: string) {
    const section = options.sections.find((item) => item.id === sectionId);
    if (!section) return;
    options.setSelectedId(sectionId);
    options.setLeftTab('layers');
    setAnnotationMode(false);
    setAnnotationDraft({ sectionId, note: '' });
    options.setStatus('Annotation');
  }

  function editAnnotation(annotationId: string) {
    const annotation = annotations.find((item) => item.id === annotationId);
    if (!annotation) return;
    options.setSelectedId(annotation.sectionId);
    options.setLeftTab('layers');
    setAnnotationMode(false);
    setAnnotationDraft({ id: annotation.id, sectionId: annotation.sectionId, note: annotation.note });
    options.setStatus('Annotation');
  }

  function updateAnnotationDraft(note: string) {
    setAnnotationDraft((current) => current ? { ...current, note } : current);
  }

  function closeAnnotationDraft() {
    setAnnotationDraft(null);
  }

  function commitAnnotationDraft(nextStatus: GusyAnnotation['status']): GusyAnnotation | null {
    const result = annotationFromDraft({
      draft: annotationDraft,
      sections: options.sections,
      existingAnnotations: annotations,
      nextStatus
    });

    if (!result.annotation) {
      if (result.error) options.setStatus(result.error);
      return null;
    }

    setAnnotations((current) => upsertAnnotation(current, result.annotation as GusyAnnotation));
    return result.annotation;
  }

  function saveAnnotationDraft() {
    const annotation = commitAnnotationDraft('open');
    if (!annotation) return;
    setAnnotationDraft(null);
    options.setStatus('Annotation saved');
  }

  async function applyAnnotationDraft() {
    const annotation = commitAnnotationDraft('open');
    if (!annotation) return;
    setAnnotationDraft(null);
    await applyAnnotation(annotation);
  }

  async function applyAnnotation(annotation: GusyAnnotation) {
    await options.transformSectionById(annotation.sectionId, buildAnnotationInstruction(annotation));
    const patch = explicitAnnotationPatch(annotation, options.sections);
    if (patch) {
      options.patchSectionById(annotation.sectionId, patch);
    }
    setAnnotations((current) =>
      current.map((item) =>
        item.id === annotation.id ? { ...item, status: 'applied', updatedAt: new Date().toISOString() } : item
      )
    );
    options.setStatus('Annotation applied');
  }

  function removeAnnotation(annotationId: string) {
    setAnnotations((current) => current.filter((item) => item.id !== annotationId));
    setAnnotationDraft((current) => current?.id === annotationId ? null : current);
    options.setStatus('Annotation removed');
  }

  return {
    annotationDraft,
    annotationMode,
    annotations,
    applyAnnotation,
    applyAnnotationDraft,
    clearPageAnnotations,
    closeAnnotationDraft,
    editAnnotation,
    liveAnnotations,
    removeAnnotation,
    removeAnnotationsForSection,
    saveAnnotationDraft,
    startAnnotation,
    toggleAnnotationMode,
    updateAnnotationDraft
  };
}
