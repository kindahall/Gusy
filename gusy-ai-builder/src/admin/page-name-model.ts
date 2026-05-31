import { slugifyPageTitle } from './schema';

export function cleanPageTitle(title: string, fallback = 'Untitled page'): string {
  const clean = title.trim();
  return clean || fallback;
}

export function cleanPageSlug(slug: string, title: string): string {
  return slugifyPageTitle(slug || title);
}

export function nextSlugAfterTitleChange(title: string, currentSlug: string, slugTouched: boolean): string {
  return slugTouched ? currentSlug : slugifyPageTitle(title);
}

export function pageNameChanged(currentTitle: string, currentSlug: string, nextTitle: string, nextSlug: string): boolean {
  return cleanPageTitle(nextTitle) !== currentTitle || cleanPageSlug(nextSlug, nextTitle) !== currentSlug;
}
