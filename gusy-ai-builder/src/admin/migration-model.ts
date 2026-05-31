import type { GusyAudit, GusyBlueprint, GusyElementorPage, MigrationPreview } from './types';

export type MigrationPreviewResponse = {
  blueprint: GusyBlueprint;
  audit: GusyAudit;
  original: {
    id: number;
    title: string;
    editLink?: string;
    viewLink?: string;
  };
  metrics?: {
    source?: 'elementor' | 'wordpress';
    compatibility?: number;
    textCount?: number;
    widgetCount?: number;
    warnings?: string[];
  };
};

export function buildMigrationPreview(
  response: MigrationPreviewResponse,
  normalized: GusyBlueprint,
  pages: GusyElementorPage[]
): MigrationPreview {
  const page = pages.find((candidate) => candidate.id === response.original.id);

  return {
    pageId: response.original.id,
    title: response.original.title,
    source: response.metrics?.source ?? page?.source ?? 'wordpress',
    compatibility: response.metrics?.compatibility ?? page?.compatibility ?? response.audit.score,
    textCount: response.metrics?.textCount ?? page?.textCount ?? 0,
    widgetCount: response.metrics?.widgetCount ?? page?.widgetCount ?? 0,
    warnings: response.metrics?.warnings ?? page?.warnings ?? [],
    blueprint: normalized,
    audit: response.audit,
    viewLink: response.original.viewLink,
    editLink: response.original.editLink
  };
}
