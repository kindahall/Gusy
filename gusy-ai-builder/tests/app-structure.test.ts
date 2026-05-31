import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

describe('Gusy app structure', () => {
  it('keeps workspace routing outside the root App component', () => {
    const app = readFileSync('src/admin/App.tsx', 'utf8');
    const router = readFileSync('src/admin/workspace-router.tsx', 'utf8');
    const overlays = readFileSync('src/admin/app-overlays.tsx', 'utf8');

    assert.match(app, /import \{ WorkspaceRouter \} from '\.\/workspace-router';/);
    assert.match(app, /import \{ AppOverlays \} from '\.\/app-overlays';/);
    assert.doesNotMatch(app, /from '\.\/workspaces'/);
    assert.doesNotMatch(router, /from '\.\/workspaces'/);
    assert.doesNotMatch(app, /from '\.\/theme-workspace'/);
    assert.doesNotMatch(app, /from '\.\/brand-workspace'/);
    assert.doesNotMatch(app, /from '\.\/page-canvas'/);
    assert.doesNotMatch(app, /from '\.\/ai-tools'/);
    assert.doesNotMatch(app, /from '\.\/canvas-context-menu'/);
    assert.doesNotMatch(app, /getColors/);
    assert.doesNotMatch(app, /function renderMain/);
    assert.match(router, /export function WorkspaceRouter/);
    assert.match(overlays, /export function AppOverlays/);
    assert.match(overlays, /CanvasContextMenu/);
    assert.match(overlays, /ProductAgentPanel/);
    assert.match(app, /settings\.initialEdit \|\| initialPostId \? 'layers' : 'pages'/);
    assert.ok(app.split('\n').length < 760);
  });

  it('keeps editor chrome flows outside the editor shell barrel', () => {
    const shell = readFileSync('src/admin/editor-shell.tsx', 'utf8');
    const topbar = readFileSync('src/admin/editor-topbar.tsx', 'utf8');
    const sidebar = readFileSync('src/admin/editor-sidebar.tsx', 'utf8');
    const launch = readFileSync('src/admin/launch-checklist.tsx', 'utf8');
    const pageName = readFileSync('src/admin/page-name-editor.tsx', 'utf8');

    assert.match(shell, /export \{ Topbar \} from '\.\/editor-topbar';/);
    assert.match(shell, /export \{ Sidebar \} from '\.\/editor-sidebar';/);
    assert.doesNotMatch(shell, /function Topbar/);
    assert.doesNotMatch(shell, /function Sidebar/);
    assert.doesNotMatch(shell, /LaunchChecklist/);
    assert.doesNotMatch(shell, /PageNameEditor/);
    assert.match(topbar, /export function Topbar/);
    assert.match(topbar, /DeviceSwitch/);
    assert.match(topbar, /gusy-language-switch/);
    assert.match(sidebar, /export function Sidebar/);
    assert.match(sidebar, /LaunchChecklist/);
    assert.match(sidebar, /PageNameEditor/);
    assert.match(launch, /export function LaunchChecklist/);
    assert.match(launch, /Choose a base/);
    assert.match(pageName, /export function PageNameEditor/);
    assert.match(pageName, /nextSlugAfterTitleChange/);
    assert.ok(shell.split('\n').length < 10);
    assert.ok(sidebar.split('\n').length < 190);
  });

  it('keeps WordPress page session actions outside the root App component', () => {
    const app = readFileSync('src/admin/App.tsx', 'utf8');
    const session = readFileSync('src/admin/page-session-workflow.ts', 'utf8');
    const lifecycle = readFileSync('src/admin/app-lifecycle.ts', 'utf8');

    assert.match(app, /import \{ usePageSessionWorkflow \} from '\.\/page-session-workflow';/);
    assert.match(app, /import \{ useAppLifecycle \} from '\.\/app-lifecycle';/);
    assert.match(app, /usePageSessionWorkflow/);
    assert.match(app, /useAppLifecycle/);
    assert.match(app, /savePage=\{savePage\}/);
    assert.match(app, /startBlankPage=\{startBlankPage\}/);
    assert.doesNotMatch(app, /applyPendingPageName/);
    assert.doesNotMatch(app, /uniqueBlankPageTitle/);
    assert.doesNotMatch(app, /addEventListener\('keydown'/);
    assert.doesNotMatch(app, /UI_LANGUAGE_KEY/);
    assert.doesNotMatch(app, /function savePage/);
    assert.doesNotMatch(app, /function previewPage/);
    assert.doesNotMatch(app, /function startBlankPage/);
    assert.match(session, /export function usePageSessionWorkflow/);
    assert.match(session, /applyPendingPageName/);
    assert.match(session, /uniqueBlankPageTitle/);
    assert.match(session, /createBlankBlueprint/);
    assert.match(session, /restoreRevision/);
    assert.match(lifecycle, /export function useAppLifecycle/);
    assert.match(lifecycle, /UI_LANGUAGE_KEY/);
    assert.match(lifecycle, /addEventListener\('keydown'/);
    assert.match(lifecycle, /loadAgentMemory/);
    assert.ok(app.split('\n').length < 700);
  });

  it('keeps theme kit profile editing outside the theme workspace shell', () => {
    const themeWorkspace = readFileSync('src/admin/theme-workspace.tsx', 'utf8');
    const profileEditor = readFileSync('src/admin/theme-profile-editor.tsx', 'utf8');
    const themeModel = readFileSync('src/admin/theme-workspace-model.ts', 'utf8');

    assert.match(themeWorkspace, /import \{ ThemeProfileEditor \} from '\.\/theme-profile-editor';/);
    assert.match(themeWorkspace, /profileFromThemeKit/);
    assert.match(themeWorkspace, /themeWorkspaceCopy/);
    assert.doesNotMatch(themeWorkspace, /const PAGE_KEYS/);
    assert.doesNotMatch(themeWorkspace, /function updateOffer/);
    assert.doesNotMatch(themeWorkspace, /function updateReview/);
    assert.match(profileEditor, /export function ThemeProfileEditor/);
    assert.match(profileEditor, /updateThemeProfileMenuPages/);
    assert.match(themeModel, /export function profileFromThemeKit/);
    assert.ok(themeWorkspace.split('\n').length < 380);
  });

  it('keeps the blocks browser outside the mixed workspace module', () => {
    const router = readFileSync('src/admin/workspace-router.tsx', 'utf8');
    const blocks = readFileSync('src/admin/blocks-workspace.tsx', 'utf8');

    assert.match(router, /import \{ BlocksWorkspace \} from '\.\/blocks-workspace';/);
    assert.match(blocks, /export function BlocksWorkspace/);
    assert.match(blocks, /BLOCK_DRAG_MIME/);
    assert.match(blocks, /filterBlockTemplates/);
  });

  it('keeps canvas editing controls outside the canvas drag coordinator', () => {
    const canvas = readFileSync('src/admin/page-canvas.tsx', 'utf8');
    const annotations = readFileSync('src/admin/canvas-annotation-markers.tsx', 'utf8');
    const controls = readFileSync('src/admin/canvas-section-controls.tsx', 'utf8');
    const palette = readFileSync('src/admin/canvas-block-palette.tsx', 'utf8');

    assert.match(canvas, /import \{ CanvasAnnotationMarkers \} from '\.\/canvas-annotation-markers';/);
    assert.match(canvas, /import \{ EmptyCanvas, CanvasToolbelt \} from '\.\/canvas-block-palette';/);
    assert.match(canvas, /import \{ CanvasSectionControls \} from '\.\/canvas-section-controls';/);
    assert.match(canvas, /dragTypesFromList/);
    assert.match(canvas, /placementFromVerticalPoint/);
    assert.match(canvas, /RenderSection/);
    assert.doesNotMatch(canvas, /const STYLE_GROUPS/);
    assert.doesNotMatch(canvas, /const QUICK_INSERTS/);
    assert.doesNotMatch(canvas, /Edit this section/);
    assert.match(annotations, /export function CanvasAnnotationMarkers/);
    assert.match(annotations, /gusy-annotation-marker/);
    assert.match(controls, /const STYLE_GROUPS/);
    assert.match(controls, /const QUICK_INSERTS/);
    assert.match(controls, /export function CanvasSectionControls/);
    assert.match(palette, /export function CanvasToolbelt/);
    assert.match(palette, /export function EmptyCanvas/);
    assert.ok(canvas.split('\n').length < 310);
  });

  it('keeps canvas session events outside the root App component', () => {
    const app = readFileSync('src/admin/App.tsx', 'utf8');
    const session = readFileSync('src/admin/canvas-session-workflow.ts', 'utf8');

    assert.match(app, /import \{ useCanvasSessionWorkflow \} from '\.\/canvas-session-workflow';/);
    assert.match(app, /useCanvasSessionWorkflow/);
    assert.doesNotMatch(app, /CanvasMenuState/);
    assert.doesNotMatch(app, /ReactMouseEvent/);
    assert.doesNotMatch(app, /GusySection/);
    assert.doesNotMatch(app, /function updateCanvasSection/);
    assert.doesNotMatch(app, /function updateCanvasItem/);
    assert.doesNotMatch(app, /function openCanvasMenu/);
    assert.match(session, /export function useCanvasSessionWorkflow/);
    assert.match(session, /CanvasMenuState/);
    assert.match(session, /updateCanvasSection/);
    assert.match(session, /updateCanvasItem/);
    assert.match(session, /openCanvasMenu/);
    assert.ok(app.split('\n').length < 680);
  });

  it('keeps Elementor migration isolated from generic workspace shells', () => {
    const router = readFileSync('src/admin/workspace-router.tsx', 'utf8');
    const migration = readFileSync('src/admin/migration-workspace.tsx', 'utf8');

    assert.match(router, /import \{ MigrationWorkspace \} from '\.\/migration-workspace';/);
    assert.match(migration, /export function MigrationWorkspace/);
    assert.match(migration, /GusyElementorPage/);
    assert.match(migration, /MigrationPreview/);
    assert.match(migration, /RenderSection/);
  });

  it('keeps export and backup UI outside the mixed workspace module', () => {
    const router = readFileSync('src/admin/workspace-router.tsx', 'utf8');
    const exportWorkspace = readFileSync('src/admin/export-workspace.tsx', 'utf8');
    const exportStore = readFileSync('src/admin/export-store.ts', 'utf8');

    assert.match(router, /import \{ ExportWorkspace \} from '\.\/export-workspace';/);
    assert.match(exportWorkspace, /export function ExportWorkspace/);
    assert.match(exportWorkspace, /ExportRecord/);
    assert.match(exportWorkspace, /formatDate/);
    assert.match(exportWorkspace, /onUseHistory/);
    assert.match(exportStore, /useExportRecord/);
  });

  it('keeps workflow inspectors outside the right panel shell', () => {
    const rightPanel = readFileSync('src/admin/right-panel.tsx', 'utf8');
    const workflowInspectors = readFileSync('src/admin/right-panel-workflow-inspectors.tsx', 'utf8');
    const canvasInspector = readFileSync('src/admin/canvas-inspector.tsx', 'utf8');
    const pageCompletion = readFileSync('src/admin/page-completion-panel.tsx', 'utf8');
    const inspectorPanels = readFileSync('src/admin/inspector-panels.tsx', 'utf8');
    const sectionQuality = readFileSync('src/admin/section-quality-panel.tsx', 'utf8');

    assert.match(rightPanel, /from '\.\/right-panel-workflow-inspectors';/);
    assert.match(rightPanel, /import \{ CanvasInspector \} from '\.\/canvas-inspector';/);
    assert.match(rightPanel, /import \{ SectionInspector \} from '\.\/inspector-panels';/);
    assert.match(rightPanel, /AuditInspector/);
    assert.match(rightPanel, /BlockInspector/);
    assert.match(rightPanel, /BrandInspector/);
    assert.match(rightPanel, /ExportInspector/);
    assert.match(rightPanel, /MigrationInspector/);
    assert.doesNotMatch(rightPanel, /function BrandInspector/);
    assert.doesNotMatch(rightPanel, /function MigrationInspector/);
    assert.doesNotMatch(rightPanel, /BRAND_PRESETS/);
    assert.doesNotMatch(rightPanel, /PanelSection/);
    assert.doesNotMatch(rightPanel, /TemplateThumb/);
    assert.match(workflowInspectors, /export function BlockInspector/);
    assert.match(workflowInspectors, /export function BrandInspector/);
    assert.match(workflowInspectors, /export function AuditInspector/);
    assert.match(workflowInspectors, /export function ExportInspector/);
    assert.match(workflowInspectors, /export function MigrationInspector/);
    assert.match(workflowInspectors, /BRAND_PRESETS/);
    assert.match(workflowInspectors, /PanelSection/);
    assert.match(workflowInspectors, /TemplateThumb/);
    assert.match(canvasInspector, /export function CanvasInspector/);
    assert.match(canvasInspector, /PageCompletionPanel/);
    assert.match(pageCompletion, /export function PageCompletionPanel/);
    assert.match(sectionQuality, /export function SectionQualityPanel/);
    assert.doesNotMatch(inspectorPanels, /export function CanvasInspector/);
    assert.doesNotMatch(inspectorPanels, /function PageCompletionPanel/);
    assert.doesNotMatch(inspectorPanels, /function SectionQualityPanel/);
    assert.ok(rightPanel.split('\n').length < 220);
    assert.ok(inspectorPanels.split('\n').length < 500);
  });

  it('removes the generic workspaces module after splitting real workflows', () => {
    const router = readFileSync('src/admin/workspace-router.tsx', 'utf8');
    const start = readFileSync('src/admin/start-workspace.tsx', 'utf8');
    const audit = readFileSync('src/admin/audit-workspace.tsx', 'utf8');

    assert.equal(existsSync('src/admin/workspaces.tsx'), false);
    assert.match(router, /import \{ StartWorkspace \} from '\.\/start-workspace';/);
    assert.match(router, /import \{ AuditWorkspace \} from '\.\/audit-workspace';/);
    assert.match(start, /export function StartWorkspace/);
    assert.match(audit, /export function AuditWorkspace/);
    assert.match(audit, /ScoreRing/);
  });

  it('keeps motion settings through the WordPress REST sanitizer and serializer', () => {
    const rest = readFileSync('includes/class-gusy-rest-controller.php', 'utf8');
    const serializer = readFileSync('includes/class-gusy-block-serializer.php', 'utf8');

    assert.match(rest, /motionEnabled/);
    assert.match(rest, /motionEntrance/);
    assert.match(rest, /motionDuration/);
    assert.match(serializer, /gusy-motion-enabled/);
    assert.match(serializer, /--gusy-motion-duration/);
  });

  it('keeps form field editing separate from generic image item controls', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');

    assert.match(inspector, /FORM_SECTION_TYPES/);
    assert.match(inspector, /const isFormSection =/);
    assert.match(inspector, /PanelSection title="Fields"/);
    assert.match(inspector, /Field label/);
    assert.match(inspector, /Placeholder/);
    assert.match(inspector, /!isHeroSection && !isFormSection && !isNavigationSection && !isFaqSection/);
  });

  it('keeps navigation and FAQ editing out of generic image item controls', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');

    assert.match(inspector, /const isNavigationSection =/);
    assert.match(inspector, /const isFaqSection =/);
    assert.match(inspector, /PanelSection title="Navigation links"/);
    assert.match(inspector, /Link label/);
    assert.match(inspector, /Link URL/);
    assert.match(inspector, /PanelSection title="Questions"/);
    assert.match(inspector, /Question/);
    assert.match(inspector, /Answer/);
    assert.match(inspector, /!isHeroSection && !isFormSection && !isNavigationSection && !isFaqSection/);
  });

  it('keeps hero proof points visible and editable in Gusy', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');
    const renderer = readFileSync('src/admin/section-renderer.tsx', 'utf8');
    const canvasCss = readFileSync('assets/css/admin-canvas.css', 'utf8');

    assert.match(inspector, /const isHeroSection =/);
    assert.match(inspector, /PanelSection title="Proof points"/);
    assert.match(inspector, /Metric/);
    assert.match(inspector, /Caption/);
    assert.match(renderer, /gusy-render-hero-proof/);
    assert.match(renderer, /itemText\(itemIndex, 'label'\)/);
    assert.match(canvasCss, /gusy-render-hero-proof/);
  });

  it('keeps button controls focused on sections that actually render actions', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');

    assert.match(inspector, /ACTION_SECTION_TYPES/);
    assert.match(inspector, /const showsButtonControls =/);
    assert.match(inspector, /PanelSection title="Buttons"/);
    assert.match(inspector, /Primary label/);
    assert.match(inspector, /Secondary label/);
  });

  it('uses business-specific item panels instead of unlabeled generic item controls', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');

    assert.match(inspector, /PanelSection title="Offers"/);
    assert.match(inspector, /Offer name/);
    assert.match(inspector, /PanelSection title="Reviews"/);
    assert.match(inspector, /Customer photo/);
    assert.match(inspector, /PanelSection title="Metrics"/);
    assert.match(inspector, /PanelSection title="Logos"/);
    assert.match(inspector, /PanelSection title="Comparison rows"/);
    assert.match(inspector, /PanelSection title="Footer columns"/);
    assert.match(inspector, /PanelSection title="Cards"/);
    assert.match(inspector, /ItemImageControls/);
  });

  it('lets repeated section items move and duplicate from the inspector', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');
    const itemControls = readFileSync('src/admin/item-action-controls.tsx', 'utf8');
    const workflow = readFileSync('src/admin/section-workflow.ts', 'utf8');
    const app = readFileSync('src/admin/App.tsx', 'utf8');
    const rightPanel = readFileSync('src/admin/right-panel.tsx', 'utf8');

    assert.match(workflow, /moveBlueprintSectionItem/);
    assert.match(workflow, /duplicateBlueprintSectionItem/);
    assert.match(app, /moveSelectedItem=\{moveSelectedItem\}/);
    assert.match(app, /duplicateSelectedItem=\{duplicateSelectedItem\}/);
    assert.match(rightPanel, /moveSelectedItem=\{props\.moveSelectedItem\}/);
    assert.match(rightPanel, /duplicateSelectedItem=\{props\.duplicateSelectedItem\}/);
    assert.match(inspector, /ItemActionControls/);
    assert.match(itemControls, /Move up/);
    assert.match(itemControls, /Move down/);
    assert.match(itemControls, /Duplicate/);
  });

  it('offers one-click section style presets in the inspector', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');
    const presets = readFileSync('src/admin/section-style-presets.tsx', 'utf8');

    assert.match(inspector, /SectionStylePanel/);
    assert.match(presets, /Style presets/);
    assert.match(presets, /Editorial/);
    assert.match(presets, /Conversion/);
    assert.match(presets, /Compact/);
    assert.match(presets, /Copy style/);
    assert.match(presets, /Paste style/);
    assert.match(presets, /Reset style/);
  });

  it('keeps responsive section columns editable and rendered across breakpoints', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');
    const canvas = readFileSync('src/admin/page-canvas.tsx', 'utf8');
    const serializer = readFileSync('includes/class-gusy-block-serializer.php', 'utf8');
    const frontend = readFileSync('assets/css/frontend.css', 'utf8');

    assert.match(inspector, /Desktop columns/);
    assert.match(inspector, /Tablet columns/);
    assert.match(inspector, /Mobile columns/);
    assert.match(canvas, /data-tablet-columns/);
    assert.match(canvas, /data-mobile-columns/);
    assert.match(serializer, /gusy-tablet-cols-/);
    assert.match(serializer, /gusy-mobile-cols-/);
    assert.match(frontend, /gusy-tablet-cols-3/);
    assert.match(frontend, /gusy-mobile-cols-2/);
  });

  it('keeps section typography controls editable and rendered in WordPress', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');
    const canvas = readFileSync('src/admin/page-canvas.tsx', 'utf8');
    const serializer = readFileSync('includes/class-gusy-block-serializer.php', 'utf8');
    const frontend = readFileSync('assets/css/frontend.css', 'utf8');

    assert.match(inspector, /PanelSection title="Typography"/);
    assert.match(inspector, /textAlign/);
    assert.match(inspector, /headingScale/);
    assert.match(inspector, /textWidth/);
    assert.match(inspector, /bodyScale/);
    assert.match(canvas, /data-text-align/);
    assert.match(canvas, /data-heading-scale/);
    assert.match(canvas, /data-text-width/);
    assert.match(canvas, /data-body-scale/);
    assert.match(serializer, /gusy-align-/);
    assert.match(serializer, /gusy-heading-/);
    assert.match(serializer, /gusy-text-width-/);
    assert.match(serializer, /gusy-body-/);
    assert.match(frontend, /gusy-align-center/);
    assert.match(frontend, /gusy-heading-display/);
    assert.match(frontend, /gusy-text-width-wide/);
    assert.match(frontend, /gusy-body-large/);
  });

  it('keeps CTA button design controls editable and rendered in WordPress', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');
    const buttonControls = readFileSync('src/admin/button-design-controls.tsx', 'utf8');
    const canvas = readFileSync('src/admin/page-canvas.tsx', 'utf8');
    const serializer = readFileSync('includes/class-gusy-block-serializer.php', 'utf8');
    const frontend = readFileSync('assets/css/frontend.css', 'utf8');

    assert.match(inspector, /ButtonDesignControls/);
    assert.match(buttonControls, /buttonStyle/);
    assert.match(buttonControls, /buttonSize/);
    assert.match(buttonControls, /buttonShape/);
    assert.match(canvas, /data-button-style/);
    assert.match(canvas, /data-button-size/);
    assert.match(canvas, /data-button-shape/);
    assert.match(serializer, /gusy-button-style-/);
    assert.match(serializer, /gusy-button-size-/);
    assert.match(serializer, /gusy-button-shape-/);
    assert.match(frontend, /gusy-button-style-outline/);
    assert.match(frontend, /gusy-button-shape-rounded/);
  });

  it('keeps image and video media controls editable and rendered in WordPress', () => {
    const inspector = readFileSync('src/admin/inspector-panels.tsx', 'utf8');
    const imageControls = readFileSync('src/admin/image-design-controls.tsx', 'utf8');
    const mediaWorkflow = readFileSync('src/admin/media-workflow.ts', 'utf8');
    const canvasMedia = readFileSync('src/admin/canvas-section-media.tsx', 'utf8');
    const renderer = readFileSync('src/admin/section-renderer.tsx', 'utf8');
    const serializer = readFileSync('includes/class-gusy-block-serializer.php', 'utf8');
    const frontend = readFileSync('assets/css/frontend.css', 'utf8');

    assert.match(inspector, /SectionImageControls/);
    assert.match(imageControls, /imageAspect/);
    assert.match(imageControls, /backgroundVideo/);
    assert.match(imageControls, /videoMode/);
    assert.match(mediaWorkflow, /openWordPressVideoPicker/);
    assert.match(canvasMedia, /gusy-render-background-video/);
    assert.match(renderer, /heroVideo/);
    assert.match(serializer, /gusy-has-bg-video/);
    assert.match(serializer, /gusy-video-mode-/);
    assert.match(serializer, /gusy-background-video/);
    assert.match(frontend, /gusy-has-bg-video/);
    assert.match(frontend, /gusy-image-aspect-portrait/);
  });

  it('keeps logo wall items editable in canvas and serialized output', () => {
    const renderer = readFileSync('src/admin/section-renderer.tsx', 'utf8');
    const serializer = readFileSync('includes/class-gusy-block-serializer.php', 'utf8');
    const templates = readFileSync('includes/class-gusy-template-repository.php', 'utf8');

    assert.match(renderer, /section\.type === 'logos'/);
    assert.match(renderer, /gusy-render is-logos/);
    assert.match(serializer, /foreach \( array_slice\( \$items, 0, 8 \) as \$item \)/);
    assert.match(templates, /'logos' => array/);
  });

  it('keeps stats, comparison and CTA canvas renderings aligned with WordPress output', () => {
    const renderer = readFileSync('src/admin/section-renderer.tsx', 'utf8');
    const serializer = readFileSync('includes/class-gusy-block-serializer.php', 'utf8');
    const canvasCss = readFileSync('assets/css/admin-canvas.css', 'utf8');

    assert.match(renderer, /section\.type === 'stats'/);
    assert.match(renderer, /section\.type === 'comparison'/);
    assert.match(renderer, /\['cta', 'sticky-offer'\]\.includes\(section\.type\)/);
    assert.match(serializer, /section_header\( \$section \) \. '<div class="gusy-stats-band">/);
    assert.match(serializer, /clean_url\( \(string\) \( \$section\['cta'\]\['url'\] \?\? '#contact' \) \)/);
    assert.match(canvasCss, /gusy-render\.is-stats/);
    assert.match(canvasCss, /gusy-render\.is-comparison/);
    assert.match(canvasCss, /gusy-render\.is-cta/);
  });
});
