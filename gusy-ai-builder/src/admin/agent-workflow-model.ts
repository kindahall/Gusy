import { pageCritiqueItems } from './agent-page-model';
import type { GusyAudit, GusyBlueprint } from './types';

export const AGENT_MISSION_SECTION_TYPES = ['hero', 'features', 'faq', 'form'] as const;

export const AGENT_MISSION_COMPLETE_MESSAGE =
  'Mission complete: memory saved, theme applied, structure completed, SEO prepared. Run Audit next before publishing.';

export type AgentFixRoute = 'finish_page' | 'generate_seo' | 'critique' | 'transform_selected';

export function missingMissionSectionTypes(blueprint: GusyBlueprint): string[] {
  const existing = new Set(blueprint.page.sections.map((section) => section.type));
  return AGENT_MISSION_SECTION_TYPES.filter((type) => !existing.has(type));
}

export function agentCritiqueText(blueprint: GusyBlueprint, audit: GusyAudit): string {
  return pageCritiqueItems(blueprint, audit).join(' ');
}

export function resolveFixWithAiRoute(options: {
  audit: GusyAudit;
  sectionCount: number;
  hasSelectedSection: boolean;
}): AgentFixRoute {
  const issueText = options.audit.issues.join(' ').toLowerCase();

  if (
    options.sectionCount === 0 ||
    issueText.includes('hero') ||
    issueText.includes('faq') ||
    issueText.includes('conversion')
  ) {
    return 'finish_page';
  }

  if (issueText.includes('meta description') || issueText.includes('seo')) {
    return 'generate_seo';
  }

  return options.hasSelectedSection ? 'transform_selected' : 'critique';
}
