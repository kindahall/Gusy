import type { ComponentProps, MouseEvent as ReactMouseEvent } from 'react';
import { AuditWorkspace } from './audit-workspace';
import { BlocksWorkspace } from './blocks-workspace';
import { BrandWorkspace } from './brand-workspace';
import { DEFAULT_BUILD_PROMPT } from './builder-options';
import { ExportWorkspace } from './export-workspace';
import { hasFeature, openUpgrade } from './features';
import { MigrationWorkspace } from './migration-workspace';
import { PageCanvas } from './page-canvas';
import { StartWorkspace } from './start-workspace';
import { ThemeWorkspace } from './theme-workspace';
import type { Device, GusyBlueprint, GusySection, GusySettings, LeftTab } from './types';

type MaybePromise = void | Promise<unknown>;
type ThemeWorkspaceProps = ComponentProps<typeof ThemeWorkspace>;
type BlocksWorkspaceProps = ComponentProps<typeof BlocksWorkspace>;
type BrandWorkspaceProps = ComponentProps<typeof BrandWorkspace>;
type AuditWorkspaceProps = ComponentProps<typeof AuditWorkspace>;
type ExportWorkspaceProps = ComponentProps<typeof ExportWorkspace>;
type MigrationWorkspaceProps = ComponentProps<typeof MigrationWorkspace>;
type PageCanvasProps = ComponentProps<typeof PageCanvas>;

export type WorkspaceRouterProps = {
  activeTab: LeftTab;
  annotationMode: PageCanvasProps['annotationMode'];
  annotations: PageCanvasProps['annotations'];
  applyBrandPreset: BrandWorkspaceProps['onPreset'];
  applyThemeTokens: () => MaybePromise;
  blueprint: GusyBlueprint;
  buildBrandKit: (instruction: string) => MaybePromise;
  busy: boolean;
  chooseBackgroundImage: PageCanvasProps['onChooseBackgroundImage'];
  copyExportText: ExportWorkspaceProps['onCopy'];
  customizeThemeKit: ThemeWorkspaceProps['onCustomize'];
  device: Device;
  downloadExportFile: ExportWorkspaceProps['onDownload'];
  duplicateSelected: PageCanvasProps['onDuplicate'];
  editAnnotation: PageCanvasProps['onOpenAnnotation'];
  exportBlueprint: ExportWorkspaceProps['onExport'];
  exportHistory: ExportWorkspaceProps['exportHistory'];
  exportText: string;
  finishPage: (instruction?: string) => MaybePromise;
  fixWithAI: AuditWorkspaceProps['onFix'];
  focusedTemplateId: string;
  generateLocalSeo: AuditWorkspaceProps['onSeo'];
  generatePage: (promptOverride?: string) => MaybePromise;
  generateSection: BlocksWorkspaceProps['onGenerateSection'];
  importBlueprint: ExportWorkspaceProps['onImport'];
  importText: string;
  importThemeKit: ThemeWorkspaceProps['onImport'];
  leftTab: LeftTab;
  loadPage: ThemeWorkspaceProps['onEditPage'];
  loadMigrationPages: MigrationWorkspaceProps['onScan'];
  loadThemeKits: () => MaybePromise;
  localAudit: AuditWorkspaceProps['audit'];
  migrationPages: MigrationWorkspaceProps['pages'];
  migrationPreview: MigrationWorkspaceProps['preview'];
  onAddTemplate: BlocksWorkspaceProps['onAdd'];
  onContextMenu: (event: ReactMouseEvent, sectionId?: string) => void;
  previewMigration: MigrationWorkspaceProps['onPreview'];
  previewPage: () => MaybePromise;
  previewThemePage: ThemeWorkspaceProps['onPreviewPage'];
  prompt: string;
  quickAddBlock: PageCanvasProps['onQuickAdd'];
  removeSelected: PageCanvasProps['onRemove'];
  reorderSection: PageCanvasProps['onReorder'];
  moveSectionById: PageCanvasProps['onMoveSection'];
  runAudit: AuditWorkspaceProps['onRunAudit'];
  saveBrandKit: BrandWorkspaceProps['onSave'];
  savePage: (status: 'draft' | 'publish') => MaybePromise;
  saveThemeSettings: ThemeWorkspaceProps['onSetting'];
  sections: GusySection[];
  selectTab: (tab: LeftTab) => void;
  selected?: GusySection;
  setDevice: (device: Device) => void;
  setFocusedTemplateId: BlocksWorkspaceProps['onFocus'];
  setImportText: ExportWorkspaceProps['setImportText'];
  setSelectedId: PageCanvasProps['onSelect'];
  setStatus: ThemeWorkspaceProps['onStatus'];
  useExportRecord: ExportWorkspaceProps['onUseHistory'];
  settings: GusySettings;
  startAnnotation: PageCanvasProps['onAnnotate'];
  themeKits: ThemeWorkspaceProps['kits'];
  themeKitsAvailable: boolean;
  themeSettings: ThemeWorkspaceProps['settings'];
  themeStatus: string;
  themesBusy: boolean;
  transformSelected: PageCanvasProps['onTransform'];
  uiLanguage: ThemeWorkspaceProps['uiLanguage'];
  updateCanvasItem: PageCanvasProps['onUpdateItem'];
  updateCanvasSection: PageCanvasProps['onUpdateSection'];
  updateSectionSettingsById: PageCanvasProps['onUpdateSectionSettings'];
  updateDesignColor: BrandWorkspaceProps['updateColor'];
  updateDesignTokens: BrandWorkspaceProps['onTokenPatch'];
};

