import type { DropPlacement, GusyBlueprint, GusySection, GusyTemplate, LeftTab } from './types';
import {
  addBlueprintSectionItem,
  duplicateBlueprintSectionItem,
  duplicateBlueprintSection,
  moveBlueprintSectionItem,
  patchBlueprintSection,
  patchBlueprintSectionItem,
  patchBlueprintSectionSettings,
  removeBlueprintSection,
  removeBlueprintSectionItem
} from './section-editing-model';
import { insertSection, moveSectionByDrop, moveSectionToIndex, sectionFromTemplate } from './workflow-model';

export type SectionSettingValue = GusySection['settings'][keyof GusySection['settings']];

type UseSectionWorkflowOptions = {
  blueprint: GusyBlueprint;
  sections: GusySection[];
  selected?: GusySection;
  selectedId: string;
  templates: GusyTemplate[];
  replaceBlueprint: (
    nextBlueprint: GusyBlueprint,
    options?: { recordHistory?: boolean; selectedId?: string; resetAudit?: boolean }
  ) => void;
  updateBlueprint: (updater: (draft: GusyBlueprint) => void) => void;
  setSelectedId: (id: string) => void;
  setLeftTab: (tab: LeftTab) => void;
  setStatus: (status: string) => void;
  removeAnnotationsForSection: (sectionId: string) => void;
};

const PREFERRED_QUICK_TEMPLATES: Record<string, string> = {
  header: 'header-nav',
  hero: 'hero-local-service',
  features: 'features-grid',
  testimonials: 'testimonials-slider',
  pricing: 'pricing-two-plans',
  faq: 'faq-conversion',
  form: 'contact-form-qualified'
};

