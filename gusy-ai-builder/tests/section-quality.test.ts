import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  conciseText,
  defaultSectionCta,
  sectionQualityIssues,
  sectionQualityScore,
  shortenSectionCopy
} from '../src/admin/section-quality';
import type { GusySection } from '../src/admin/types';

function section(overrides: Partial<GusySection> = {}): GusySection {
  return {
    id: 'hero',
    type: 'hero',
    variant: 'default',
    label: 'Hero',
    kicker: '',
    title: 'A focused local offer',
    body: 'Clear message for a professional page.',
    cta: { label: 'Book now', url: '#contact' },
    items: [
      { label: '24h', title: 'Fast reply', body: '' },
      { label: '4.9/5', title: 'Client rating', body: '' }
    ],
    settings: {
      background: 'hero',
      spacing: 'xl',
      columns: 2,
      tabletColumns: 2,
      mobileColumns: 1,
      accent: 'accent',
      width: 'wide',
      mobileStack: true,
      backgroundImage: {
        id: 1,
        url: 'https://example.test/hero.jpg',
        alt: 'Hero',
        title: 'Hero'
      }
    },
    ...overrides
  };
}

describe('Gusy section quality', () => {
  it('flags real publishing gaps instead of only relying on the global audit', () => {
    const incomplete = section({
      title: 'This title is intentionally far too long for a clean professional desktop and mobile layout',
      body: 'This body is intentionally long because it repeats too many ideas for a commercial section and should be compressed before publishing to avoid the same cramped feeling as a generic mockup.',
      cta: { label: '', url: '' },
      items: [],
      settings: {
        ...section().settings,
        backgroundImage: undefined
      }
    });

    const issues = sectionQualityIssues(incomplete);

    assert.ok(issues.some((issue) => issue.key === 'long-title' && issue.action === 'shorten-copy'));
    assert.ok(issues.some((issue) => issue.key === 'long-text' && issue.action === 'shorten-copy'));
    assert.ok(issues.some((issue) => issue.key === 'missing-cta' && issue.action === 'add-cta'));
    assert.ok(issues.some((issue) => issue.key === 'missing-section-image' && issue.action === 'add-image'));
    assert.ok(issues.some((issue) => issue.key === 'missing-items' && issue.action === 'add-item'));
    assert.equal(issues.find((issue) => issue.key === 'missing-items')?.missing, 2);
    assert.ok(sectionQualityScore(incomplete) < 50);
  });

  it('shortens section copy without replacing it with fake marketing text', () => {
    const source = section({
      title: 'Elegant seasonal flowers delivered locally for weddings, gifts, and weekly subscriptions',
      body: 'A real florist page needs a short promise, visible services, and no filler paragraph that only explains the interface.'
    });

    const shortened = shortenSectionCopy(source);

    assert.equal(shortened.title, 'Elegant seasonal flowers delivered locally for weddings.');
    assert.equal(shortened.body, source.body);
    assert.equal(conciseText('Short enough.', 40), 'Short enough.');
  });

  it('checks professional content expectations for offers and reviews', () => {
    const pricing = section({
      type: 'pricing',
      title: 'Offers',
      settings: { ...section().settings, backgroundImage: undefined },
      items: [
        { title: 'Starter', body: 'Essential setup.', label: 'From EUR490' },
        { title: 'Signature', body: 'Complete setup.' }
      ]
    });
    const reviews = section({
      type: 'testimonials',
      title: 'Reviews',
      settings: { ...section().settings, backgroundImage: undefined },
      items: [
        { title: '"Clear and fast."', body: 'Claire M.', label: 'client' },
        { title: '"Very professional."', body: 'Julien S.', label: 'client' },
        { title: '"Exactly what we needed."', body: 'Sarah R.', label: 'client' }
      ]
    });

    assert.ok(sectionQualityIssues(pricing).some((issue) => issue.key === 'missing-price'));
    assert.ok(sectionQualityIssues(pricing).some((issue) => issue.key === 'missing-item-images' && issue.action === 'add-item-image' && issue.itemIndex === 0));
    assert.ok(sectionQualityIssues(reviews).some((issue) => issue.label === 'Use real customer photos for every review.' && issue.action === 'add-item-image'));
    assert.deepEqual(defaultSectionCta(pricing), { label: 'View offers', url: '#offers' });
  });

  it('treats complete sections as ready', () => {
    assert.deepEqual(sectionQualityIssues(section()), []);
    assert.equal(sectionQualityScore(section()), 100);
  });
});
