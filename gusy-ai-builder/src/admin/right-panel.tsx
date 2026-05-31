import type { BrandPresetKey } from './brand';
import { CanvasInspector } from './canvas-inspector';
import { SectionInspector } from './inspector-panels';
import {
  AuditInspector,
  BlockInspector,
  BrandInspector,
  ExportInspector,
  MigrationInspector
} from './right-panel-workflow-inspectors';
import type { GusyDesignSystem } from './schema';
import type {
  GusyAudit,
  GusyBlueprint,
  GusyElementorPage,
  GusyLLMDraft,
  GusyLLMSettings,
  GusySettings,
  GusySection,
  GusyTemplate,
  InspectorTab,
  LeftTab,
  MigrationPreview
} from './types';

type SectionSettingValue = GusySection['settings'][keyof GusySection['settings']];

export function RightPanel(props: {
  settings: GusySettings;
  tab: LeftTab;
  inspectorTab: InspectorTab;
  setInspectorTab: (tab: InspectorTab) => void;
  blueprint: GusyBlueprint;
  selected?: GusySection;
  focusedTemplate?: GusyTemplate;
  audit: GusyAudit;
  llmSettings: GusyLLMSettings;
  llmDraft: GusyLLMDraft;
  llmBusy: boolean;
  llmStatus: string;
  migrationPages: GusyElementorPage[];
  migrationPreview: MigrationPreview | null;
  exportText: string;
  importText: string;
  setImportText: (text: string) => void;
  updatePage: (updater: (page: GusyBlueprint['page']) => void) => void;
  updateSelected: (patch: Partial<GusySection>) => void;
  updateSelectedSettings: (key: keyof GusySection['settings'], value: SectionSettingValue) => void;
  onChooseBackgroundImage?: () => void;
  onRemoveBackgroundImage?: () => void;
  onChooseBackgroundVideo?: () => void;
  onRemoveBackgroundVideo?: () => void;
  updateSelectedItem: (index: number, patch: Partial<GusySection['items'][number]>) => void;
  onChooseItemImage?: (index: number) => void;
  onRemoveItemImage?: (index: number) => void;
  addSelectedItem: () => void;
  duplicateSelectedItem: (index: number) => void;
  moveSelectedItem: (index: number, direction: -1 | 1) => void;
  removeSelectedItem: (index: number) => void;
  updateColor: (key: string, value: string) => void;
  onTokenPatch: (patch: GusyDesignSystem, message?: string) => void;
  onBrandPreset: (key: BrandPresetKey) => void;
  onApplyTheme: () => void;
  onGenerateBrandKit: () => void;
  onBuildBrandPage: () => void;
  onSaveBrand: () => void;
  onQuickAdd: (type: string) => void;
  onBuildPage: () => void;
  onOpenBlocks: () => void;
  onAddTemplate: (template: GusyTemplate) => void;
  onRunAudit: () => void;
  onFix: () => void;
  onLlmDraftChange: (patch: Partial<GusyLLMDraft>) => void;
  onSaveLlm: () => void;
  onTestLlm: () => void;
  onExport: () => void;
  onCopyExport: () => void;
  onDownloadExport: () => void;
  onSaveDraft: () => void;
  onSyncExport: () => void;
  onPreviewExport: () => void;
  onImport: () => void;
  onScanMigration: () => void;
  onPreviewMigration: (id: number) => void;
  onPreviewFirstMigration: () => void;
  onOpenCanvas: () => void;
  busy: boolean;
}) {
  const isEmptyCanvasInspector = props.tab === 'layers' && !props.selected && props.blueprint.page.sections.length === 0;
  const showInspectorTabs = !isEmptyCanvasInspector && !['themes', 'blocks', 'brand', 'audit', 'export', 'migrate'].includes(props.tab);

  return (
    <aside className="gusy-right-panel">
      {showInspectorTabs && (
        <div className="gusy-right-tabs">
          {(['content', 'style', 'layout', 'motion'] as InspectorTab[]).map((tab) => (
            <button key={tab} type="button" aria-pressed={props.inspectorTab === tab} onClick={() => props.setInspectorTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
      )}
      {props.tab === 'blocks' && props.focusedTemplate && (
        <BlockInspector template={props.focusedTemplate} onInsert={props.onAddTemplate} />
      )}
      {props.tab === 'brand' && (
        <BrandInspector
          blueprint={props.blueprint}
          updateColor={props.updateColor}
          onTokenPatch={props.onTokenPatch}
          onPreset={props.onBrandPreset}
          onApplyTheme={props.onApplyTheme}
          onGenerateKit={props.onGenerateBrandKit}
          onBuildPage={props.onBuildBrandPage}
          onSave={props.onSaveBrand}
          onOpenCanvas={props.onOpenCanvas}
        />
      )}
      {props.tab === 'audit' && (
        <AuditInspector audit={props.audit} onRun={props.onRunAudit} onFix={props.onFix} />
      )}
      {props.tab === 'export' && (
        <ExportInspector
          blueprint={props.blueprint}
          exportText={props.exportText}
          importText={props.importText}
          setImportText={props.setImportText}
          onExport={props.onExport}
          onCopy={props.onCopyExport}
          onDownload={props.onDownloadExport}
          onSaveDraft={props.onSaveDraft}
          onSync={props.onSyncExport}
          onPreview={props.onPreviewExport}
          onImport={props.onImport}
          busy={props.busy}
        />
      )}
      {props.tab === 'migrate' && (
        <MigrationInspector
          pages={props.migrationPages}
          preview={props.migrationPreview}
          busy={props.busy}
          hasCanvas={props.blueprint.page.sections.length > 0}
          onScan={props.onScanMigration}
          onPreview={props.onPreviewMigration}
          onPreviewFirst={props.onPreviewFirstMigration}
          onOpenCanvas={props.onOpenCanvas}
        />
      )}
      {!['themes', 'blocks', 'brand', 'audit', 'export', 'migrate'].includes(props.tab) && (
        isEmptyCanvasInspector ? (
          <CanvasInspector
            onQuickAdd={props.onQuickAdd}
            onOpenBlocks={props.onOpenBlocks}
            onBuildPage={props.onBuildPage}
            onRunAudit={props.onRunAudit}
          />
        ) : (
          <SectionInspector
            selected={props.selected}
            blueprint={props.blueprint}
            inspectorTab={props.inspectorTab}
            llmSettings={props.llmSettings}
            llmDraft={props.llmDraft}
            llmBusy={props.llmBusy}
            llmStatus={props.llmStatus}
            updatePage={props.updatePage}
            updateSelected={props.updateSelected}
            updateSelectedSettings={props.updateSelectedSettings}
            onQuickAdd={props.onQuickAdd}
            onOpenBlocks={props.onOpenBlocks}
            onBuildPage={props.onBuildPage}
            onRunAudit={props.onRunAudit}
            onChooseBackgroundImage={props.onChooseBackgroundImage}
            onRemoveBackgroundImage={props.onRemoveBackgroundImage}
            onChooseBackgroundVideo={props.onChooseBackgroundVideo}
            onRemoveBackgroundVideo={props.onRemoveBackgroundVideo}
            updateSelectedItem={props.updateSelectedItem}
            onChooseItemImage={props.onChooseItemImage}
            onRemoveItemImage={props.onRemoveItemImage}
            addSelectedItem={props.addSelectedItem}
            duplicateSelectedItem={props.duplicateSelectedItem}
            moveSelectedItem={props.moveSelectedItem}
            removeSelectedItem={props.removeSelectedItem}
            onLlmDraftChange={props.onLlmDraftChange}
            onSaveLlm={props.onSaveLlm}
            onTestLlm={props.onTestLlm}
            settings={props.settings}
            showLlmGateway={props.tab === 'layers' && !props.selected && props.inspectorTab === 'content' && props.blueprint.page.sections.length > 0}
          />
        )
      )}
    </aside>
  );
}
