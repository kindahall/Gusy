import { useMemo, useState } from 'react';
import type { Device, GusyBlueprint, GusySettings, InspectorTab, LeftTab } from './types';
import { getInitialUiLanguage, useUiTranslation, type UiLanguage } from './i18n';
import { useAnnotationWorkflow } from './annotation-store';
import { useAppLifecycle } from './app-lifecycle';
import { DEFAULT_BUILD_PROMPT, DEFAULT_PROMPT } from './builder-options';
import { planLabel } from './features';
import { createAgentFeatureActions, createBaseFeatureActions } from './pro-feature-actions';
import { useCanvasSessionWorkflow } from './canvas-session-workflow';
import { buildAgentContext } from './agent-model';
import { useProductAgent } from './agent-store';
import { useAgentWorkflow } from './agent-workflow';
import { useAuditWorkflow } from './audit-workflow';
import { useBrandWorkflow } from './brand-workflow';
import { useExportWorkflow } from './export-store';
import { useGenerationWorkflow } from './generation-store';
import { useLlmGateway } from './llm-store';
import { useMediaWorkflow } from './media-workflow';
import { useMigrationWorkflow } from './migration-store';
import { AppOverlays } from './app-overlays';
import { Sidebar, Topbar } from './editor-shell';
import { useWordPressPages } from './page-persistence-store';
import { usePageSessionWorkflow } from './page-session-workflow';
import { RightPanel } from './right-panel';
import { normalizeInitialPostId } from './settings';
import { useThemeKitWorkflow } from './theme-kit-store';
import { WorkspaceRouter } from './workspace-router';
import { persistDevice, readDevice } from './storage';
import { useBlueprintStore } from './editor-store';
import { useSectionWorkflow } from './section-workflow';

