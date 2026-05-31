import { actionSummary, isImpactfulAction } from './agent-policy';
import {
  QUICK_BLOCKS,
  SECTION_ACCENT_KEYS,
  SECTION_BACKGROUND_OPTIONS,
  SECTION_SPACING_OPTIONS,
  SECTION_WIDTH_OPTIONS
} from './builder-options';
import type { GusyAgentAction, GusySection, LeftTab, PendingAgentAction } from './types';

const AGENT_TABS: LeftTab[] = ['pages', 'themes', 'blocks', 'layers', 'brand', 'audit', 'export', 'migrate'];
const AGENT_SECTION_TYPES = [
  ...QUICK_BLOCKS.map((block) => block.type),
  'cta',
  'testimonials',
  'gallery',
  'process',
  'comparison',
  'local',
  'newsletter',
  'logos',
  'stats',
  'footer'
];
const AGENT_SECTION_TYPE_ALIASES: Record<string, string> = {
  service: 'features',
  services: 'features',
  contact: 'form',
  lead: 'form',
  proof: 'testimonials',
  testimonial: 'testimonials'
};

export type AgentActionCommand =
  | { type: 'open_tab'; tab: LeftTab }
  | { type: 'open_page_settings' }
  | { type: 'scan_elementor' }
  | { type: 'run_audit' }
  | { type: 'save_page'; status: 'draft' | 'publish' }
  | { type: 'generate_page'; prompt: string }
  | { type: 'create_section'; sectionType: string }
  | { type: 'transform_selected'; prompt: string }
  | { type: 'update_selected_style'; settings: Partial<GusySection['settings']> }
  | { type: 'move_selected'; direction: -1 | 1 }
  | { type: 'apply_theme_tokens' }
  | { type: 'save_project_memory'; prompt: string }
  | { type: 'build_brand_kit'; prompt: string }
  | { type: 'generate_local_seo' }
  | { type: 'critique_page' }
  | { type: 'preview_first_elementor' }
  | { type: 'set_homepage' }
  | { type: 'finish_page'; prompt: string }
  | { type: 'start_mission'; prompt: string };

export type AgentActionResolution =
  | { type: 'confirm'; pendingAction: PendingAgentAction }
  | { type: 'blocked'; status: string }
  | { type: 'run'; command: AgentActionCommand };

export function normalizeAgentTab(target?: string): LeftTab | null {
  return AGENT_TABS.includes(target as LeftTab) ? target as LeftTab : null;
}

