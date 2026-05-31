import { useState } from 'react';
import apiFetch from './api';
import { pageLoadLink, pagePersistenceError, pageSaveStartStatus, shouldUseCachedPreview } from './page-persistence-model';
import { prepareRenamedBlueprint, savedPageLink, savedPageStatusLabel } from './page-workflow';
import { normalizeBlueprint } from './schema';
import { wordpressSavePayload } from './workflow-model';
import type { GusyAudit, GusyBlueprint, GusyRevision, GusySavedPage, GusySettings, LeftTab } from './types';

type ReplaceBlueprint = (
  blueprint: GusyBlueprint,
  options?: { recordHistory?: boolean; selectedId?: string; resetAudit?: boolean }
) => void;

export function useWordPressPages(
  settings: GusySettings,
  handlers: {
    clearPageAnnotations: () => void;
    replaceBlueprint: ReplaceBlueprint;
    setAudit: (audit: GusyAudit | null) => void;
    setBusy: (busy: boolean) => void;
    setLeftTab: (tab: LeftTab) => void;
    setStatus: (status: string) => void;
  }
) {
  const [postId, setPostId] = useState<number | null>(null);
  const [postStatus, setPostStatus] = useState('');
  const [lastViewLink, setLastViewLink] = useState('');
  const [pages, setPages] = useState<GusySavedPage[]>([]);
  const [revisions, setRevisions] = useState<GusyRevision[]>([]);

  async function loadPages() {
    try {
      const response = await apiFetch<{ pages: GusySavedPage[] }>({ path: '/gusy/v1/pages' });
      setPages(response.pages);
    } catch (error) {
      handlers.setStatus(pagePersistenceError(error, 'Could not load pages'));
    }
  }

  async function loadRevisions(id = postId) {
    if (!id) {
      setRevisions([]);
      return;
    }
    try {
      const response = await apiFetch<{ revisions: GusyRevision[] }>({ path: `/gusy/v1/page/${id}/revisions` });
      setRevisions(response.revisions);
    } catch {
      setRevisions([]);
    }
  }

  function resetCurrentPage() {
    setPostId(null);
    setPostStatus('');
    setLastViewLink('');
    setRevisions([]);
  }

  async function adoptSavedPage(page?: { id?: number; viewLink?: string; previewLink?: string; editLink?: string; status?: string }) {
    if (!page) return;
    const link = pageLoadLink(page);
    if (link) {
      setLastViewLink(link);
    }
    if (page.status) {
      setPostStatus(page.status);
    }
    if (page.id) {
      setPostId(page.id);
      await loadRevisions(page.id);
    }
  }

  async function loadPage(id: number) {
    handlers.setBusy(true);
    handlers.setStatus('Loading');
    try {
      const response = await apiFetch<{ post: GusySavedPage; blueprint: GusyBlueprint }>({ path: `/gusy/v1/page/${id}` });
      const normalized = normalizeBlueprint(response.blueprint, settings);
      handlers.replaceBlueprint(normalized, { recordHistory: true });
      handlers.clearPageAnnotations();
      setPostId(response.post.id);
      setPostStatus(response.post.status);
      setLastViewLink(pageLoadLink(response.post));
      handlers.setLeftTab('layers');
      handlers.setStatus('Loaded');
      await loadRevisions(response.post.id);
    } catch (error) {
      handlers.setStatus(pagePersistenceError(error, 'Load failed'));
    } finally {
      handlers.setBusy(false);
    }
  }

  async function renamePage(blueprint: GusyBlueprint, title: string, slug: string | undefined, selectedId: string) {
    const nextBlueprint = prepareRenamedBlueprint(blueprint, title, slug);
    handlers.replaceBlueprint(nextBlueprint, { recordHistory: true, selectedId });
    handlers.setBusy(true);
    handlers.setStatus('Saving name');

    try {
      const response = await apiFetch<{ postId: number; editLink: string; viewLink: string; status: string }>({
        path: '/gusy/v1/page/save',
        method: 'POST',
        data: { blueprint: nextBlueprint, postId, status: 'draft' }
      });
      setPostId(response.postId);
      setPostStatus(response.status);
      setLastViewLink(savedPageLink(response));
      await loadPages();
      await loadRevisions(response.postId);
      handlers.setStatus('Page named');
    } catch (error) {
      handlers.setStatus(pagePersistenceError(error, 'Rename failed'));
    } finally {
      handlers.setBusy(false);
    }
  }

  async function savePage(blueprint: GusyBlueprint, nextStatus: 'draft' | 'publish'): Promise<string> {
    handlers.setBusy(true);
    handlers.setStatus(pageSaveStartStatus(nextStatus));
    try {
      const response = await apiFetch<{ postId: number; editLink: string; viewLink: string; status: string }>({
        path: '/gusy/v1/page/save',
        method: 'POST',
        data: wordpressSavePayload(blueprint, postId, nextStatus)
      });
      setPostId(response.postId);
      setPostStatus(response.status);
      setLastViewLink(savedPageLink(response));
      handlers.setStatus(savedPageStatusLabel(response.status));
      await loadPages();
      await loadRevisions(response.postId);
      return savedPageLink(response);
    } catch (error) {
      handlers.setStatus(pagePersistenceError(error, 'Failed'));
      return '';
    } finally {
      handlers.setBusy(false);
    }
  }

  async function previewPage(blueprint: GusyBlueprint) {
    if (shouldUseCachedPreview(lastViewLink)) {
      window.open(lastViewLink, '_blank', 'noopener,noreferrer');
      return;
    }

    const link = await savePage(blueprint, 'draft');
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }

  async function setCurrentAsHomepage() {
    if (!postId) {
      handlers.setStatus('Save the page first');
      return;
    }
    handlers.setBusy(true);
    handlers.setStatus('Setting homepage');
    try {
      const response = await apiFetch<{ viewLink: string }>({
        path: `/gusy/v1/page/${postId}/homepage`,
        method: 'POST'
      });
      setLastViewLink(response.viewLink || lastViewLink);
      handlers.setStatus('Homepage set');
    } catch (error) {
      handlers.setStatus(pagePersistenceError(error, 'Homepage failed'));
    } finally {
      handlers.setBusy(false);
    }
  }

  return {
    adoptSavedPage,
    lastViewLink,
    loadPage,
    loadPages,
    loadRevisions,
    pages,
    postId,
    postStatus,
    previewPage,
    renamePage,
    resetCurrentPage,
    revisions,
    savePage,
    setCurrentAsHomepage
  };
}
