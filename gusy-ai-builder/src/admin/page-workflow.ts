import { cleanPageSlug, cleanPageTitle } from './page-name-model';
import { cloneBlueprint } from './storage';
import type { GusyBlueprint, GusySavedPage } from './types';

const UNTITLED_PAGE = 'Untitled page';

export function uniqueBlankPageTitle(
  pages: Array<Pick<GusySavedPage, 'title'>>,
  currentTitle: string,
  fallbackSuffix = ''
): string {
  const usedTitles = new Set([
    ...pages.map((page) => page.title.trim().toLowerCase()),
    currentTitle.trim().toLowerCase()
  ].filter(Boolean));

  if (!usedTitles.has(UNTITLED_PAGE.toLowerCase())) return UNTITLED_PAGE;

  for (let index = 2; index < 100; index += 1) {
    const candidate = `${UNTITLED_PAGE} ${index}`;
    if (!usedTitles.has(candidate.toLowerCase())) return candidate;
  }

  return `${UNTITLED_PAGE} ${fallbackSuffix || pages.length + 1}`;
}

export function prepareRenamedBlueprint(blueprint: GusyBlueprint, title: string, slug?: string): GusyBlueprint {
  const nextTitle = cleanPageTitle(title);
  const nextSlug = cleanPageSlug(slug?.trim() || nextTitle, nextTitle);
  const nextBlueprint = cloneBlueprint(blueprint);

  nextBlueprint.page.title = nextTitle;
  nextBlueprint.page.slug = nextSlug;
  nextBlueprint.page.seo = {
    ...nextBlueprint.page.seo,
    metaTitle: nextBlueprint.page.seo.metaTitle && nextBlueprint.page.seo.metaTitle !== blueprint.page.title
      ? nextBlueprint.page.seo.metaTitle
      : nextTitle
  };

  return nextBlueprint;
}

export function applyPendingPageName(blueprint: GusyBlueprint, title: string, slug?: string): GusyBlueprint {
  const nextTitle = cleanPageTitle(title);
  const nextSlug = cleanPageSlug(slug?.trim() || nextTitle, nextTitle);

  if (blueprint.page.title === nextTitle && blueprint.page.slug === nextSlug) {
    return blueprint;
  }

  return prepareRenamedBlueprint(blueprint, nextTitle, nextSlug);
}

export function savedPageLink(response: { editLink?: string; viewLink?: string }): string {
  return response.viewLink || response.editLink || '';
}

export function savedPageStatusLabel(status: string): string {
  return status === 'publish' ? 'Published' : 'Draft';
}
