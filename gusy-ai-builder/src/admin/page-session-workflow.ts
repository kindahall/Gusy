import { useEffect, useMemo, useState } from 'react';
import { applyPendingPageName, uniqueBlankPageTitle } from './page-workflow';
import { createBlankBlueprint, normalizeBlueprint } from './schema';
import type { GusyBlueprint, GusyRevision, GusySavedPage, GusySettings, LeftTab } from './types';

type ReplaceBlueprint = (
  blueprint: GusyBlueprint,
  options?: { recordHistory?: boolean; selectedId?: string; resetAudit?: boolean }
) => void;

export function usePageSessionWorkflow(options: {
  blueprint: GusyBlueprint;
  pages: GusySavedPage[];
  postId: number | null;
  postStatus: string;
  selectedId: string;
  settings: GusySettings;
  clearPageAnnotations: () => void;
  renamePage: (blueprint: GusyBlueprint, title: string, slug: string | undefined, selectedId: string) => Promise<void>;
  replaceBlueprint: ReplaceBlueprint;
  resetCurrentPage: () => void;
  saveWordPressPage: (blueprint: GusyBlueprint, status: 'draft' | 'publish') => Promise<string>;
  previewWordPressPage: (blueprint: GusyBlueprint) => Promise<void>;
  setLeftTab: (tab: LeftTab) => void;
  setStatus: (status: string) => void;
}) {
  const [pageNameDraft, setPageNameDraft] = useState(() => ({
    title: options.blueprint.page.title,
    slug: options.blueprint.page.slug
  }));

  useEffect(() => {
    setPageNameDraft({
      title: options.blueprint.page.title,
      slug: options.blueprint.page.slug
    });
  }, [options.blueprint.page.title, options.blueprint.page.slug]);

  const currentPage = useMemo(
    () => options.pages.find((page) => page.id === options.postId),
    [options.pages, options.postId]
  );

  function updatePageNameDraft(title: string, slug?: string): void {
    setPageNameDraft({ title, slug: slug || title });
  }

  async function renameCurrentPage(title: string, slug?: string): Promise<void> {
    updatePageNameDraft(title, slug);
    await options.renamePage(options.blueprint, title, slug, options.selectedId);
  }

  function applyDraftName(): GusyBlueprint {
    const nextBlueprint = applyPendingPageName(options.blueprint, pageNameDraft.title, pageNameDraft.slug);
    if (nextBlueprint !== options.blueprint) {
      options.replaceBlueprint(nextBlueprint, {
        recordHistory: true,
        selectedId: options.selectedId,
        resetAudit: false
      });
    }
    return nextBlueprint;
  }

  function savePage(nextStatus: 'draft' | 'publish'): Promise<string> {
    return options.saveWordPressPage(applyDraftName(), nextStatus);
  }

  function previewPage(): Promise<void> {
    return options.previewWordPressPage(applyDraftName());
  }

  function topbarSaveStatus(): 'draft' | 'publish' {
    return (options.postStatus || currentPage?.status) === 'publish' ? 'publish' : 'draft';
  }

  function currentPageStatus(): string {
    return options.postStatus || currentPage?.status || '';
  }

  function startBlankPage(): void {
    const title = uniqueBlankPageTitle(options.pages, options.blueprint.page.title);
    options.replaceBlueprint(createBlankBlueprint(options.settings, title), { recordHistory: true, selectedId: '' });
    options.resetCurrentPage();
    options.clearPageAnnotations();
    options.setLeftTab('layers');
    options.setStatus('Blank page');
  }

  function restoreRevision(revision: GusyRevision): void {
    const normalized = normalizeBlueprint(revision.blueprint, options.settings);
    options.replaceBlueprint(normalized, { recordHistory: true });
    options.setStatus('Revision restored');
    options.setLeftTab('layers');
  }

  return {
    currentPageStatus,
    pageNameDraft,
    previewPage,
    renameCurrentPage,
    restoreRevision,
    savePage,
    startBlankPage,
    topbarSaveStatus,
    updatePageNameDraft
  };
}