export function normalizeAgentSectionType(value?: string): string | null {
  const clean = (value || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const normalized = AGENT_SECTION_TYPE_ALIASES[clean] || clean;
  return AGENT_SECTION_TYPES.includes(normalized as typeof AGENT_SECTION_TYPES[number]) ? normalized : null;
}

export function normalizeAgentDirection(value?: string): -1 | 1 | null {
  if (value === 'up' || value === 'before') return -1;
  if (value === 'down' || value === 'after') return 1;
  return null;
}

export function normalizeAgentSectionSettings(settings?: Partial<GusySection['settings']>): Partial<GusySection['settings']> | null {
  if (!settings || typeof settings !== 'object') return null;

  const next: Partial<GusySection['settings']> = {};
  const backgrounds = SECTION_BACKGROUND_OPTIONS.map((option) => option.value);
  const spacings = SECTION_SPACING_OPTIONS.map((option) => option.value);
  const widths = SECTION_WIDTH_OPTIONS.map((option) => option.value);

  if (settings.background && backgrounds.includes(settings.background as typeof backgrounds[number])) {
    next.background = settings.background;
  }
  if (settings.spacing && spacings.includes(settings.spacing as typeof spacings[number])) {
    next.spacing = settings.spacing;
  }
  if (settings.width && widths.includes(settings.width as typeof widths[number])) {
    next.width = settings.width;
  }
  if (settings.textAlign && ['left', 'center', 'right'].includes(settings.textAlign)) {
    next.textAlign = settings.textAlign;
  }
  if (settings.headingScale && ['compact', 'standard', 'display'].includes(settings.headingScale)) {
    next.headingScale = settings.headingScale;
  }
  if (settings.textWidth && ['narrow', 'standard', 'wide'].includes(settings.textWidth)) {
    next.textWidth = settings.textWidth;
  }
  if (settings.bodyScale && ['compact', 'standard', 'large'].includes(settings.bodyScale)) {
    next.bodyScale = settings.bodyScale;
  }
  if (settings.buttonStyle && ['solid', 'soft', 'outline'].includes(settings.buttonStyle)) {
    next.buttonStyle = settings.buttonStyle;
  }
  if (settings.buttonSize && ['sm', 'md', 'lg'].includes(settings.buttonSize)) {
    next.buttonSize = settings.buttonSize;
  }
  if (settings.buttonShape && ['pill', 'rounded', 'square'].includes(settings.buttonShape)) {
    next.buttonShape = settings.buttonShape;
  }
  if (settings.imageAspect && ['landscape', 'portrait', 'square'].includes(settings.imageAspect)) {
    next.imageAspect = settings.imageAspect;
  }
  if (settings.imagePosition && ['center', 'top', 'bottom'].includes(settings.imagePosition)) {
    next.imagePosition = settings.imagePosition;
  }
  if (settings.imageShape && ['rounded', 'square', 'soft'].includes(settings.imageShape)) {
    next.imageShape = settings.imageShape;
  }
  if (settings.videoMode && ['inline', 'background'].includes(settings.videoMode)) {
    next.videoMode = settings.videoMode;
  }
  if (settings.accent && SECTION_ACCENT_KEYS.includes(settings.accent as typeof SECTION_ACCENT_KEYS[number])) {
    next.accent = settings.accent;
  }
  if (typeof settings.columns === 'number' && Number.isInteger(settings.columns) && settings.columns >= 1 && settings.columns <= 4) {
    next.columns = settings.columns;
  }
  if (typeof settings.tabletColumns === 'number' && Number.isInteger(settings.tabletColumns) && settings.tabletColumns >= 1 && settings.tabletColumns <= 3) {
    next.tabletColumns = settings.tabletColumns;
  }
  if (typeof settings.mobileColumns === 'number' && Number.isInteger(settings.mobileColumns) && settings.mobileColumns >= 1 && settings.mobileColumns <= 2) {
    next.mobileColumns = settings.mobileColumns;
  }
  if (typeof settings.mobileStack === 'boolean') {
    next.mobileStack = settings.mobileStack;
  }
  if (typeof settings.motionEnabled === 'boolean') {
    next.motionEnabled = settings.motionEnabled;
  }
  if (settings.motionEntrance && ['fade-up', 'scale-in', 'slide-in'].includes(settings.motionEntrance)) {
    next.motionEntrance = settings.motionEntrance;
  }
  if (typeof settings.motionDuration === 'number' && Number.isInteger(settings.motionDuration) && settings.motionDuration >= 100 && settings.motionDuration <= 1200) {
    next.motionDuration = settings.motionDuration;
  }

  return Object.keys(next).length ? next : null;
}

export function actionPrompt(action: GusyAgentAction, activePrompt: string, fallback = ''): string {
  return action.prompt || activePrompt || fallback;
}

export function resolveAgentAction(
  action: GusyAgentAction,
  context: { confirmed?: boolean; activePrompt: string; hasSelectedSection: boolean }
): AgentActionResolution {
  if (!context.confirmed && isImpactfulAction(action)) {
    return { type: 'confirm', pendingAction: { action, summary: actionSummary(action) } };
  }

  if (action.type === 'open_tab') {
    const tab = normalizeAgentTab(action.target);
    return tab ? { type: 'run', command: { type: 'open_tab', tab } } : { type: 'blocked', status: 'Workspace unavailable' };
  }
  if (action.type === 'open_page_settings') return { type: 'run', command: { type: 'open_page_settings' } };
  if (action.type === 'scan_elementor') return { type: 'run', command: { type: 'scan_elementor' } };
  if (action.type === 'run_audit') return { type: 'run', command: { type: 'run_audit' } };
  if (action.type === 'save_draft') return { type: 'run', command: { type: 'save_page', status: 'draft' } };
  if (action.type === 'publish') return { type: 'run', command: { type: 'save_page', status: 'publish' } };
  if (action.type === 'generate_page') return { type: 'run', command: { type: 'generate_page', prompt: actionPrompt(action, context.activePrompt) } };
  if (action.type === 'create_section') {
    const sectionType = normalizeAgentSectionType(action.sectionType || action.target || action.prompt);
    return sectionType
      ? { type: 'run', command: { type: 'create_section', sectionType } }
      : { type: 'blocked', status: 'Section type unavailable' };
  }
  if (action.type === 'transform_selected') {
    if (!context.hasSelectedSection) return { type: 'blocked', status: 'Select a section first' };
    return { type: 'run', command: { type: 'transform_selected', prompt: actionPrompt(action, context.activePrompt, 'Improve this section') } };
  }
  if (action.type === 'update_selected_style') {
    if (!context.hasSelectedSection) return { type: 'blocked', status: 'Select a section first' };
    const settings = normalizeAgentSectionSettings(action.settings);
    return settings
      ? { type: 'run', command: { type: 'update_selected_style', settings } }
      : { type: 'blocked', status: 'Style change unavailable' };
  }
  if (action.type === 'move_selected') {
    if (!context.hasSelectedSection) return { type: 'blocked', status: 'Select a section first' };
    const direction = normalizeAgentDirection(action.direction || action.target);
    return direction
      ? { type: 'run', command: { type: 'move_selected', direction } }
      : { type: 'blocked', status: 'Move direction unavailable' };
  }
  if (action.type === 'apply_theme_tokens') return { type: 'run', command: { type: 'apply_theme_tokens' } };
  if (action.type === 'save_project_memory') return { type: 'run', command: { type: 'save_project_memory', prompt: actionPrompt(action, context.activePrompt) } };
  if (action.type === 'build_brand_kit') return { type: 'run', command: { type: 'build_brand_kit', prompt: actionPrompt(action, context.activePrompt) } };
  if (action.type === 'generate_local_seo') return { type: 'run', command: { type: 'generate_local_seo' } };
  if (action.type === 'critique_page') return { type: 'run', command: { type: 'critique_page' } };
  if (action.type === 'preview_first_elementor') return { type: 'run', command: { type: 'preview_first_elementor' } };
  if (action.type === 'set_homepage') return { type: 'run', command: { type: 'set_homepage' } };
  if (action.type === 'finish_page') return { type: 'run', command: { type: 'finish_page', prompt: actionPrompt(action, context.activePrompt) } };
  return { type: 'run', command: { type: 'start_mission', prompt: actionPrompt(action, context.activePrompt) } };
}
