export const DEFAULT_PROMPT = '';
export const DEFAULT_BUILD_PROMPT = 'Create a modern English landing page with hero, features, proof, FAQ and lead capture.';

export const STORAGE_KEY = 'gusy.builder.session.v6';
export const EXPORT_HISTORY_KEY = 'gusy.builder.exports.v2';
export const DEVICE_STORAGE_KEY = 'gusy.builder.device.v1';
export const ANNOTATIONS_STORAGE_KEY = 'gusy.builder.annotations.v1';

export const BLOCK_DRAG_MIME = 'application/x-gusy-block';
export const SECTION_DRAG_MIME = 'application/x-gusy-section';

export const QUICK_BLOCKS = [
  { type: 'header', label: 'Header', icon: 'N' },
  { type: 'hero', label: 'Hero', icon: 'H' },
  { type: 'features', label: 'Services', icon: 'S' },
  { type: 'testimonials', label: 'Reviews', icon: 'R' },
  { type: 'pricing', label: 'Pricing', icon: '$' },
  { type: 'form', label: 'Form', icon: 'F' },
  { type: 'faq', label: 'FAQ', icon: '?' }
] as const;

export const SECTION_BACKGROUND_OPTIONS = [
  { value: 'plain', label: 'Plain' },
  { value: 'soft', label: 'Soft' },
  { value: 'elevated', label: 'Raised' },
  { value: 'hero', label: 'Hero' }
] as const;

export const SECTION_ACCENT_KEYS = ['primary', 'accent', 'support', 'gold', 'ink'] as const;

export const SECTION_WIDTH_OPTIONS = [
  { value: 'boxed', label: 'Boxed' },
  { value: 'wide', label: 'Wide' },
  { value: 'full', label: 'Full' }
] as const;

export const SECTION_SPACING_OPTIONS = [
  { value: 'compact', label: 'Tight' },
  { value: 'lg', label: 'Normal' },
  { value: 'xl', label: 'Roomy' }
] as const;
