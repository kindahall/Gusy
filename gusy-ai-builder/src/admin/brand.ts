import type { GusyDesignSystem } from './schema';

export const BRAND_COLOR_KEYS = ['primary', 'accent', 'support', 'surface', 'ink'] as const;

export const BRAND_PRESETS = {
  product: {
    label: 'Product',
    tokens: {
      style: 'product launch',
      colors: {
        primary: '#172033',
        secondary: '#F4F7FB',
        accent: '#2F7CFF',
        support: '#18A86B',
        gold: '#F8B84E',
        surface: '#FFFFFF',
        ink: '#111827',
        muted: '#64748B',
        line: '#D9E3EF'
      },
      typography: {
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        scale: 'comfortable',
        weight: '700'
      },
      spacing: 'comfortable',
      radius: { sm: '8px', md: '14px', lg: '22px', xl: '30px' },
      shadow: 'premium',
      motion: 'subtle',
      layout: 'wide'
    }
  },
  local: {
    label: 'Local',
    tokens: {
      style: 'local service',
      colors: {
        primary: '#123A3A',
        secondary: '#F7F2E7',
        accent: '#E75A3C',
        support: '#5BAE72',
        gold: '#D8A33F',
        surface: '#FFFDF9',
        ink: '#14201E',
        muted: '#66746F',
        line: '#E4DDD0'
      },
      typography: {
        fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        scale: 'comfortable',
        weight: '700'
      },
      spacing: 'comfortable',
      radius: { sm: '6px', md: '12px', lg: '18px', xl: '26px' },
      shadow: 'premium',
      motion: 'subtle',
      layout: 'wide'
    }
  },
  premium: {
    label: 'Premium',
    tokens: {
      style: 'premium editorial',
      colors: {
        primary: '#15171E',
        secondary: '#F4F0EA',
        accent: '#B98645',
        support: '#5668D8',
        gold: '#C99A3A',
        surface: '#FFFFFF',
        ink: '#121318',
        muted: '#70737E',
        line: '#E3DFD6'
      },
      typography: {
        fontFamily: 'Fraunces, Georgia, "Times New Roman", serif',
        scale: 'editorial',
        weight: '700'
      },
      spacing: 'editorial',
      radius: { sm: '4px', md: '10px', lg: '18px', xl: '28px' },
      shadow: 'subtle',
      motion: 'quiet',
      layout: 'wide'
    }
  },
  bold: {
    label: 'Bold',
    tokens: {
      style: 'bold conversion',
      colors: {
        primary: '#09224A',
        secondary: '#F3F8FF',
        accent: '#FF4D6D',
        support: '#00A6A6',
        gold: '#FFBC42',
        surface: '#FFFFFF',
        ink: '#0F172A',
        muted: '#59677D',
        line: '#D6E2F2'
      },
      typography: {
        fontFamily: 'Sora, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        scale: 'compact',
        weight: '800'
      },
      spacing: 'compact',
      radius: { sm: '10px', md: '16px', lg: '24px', xl: '34px' },
      shadow: 'premium',
      motion: 'subtle',
      layout: 'wide'
    }
  }
} satisfies Record<string, { label: string; tokens: GusyDesignSystem }>;

export type BrandPresetKey = keyof typeof BRAND_PRESETS;

export const BRAND_TYPE_OPTIONS = [
  { key: 'product', label: 'Product', patch: { typography: { fontFamily: BRAND_PRESETS.product.tokens.typography?.fontFamily, scale: 'comfortable', weight: '700' } } },
  { key: 'editorial', label: 'Editorial', patch: { typography: { fontFamily: BRAND_PRESETS.premium.tokens.typography?.fontFamily, scale: 'editorial', weight: '700' } } },
  { key: 'bold', label: 'Bold', patch: { typography: { fontFamily: BRAND_PRESETS.bold.tokens.typography?.fontFamily, scale: 'compact', weight: '800' } } }
] satisfies Array<{ key: string; label: string; patch: GusyDesignSystem }>;

export const BRAND_RADIUS_OPTIONS = [
  { key: 'sharp', label: 'Sharp', patch: { radius: { sm: '2px', md: '6px', lg: '10px', xl: '16px' } } },
  { key: 'soft', label: 'Soft', patch: { radius: { sm: '8px', md: '14px', lg: '22px', xl: '30px' } } },
  { key: 'round', label: 'Round', patch: { radius: { sm: '14px', md: '20px', lg: '30px', xl: '44px' } } }
] satisfies Array<{ key: string; label: string; patch: GusyDesignSystem }>;

export const BRAND_SPACING_OPTIONS = [
  { key: 'compact', label: 'compact', section: '34px 28px', card: '14px', gap: '12px' },
  { key: 'comfortable', label: 'comfortable', section: '46px 36px', card: '18px', gap: '16px' },
  { key: 'editorial', label: 'editorial', section: '62px 48px', card: '22px', gap: '22px' }
] as const;

export function isActivePreset(design: GusyDesignSystem, key: BrandPresetKey): boolean {
  return design.style === BRAND_PRESETS[key].tokens.style;
}

export function isActiveType(design: GusyDesignSystem, option: (typeof BRAND_TYPE_OPTIONS)[number]): boolean {
  const typography = design.typography ?? {};
  return typography.scale === option.patch.typography?.scale && typography.weight === option.patch.typography?.weight;
}

export function isActiveRadius(design: GusyDesignSystem, option: (typeof BRAND_RADIUS_OPTIONS)[number]): boolean {
  return design.radius?.lg === option.patch.radius?.lg;
}
