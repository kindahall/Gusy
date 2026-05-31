import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { buildLocalAudit } from './schema';
import { cloneBlueprint, persistBlueprint, readInitialBlueprint } from './storage';
import type { GusyAudit, GusyBlueprint, GusySettings } from './types';

const HISTORY_LIMIT = 16;

export type CoreEditorState = {
  blueprint: GusyBlueprint;
  selectedId: string;
  versions: GusyBlueprint[];
  redoVersions: GusyBlueprint[];
  audit: GusyAudit | null;
};

export function firstSectionId(blueprint: GusyBlueprint): string {
  return blueprint.page.sections[0]?.id ?? '';
}

export function createBlueprintDraft(blueprint: GusyBlueprint, updater: (draft: GusyBlueprint) => void): GusyBlueprint {
  const draft = cloneBlueprint(blueprint);
  updater(draft);
  return draft;
}

export function pushHistory(state: CoreEditorState): CoreEditorState {
  return {
    ...state,
    versions: [state.blueprint, ...state.versions].slice(0, HISTORY_LIMIT),
    redoVersions: []
  };
}

export function restoreHistory(state: CoreEditorState): CoreEditorState {
  const [latest, ...rest] = state.versions;
  if (!latest) return state;

  return {
    ...state,
    blueprint: latest,
    selectedId: firstSectionId(latest),
    versions: rest,
    redoVersions: [state.blueprint, ...state.redoVersions].slice(0, HISTORY_LIMIT)
  };
}

export function redoHistory(state: CoreEditorState): CoreEditorState {
  const [latest, ...rest] = state.redoVersions;
  if (!latest) return state;

  return {
    ...state,
    blueprint: latest,
    selectedId: firstSectionId(latest),
    versions: [state.blueprint, ...state.versions].slice(0, HISTORY_LIMIT),
    redoVersions: rest
  };
}

export function replaceBlueprintState(
  state: CoreEditorState,
  blueprint: GusyBlueprint,
  options: { recordHistory?: boolean; selectedId?: string; resetAudit?: boolean } = {}
): CoreEditorState {
  const nextState = options.recordHistory ? pushHistory(state) : state;

  return {
    ...nextState,
    blueprint,
    selectedId: options.selectedId ?? firstSectionId(blueprint),
    audit: options.resetAudit === false ? nextState.audit : null
  };
}

export function useBlueprintStore(settings: GusySettings) {
  const [blueprint, setBlueprint] = useState<GusyBlueprint>(() => readInitialBlueprint(settings));
  const [selectedId, setSelectedId] = useState<string>(() => firstSectionId(blueprint));
  const [versions, setVersions] = useState<GusyBlueprint[]>([]);
  const [redoVersions, setRedoVersions] = useState<GusyBlueprint[]>([]);
  const [audit, setAudit] = useState<GusyAudit | null>(null);

  useEffect(() => {
    persistBlueprint(blueprint);
  }, [blueprint]);

  const sections = blueprint.page.sections;
  const selected = useMemo(
    () => selectedId ? sections.find((section) => section.id === selectedId) : undefined,
    [sections, selectedId]
  );
  const localAudit = useMemo(
    () => audit ?? buildLocalAudit(blueprint),
    [audit, blueprint]
  );

  function pushVersion(snapshot = blueprint): void {
    setVersions((current) => [snapshot, ...current].slice(0, HISTORY_LIMIT));
    setRedoVersions([]);
  }

  function restoreVersion(): boolean {
    const [latest, ...rest] = versions;
    if (!latest) return false;

    setRedoVersions((future) => [blueprint, ...future].slice(0, HISTORY_LIMIT));
    setVersions(rest);
    setBlueprint(latest);
    setSelectedId(firstSectionId(latest));
    return true;
  }

  function redoVersion(): boolean {
    const [latest, ...rest] = redoVersions;
    if (!latest) return false;

    setVersions((history) => [blueprint, ...history].slice(0, HISTORY_LIMIT));
    setRedoVersions(rest);
    setBlueprint(latest);
    setSelectedId(firstSectionId(latest));
    return true;
  }

  function replaceBlueprint(
    nextBlueprint: GusyBlueprint,
    options: { recordHistory?: boolean; selectedId?: string; resetAudit?: boolean } = {}
  ): void {
    if (options.recordHistory) pushVersion();
    setBlueprint(nextBlueprint);
    setSelectedId(options.selectedId ?? firstSectionId(nextBlueprint));
    if (options.resetAudit !== false) setAudit(null);
  }

  function updateBlueprint(updater: (draft: GusyBlueprint) => void): void {
    pushVersion();
    setBlueprint((current) => createBlueprintDraft(current, updater));
    setAudit(null);
  }

  function updatePage(updater: (page: GusyBlueprint['page']) => void): void {
    updateBlueprint((draft) => updater(draft.page));
  }

  return {
    audit,
    blueprint,
    localAudit,
    redoVersion,
    redoVersions,
    replaceBlueprint,
    restoreVersion,
    selected,
    selectedId,
    sections,
    setAudit,
    setBlueprint: setBlueprint as Dispatch<SetStateAction<GusyBlueprint>>,
    setSelectedId,
    updateBlueprint,
    updatePage,
    versions,
    pushVersion
  };
}
