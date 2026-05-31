import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  backgroundImageFromAttachment,
  backgroundVideoFromAttachment,
  buildLocalAudit,
  cloneSection,
  createBlankBlueprint,
  createEmptyAudit,
  cssUrl,
  DEFAULT_FORM_FIELDS,
  mergeDesignSystem,
  normalizeBlueprint,
  reorder,
  resolveSectionAccent,
  shortText,
  slugifyPageTitle
} from '../src/admin/schema';
import type { GusyBlueprint, GusySection, GusySettings } from '../src/admin/types';

const settings: GusySettings = {
  restBase: '/wp-json/gusy/v1',
  nonce: 'nonce',
  templates: [],
  brandKit: {
    colors: {
      primary: '#111111',
      accent: '#2277ff',
      support: '#18a86b'
    }
  },
  siteName: 'Test',
  adminUrl: '/wp-admin/',
  canPublish: true,
  pluginVersion: 'test',
  locale: 'en_US'
};

function section(overrides: Partial<GusySection> = {}): GusySection {
  return {
    id: 'section-1',
    type: 'hero',
    variant: 'default',
    label: 'Hero',
    kicker: 'Proof',
    title: 'Title',
    body: 'Body',
    cta: { label: 'Start', url: '#start' },
    items: [],
    settings: {
      background: 'plain',
      spacing: 'lg',
      columns: 2,
      mobileStack: true
    },
    ...overrides
  };
}

