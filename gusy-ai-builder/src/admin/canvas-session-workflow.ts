import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { CanvasMenuState, GusyBlueprint, GusySection, LeftTab } from './types';

export function useCanvasSessionWorkflow(options: {
  patchSectionById: (sectionId: string, patch: Partial<GusySection>) => void;
  updateBlueprint: (updater: (draft: GusyBlueprint) => void) => void;
  setLeftTab: (tab: LeftTab) => void;
  setSelectedId: (sectionId: string) => void;
  setStatus: (status: string) => void;
}) {
  const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState | null>(null);

  function updateCanvasSection(sectionId: string, patch: Partial<GusySection>): void {
    options.patchSectionById(sectionId, patch);
    options.setStatus('Content updated');
  }

  function updateCanvasItem(sectionId: string, itemIndex: number, patch: Partial<GusySection['items'][number]>): void {
    options.updateBlueprint((draft) => {
      const section = draft.page.sections.find((candidate) => candidate.id === sectionId);
      if (!section || !section.items[itemIndex]) return;
      section.items[itemIndex] = { ...section.items[itemIndex], ...patch };
    });
    options.setSelectedId(sectionId);
    options.setLeftTab('layers');
    options.setStatus('Content updated');
  }

  function openCanvasMenu(event: ReactMouseEvent, sectionId?: string): void {
    event.preventDefault();
    event.stopPropagation();
    if (sectionId) {
      options.setSelectedId(sectionId);
      options.setLeftTab('layers');
    }
    setCanvasMenu({ x: event.clientX, y: event.clientY, sectionId });
  }

  return {
    canvasMenu,
    openCanvasMenu,
    setCanvasMenu,
    updateCanvasItem,
    updateCanvasSection
  };
}
