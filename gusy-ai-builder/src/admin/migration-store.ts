import { useState } from 'react';
import apiFetch from './api';
import { buildMigrationPreview, type MigrationPreviewResponse } from './migration-model';
import { normalizeBlueprint } from './schema';
import type { GusyAudit, GusyBlueprint, GusyElementorPage, GusySettings, LeftTab, MigrationPreview } from './types';

type ReplaceBlueprint = (
  nextBlueprint: GusyBlueprint,
  options?: { recordHistory?: boolean; selectedId?: string; resetAudit?: boolean }
) => void;

type UseMigrationWorkflowOptions = {
  settings: GusySettings;
  replaceBlueprint: ReplaceBlueprint;
  clearPageAnnotations: () => void;
  resetCurrentPage: () => void;
  setAudit: (audit: GusyAudit | null) => void;
  setBusy: (busy: boolean) => void;
  setLeftTab: (tab: LeftTab) => void;
  setStatus: (status: string) => void;
};

export function useMigrationWorkflow({
  settings,
  replaceBlueprint,
  clearPageAnnotations,
  resetCurrentPage,
  setAudit,
  setBusy,
  setLeftTab,
  setStatus
}: UseMigrationWorkflowOptions) {
  const [migrationPages, setMigrationPages] = useState<GusyElementorPage[]>([]);
  const [migrationPreview, setMigrationPreview] = useState<MigrationPreview | null>(null);

  async function loadMigrationPages() {
    setBusy(true);
    setStatus('Scanning site');
    try {
      const response = await apiFetch<{ pages: GusyElementorPage[] }>({ path: '/gusy/v1/migration/elementor/pages' });
      setMigrationPages(response.pages);
      setStatus(response.pages.length ? `${response.pages.length} pages found` : 'No source pages');
      return response.pages;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Migration scan failed');
      return [];
    } finally {
      setBusy(false);
    }
  }

  async function previewMigration(pageId: number, knownPages = migrationPages) {
    setBusy(true);
    setStatus('Converting page');
    try {
      const response = await apiFetch<MigrationPreviewResponse>({
        path: '/gusy/v1/migration/elementor/preview',
        method: 'POST',
        data: { postId: pageId }
      });
      const normalized = normalizeBlueprint(response.blueprint, settings);
      replaceBlueprint(normalized, { recordHistory: true, resetAudit: false });
      clearPageAnnotations();
      resetCurrentPage();
      setAudit(response.audit);
      setMigrationPreview(buildMigrationPreview(response, normalized, knownPages));
      setLeftTab('migrate');
      setStatus('Converted');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Migration failed');
    } finally {
      setBusy(false);
    }
  }

  async function previewFirstElementorPage() {
    setBusy(true);
    setStatus('Scanning site');
    try {
      const response = await apiFetch<{ pages: GusyElementorPage[] }>({ path: '/gusy/v1/migration/elementor/pages' });
      setMigrationPages(response.pages);
      if (!response.pages.length) {
        setLeftTab('migrate');
        setStatus('No source pages');
        return;
      }
      await previewMigration(response.pages[0].id, response.pages);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Migration preview failed');
    } finally {
      setBusy(false);
    }
  }

  return {
    migrationPages,
    migrationPreview,
    loadMigrationPages,
    previewMigration,
    previewFirstElementorPage
  };
}
