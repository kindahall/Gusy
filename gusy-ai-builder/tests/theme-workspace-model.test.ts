import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  importedThemePageCount,
  nextSelectedThemeKitId,
  profileFromThemeKit,
  themeKitGallery,
  themeKitPalette,
  themeWorkspaceCopy,
  updateThemeProfileMenuPages,
  visibleThemeKits
} from '../src/admin/theme-workspace-model';
import type { GusyThemeKit } from '../src/admin/types';

function kit(id: string, language: GusyThemeKit['language'], pages: number[] = []): GusyThemeKit {
  return {
    id,
    slug: id,
    language,
    name: id,
    brand: `${id} brand`,
    title: `${id} title`,
    body: '',
    location: '',
    primary: '#111111',
    secondary: '#ffffff',
    imageUrl: `https://example.com/${id}.jpg`,
    gallery: [],
    imageCount: 1,
    pages: pages.map((pageId, index) => ({
      type: index === 0 ? 'home' : `page-${index}`,
      label: `Page ${index}`,
      slug: `page-${index}`,
      id: pageId
    })),
    tokens: {
      colors: {
        primary: '#111111',
        accent: '#2277ff',
        invalid: 'not-a-color'
      }
    }
  };
}

describe('Gusy theme workspace model', () => {
  const kits = [
    kit('agency-en', 'en', [10, 0]),
    kit('local-fr', 'fr', [20, 21]),
    kit('shop-en', 'en', [0])
  ];

  it('filters kits by language and keeps selection stable', () => {
    const english = visibleThemeKits(kits, 'en');

    assert.deepEqual(english.map((item) => item.id), ['agency-en', 'shop-en']);
    assert.equal(nextSelectedThemeKitId(english, 'shop-en'), 'shop-en');
    assert.equal(nextSelectedThemeKitId(english, 'missing'), 'agency-en');
    assert.equal(nextSelectedThemeKitId([], 'shop-en'), '');
  });

  it('counts imported pages and derives safe visual tokens', () => {
    assert.equal(importedThemePageCount(kits), 3);
    assert.deepEqual(themeKitPalette(kits[0]), ['#111111', '#2277ff']);
    assert.deepEqual(themeKitGallery(kits[0]), [{ src: 'https://example.com/agency-en.jpg', label: 'agency-en brand' }]);
  });

  it('creates editable business profiles from theme kits', () => {
    const profile = profileFromThemeKit({
      ...kits[0],
      location: 'Lyon',
      primary: 'Book now',
      secondary: 'See work',
      gallery: [
        { src: 'https://example.com/hero.jpg', label: 'Hero' },
        { src: 'https://example.com/offer.jpg', label: 'Offer' },
        { src: 'https://example.com/review.jpg', label: 'Review' }
      ]
    });

    assert.equal(profile.businessName, 'agency-en brand');
    assert.equal(profile.city, 'Lyon');
    assert.equal(profile.heroImageUrl, 'https://example.com/hero.jpg');
    assert.deepEqual(profile.offerImages, ['https://example.com/offer.jpg', 'https://example.com/review.jpg']);
    assert.equal(profile.offers.length, 3);
    assert.equal(profile.reviews.length, 3);
  });

  it('keeps theme menu selection ordered and never empty', () => {
    assert.deepEqual(updateThemeProfileMenuPages(['home', 'contact'], 'offers', true), ['home', 'offers', 'contact']);
    assert.deepEqual(updateThemeProfileMenuPages(['home'], 'home', false), ['home']);
  });

  it('keeps theme copy concise and localized', () => {
    assert.equal(themeWorkspaceCopy('en').customizeFull, 'Create tailored site');
    assert.equal(themeWorkspaceCopy('fr').customizeFull, 'Créer le site personnalisé');
  });
});
