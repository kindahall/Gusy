import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import { AIBar, AnnotationPanel, CommandPalette, ProductAgentPanel } from './ai-tools';
import { CanvasContextMenu } from './canvas-context-menu';
import { DEFAULT_BUILD_PROMPT } from './builder-options';
import { getColors } from './schema';
import type { CanvasMenuState, GusyBlueprint, GusySection, GusySettings, InspectorTab, LeftTab } from './types';

type MaybePromise = void | Promise<unknown>;
type AIBarProps = ComponentProps<typeof AIBar>;
type AnnotationPanelProps = ComponentProps<typeof AnnotationPanel>;
type CommandPaletteProps = ComponentProps<typeof CommandPalette>;
type ProductAgentPanelProps = ComponentProps<typeof ProductAgentPanel>;

export type AppOverlaysProps = {
  addTemplate: CommandPaletteProps['onAddTemplate'];
  agentBusy: boolean;
  agentMemory: ProductAgentPanelProps['memory'];
  agentMessages: ProductAgentPanelProps['messages'];
  agentOpen: boolean;
  annotationDraft: AnnotationPanelProps['draft'] | null;
  applyAnnotationDraft: () => Promise<void>;
  applyPendingAgentAction: ProductAgentPanelProps['onApplyPending'];
  applyThemeTokens: () => MaybePromise;
  askAgent: AIBarProps['onAskAgent'];
  askProductAgent: ProductAgentPanelProps['onAsk'];
  blueprint: GusyBlueprint;
  buildBrandKit: (instruction: string) => MaybePromise;
  busy: boolean;
  canvasMenu: CanvasMenuState | null;
  chooseBackgroundImage: (sectionId: string) => MaybePromise;
  chooseBackgroundVideo: (sectionId: string) => MaybePromise;
  clearPendingAgentAction: ProductAgentPanelProps['onCancelPending'];
  closeAnnotationDraft: AnnotationPanelProps['onClose'];
  duplicateSectionById: (sectionId: string) => void;
  exportBlueprint: () => MaybePromise;
  finishPage: (instruction?: string) => MaybePromise;
  generatePage: (promptOverride?: string) => MaybePromise;
  leftTab: LeftTab;
  loadMigrationPages: () => MaybePromise;
  moveSectionById: (sectionId: string, direction: -1 | 1) => void;
  paletteOpen: boolean;
  pendingAgentAction: ProductAgentPanelProps['pendingAction'];
  prompt: string;
  quickAddBlock: (type: GusySection['type'], afterId?: string) => void;
  removeAnnotation: (annotationId: string) => void;
  removeBackgroundImage: (sectionId: string) => MaybePromise;
  removeBackgroundVideo: (sectionId: string) => MaybePromise;
  removeSectionById: (sectionId: string) => void;
  restoreVersion: () => void;
  runAgentAction: ProductAgentPanelProps['onAction'];
  runAudit: () => MaybePromise;
  saveAnnotationDraft: AnnotationPanelProps['onSave'];
  savePage: (status: 'draft' | 'publish') => MaybePromise;
  sections: GusySection[];
  selected?: GusySection;
  setAgentOpen: Dispatch<SetStateAction<boolean>>;
  onOpenAgent: () => void;
  setCanvasMenu: Dispatch<SetStateAction<CanvasMenuState | null>>;
  setInspectorTab: (tab: InspectorTab) => void;
  setLeftTab: (tab: LeftTab) => void;
  setPaletteOpen: Dispatch<SetStateAction<boolean>>;
  setPrompt: AIBarProps['setPrompt'];
  setSelectedId: (sectionId: string) => void;
  settings: GusySettings;
  startBlankPage: () => void;
  startAnnotation: (sectionId: string) => void;
  toggleAnnotationMode: () => void;
  transformSectionById: (sectionId: string, instruction: string) => MaybePromise;
  transformSelected: AIBarProps['onTransform'];
  updateAnnotationDraft: AnnotationPanelProps['onChange'];
  updateSectionSettingsById: (
    sectionId: string,
    settings: Partial<NonNullable<GusySection['settings']>>,
    status?: string
  ) => void;
};

