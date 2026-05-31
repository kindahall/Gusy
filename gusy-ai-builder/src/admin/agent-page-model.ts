import { shortText } from './schema';
import type { GusyAgentAction, GusyAgentMemory, GusyAudit, GusyBlueprint } from './types';

export const AGENT_CRITIQUE_ACTIONS: GusyAgentAction[] = [
  { type: 'finish_page', label: 'Fix Structure' },
  { type: 'generate_local_seo', label: 'Generate SEO' },
  { type: 'run_audit', label: 'Run Audit' }
];

export const AGENT_MISSION_ACTIONS: GusyAgentAction[] = [
  { type: 'run_audit', label: 'Run Audit' },
  { type: 'save_draft', label: 'Save Draft' }
];

export function buildPageSeo(blueprint: GusyBlueprint, memory: GusyAgentMemory): GusyBlueprint['page']['seo'] {
  const titleBase = memory.business || blueprint.page.title || 'Gusy page';
  const market = memory.localMarket ? ` in ${memory.localMarket}` : '';
  const offer = memory.offer || 'a clear, conversion-focused offer';
  const metaTitle = shortText(`${titleBase}${market} | ${offer}`, 58);
  const metaDescription = shortText(
    `${titleBase}${market} helps ${memory.audience || 'visitors'} understand ${offer} and take the next step with confidence.`,
    155
  );
  const faqItems = blueprint.page.sections.find((section) => section.type === 'faq')?.items ?? [];

  return {
    metaTitle,
    metaDescription,
    schemaJsonLd: {
      '@context': 'https://schema.org',
      '@type': memory.localMarket ? 'LocalBusiness' : 'Organization',
      name: titleBase,
      description: metaDescription,
      areaServed: memory.localMarket || undefined,
      knowsAbout: memory.keywords || [],
      mainEntity: faqItems.slice(0, 6).map((item) => ({
        '@type': 'Question',
        name: item.title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.body
        }
      }))
    }
  };
}

export function pageCritiqueItems(blueprint: GusyBlueprint, audit: GusyAudit): string[] {
  const types = new Set(blueprint.page.sections.map((section) => section.type));
  const issues = [
    blueprint.page.sections.length ? '' : 'The page has no sections yet.',
    types.has('hero') ? '' : 'Add a hero section with one clear promise.',
    types.has('faq') ? '' : 'Add FAQ coverage for SEO and objections.',
    types.has('form') || types.has('cta') || types.has('pricing') ? '' : 'Add a clear conversion path.',
    blueprint.page.seo.metaDescription ? '' : 'Write a meta description before publishing.',
    audit.score >= 80 || audit.score === 0 ? '' : `Audit score is ${audit.score}; fix priority issues before publish.`
  ].filter(Boolean);

  return issues.length ? issues : ['Structure, SEO and conversion path look ready for a final audit.'];
}
