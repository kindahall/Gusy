import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPageSeo, pageCritiqueItems } from '../src/admin/agent-page-model';
import { EMPTY_AGENT_MEMORY } from '../src/admin/llm';
import type { GusyAudit, GusyBlueprint, GusySection } from '../src/admin/types';

function section(type: string, title: string, items: GusySection['items'] = []): GusySection {
  return {
    id: `${type}-1`,
    type,
    variant: 'default',
    label: title,
    kicker: '',
    title,
    body: `${title} body`,
    items,
    settings: {
      background: 'plain',
      spacing: 'lg',
      columns: 2,
      mobileStack: true
    }
  };
}

function blueprint(sections: GusySection[] = []): GusyBlueprint {
  return {
    schemaVersion: '1.0',
    page: {
      title: 'Maison Aveline',
      slug: 'maison-aveline',
      language: 'en',
      seo: { metaTitle: '', metaDescription: '' },
      designSystem: {},
      sections
    }
  };
}

const goodAudit: GusyAudit = {
  summary: {},
  issues: [],
  sectionCount: 4,
  types: ['hero', 'features', 'faq', 'form'],
  score: 91
};

describe('Gusy agent page model', () => {
  it('builds SEO and FAQ schema from product memory and current sections', () => {
    const seo = buildPageSeo(
      blueprint([
        section('hero', 'Hero'),
        section('faq', 'FAQ', [
          { title: 'Can I order online?', body: 'Yes, order from the page.' },
          { title: 'Where are you based?', body: 'Lyon.' }
        ])
      ]),
      {
        ...EMPTY_AGENT_MEMORY,
        business: 'Maison Aveline',
        localMarket: 'Lyon',
        audience: 'local shoppers',
        offer: 'curated boutique gifts',
        keywords: ['boutique', 'gifts']
      }
    );

    assert.equal(seo.schemaJsonLd?.['@type'], 'LocalBusiness');
    assert.equal(seo.schemaJsonLd?.areaServed, 'Lyon');
    assert.match(seo.metaDescription, /local shoppers/);
    assert.deepEqual(
      (seo.schemaJsonLd?.mainEntity as Array<Record<string, unknown>>).map((item) => item.name),
      ['Can I order online?', 'Where are you based?']
    );
  });

  it('returns concrete critique items for incomplete pages', () => {
    const items = pageCritiqueItems(blueprint(), { ...goodAudit, score: 54 });

    assert.deepEqual(items, [
      'The page has no sections yet.',
      'Add a hero section with one clear promise.',
      'Add FAQ coverage for SEO and objections.',
      'Add a clear conversion path.',
      'Write a meta description before publishing.',
      'Audit score is 54; fix priority issues before publish.'
    ]);
  });

  it('recognizes a ready structure when SEO, conversion and audit are present', () => {
    const ready = blueprint([
      section('hero', 'Hero'),
      section('faq', 'FAQ'),
      section('form', 'Form')
    ]);
    ready.page.seo.metaDescription = 'A complete local page.';

    assert.deepEqual(pageCritiqueItems(ready, goodAudit), [
      'Structure, SEO and conversion path look ready for a final audit.'
    ]);
  });
});
