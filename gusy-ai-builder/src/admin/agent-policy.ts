import type { GusyAgentAction } from './types';

export const AGENT_ACTION_SUMMARIES: Record<GusyAgentAction['type'], string> = {
  open_tab: 'Open the requested workspace.',
  open_page_settings: 'Open page settings and LLM Gateway.',
  scan_elementor: 'Scan WordPress for Elementor pages.',
  run_audit: 'Run the current page audit.',
  save_draft: 'Save the page as a WordPress draft.',
  publish: 'Publish the page to WordPress.',
  generate_page: 'Generate a full page from the brief and replace the current page.',
  create_section: 'Insert a new section into the current page.',
  transform_selected: 'Modify the selected section using the instruction.',
  update_selected_style: 'Change layout or visual settings for the selected section.',
  move_selected: 'Move the selected section up or down in the page.',
  apply_theme_tokens: 'Apply colors, typography and layout derived from the active WordPress theme.',
  start_mission: 'Run the full Gusy workflow: memory, theme, structure, SEO and audit.',
  finish_page: 'Complete missing sections, theme fit, SEO and audit readiness.',
  save_project_memory: 'Save this brief as reusable project memory.',
  build_brand_kit: 'Create a site style from memory and the active theme.',
  generate_local_seo: 'Create SEO metadata and JSON-LD for the current page.',
  critique_page: 'Inspect the current page and return concrete fixes.',
  preview_first_elementor: 'Preview the first detected Elementor page conversion.',
  set_homepage: 'Set the saved WordPress page as the site homepage.'
};

const IMPACTFUL_ACTIONS = new Set<GusyAgentAction['type']>([
  'generate_page',
  'create_section',
  'transform_selected',
  'update_selected_style',
  'move_selected',
  'apply_theme_tokens',
  'start_mission',
  'finish_page',
  'build_brand_kit',
  'generate_local_seo',
  'publish',
  'set_homepage'
]);

export function actionSummary(action: GusyAgentAction): string {
  return AGENT_ACTION_SUMMARIES[action.type] || 'Run this Gusy action.';
}

export function isImpactfulAction(action: GusyAgentAction): boolean {
  return IMPACTFUL_ACTIONS.has(action.type);
}