export function useSectionWorkflow({
  blueprint,
  sections,
  selected,
  selectedId,
  templates,
  replaceBlueprint,
  updateBlueprint,
  setSelectedId,
  setLeftTab,
  setStatus,
  removeAnnotationsForSection
}: UseSectionWorkflowOptions) {
  function commitSectionBlueprint(nextBlueprint: GusyBlueprint, nextSelectedId = selectedId) {
    replaceBlueprint(nextBlueprint, { recordHistory: true, selectedId: nextSelectedId });
  }

  function updateSelected(patch: Partial<GusySection>) {
    if (!selected) return;
    updateBlueprint((draft) => {
      const next = patchBlueprintSection(draft, selected.id, patch);
      draft.page.sections = next.page.sections;
    });
  }

  function updateSelectedSettings(key: keyof GusySection['settings'], value: SectionSettingValue) {
    if (!selected) return;
    updateBlueprint((draft) => {
      const next = patchBlueprintSectionSettings(draft, selected.id, { [key]: value });
      draft.page.sections = next.page.sections;
    });
  }

  function updateSectionSettingsById(sectionId: string, patch: Partial<GusySection['settings']>, message = 'Section style updated') {
    commitSectionBlueprint(patchBlueprintSectionSettings(blueprint, sectionId, patch), sectionId);
    setLeftTab('layers');
    setStatus(message);
  }

  function patchSectionById(sectionId: string, patch: Partial<GusySection>) {
    commitSectionBlueprint(patchBlueprintSection(blueprint, sectionId, patch), sectionId);
    setLeftTab('layers');
  }

  function updateSelectedItem(index: number, patch: Partial<GusySection['items'][number]>) {
    if (!selected) return;
    updateBlueprint((draft) => {
      const next = patchBlueprintSectionItem(draft, selected.id, index, patch);
      draft.page.sections = next.page.sections;
    });
  }

  function addSelectedItem() {
    if (!selected) return;
    updateBlueprint((draft) => {
      const next = addBlueprintSectionItem(draft, selected.id);
      draft.page.sections = next.page.sections;
    });
  }

  function removeSelectedItem(index: number) {
    if (!selected) return;
    updateBlueprint((draft) => {
      const next = removeBlueprintSectionItem(draft, selected.id, index);
      draft.page.sections = next.page.sections;
    });
  }

  function duplicateSelectedItem(index: number) {
    if (!selected) return;
    updateBlueprint((draft) => {
      const next = duplicateBlueprintSectionItem(draft, selected.id, index);
      draft.page.sections = next.page.sections;
    });
    setStatus('Item duplicated');
  }

  function moveSelectedItem(index: number, direction: -1 | 1) {
    if (!selected) return;
    updateBlueprint((draft) => {
      const next = moveBlueprintSectionItem(draft, selected.id, index, direction);
      draft.page.sections = next.page.sections;
    });
    setStatus('Item moved');
  }

  function addTemplate(template: GusyTemplate) {
    const section = sectionFromTemplate(template, `gusy-${template.id}-${Date.now()}`);
    commitSectionBlueprint(insertSection(blueprint, section), section.id);
    setLeftTab('layers');
    setStatus(`${section.label} added`);
  }

  function duplicateSelected() {
    if (!selected) return;
    duplicateSectionById(selected.id);
  }

  function removeSelected() {
    if (!selected) return;
    removeSectionById(selected.id);
  }

  function moveSection(from: number, to: number) {
    commitSectionBlueprint(moveSectionToIndex(blueprint, from, to), selectedId);
    setStatus('Section moved');
  }

  function templateFor(type: string): GusyTemplate | undefined {
    const preferredId = PREFERRED_QUICK_TEMPLATES[type];
    const preferred = preferredId ? templates.find((template) => template.id === preferredId) : undefined;
    return preferred ?? templates.find((template) => template.type === type || template.id.includes(type));
  }

  function makeSectionFromTemplate(type: string, index: number): GusySection | null {
    const template = templateFor(type);
    if (!template) return null;
    return sectionFromTemplate(template, `gusy-${type}-${Date.now()}-${index}`);
  }

  function quickAddBlock(type: string, targetId?: string, placement: DropPlacement = 'after') {
    const section = makeSectionFromTemplate(type, sections.length);
    if (!section) {
      setStatus('Block unavailable');
      return;
    }
    commitSectionBlueprint(insertSection(blueprint, section, targetId, placement), section.id);
    setLeftTab('layers');
    setStatus(`${section.label} added`);
  }

  function reorderSection(draggedId: string, targetId: string, placement: DropPlacement = 'before') {
    if (draggedId === targetId) return;
    const nextBlueprint = moveSectionByDrop(blueprint, draggedId, targetId, placement);
    if (nextBlueprint === blueprint) return;
    commitSectionBlueprint(nextBlueprint, draggedId);
    setLeftTab('layers');
    setStatus('Section moved');
  }

  function moveSectionById(sectionId: string, direction: -1 | 1) {
    const from = sections.findIndex((section) => section.id === sectionId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= sections.length) return;
    commitSectionBlueprint(moveSectionToIndex(blueprint, from, to), sectionId);
    setStatus('Section moved');
  }

  function duplicateSectionById(sectionId: string) {
    const result = duplicateBlueprintSection(blueprint, sectionId, `${sectionId}-copy-${Date.now()}`);
    if (!result.duplicatedId) return;
    commitSectionBlueprint(result.blueprint, result.duplicatedId);
    setStatus('Section copied');
  }

  function removeSectionById(sectionId: string) {
    const result = removeBlueprintSection(blueprint, sectionId);
    commitSectionBlueprint(result.blueprint, result.nextSelectedId);
    removeAnnotationsForSection(sectionId);
    setStatus('Section deleted');
  }

  return {
    addSelectedItem,
    addTemplate,
    duplicateSelected,
    duplicateSelectedItem,
    duplicateSectionById,
    makeSectionFromTemplate,
    moveSection,
    moveSectionById,
    moveSelectedItem,
    patchSectionById,
    quickAddBlock,
    removeSelected,
    removeSelectedItem,
    removeSectionById,
    reorderSection,
    updateSectionSettingsById,
    updateSelected,
    updateSelectedItem,
    updateSelectedSettings
  };
}