export function App({ settings }: { settings: GusySettings }) {
  const initialPostId = normalizeInitialPostId(settings.initialPostId);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [device, setDevice] = useState<Device>(() => readDevice());
  const [leftTab, setLeftTab] = useState<LeftTab>(() => settings.initialEdit || initialPostId ? 'layers' : 'pages');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('content');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [focusedTemplateId, setFocusedTemplateId] = useState(settings.templates[0]?.id ?? '');
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>(() => getInitialUiLanguage(settings));
  const {
    audit,
    blueprint,
    localAudit,
    redoVersion: redoBlueprintVersion,
    redoVersions,
    replaceBlueprint,
    restoreVersion: restoreBlueprintVersion,
    selected,
    selectedId,
    sections,
    setAudit,
    setBlueprint,
    setSelectedId,
    updateBlueprint: commitBlueprint,
    updatePage: commitPage,
    versions
  } = useBlueprintStore(settings);
  const {
    addSelectedItem,
    addTemplate,
    duplicateSelected, duplicateSelectedItem,
    duplicateSectionById,
    makeSectionFromTemplate,
    moveSectionById, moveSelectedItem,
    patchSectionById,
    quickAddBlock,
    removeSelected,
    removeSelectedItem,
    removeSectionById,
    reorderSection,
    updateSectionSettingsById,
    updateSelected,
    updateSelectedItem,
    updateSelectedSettings
  } = useSectionWorkflow({
    blueprint,
    sections,
    selected,
    selectedId,
    templates: settings.templates,
    replaceBlueprint,
    updateBlueprint: commitBlueprint,
    setSelectedId,
    setLeftTab,
    setStatus,
    removeAnnotationsForSection: removeSectionAnnotations
  });
  const {
    canvasMenu,
    openCanvasMenu,
    setCanvasMenu,
    updateCanvasItem,
    updateCanvasSection
  } = useCanvasSessionWorkflow({
    patchSectionById,
    updateBlueprint: commitBlueprint,
    setLeftTab,
    setSelectedId,
    setStatus
  });
  const { chooseBackgroundImage, chooseBackgroundVideo, chooseItemImage, removeBackgroundImage, removeBackgroundVideo, removeItemImage } = useMediaWorkflow({
    setStatus,
    updateSectionSettingsById,
    updateSelectedItem
  });
  const {
    annotationDraft,
    annotationMode,
    applyAnnotationDraft,
    clearPageAnnotations,
    closeAnnotationDraft,
    editAnnotation,
    liveAnnotations,
    removeAnnotation,
    removeAnnotationsForSection,
    saveAnnotationDraft,
    startAnnotation,
    toggleAnnotationMode,
    updateAnnotationDraft
  } = useAnnotationWorkflow({
    sections,
    setSelectedId,
    setLeftTab,
    setStatus,
    transformSectionById,
    patchSectionById
  });
  const generationWorkflow = useGenerationWorkflow(settings, {
    blueprint,
    sections,
    selected,
    prompt,
    replaceBlueprint,
    updateBlueprint: commitBlueprint,
    clearPageAnnotations,
    setBusy,
    setStatus,
    setSelectedId,
    setLeftTab
  });
  const {
    generatePage,
    generateSection,
    transformSelected
  } = generationWorkflow;
  const {
    llmBusy,
    llmDraft,
    llmSettings,
    llmStatus,
    saveLlmSettings,
    testLlmGateway,
    updateLlmDraft
  } = useLlmGateway(settings, setStatus);
  const {
    adoptSavedPage,
    loadPage,
    loadPages,
    pages,
    postId,
    postStatus,
    previewPage: previewWordPressPage,
    renamePage,
    resetCurrentPage,
    revisions,
    savePage: saveWordPressPage,
    setCurrentAsHomepage
  } = useWordPressPages(settings, {
    clearPageAnnotations,
    replaceBlueprint,
    setAudit,
    setBusy,
    setLeftTab,
    setStatus
  });
  const {
    currentPageStatus,
    previewPage,
    renameCurrentPage,
    restoreRevision,
    savePage,
    startBlankPage,
    topbarSaveStatus,
    updatePageNameDraft
  } = usePageSessionWorkflow({
    blueprint,
    pages,
    postId,
    postStatus,
    selectedId,
    settings,
    clearPageAnnotations,
    renamePage,
    replaceBlueprint,
    resetCurrentPage,
    saveWordPressPage,
    previewWordPressPage,
    setLeftTab,
    setStatus
  });
  const {
    migrationPages,
    migrationPreview,
    loadMigrationPages,
    previewMigration,
    previewFirstElementorPage
  } = useMigrationWorkflow({
    settings,
    replaceBlueprint,
    clearPageAnnotations,
    resetCurrentPage,
    setAudit,
    setBusy,
    setLeftTab,
    setStatus
  });
  async function openThemePageInGusy(page?: { id?: number; viewLink?: string; previewLink?: string; editLink?: string }) {
    if (!page) return;
    await adoptSavedPage(page);
    if (page.id) await loadPage(page.id);
  }
  const {
    customizeThemeKit,
    importThemeKit,
    loadThemeKits,
    previewThemePage,
    saveThemeSettings,
    themeKits,
    themeKitsAvailable,
    themeSettings,
    themeStatus,
    themesBusy
  } = useThemeKitWorkflow({
    adoptSavedPage,
    openImportedPage: openThemePageInGusy,
    loadPages,
    setStatus
  });
  const {
    copyExportText,
    downloadExportFile,
    exportBlueprint,
    exportHistory,
    exportText,
    importBlueprint,
    importText,
    setImportText,
    useExportRecord
  } = useExportWorkflow(settings, {
    blueprint,
    clearPageAnnotations,
    replaceBlueprint,
    resetCurrentPage,
    setAudit,
    setBusy,
    setLeftTab,
    setStatus
  });
  const {
    agentBusy,
    agentMemory,
    agentMessages,
    agentOpen,
    appendAgentMessage,
    askProductAgent,
    clearPendingAgentAction,
    inferMemoryFromText,
    loadAgentMemory,
    pendingAgentAction,
    queuePendingAgentAction,
    saveAgentMemory,
    setAgentOpen
  } = useProductAgent({
    setStatus,
    getContext: (memory) =>
      buildAgentContext({
        activeTab: leftTab,
        blueprint,
        selected,
        audit: localAudit,
        llmSettings,
        canPublish: settings.canPublish,
        postId,
        memory
      })
  });
  const featureActions = createBaseFeatureActions(settings, {
    setStatus,
    setLeftTab,
    setAgentOpen,
    askProductAgent,
    loadMigrationPages,
    previewFirstElementorPage
  });
  const {
    applyBrandPreset,
    applyThemeTokens,
    saveBrandKit,
    updateDesignColor,
    updateDesignTokens
  } = useBrandWorkflow({
    blueprint,
    setBlueprint,
    setBusy,
    setLeftTab,
    setStatus,
    updateBlueprint
  });
  const { runAudit } = useAuditWorkflow({
    blueprint,
    setAudit,
    setBusy,
    setLeftTab,
    setStatus
  });
  const {
    applyPendingAgentAction,
    askAgent,
    buildBrandKit,
    fixWithAI,
    finishPage,
    generateLocalSeo,
    runAgentAction
  } = useAgentWorkflow({
    agentMemory,
    appendAgentMessage,
    applyThemeTokens,
    askProductAgent: featureActions.askProductAgent,
    blueprint,
    clearPendingAgentAction,
    generatePage,
    inferMemoryFromText,
    loadMigrationPages: featureActions.loadMigrationPages,
    localAudit,
    makeSectionFromTemplate,
    moveSectionById,
    openPageSettings,
    pendingAgentAction,
    previewFirstElementorPage: featureActions.previewFirstElementorPage,
    prompt,
    queuePendingAgentAction,
    quickAddBlock,
    runAudit,
    saveAgentMemory,
    savePage,
    sections,
    selectTab: featureActions.selectTab,
    selected,
    setAudit,
    setBusy,
    setCurrentAsHomepage,
    setLeftTab,
    setPrompt,
    setStatus,
    transformSelected,
    updateBlueprint,
    updateSectionSettingsById
  });
  const { selectTab, openAgentPanel, askProductAgent: askProductAgentPro, loadMigrationPages: loadMigrationPagesPro, previewFirstElementorPage: previewFirstElementorPagePro } = featureActions;
  const { askAgent: askAgentPro, buildBrandKit: buildBrandKitPro } = createAgentFeatureActions(settings, { setStatus, askAgent, buildBrandKit });

  useUiTranslation(uiLanguage);
  const focusedTemplate = useMemo(
    () => settings.templates.find((template) => template.id === focusedTemplateId) ?? settings.templates[0],
    [focusedTemplateId, settings.templates]
  );

  function removeSectionAnnotations(sectionId: string) {
    removeAnnotationsForSection(sectionId);
  }

  function setPreviewDevice(nextDevice: Device) {
    setDevice(nextDevice);
    persistDevice(nextDevice);
    setStatus(`${nextDevice[0].toUpperCase() + nextDevice.slice(1)} preview`);
  }

  function restoreVersion() {
    if (restoreBlueprintVersion()) setStatus('Restored');
  }

  function redoVersion() {
    if (redoBlueprintVersion()) setStatus('Redone');
  }

  useAppLifecycle({
    initialPostId,
    uiLanguage,
    loadAgentMemory,
    loadPage,
    loadPages,
    loadThemeKits,
    redoVersion,
    restoreVersion,
    setCanvasMenu,
    setPaletteOpen
  });

  function openPageSettings() {
    setSelectedId('');
    setInspectorTab('content');
    setLeftTab('layers');
    setStatus('Page settings');
  }

  function updateBlueprint(updater: (draft: GusyBlueprint) => void) {
    commitBlueprint(updater);
    setStatus('Updated');
  }

  function updatePage(updater: (page: GusyBlueprint['page']) => void) {
    commitPage(updater);
    setStatus('Updated');
  }

  async function transformSectionById(sectionId: string, instruction: string) {
    await generationWorkflow.transformSectionById(sectionId, instruction);
  }

  return (
    <div className="gusy-admin" data-device={device} data-tab={leftTab}>
      <Topbar
        title={blueprint.page.title}
        status={status}
        busy={busy}
        device={device}
        canPublish={settings.canPublish}
        canUndo={versions.length > 0}
        canRedo={redoVersions.length > 0}
        annotationMode={annotationMode}
        annotationCount={liveAnnotations.filter((annotation) => annotation.status === 'open').length}
        uiLanguage={uiLanguage}
        setUiLanguage={setUiLanguage}
        setDevice={setPreviewDevice}
        onUndo={restoreVersion}
        onRedo={redoVersion}
        onOpenPages={() => selectTab('pages')}
        onOpenPageSettings={openPageSettings}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenAgent={openAgentPanel}
        onToggleAnnotations={toggleAnnotationMode}
        saveLabel={topbarSaveStatus() === 'publish' ? 'Save changes' : 'Save Draft'}
        onSave={() => savePage(topbarSaveStatus())}
        onPublish={() => savePage('publish')}
        publishLabel="Publish"
        showPublish={topbarSaveStatus() !== 'publish'}
        onPreview={() => { void previewPage(); }}
        planLabel={planLabel(settings)}
      />

      <div className="gusy-shell">
        <Sidebar
          active={leftTab}
          currentTitle={blueprint.page.title}
          currentSlug={blueprint.page.slug}
          currentStatus={currentPageStatus()}
          postId={postId}
          pages={pages}
          revisions={revisions}
          audit={localAudit}
          busy={busy}
          onChange={selectTab}
          onOpenAgent={openAgentPanel}
          onRunAudit={runAudit}
          onPublish={() => { void savePage('publish'); }}
          onSaveSnapshot={() => { void savePage('draft'); }}
          onLoadPage={loadPage}
          onNewPage={startBlankPage}
          onPageNameDraftChange={updatePageNameDraft}
          onRenamePage={(title, slug) => { void renameCurrentPage(title, slug); }}
          onRestoreRevision={restoreRevision}
        />

        <main className="gusy-main">
          <div className="gusy-device-viewport">
            <WorkspaceRouter
              activeTab={leftTab}
              annotationMode={annotationMode}
              annotations={liveAnnotations}
              applyBrandPreset={applyBrandPreset}
              applyThemeTokens={applyThemeTokens}
              blueprint={blueprint}
              buildBrandKit={buildBrandKitPro}
              busy={busy}
              chooseBackgroundImage={chooseBackgroundImage}
              copyExportText={copyExportText}
              customizeThemeKit={customizeThemeKit}
              device={device}
              downloadExportFile={downloadExportFile}
              duplicateSelected={duplicateSelected}
              editAnnotation={editAnnotation}
              exportBlueprint={exportBlueprint}
              exportHistory={exportHistory}
              exportText={exportText}
              finishPage={finishPage}
              fixWithAI={fixWithAI}
              focusedTemplateId={focusedTemplateId}
              generateLocalSeo={generateLocalSeo}
              generatePage={generatePage}
              generateSection={generateSection}
              importBlueprint={importBlueprint}
              importText={importText}
              importThemeKit={importThemeKit}
              leftTab={leftTab}
              loadPage={loadPage}
              loadMigrationPages={loadMigrationPagesPro}
              loadThemeKits={loadThemeKits}
              localAudit={localAudit}
              migrationPages={migrationPages}
              migrationPreview={migrationPreview}
              onAddTemplate={addTemplate}
              onContextMenu={openCanvasMenu}
              moveSectionById={moveSectionById}
              previewMigration={previewMigration}
              previewPage={previewPage}
              previewThemePage={previewThemePage}
              prompt={prompt}
              quickAddBlock={quickAddBlock}
              removeSelected={removeSelected}
              reorderSection={reorderSection}
              runAudit={runAudit}
              saveBrandKit={saveBrandKit}
              savePage={savePage}
              saveThemeSettings={saveThemeSettings}
              sections={sections}
              selectTab={selectTab}
              selected={selected}
              setDevice={setPreviewDevice}
              setFocusedTemplateId={setFocusedTemplateId}
              setImportText={setImportText}
              setSelectedId={setSelectedId}
              setStatus={setStatus}
              settings={settings}
              startAnnotation={startAnnotation}
              themeKits={themeKits}
              themeKitsAvailable={themeKitsAvailable}
              themeSettings={themeSettings}
              themeStatus={themeStatus}
              themesBusy={themesBusy}
              transformSelected={transformSelected}
              uiLanguage={uiLanguage}
              updateCanvasItem={updateCanvasItem}
              updateCanvasSection={updateCanvasSection}
              updateSectionSettingsById={updateSectionSettingsById}
              updateDesignColor={updateDesignColor}
              updateDesignTokens={updateDesignTokens}
              useExportRecord={useExportRecord}
            />
          </div>
        </main>
        <RightPanel
          settings={settings}
          tab={leftTab}
          inspectorTab={inspectorTab}
          setInspectorTab={setInspectorTab}
          blueprint={blueprint}
          selected={selected}
          focusedTemplate={focusedTemplate}
          audit={localAudit}
          llmSettings={llmSettings}
          llmDraft={llmDraft}
          llmBusy={llmBusy}
          llmStatus={llmStatus}
          migrationPages={migrationPages}
          migrationPreview={migrationPreview}
          exportText={exportText}
          setImportText={setImportText}
          importText={importText}
          updatePage={updatePage}
          updateSelected={updateSelected}
          updateSelectedSettings={updateSelectedSettings}
          onChooseBackgroundImage={selected ? () => chooseBackgroundImage(selected.id) : undefined}
          onRemoveBackgroundImage={selected ? () => removeBackgroundImage(selected.id) : undefined}
          onChooseBackgroundVideo={selected ? () => chooseBackgroundVideo(selected.id) : undefined}
          onRemoveBackgroundVideo={selected ? () => removeBackgroundVideo(selected.id) : undefined}
          updateSelectedItem={updateSelectedItem}
          onChooseItemImage={selected ? chooseItemImage : undefined}
          onRemoveItemImage={selected ? removeItemImage : undefined}
          addSelectedItem={addSelectedItem}
          duplicateSelectedItem={duplicateSelectedItem}
          moveSelectedItem={moveSelectedItem}
          removeSelectedItem={removeSelectedItem}
          updateColor={updateDesignColor}
          onTokenPatch={updateDesignTokens}
          onBrandPreset={applyBrandPreset}
          onApplyTheme={() => { void applyThemeTokens(); }}
          onGenerateBrandKit={() => { void buildBrandKitPro(prompt || DEFAULT_BUILD_PROMPT); }}
          onBuildBrandPage={() => { void generatePage(prompt || DEFAULT_BUILD_PROMPT); }}
          onSaveBrand={() => { void saveBrandKit(); }}
          onQuickAdd={quickAddBlock}
          onBuildPage={() => { void generatePage(prompt || DEFAULT_BUILD_PROMPT); }}
          onOpenBlocks={() => selectTab('blocks')}
          onOpenCanvas={() => selectTab('layers')}
          onAddTemplate={addTemplate}
          onRunAudit={runAudit}
          onFix={fixWithAI}
          onLlmDraftChange={updateLlmDraft}
          onSaveLlm={saveLlmSettings}
          onTestLlm={testLlmGateway}
          onExport={exportBlueprint}
          onCopyExport={copyExportText}
          onDownloadExport={downloadExportFile}
          onSaveDraft={() => { void savePage('draft'); }}
          onSyncExport={() => { void savePage('publish'); }}
          onPreviewExport={() => { void previewPage(); }}
          onImport={importBlueprint}
          onScanMigration={loadMigrationPagesPro}
          onPreviewMigration={previewMigration}
          onPreviewFirstMigration={previewFirstElementorPagePro}
          busy={busy}
        />
      </div>

      <AppOverlays
        addTemplate={addTemplate}
        agentBusy={agentBusy}
        agentMemory={agentMemory}
        agentMessages={agentMessages}
        agentOpen={agentOpen}
        annotationDraft={annotationDraft}
        applyAnnotationDraft={applyAnnotationDraft}
        applyPendingAgentAction={applyPendingAgentAction}
        applyThemeTokens={applyThemeTokens}
        askAgent={askAgentPro}
        askProductAgent={askProductAgentPro}
        blueprint={blueprint}
        buildBrandKit={buildBrandKitPro}
        busy={busy}
        canvasMenu={canvasMenu}
        chooseBackgroundImage={chooseBackgroundImage}
        chooseBackgroundVideo={chooseBackgroundVideo}
        clearPendingAgentAction={clearPendingAgentAction}
        closeAnnotationDraft={closeAnnotationDraft}
        duplicateSectionById={duplicateSectionById}
        exportBlueprint={exportBlueprint}
        finishPage={finishPage}
        generatePage={generatePage}
        leftTab={leftTab}
        loadMigrationPages={loadMigrationPagesPro}
        moveSectionById={moveSectionById}
        paletteOpen={paletteOpen}
        pendingAgentAction={pendingAgentAction}
        prompt={prompt}
        quickAddBlock={quickAddBlock}
        removeAnnotation={removeAnnotation}
        removeBackgroundImage={removeBackgroundImage}
        removeBackgroundVideo={removeBackgroundVideo}
        removeSectionById={removeSectionById}
        restoreVersion={restoreVersion}
        runAgentAction={runAgentAction}
        runAudit={runAudit}
        saveAnnotationDraft={saveAnnotationDraft}
        savePage={savePage}
        sections={sections}
        selected={selected}
        setAgentOpen={setAgentOpen}
        onOpenAgent={openAgentPanel}
        setCanvasMenu={setCanvasMenu}
        setInspectorTab={setInspectorTab}
        setLeftTab={selectTab}
        setPaletteOpen={setPaletteOpen}
        setPrompt={setPrompt}
        setSelectedId={setSelectedId}
        settings={settings}
        startAnnotation={startAnnotation}
        startBlankPage={startBlankPage}
        toggleAnnotationMode={toggleAnnotationMode}
        transformSectionById={transformSectionById}
        transformSelected={transformSelected}
        updateAnnotationDraft={updateAnnotationDraft}
        updateSectionSettingsById={updateSectionSettingsById}
      />
	    </div>
	  );
	}
