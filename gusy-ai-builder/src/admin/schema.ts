import type { GusyAudit, GusyBackgroundImage, GusyBackgroundVideo, GusyBlueprint, GusySection, GusySettings } from './types';

export type GusyDesignSystem = Record<string, unknown> & {
  colors?: Record<string, string>;
  typography?: {
    fontFamily?: string;
    scale?: string;
    weight?: string;
  };
  radius?: Record<string, string>;
  spacing?: string;
  shadow?: string;
  motion?: string;
  layout?: string;
  style?: string;
};

export function slugifyPageTitle(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return slug || 'page';
}

export function createBlankBlueprint(settings: GusySettings, title = 'Untitled page'): GusyBlueprint {
  return {
    schemaVersion: '1.0',
    page: {
      title,
      slug: slugifyPageTitle(title),
      language: 'en',
      seo: {
        metaTitle: title,
        metaDescription: ''
      },
      designSystem: settings.brandKit,
      sections: []
    }
  };
}

export function createEmptyAudit(): GusyAudit {
  return {
    summary: {
      performance: 'Not run',
      seo: 'Not run',
      accessibility: 'Not run',
      conversion: 'Not run'
    },
    issues: [],
    sectionCount: 0,
    types: [],
    score: 0
  };
}

export const FORM_SECTION_TYPES = ['form', 'newsletter', 'lead-magnet', 'audit'];

export const DEFAULT_FORM_FIELDS: GusySection['items'] = [
  { title: 'Name', body: 'Your full name', label: 'text' },
  { title: 'Email', body: 'Your email address', label: 'email' },
  { title: 'Project', body: 'Tell us what you need', label: 'textarea' }
];

export function normalizeColumnCount(value: unknown, fallback: number, max = 4): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.min(max, Math.round(numeric)));
}

function normalizeOption<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}

function normalizeSectionItems(section: GusySection): GusySection['items'] {
  const items = (section.items || []).map((item) => ({
    ...item,
    image: item.image
  }));

  if (!FORM_SECTION_TYPES.includes(section.type)) {
    return items;
  }

  const titles = items.map((item) => item.title.toLowerCase());
  const looksLikeContactDetails = titles.includes('address') && titles.includes('hours') && titles.includes('phone');
  if (looksLikeContactDetails) {
    return DEFAULT_FORM_FIELDS.map((item) => ({ ...item }));
  }

  return DEFAULT_FORM_FIELDS.map((defaultItem, index) => ({
    ...defaultItem,
    ...(items[index] ?? {})
  })).concat(items.slice(DEFAULT_FORM_FIELDS.length));
}

export function normalizeBlueprint(blueprint: GusyBlueprint, settings: GusySettings): GusyBlueprint {
  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      language: 'en',
      designSystem: blueprint.page.designSystem || settings.brandKit,
      sections: (blueprint.page.sections || []).map((section) => {
        const columns = normalizeColumnCount(section.settings?.columns, 2);
        const tabletColumns = normalizeColumnCount(section.settings?.tabletColumns, Math.min(columns, 2), 3);
        const mobileColumns = normalizeColumnCount(
          section.settings?.mobileColumns,
          section.settings?.mobileStack === false ? Math.min(columns, 2) : 1,
          2
        );

        return {
          ...section,
          items: normalizeSectionItems(section),
          settings: {
            background: section.settings?.background || 'plain',
            spacing: section.settings?.spacing || 'lg',
            columns,
            tabletColumns,
            mobileColumns,
            accent: section.settings?.accent || 'accent',
            width: section.settings?.width || 'wide',
            textAlign: normalizeOption(section.settings?.textAlign, ['left', 'center', 'right'] as const, 'left'),
            headingScale: normalizeOption(section.settings?.headingScale, ['compact', 'standard', 'display'] as const, 'standard'),
            textWidth: normalizeOption(section.settings?.textWidth, ['narrow', 'standard', 'wide'] as const, 'standard'),
            bodyScale: normalizeOption(section.settings?.bodyScale, ['compact', 'standard', 'large'] as const, 'standard'),
            buttonStyle: normalizeOption(section.settings?.buttonStyle, ['solid', 'soft', 'outline'] as const, 'solid'),
            buttonSize: normalizeOption(section.settings?.buttonSize, ['sm', 'md', 'lg'] as const, 'md'),
            buttonShape: normalizeOption(section.settings?.buttonShape, ['pill', 'rounded', 'square'] as const, 'pill'),
            imageAspect: normalizeOption(section.settings?.imageAspect, ['landscape', 'portrait', 'square'] as const, 'landscape'),
            imagePosition: normalizeOption(section.settings?.imagePosition, ['center', 'top', 'bottom'] as const, 'center'),
            imageShape: normalizeOption(section.settings?.imageShape, ['rounded', 'square', 'soft'] as const, 'rounded'),
            backgroundImage: section.settings?.backgroundImage,
            backgroundVideo: section.settings?.backgroundVideo,
            videoMode: normalizeOption(section.settings?.videoMode, ['inline', 'background'] as const, 'inline'),
            mobileStack: section.settings?.mobileStack ?? true,
            interactive: section.settings?.interactive ?? false,
            motionEnabled: section.settings?.motionEnabled ?? false,
            motionEntrance: section.settings?.motionEntrance || 'fade-up',
            motionDuration: Math.min(1200, Math.max(100, Number(section.settings?.motionDuration || 600)))
          }
        };
      })
    }
  };
}