describe('Gusy schema utilities', () => {
  it('creates stable English blueprints from page titles', () => {
    const blueprint = createBlankBlueprint(settings, 'À propos de Gusy !');

    assert.equal(blueprint.schemaVersion, '1.0');
    assert.equal(blueprint.page.language, 'en');
    assert.equal(blueprint.page.title, 'À propos de Gusy !');
    assert.equal(blueprint.page.slug, 'a-propos-de-gusy');
    assert.equal(blueprint.page.seo.metaTitle, 'À propos de Gusy !');
    assert.equal(slugifyPageTitle('!!!'), 'page');
  });

  it('normalizes legacy sections without losing content', () => {
    const legacy = createBlankBlueprint(settings, 'Legacy');
    legacy.page.language = 'fr';
    legacy.page.sections = [
      {
        id: 'legacy',
        type: 'features',
        variant: 'default',
        label: 'Features',
        kicker: '',
        title: 'Features',
        body: '',
        items: undefined as unknown as GusySection['items'],
        settings: { background: 'hero' } as GusySection['settings']
      }
    ];

    const normalized = normalizeBlueprint(legacy, settings);

    assert.equal(normalized.page.language, 'en');
    assert.deepEqual(normalized.page.sections[0].items, []);
    assert.deepEqual(normalized.page.sections[0].settings, {
      background: 'hero',
      spacing: 'lg',
      columns: 2,
      tabletColumns: 2,
      mobileColumns: 1,
      accent: 'accent',
      width: 'wide',
      textAlign: 'left',
      headingScale: 'standard',
      textWidth: 'standard',
      bodyScale: 'standard',
      buttonStyle: 'solid',
      buttonSize: 'md',
      buttonShape: 'pill',
      imageAspect: 'landscape',
      imagePosition: 'center',
      imageShape: 'rounded',
      backgroundImage: undefined,
      backgroundVideo: undefined,
      videoMode: 'inline',
      mobileStack: true,
      interactive: false,
      motionEnabled: false,
      motionEntrance: 'fade-up',
      motionDuration: 600
    });
  });

  it('normalizes responsive column settings for desktop, tablet and mobile', () => {
    const blueprint = createBlankBlueprint(settings, 'Responsive');
    blueprint.page.sections = [
      section({
        settings: {
          background: 'plain',
          spacing: 'lg',
          columns: 9,
          tabletColumns: 5,
          mobileColumns: 4,
          textAlign: 'center',
          headingScale: 'display',
          textWidth: 'wide',
          bodyScale: 'large',
          buttonStyle: 'outline',
          buttonSize: 'lg',
          buttonShape: 'rounded',
          imageAspect: 'portrait',
          imagePosition: 'top',
          imageShape: 'soft',
          backgroundVideo: { id: 8, url: 'https://example.test/hero.mp4', title: 'Hero video' },
          videoMode: 'background',
          mobileStack: true
        } as GusySection['settings']
      })
    ];

    const normalized = normalizeBlueprint(blueprint, settings);

    assert.equal(normalized.page.sections[0].settings.columns, 4);
    assert.equal(normalized.page.sections[0].settings.tabletColumns, 3);
    assert.equal(normalized.page.sections[0].settings.mobileColumns, 2);
    assert.equal(normalized.page.sections[0].settings.textAlign, 'center');
    assert.equal(normalized.page.sections[0].settings.headingScale, 'display');
    assert.equal(normalized.page.sections[0].settings.textWidth, 'wide');
    assert.equal(normalized.page.sections[0].settings.bodyScale, 'large');
    assert.equal(normalized.page.sections[0].settings.buttonStyle, 'outline');
    assert.equal(normalized.page.sections[0].settings.buttonSize, 'lg');
    assert.equal(normalized.page.sections[0].settings.buttonShape, 'rounded');
    assert.equal(normalized.page.sections[0].settings.imageAspect, 'portrait');
    assert.equal(normalized.page.sections[0].settings.imagePosition, 'top');
    assert.equal(normalized.page.sections[0].settings.imageShape, 'soft');
    assert.equal(normalized.page.sections[0].settings.backgroundVideo?.url, 'https://example.test/hero.mp4');
    assert.equal(normalized.page.sections[0].settings.videoMode, 'background');
  });

  it('normalizes form fields so visible labels can be edited and saved', () => {
    const blueprint = createBlankBlueprint(settings, 'Form');
    blueprint.page.sections = [
      section({ id: 'form', type: 'form', items: [] }),
      section({
        id: 'legacy-contact',
        type: 'form',
        items: [
          { title: 'Address', body: '12 Street', label: 'Shop' },
          { title: 'Hours', body: '9-5', label: 'Paris' },
          { title: 'Phone', body: '01 00 00 00 00', label: 'Email' }
        ]
      })
    ];

    const normalized = normalizeBlueprint(blueprint, settings);

    assert.deepEqual(normalized.page.sections[0].items, DEFAULT_FORM_FIELDS);
    assert.deepEqual(normalized.page.sections[1].items, DEFAULT_FORM_FIELDS);
  });

  it('clones and reorders sections without mutating the source', () => {
    const source = section({ items: [{ title: 'A', body: 'B' }] });
    const cloned = cloneSection(source);
    cloned.items[0].title = 'Changed';

    assert.equal(source.items[0].title, 'A');
    assert.deepEqual(reorder(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a']);
  });

  it('sanitizes media background data for CSS usage', () => {
    assert.deepEqual(
      backgroundImageFromAttachment({
        id: 12,
        url: 'https://example.com/original.jpg',
        title: 'Hero',
        sizes: { large: { url: 'https://example.com/large.jpg' } }
      }),
      {
        id: 12,
        url: 'https://example.com/large.jpg',
        alt: '',
        title: 'Hero'
      }
    );

    assert.equal(backgroundImageFromAttachment({ id: 1 }), null);
    assert.deepEqual(
      backgroundVideoFromAttachment({
        id: 14,
        url: 'https://example.com/clip.mp4',
        title: 'Clip',
        mime: 'video/mp4',
        image: { src: 'https://example.com/poster.jpg' }
      }),
      {
        id: 14,
        url: 'https://example.com/clip.mp4',
        title: 'Clip',
        poster: 'https://example.com/poster.jpg',
        mime: 'video/mp4'
      }
    );
    assert.equal(backgroundVideoFromAttachment({ id: 1 }), null);
    assert.equal(cssUrl('https://example.com/a\"b\\c\n.jpg'), 'url("https://example.com/abc.jpg")');
  });

  it('merges design tokens without dropping nested values', () => {
    const merged = mergeDesignSystem(
      { colors: { primary: '#111', accent: '#222' }, typography: { fontFamily: 'Inter' } },
      { colors: { accent: '#333' }, radius: { lg: '22px' } }
    );

    assert.deepEqual(merged.colors, { primary: '#111', accent: '#333' });
    assert.deepEqual(merged.typography, { fontFamily: 'Inter' });
    assert.deepEqual(merged.radius, { lg: '22px' });
  });

  it('computes local audit and section accents from real blueprint state', () => {
    const emptyAudit = createEmptyAudit();
    assert.equal(emptyAudit.score, 0);

    const incomplete = createBlankBlueprint(settings, 'Audit');
    const incompleteAudit = buildLocalAudit(incomplete);
    assert.ok(incompleteAudit.issues.includes('Hero section is missing'));
    assert.ok(incompleteAudit.issues.includes('Conversion section is missing'));

    const complete: GusyBlueprint = {
      ...incomplete,
      page: {
        ...incomplete.page,
        seo: { ...incomplete.page.seo, metaDescription: 'A useful description.' },
        sections: [
          section({ id: 'hero', type: 'hero', settings: { ...section().settings, accent: 'support' } }),
          section({ id: 'faq', type: 'faq' }),
          section({ id: 'form', type: 'form' })
        ]
      }
    };

    const completeAudit = buildLocalAudit(complete);
    assert.equal(completeAudit.issues.length, 0);
    assert.equal(resolveSectionAccent(complete.page.sections[0], settings.brandKit.colors as Record<string, string>), '#18a86b');
    assert.equal(shortText('1234567890', 6), '123456...');
  });
});
