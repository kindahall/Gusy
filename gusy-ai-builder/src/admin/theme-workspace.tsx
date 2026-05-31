import { useEffect, useMemo, useState } from 'react';
import { GusySymbol } from './components';
import { RenderSection } from './section-renderer';
import { ThemeProfileEditor } from './theme-profile-editor';
import {
  importedThemePageCount,
  nextSelectedThemeKitId,
  profileFromThemeKit,
  themeKitGallery,
  themeKitPalette,
  themeWorkspaceCopy,
  visibleThemeKits
} from './theme-workspace-model';
import { openWordPressImagePicker } from './wordpress-media';
import type {
  GusyThemeBusinessProfile,
  GusyThemeKit,
  GusyThemeLanguage,
  GusyThemePreviewResponse,
  GusyThemeSettings
} from './types';
import type { UiLanguage } from './i18n';

export function ThemeWorkspace(props: {
  kits: GusyThemeKit[];
  settings: GusyThemeSettings;
  available: boolean;
  status: string;
  busy: boolean;
  uiLanguage: UiLanguage;
  onLanguage: (language: GusyThemeLanguage) => void;
  onSetting: (patch: Partial<GusyThemeSettings>) => void;
  onEditPage: (pageId: number) => void;
  onImport: (kit: GusyThemeKit, scope?: 'single' | 'full') => void;
  onCustomize: (kit: GusyThemeKit, profile: GusyThemeBusinessProfile) => void | Promise<void>;
  onPreviewPage: (kit: GusyThemeKit, type: string, profile?: GusyThemeBusinessProfile) => Promise<GusyThemePreviewResponse | null>;
  onStatus: (status: string) => void;
  onRefresh: () => void;
  onUpgrade: () => void;
  canImportFull: boolean;
  canCustomize: boolean;
}) {
  const copy = themeWorkspaceCopy(props.uiLanguage);
  const visibleKits = useMemo(
    () => visibleThemeKits(props.kits, props.settings.language),
    [props.kits, props.settings.language]
  );
  const [selectedKitId, setSelectedKitId] = useState('');
  const [profile, setProfile] = useState<GusyThemeBusinessProfile>(() => profileFromThemeKit());
  const [preview, setPreview] = useState<GusyThemePreviewResponse | null>(null);

  useEffect(() => {
    setSelectedKitId(nextSelectedThemeKitId(visibleKits, selectedKitId));
  }, [visibleKits, selectedKitId]);

  const selectedKit = visibleKits.find((kit) => kit.id === selectedKitId) ?? visibleKits[0];

  useEffect(() => {
    setProfile(profileFromThemeKit(selectedKit));
    setPreview(null);
  }, [selectedKit?.id]);

  const importedPages = importedThemePageCount(visibleKits);
  const styleOptions: GusyThemeSettings['styleVariation'][] = ['editorial', 'luxe', 'clean', 'warm', 'bold'];
  const densityOptions: GusyThemeSettings['density'][] = ['compact', 'comfortable', 'editorial'];
  const homePage = selectedKit?.pages.find((page) => page.type === 'home');
  const selectedInstalledCount = selectedKit?.pages.filter((page) => page.id > 0).length ?? 0;
  const palette = themeKitPalette(selectedKit);
  const gallery = themeKitGallery(selectedKit);
  const visibleStatus = props.busy
    ? copy.importing
    : props.status.toLowerCase().includes('ready')
      ? props.uiLanguage === 'fr' ? `${visibleKits.length} kits prêts` : `${visibleKits.length} kits ready`
      : props.status;
  const showcaseImages = [gallery[1], gallery[2], gallery[0], gallery[3]]
    .filter((image, index, images): image is NonNullable<typeof image> => Boolean(image) && images.findIndex((candidate) => candidate?.src === image.src) === index)
    .slice(0, 4);

  function updateProfileImage(kind: 'hero' | 'offer' | 'review', index: number, value: string) {
    setProfile((current) => {
      if (kind === 'hero') return { ...current, heroImageUrl: value };
      const key = kind === 'offer' ? 'offerImages' : 'reviewImages';
      const images = [...(current[key] || [])];
      images[index] = value;
      return { ...current, [key]: images };
    });
  }

  function chooseProfileImage(kind: 'hero' | 'offer' | 'review', index = 0) {
    openWordPressImagePicker({
      title: copy.photosLabel,
      buttonText: copy.chooseImage,
      onStatus: props.onStatus,
      onImage: (image) => {
        updateProfileImage(kind, index, image.url);
      }
    });
  }

  async function previewPage(type: string) {
    if (!selectedKit) return;
    if (selectedKit.locked) {
      props.onUpgrade();
      return;
    }
    const response = await props.onPreviewPage(selectedKit, type, profile);
    if (response) setPreview(response);
  }

  function runCustomize(kit: GusyThemeKit) {
    if (kit.locked || !props.canCustomize) {
      props.onUpgrade();
      return;
    }
    void props.onCustomize(kit, profile);
  }

  function runImport(kit: GusyThemeKit, scope: 'single' | 'full') {
    if (kit.locked || (scope === 'full' && !props.canImportFull)) {
      props.onUpgrade();
      return;
    }
    props.onImport(kit, scope);
  }

  if (!props.available) {
    return (
      <section className="gusy-themes-workspace">
        <div className="gusy-themes-empty">
          <GusySymbol />
          <h1>Gusy Base Theme</h1>
          <p>{props.status}</p>
          <button type="button" onClick={props.onRefresh}>{copy.refresh}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="gusy-themes-workspace">
      <div className="gusy-themes-panel">
        <header className="gusy-themes-header">
          <div>
            <strong>{copy.title}</strong>
            <span>{visibleKits.length} {copy.summary} / {importedPages} {copy.installedPages}</span>
          </div>
          <div className="gusy-theme-language">
            {(['en', 'fr'] as GusyThemeLanguage[]).map((language) => (
              <button key={language} type="button" aria-pressed={props.settings.language === language} onClick={() => props.onLanguage(language)}>
                {language.toUpperCase()}
              </button>
            ))}
          </div>
          <label className="gusy-theme-home-toggle">
            <input
              type="checkbox"
              checked={props.settings.setHomeOnImport}
              onChange={(event) => props.onSetting({ setHomeOnImport: event.target.checked })}
            />
            <span>{copy.setHomepage}</span>
          </label>
          <button type="button" onClick={props.onRefresh} disabled={props.busy}>{copy.refresh}</button>
        </header>

        <div className="gusy-theme-controls">
          <label>
            <span>{copy.style}</span>
            <select
              value={props.settings.styleVariation}
              onChange={(event) => props.onSetting({ styleVariation: event.target.value as GusyThemeSettings['styleVariation'] })}
            >
              {styleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>{copy.density}</span>
            <select
              value={props.settings.density}
              onChange={(event) => props.onSetting({ density: event.target.value as GusyThemeSettings['density'] })}
            >
              {densityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>{copy.buttons}</span>
            <select
              value={props.settings.buttonStyle}
              onChange={(event) => props.onSetting({ buttonStyle: event.target.value as GusyThemeSettings['buttonStyle'] })}
            >
              <option value="solid">solid</option>
              <option value="soft">soft</option>
              <option value="outline">outline</option>
            </select>
          </label>
          <label>
            <span>{copy.images}</span>
            <select
              value={props.settings.imageTone}
              onChange={(event) => props.onSetting({ imageTone: event.target.value as GusyThemeSettings['imageTone'] })}
            >
              <option value="natural">natural</option>
              <option value="bright">bright</option>
              <option value="warm">warm</option>
              <option value="contrast">contrast</option>
            </select>
          </label>
          <strong>{visibleStatus}</strong>
        </div>

        {selectedKit ? (
          <>
            <section className="gusy-theme-showcase">
              <figure className="gusy-theme-showcase-media">
                <div className="gusy-theme-showcase-mosaic">
                  {showcaseImages.map((image, index) => (
                    <img
                      key={`${selectedKit.id}-showcase-${image.src}`}
                      src={image.src}
                      alt={image.label || selectedKit.name}
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  ))}
                </div>
                <figcaption>
                  <strong>{selectedKit.brand}</strong>
                  <span>{selectedKit.location}</span>
                </figcaption>
              </figure>
              <div className="gusy-theme-showcase-copy">
                <span>{copy.readyFor} {selectedKit.name}</span>
                <h1>{selectedKit.title}</h1>
                <p>{selectedKit.body}</p>
                <div className="gusy-theme-showcase-stats">
                  <span><b>{selectedKit.pages.length}</b>{copy.pages}</span>
                  <span><b>{selectedKit.imageCount || gallery.length}</b>{copy.photos}</span>
                  <span><b>{selectedInstalledCount}</b>{copy.installed}</span>
                </div>
                <div className="gusy-theme-palette" aria-label={copy.palette}>
                  {palette.map((color) => <span key={color} style={{ background: color }} title={color} />)}
                </div>
                <div className="gusy-theme-mini-gallery" aria-label={copy.mediaSet}>
                  {gallery.slice(0, 6).map((image) => (
                    <img key={`${selectedKit.id}-${image.src}`} src={image.src} alt={image.label} loading="lazy" />
                  ))}
                </div>
                <div className="gusy-theme-actions">
                  <button className="gusy-theme-primary-action" type="button" onClick={() => runCustomize(selectedKit)} disabled={props.busy}>{selectedKit.locked || !props.canCustomize ? 'Pro' : copy.customizeFull}</button>
                  <button type="button" onClick={() => runImport(selectedKit, 'full')} disabled={props.busy}>{selectedKit.locked || !props.canImportFull ? 'Pro full kit' : copy.importFull}</button>
                  <button type="button" onClick={() => runImport(selectedKit, 'single')} disabled={props.busy}>{selectedKit.locked ? 'Pro home' : copy.homeOnly}</button>
                  {homePage?.id
                    ? <button className="gusy-theme-edit-action" type="button" onClick={() => props.onEditPage(homePage.id)} disabled={props.busy}>{copy.editHome}</button>
                    : <button className="gusy-theme-edit-action" type="button" onClick={() => runImport(selectedKit, 'single')} disabled={props.busy}>{selectedKit.locked ? 'Pro' : copy.installToEdit}</button>}
                  {homePage?.viewLink && <a href={homePage.viewLink} target="_blank" rel="noreferrer">{copy.openHome}</a>}
                </div>
              </div>
              <div className="gusy-theme-page-matrix" aria-label={copy.includedPages}>
                {selectedKit.pages.map((page) => (
                  <article key={page.type}>
                    <div>
                      <strong>{page.label}</strong>
                      <span data-installed={page.id > 0 ? 'true' : 'false'}>{page.id > 0 ? copy.installed : copy.notInstalled}</span>
                    </div>
                    <nav>
                      <button type="button" onClick={() => { void previewPage(page.type); }} disabled={props.busy}>{copy.previewPage}</button>
                      {page.id > 0
                        ? <button type="button" onClick={() => props.onEditPage(page.id)} disabled={props.busy}>{copy.editWithGusy}</button>
                        : <button type="button" onClick={() => runImport(selectedKit, page.type === 'home' ? 'single' : 'full')} disabled={props.busy}>{selectedKit.locked || page.type !== 'home' && !props.canImportFull ? 'Pro' : copy.installToEdit}</button>}
                      {page.viewLink && <a href={page.viewLink} target="_blank" rel="noreferrer">{copy.view}</a>}
                    </nav>
                  </article>
                ))}
              </div>
            </section>

            <section className="gusy-theme-builder">
              <div className="gusy-theme-builder-head">
                <strong>{copy.profile}</strong>
                <button className="gusy-theme-primary-action" type="button" onClick={() => runCustomize(selectedKit)} disabled={props.busy}>{selectedKit.locked || !props.canCustomize ? 'Pro' : copy.customizeFull}</button>
              </div>
              <ThemeProfileEditor
                copy={copy}
                profile={profile}
                uiLanguage={props.uiLanguage}
                onChange={setProfile}
                onChooseImage={chooseProfileImage}
              />
            </section>

            {preview && (
              <section className="gusy-theme-preview">
                <header>
                  <div>
                    <strong>{copy.preview}</strong>
                    <span>{preview.page.title}</span>
                  </div>
                  <button type="button" onClick={() => setPreview(null)}>{copy.closePreview}</button>
                </header>
                <div className="gusy-theme-preview-frame">
                  {preview.blueprint.page.sections.map((section, index) => (
                    <section key={section.id} className="gusy-page-section" data-background={section.settings.background || 'plain'}>
                      <RenderSection section={section} index={index} />
                    </section>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="gusy-themes-empty"><p>{copy.noKits}</p></div>
        )}

        <div className="gusy-theme-grid">
          {visibleKits.map((kit) => {
            const kitHomePage = kit.pages.find((page) => page.type === 'home');
            const installedCount = kit.pages.filter((page) => page.id > 0).length;

            return (
              <article
                key={kit.id}
                className="gusy-theme-card"
                data-active={props.settings.activeKit === kit.slug ? 'true' : 'false'}
                data-selected={selectedKit?.id === kit.id ? 'true' : 'false'}
              >
                <img src={kit.imageUrl} alt={kit.brand || kit.name} loading="lazy" />
                <div className="gusy-theme-card-body">
                  <header>
                    <span>{kit.location}</span>
                    <h2>{kit.name}</h2>
                    {kit.locked && <b className="gusy-theme-pro-badge">Pro</b>}
                  </header>
                  <p>{kit.brand}</p>
                  <div className="gusy-theme-stats">
                    <span><b>{kit.pages.length}</b> {copy.pages}</span>
                    <span><b>{kit.imageCount || kit.gallery.length || 6}</b> {copy.photos}</span>
                    <span><b>{installedCount}</b> {copy.installed}</span>
                  </div>
                  <div className="gusy-theme-page-list">
                    {kit.pages.map((page) => (
                      <span key={page.type} data-installed={page.id > 0 ? 'true' : 'false'}>
                        {page.label}
                      </span>
                    ))}
                  </div>
                  <div className="gusy-theme-actions">
                    <button type="button" onClick={() => setSelectedKitId(kit.id)} aria-pressed={selectedKit?.id === kit.id}>{copy.previewKit}</button>
                    <button className="gusy-theme-primary-action" type="button" onClick={() => runImport(kit, 'full')} disabled={props.busy}>{kit.locked || !props.canImportFull ? 'Pro full kit' : copy.importFull}</button>
                    <button type="button" onClick={() => runImport(kit, 'single')} disabled={props.busy}>{kit.locked ? 'Pro home' : copy.homeOnly}</button>
                    {kitHomePage?.id ? <button className="gusy-theme-edit-action" type="button" onClick={() => props.onEditPage(kitHomePage.id)} disabled={props.busy}>{copy.editHome}</button> : null}
                    {kitHomePage?.viewLink && <a href={kitHomePage.viewLink} target="_blank" rel="noreferrer">{copy.view}</a>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