export function cloneSection(section: GusySection): GusySection {
  return JSON.parse(JSON.stringify(section)) as GusySection;
}

export function reorder<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function shortText(value = '', max = 92): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

export function getDesignSystem(blueprint: GusyBlueprint): GusyDesignSystem {
  return blueprint.page.designSystem as GusyDesignSystem;
}

export function getColors(blueprint: GusyBlueprint): Record<string, string> {
  const design = getDesignSystem(blueprint);
  return design.colors ?? {};
}

export function resolveSectionAccent(section: GusySection, colors: Record<string, string>): string {
  const key = section.settings.accent || 'accent';
  return colors[key] || colors.accent || colors.primary || '#2673ff';
}

export function cssUrl(value: string): string {
  return `url("${value.replace(/["\\\n\r]/g, '')}")`;
}

export function backgroundImageFromAttachment(attachment: {
  id?: number;
  url?: string;
  alt?: string;
  title?: string;
  sizes?: Record<string, { url?: string }>;
}): GusyBackgroundImage | null {
  const url = attachment.sizes?.large?.url || attachment.sizes?.full?.url || attachment.url;
  if (!url) return null;

  return {
    id: Number(attachment.id || 0),
    url,
    alt: attachment.alt || '',
    title: attachment.title || ''
  };
}

export function backgroundVideoFromAttachment(attachment: {
  id?: number;
  url?: string;
  title?: string;
  mime?: string;
  poster?: string;
  image?: { src?: string; url?: string };
  sizes?: Record<string, { url?: string }>;
}): GusyBackgroundVideo | null {
  if (!attachment.url) return null;

  return {
    id: Number(attachment.id || 0),
    url: attachment.url,
    title: attachment.title || '',
    poster: attachment.poster || attachment.image?.src || attachment.image?.url || attachment.sizes?.large?.url || '',
    mime: attachment.mime || ''
  };
}

export function mergeDesignSystem(base: Record<string, unknown>, patch: GusyDesignSystem): GusyDesignSystem {
  const current = base as GusyDesignSystem;
  return {
    ...current,
    ...patch,
    colors: { ...(current.colors ?? {}), ...(patch.colors ?? {}) },
    typography: { ...(current.typography ?? {}), ...(patch.typography ?? {}) },
    radius: { ...(current.radius ?? {}), ...(patch.radius ?? {}) }
  };
}

export function buildLocalAudit(blueprint: GusyBlueprint): GusyAudit {
  const types = Array.from(new Set(blueprint.page.sections.map((section) => section.type)));
  const issues = [
    blueprint.page.seo.metaDescription ? '' : 'Missing meta description',
    blueprint.page.sections.length ? '' : 'Page has no sections yet',
    types.includes('hero') ? '' : 'Hero section is missing',
    types.includes('faq') ? '' : 'FAQ section is missing',
    types.includes('form') || types.includes('newsletter') || types.includes('pricing') ? '' : 'Conversion section is missing'
  ].filter(Boolean);
  const score = Math.max(42, 100 - issues.length * 9 - Math.max(0, 5 - blueprint.page.sections.length) * 3);

  return {
    summary: {
      performance: blueprint.page.sections.length > 8 ? 'Needs trimming' : 'Good',
      seo: blueprint.page.seo.metaDescription ? 'Good' : 'Needs meta description',
      accessibility: 'Good',
      conversion: types.includes('pricing') || types.includes('form') ? 'Good' : 'Needs CTA path'
    },
    issues,
    sectionCount: blueprint.page.sections.length,
    types,
    score
  };
}

export function isAuditEmpty(audit: GusyAudit): boolean {
  return audit.score === 0 && audit.issues.length === 0 && audit.sectionCount === 0;
}