export function WorkspaceRouter(props: WorkspaceRouterProps) {
  if (props.activeTab === 'themes') {
    return (
      <ThemeWorkspace
        kits={props.themeKits}
        settings={props.themeSettings}
        available={props.themeKitsAvailable}
        status={props.themeStatus}
        busy={props.themesBusy}
        uiLanguage={props.uiLanguage}
        onLanguage={(language) => { void props.saveThemeSettings({ language }); }}
        onSetting={(patch) => { void props.saveThemeSettings(patch); }}
        onEditPage={(pageId) => { void props.loadPage(pageId); }}
        onImport={props.importThemeKit}
        onCustomize={props.customizeThemeKit}
        onPreviewPage={props.previewThemePage}
        onStatus={props.setStatus}
        onRefresh={() => { void props.loadThemeKits(); }}
        onUpgrade={() => openUpgrade(props.settings)}
        canImportFull={hasFeature(props.settings, 'theme_kits.import_full')}
        canCustomize={hasFeature(props.settings, 'theme_kits.customize')}
      />
    );
  }

  if (props.activeTab === 'blocks') {
    return (
      <BlocksWorkspace
        templates={props.settings.templates}
        focusedTemplateId={props.focusedTemplateId}
        canGenerateAI={props.prompt.trim().length > 0}
        onFocus={props.setFocusedTemplateId}
        onAdd={props.onAddTemplate}
        onGenerateSection={props.generateSection}
      />
    );
  }

  if (props.activeTab === 'brand') {
    return (
      <BrandWorkspace
        blueprint={props.blueprint}
        device={props.device}
        setDevice={props.setDevice}
        updateColor={props.updateDesignColor}
        onTokenPatch={props.updateDesignTokens}
        onPreset={props.applyBrandPreset}
        onApplyTheme={() => { void props.applyThemeTokens(); }}
        onGenerateKit={() => { void props.buildBrandKit(props.prompt || DEFAULT_BUILD_PROMPT); }}
        onBuildPage={() => { void props.generatePage(props.prompt || DEFAULT_BUILD_PROMPT); }}
        onSave={() => { void props.saveBrandKit(); }}
        onOpenCanvas={() => props.selectTab('layers')}
      />
    );
  }

  if (props.activeTab === 'audit') {
    return (
      <AuditWorkspace
        audit={props.localAudit}
        busy={props.busy}
        hasSections={props.sections.length > 0}
        onRunAudit={props.runAudit}
        onFix={props.fixWithAI}
        onBuild={() => { void props.finishPage(props.prompt || DEFAULT_BUILD_PROMPT); }}
        onSeo={props.generateLocalSeo}
        onBlocks={() => props.selectTab('blocks')}
      />
    );
  }

  if (props.activeTab === 'export') {
    return (
      <ExportWorkspace
        blueprint={props.blueprint}
        exportText={props.exportText}
        importText={props.importText}
        exportHistory={props.exportHistory}
        busy={props.busy}
        setImportText={props.setImportText}
        onExport={props.exportBlueprint}
        onCopy={props.copyExportText}
        onImport={props.importBlueprint}
        onDownload={props.downloadExportFile}
        onUseHistory={props.useExportRecord}
        onSaveDraft={() => { void props.savePage('draft'); }}
        onSync={() => { void props.savePage('publish'); }}
        onPreview={() => { void props.previewPage(); }}
      />
    );
  }

  if (props.activeTab === 'migrate') {
    return (
      <MigrationWorkspace
        pages={props.migrationPages}
        preview={props.migrationPreview}
        busy={props.busy}
        onScan={props.loadMigrationPages}
        onPreview={props.previewMigration}
        onOpenCanvas={() => props.selectTab('layers')}
        onSaveDraft={() => { void props.savePage('draft'); }}
        onPublish={() => { void props.savePage('publish'); }}
      />
    );
  }

  if (props.activeTab === 'layers') {
    return (
      <PageCanvas
        blueprint={props.blueprint}
        selectedId={props.selected?.id ?? ''}
        device={props.device}
        annotations={props.annotations}
        annotationMode={props.annotationMode}
        onSelect={props.setSelectedId}
        onOpenBlocks={() => props.selectTab('blocks')}
        onQuickAdd={props.quickAddBlock}
        onReorder={props.reorderSection}
        onGeneratePage={() => { void props.generatePage(DEFAULT_BUILD_PROMPT); }}
        onDuplicate={props.duplicateSelected}
        onRemove={props.removeSelected}
        onTransform={props.transformSelected}
        onUpdateSection={props.updateCanvasSection}
        onUpdateItem={props.updateCanvasItem}
        onUpdateSectionSettings={props.updateSectionSettingsById}
        onMoveSection={props.moveSectionById}
        onChooseBackgroundImage={props.chooseBackgroundImage}
        onAnnotate={props.startAnnotation}
        onOpenAnnotation={props.editAnnotation}
        onContextMenu={props.onContextMenu}
      />
    );
  }

  return (
    <StartWorkspace
      hasSections={props.sections.length > 0}
      onCreateAI={props.generatePage}
      onOpenThemes={() => props.selectTab('themes')}
      onImportElementor={() => props.selectTab('migrate')}
      onOpenCanvas={() => props.selectTab('layers')}
      onOpenBlocks={() => props.selectTab('blocks')}
      onQuickAdd={props.quickAddBlock}
      onContextMenu={props.onContextMenu}
    />
  );
}
