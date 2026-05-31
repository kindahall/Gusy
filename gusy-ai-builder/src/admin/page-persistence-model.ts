import type { GusySavedPage } from './types';

export function pageLoadLink(post: Pick<GusySavedPage, 'viewLink' | 'previewLink' | 'editLink'>): string {
  return post.viewLink || post.previewLink || post.editLink || '';
}

export function pagePersistenceError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function pageSaveStartStatus(status: 'draft' | 'publish'): string {
  return status === 'publish' ? 'Publishing' : 'Saving';
}

export function shouldUseCachedPreview(lastViewLink: string): boolean {
  return lastViewLink.trim().length > 0;
}
