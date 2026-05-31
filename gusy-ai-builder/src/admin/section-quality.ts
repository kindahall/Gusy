import type { GusySection } from './types';

export type SectionQualityAction = 'shorten-copy' | 'add-cta' | 'add-image' | 'add-item' | 'add-item-image';

export type SectionQualityIssue = {
  key: string;
  label: string;
  severity: 'critical' | 'warning';
  action?: SectionQualityAction;
  missing?: number;
  itemIndex?: number;
};

const TITLE_LIMITS: Record<string, number> = {
  hero: 58,
  pricing: 52,
  testimonials: 54,
  faq: 52,
  form: 50,
  default: 62
};

const BODY_LIMITS: Record<string, number> = {
  hero: 138,
  pricing: 128,
  testimonials: 120,
  faq: 120,
  form: 118,
  default: 168
};

const MIN_ITEMS: Record<string, number> = {
  hero: 2,
  features: 3,
  cards: 3,
  pricing: 3,
  testimonials: 3,
  faq: 3,
  stats: 3,
  metrics: 3,
  logos: 4,
  comparison: 3,
  footer: 2
};

const CTA_SECTION_TYPES = new Set(['header', 'hero', 'pricing', 'form', 'newsletter', 'lead-magnet', 'audit', 'cta', 'sticky-offer']);
const SECTION_IMAGE_TYPES = new Set(['hero']);
const ITEM_IMAGE_TYPES = new Set(['features', 'cards', 'pricing', 'testimonials']);

function textLength(value = ''): number {
  return value.replace(/\s+/g, ' ').trim().length;
}

export function sectionTitleLimit(section: GusySection): number {
  return TITLE_LIMITS[section.type] ?? TITLE_LIMITS.default;
}

export function sectionBodyLimit(section: GusySection): number {
  return BODY_LIMITS[section.type] ?? BODY_LIMITS.default;
}

export function conciseText(value = '', max = 90): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const sentence = clean
    .split(/[.!?]\s+/)
    .map((part) => part.trim())
    .find((part) => part.length >= 18 && part.length <= max - 1);

  if (sentence) {
    return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
  }

  const clipped = clean.slice(0, Math.max(1, max - 1)).replace(/[\s,;:]+$/g, '');
  return `${clipped}.`;
}

export function shortenSectionCopy(section: GusySection): Partial<GusySection> {
  return {
    title: conciseText(section.title, sectionTitleLimit(section)),
    body: conciseText(section.body, sectionBodyLimit(section))
  };
}

export function defaultSectionCta(section: GusySection): NonNullable<GusySection['cta']> {
  if (section.type === 'pricing') return { label: 'View offers', url: '#offers' };
  if (section.type === 'form' || section.type === 'newsletter' || section.type === 'lead-magnet') return { label: 'Send request', url: '#contact' };
  if (section.type === 'audit') return { label: 'Start audit', url: '#contact' };
  if (section.type === 'header') return { label: 'Contact', url: '#contact' };
  if (section.type === 'sticky-offer') return { label: 'Book now', url: '#contact' };
  return { label: 'Get started', url: '#contact' };
}

export function sectionQualityIssues(section: GusySection): SectionQualityIssue[] {
  const issues: SectionQualityIssue[] = [];
  const titleLimit = sectionTitleLimit(section);
  const bodyLimit = sectionBodyLimit(section);
  const titleLength = textLength(section.title);
  const bodyLength = textLength(section.body);
  const minItems = MIN_ITEMS[section.type] ?? 0;

  if (!titleLength) {
    issues.push({ key: 'missing-title', label: 'Add a clear section title.', severity: 'critical' });
  } else if (titleLength > titleLimit) {
    issues.push({ key: 'long-title', label: `Shorten the title to about ${titleLimit} characters.`, severity: 'warning', action: 'shorten-copy' });
  }

  if (bodyLength > bodyLimit) {
    issues.push({ key: 'long-text', label: `Tighten the text to about ${bodyLimit} characters.`, severity: 'warning', action: 'shorten-copy' });
  }

  if (CTA_SECTION_TYPES.has(section.type) && (!section.cta?.label || !section.cta?.url)) {
    issues.push({ key: 'missing-cta', label: 'Add one clear action button.', severity: 'critical', action: 'add-cta' });
  }

  if (SECTION_IMAGE_TYPES.has(section.type) && !section.settings.backgroundImage?.url) {
    issues.push({ key: 'missing-section-image', label: 'Add a real image for this key section.', severity: 'critical', action: 'add-image' });
  }

  if (minItems && section.items.length < minItems) {
    const missing = minItems - section.items.length;
    issues.push({ key: 'missing-items', label: `Add ${missing} more item${missing > 1 ? 's' : ''}.`, severity: 'critical', action: 'add-item', missing });
  }

  if (section.items.some((item) => !textLength(item.title))) {
    issues.push({ key: 'empty-item-title', label: 'Complete every item title.', severity: 'critical' });
  }

  if (section.type === 'pricing' && section.items.some((item) => !textLength(item.label))) {
    issues.push({ key: 'missing-price', label: 'Add a visible price or starting point for each offer.', severity: 'warning' });
  }

  if (ITEM_IMAGE_TYPES.has(section.type) && section.items.length > 0 && section.items.some((item) => !item.image?.url)) {
    const itemIndex = section.items.findIndex((item) => !item.image?.url);
    const label = section.type === 'testimonials'
      ? 'Use real customer photos for every review.'
      : 'Add real photos to the visible cards.';
    issues.push({ key: 'missing-item-images', label, severity: 'warning', action: 'add-item-image', itemIndex });
  }

  return issues;
}

export function sectionQualityScore(section: GusySection): number {
  const issues = sectionQualityIssues(section);
  const penalty = issues.reduce((total, issue) => total + (issue.severity === 'critical' ? 18 : 10), 0);
  return Math.max(0, 100 - penalty);
}