export function AppOverlays(props: AppOverlaysProps) {
  const commands = [
    { label: 'Create with AI', action: () => props.generatePage(DEFAULT_BUILD_PROMPT) },
    { label: 'Blank page', action: props.startBlankPage },
    { label: 'Add page notes', action: props.toggleAnnotationMode },
    { label: 'Load saved pages', action: () => props.setLeftTab('pages') },
    { label: 'Open theme kits', action: () => props.setLeftTab('themes') },
    { label: 'Add sections', action: () => props.setLeftTab('blocks') },
    { label: 'Edit page', action: () => props.setLeftTab('layers') },
    { label: 'Open site style', action: () => props.setLeftTab('brand') },
    { label: 'Run audit', action: props.runAudit },
    { label: 'Export JSON', action: props.exportBlueprint },
    {
      label: 'Scan Elementor',
      action: () => {
        props.setLeftTab('migrate');
        void props.loadMigrationPages();
      }
    },
    { label: 'Save draft', action: () => props.savePage('draft') },
    { label: 'Publish to WordPress', action: () => props.savePage('publish') }
  ];

  const menuSection = props.canvasMenu?.sectionId
    ? props.sections.find((section) => section.id === props.canvasMenu?.sectionId)
    : undefined;
  const menuSectionIndex = props.canvasMenu?.sectionId
    ? props.sections.findIndex((section) => section.id === props.canvasMenu?.sectionId)
    : -1;

  return (
    <>
      <AIBar
        prompt={props.prompt}
        setPrompt={props.setPrompt}
        busy={props.busy}
        agentBusy={props.agentBusy}
        selected={props.selected}
        hasSections={props.sections.length > 0}
        tab={props.leftTab}
        onGenerate={props.generatePage}
        onTransform={props.transformSelected}
        onAskAgent={props.askAgent}
        onFinishPage={() => { void props.finishPage(); }}
        onBuildBrandKit={() => { void props.buildBrandKit(props.prompt || DEFAULT_BUILD_PROMPT); }}
        onApplyTheme={() => { void props.applyThemeTokens(); }}
        onRunAudit={props.runAudit}
        onScanElementor={() => {
          props.setLeftTab('migrate');
          void props.loadMigrationPages();
        }}
        onOpenBlocks={() => props.setLeftTab('blocks')}
      />

      {props.agentOpen && (
        <ProductAgentPanel
          messages={props.agentMessages}
          memory={props.agentMemory}
          pendingAction={props.pendingAgentAction}
          busy={props.agentBusy}
          onAction={props.runAgentAction}
          onApplyPending={props.applyPendingAgentAction}
          onCancelPending={props.clearPendingAgentAction}
          onUndo={props.restoreVersion}
          onAsk={props.askProductAgent}
          onClose={() => props.setAgentOpen(false)}
        />
      )}

      {props.paletteOpen && (
        <CommandPalette
          commands={commands}
          templates={props.settings.templates}
          onAddTemplate={props.addTemplate}
          onClose={() => props.setPaletteOpen(false)}
        />
      )}

      {props.canvasMenu && (
        <CanvasContextMenu
          menu={props.canvasMenu}
          section={menuSection}
          colors={getColors(props.blueprint)}
          canMoveUp={menuSectionIndex > 0}
          canMoveDown={menuSectionIndex > -1 && menuSectionIndex < props.sections.length - 1}
          onClose={() => props.setCanvasMenu(null)}
          onAdd={(type) => {
            props.quickAddBlock(type, props.canvasMenu?.sectionId);
            props.setCanvasMenu(null);
          }}
          onOpenBlocks={() => {
            props.setCanvasMenu(null);
            props.setLeftTab('blocks');
          }}
          onOpenBrand={() => {
            props.setCanvasMenu(null);
            props.setLeftTab('brand');
          }}
          onRunAudit={() => {
            props.setCanvasMenu(null);
            void props.runAudit();
          }}
          onAskAgent={() => {
            props.setCanvasMenu(null);
            props.onOpenAgent();
          }}
          onBuildAI={() => {
            props.setCanvasMenu(null);
            void props.generatePage(props.prompt || DEFAULT_BUILD_PROMPT);
          }}
          onBackground={(background) => {
            if (props.canvasMenu?.sectionId) props.updateSectionSettingsById(props.canvasMenu.sectionId, { background }, `${background} background`);
          }}
          onBackgroundImage={() => {
            if (props.canvasMenu?.sectionId) void props.chooseBackgroundImage(props.canvasMenu.sectionId);
            props.setCanvasMenu(null);
          }}
          onRemoveBackgroundImage={() => {
            if (props.canvasMenu?.sectionId) void props.removeBackgroundImage(props.canvasMenu.sectionId);
          }}
          onBackgroundVideo={() => {
            if (props.canvasMenu?.sectionId) void props.chooseBackgroundVideo(props.canvasMenu.sectionId);
            props.setCanvasMenu(null);
          }}
          onRemoveBackgroundVideo={() => {
            if (props.canvasMenu?.sectionId) void props.removeBackgroundVideo(props.canvasMenu.sectionId);
          }}
          onClearBackgroundMedia={() => {
            if (props.canvasMenu?.sectionId) {
              props.updateSectionSettingsById(
                props.canvasMenu.sectionId,
                { backgroundImage: undefined, backgroundVideo: undefined, videoMode: 'inline' },
                'Background media cleared'
              );
            }
          }}
          onAccent={(accent) => {
            if (props.canvasMenu?.sectionId) props.updateSectionSettingsById(props.canvasMenu.sectionId, { accent }, `${accent} accent`);
          }}
          onWidth={(width) => {
            if (props.canvasMenu?.sectionId) props.updateSectionSettingsById(props.canvasMenu.sectionId, { width }, `${width} width`);
          }}
          onSpacing={(spacing) => {
            if (props.canvasMenu?.sectionId) props.updateSectionSettingsById(props.canvasMenu.sectionId, { spacing }, `${spacing} spacing`);
          }}
          onColumns={(columns) => {
            if (props.canvasMenu?.sectionId) props.updateSectionSettingsById(props.canvasMenu.sectionId, { columns }, `${columns} column layout`);
          }}
          onImprove={() => {
            if (props.canvasMenu?.sectionId) void props.transformSectionById(props.canvasMenu.sectionId, 'Improve this section for clarity, conversion and visual rhythm.');
            props.setCanvasMenu(null);
          }}
          onAnnotate={() => {
            if (props.canvasMenu?.sectionId) props.startAnnotation(props.canvasMenu.sectionId);
            props.setCanvasMenu(null);
          }}
          onDuplicate={() => {
            if (props.canvasMenu?.sectionId) props.duplicateSectionById(props.canvasMenu.sectionId);
            props.setCanvasMenu(null);
          }}
          onMoveUp={() => {
            if (props.canvasMenu?.sectionId) props.moveSectionById(props.canvasMenu.sectionId, -1);
            props.setCanvasMenu(null);
          }}
          onMoveDown={() => {
            if (props.canvasMenu?.sectionId) props.moveSectionById(props.canvasMenu.sectionId, 1);
            props.setCanvasMenu(null);
          }}
          onStyle={() => {
            if (props.canvasMenu?.sectionId) props.setSelectedId(props.canvasMenu.sectionId);
            props.setInspectorTab('style');
            props.setLeftTab('layers');
            props.setCanvasMenu(null);
          }}
          onDelete={() => {
            if (props.canvasMenu?.sectionId) props.removeSectionById(props.canvasMenu.sectionId);
            props.setCanvasMenu(null);
          }}
        />
      )}

      {props.annotationDraft && (
        <AnnotationPanel
          draft={props.annotationDraft}
          section={props.sections.find((section) => section.id === props.annotationDraft?.sectionId)}
          busy={props.busy}
          onChange={props.updateAnnotationDraft}
          onSave={props.saveAnnotationDraft}
          onApply={() => { void props.applyAnnotationDraft(); }}
          onRemove={props.annotationDraft.id ? () => props.removeAnnotation(props.annotationDraft?.id as string) : undefined}
          onClose={props.closeAnnotationDraft}
        />
      )}
    </>
  );
}
