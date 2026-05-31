import type { CSSProperties } from 'react';
import { ButtonDesignControls } from './button-design-controls';
import { PanelSection, Segmented } from './components';
import { SectionImageControls } from './image-design-controls';
import { ItemActionControls } from './item-action-controls';
import { LLMGatewayPanel } from './llm-gateway-panel';
import { PageCompletionPanel } from './page-completion-panel';
import { cssUrl, FORM_SECTION_TYPES, getColors } from './schema';
import { SectionQualityPanel } from './section-quality-panel';
import { SectionStylePanel } from './section-style-presets';
import { hasFeature, openUpgrade } from './features';
import type { GusyBlueprint, GusyLLMDraft, GusyLLMSettings, GusySection, GusySettings, InspectorTab } from './types';

type SectionSettingValue = GusySection['settings'][keyof GusySection['settings']];
const ACTION_SECTION_TYPES = ['header', 'hero', 'pricing', 'form', 'newsletter', 'lead-magnet', 'audit', 'cta', 'sticky-offer'];
const METRIC_SECTION_TYPES = ['stats', 'metrics'];

export function SectionInspector(props: {
  selected?: GusySection;
  settings: GusySettings;
  blueprint: GusyBlueprint;
  inspectorTab: InspectorTab;
  llmSettings: GusyLLMSettings;
  llmDraft: GusyLLMDraft;
  llmBusy: boolean;
  llmStatus: string;
  updatePage: (updater: (page: GusyBlueprint['page']) => void) => void;
  updateSelected: (patch: Partial<GusySection>) => void;
  updateSelectedSettings: (key: keyof GusySection['settings'], value: SectionSettingValue) => void;
  onQuickAdd: (type: string) => void;
  onOpenBlocks: () => void;
  onBuildPage: () => void;
  onRunAudit: () => void;
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
  onLlmDraftChange: (patch: Partial<GusyLLMDraft>) => void;
  onSaveLlm: () => void;
  onTestLlm: () => void;
  showLlmGateway?: boolean;
}) {
  const colors = getColors(props.blueprint);
  const sectionImage = props.selected?.settings.backgroundImage;
  const isHeroSection = props.selected?.type === 'hero';
  const isFormSection = props.selected ? FORM_SECTION_TYPES.includes(props.selected.type) : false;
  const isNavigationSection = props.selected?.type === 'header';
  const isFaqSection = props.selected?.type === 'faq';
  const isPricingSection = props.selected?.type === 'pricing';
  const isReviewSection = props.selected?.type === 'testimonials';
  const isMetricSection = props.selected ? METRIC_SECTION_TYPES.includes(props.selected.type) : false;
  const isLogoSection = props.selected?.type === 'logos';
  const isComparisonSection = props.selected?.type === 'comparison';
  const isFooterSection = props.selected?.type === 'footer';
  const showsButtonControls = props.selected ? Boolean(props.selected.cta) || ACTION_SECTION_TYPES.includes(props.selected.type) : false;

  if (!props.selected) {
    const sectionTypes = props.blueprint.page.sections.map((section) => section.type);

    return (
      <div className="gusy-panel-stack">
        <PageCompletionPanel
          sectionTypes={sectionTypes}
          onQuickAdd={props.onQuickAdd}
          onOpenBlocks={props.onOpenBlocks}
          onBuildPage={props.onBuildPage}
          onRunAudit={props.onRunAudit}
        />
        <PanelSection title="Page">
          <label><span>Title</span><input value={props.blueprint.page.title} onChange={(event) => props.updatePage((page) => { page.title = event.target.value; })} /></label>
          <label><span>Slug</span><input value={props.blueprint.page.slug} onChange={(event) => props.updatePage((page) => { page.slug = event.target.value; })} /></label>
        </PanelSection>
        {props.showLlmGateway && (
          <LLMGatewayPanel
            settings={props.llmSettings}
            draft={props.llmDraft}
            busy={props.llmBusy}
            status={props.llmStatus}
            onChange={props.onLlmDraftChange}
            onSave={props.onSaveLlm}
            onTest={props.onTestLlm}
            locked={!hasFeature(props.settings, 'ai.llm_gateway')}
            onUpgrade={() => openUpgrade(props.settings)}
          />
        )}
      </div>
    );
  }

  if (props.inspectorTab === 'style') {
    return (
      <div className="gusy-panel-stack">
        <SectionStylePanel
          settings={props.selected.settings}
          onApply={(settings) => props.updateSelected({ settings: { ...props.selected!.settings, ...settings } })}
        />
        <PanelSection title="Background">
          <Segmented value={props.selected.settings.background} options={['plain', 'soft', 'elevated', 'hero']} onChange={(value) => props.updateSelectedSettings('background', value)} />
          <div className="gusy-background-media-control">
            {props.selected.settings.backgroundImage?.url && (
              <div
                className="gusy-background-media-preview"
                style={{ backgroundImage: cssUrl(props.selected.settings.backgroundImage.url) } as CSSProperties}
              >
                <span>{props.selected.settings.backgroundImage.title || 'Image selected'}</span>
              </div>
            )}
            <button type="button" className="gusy-media-primary-button" onClick={props.onChooseBackgroundImage}>
              {props.selected.settings.backgroundImage?.url ? 'Change background image' : 'Upload background image'}
            </button>
            <button type="button" onClick={props.onRemoveBackgroundImage} disabled={!props.selected.settings.backgroundImage?.url}>Remove image</button>
          </div>
        </PanelSection>
        <PanelSection title="Colors">
          <div className="gusy-style-swatches">
            {['primary', 'accent', 'support', 'surface'].map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={(props.selected?.settings.accent || 'accent') === key}
                style={{ backgroundColor: colors[key] || '#111827' }}
                title={key}
                onClick={() => props.updateSelectedSettings('accent', key)}
              />
            ))}
          </div>
        </PanelSection>
        <PanelSection title="Variant">
          <input value={props.selected.variant} onChange={(event) => props.updateSelected({ variant: event.target.value })} />
        </PanelSection>
      </div>
    );
  }

  if (props.inspectorTab === 'layout') {
    return (
      <div className="gusy-panel-stack">
        <PanelSection title="Layout">
          <Segmented value={props.selected.settings.width || 'wide'} options={['boxed', 'wide', 'full']} onChange={(value) => props.updateSelectedSettings('width', value)} />
          <label><span>Desktop columns</span><input type="range" min="1" max="4" value={props.selected.settings.columns} onChange={(event) => props.updateSelectedSettings('columns', Number(event.target.value))} /></label>
          <label><span>Tablet columns</span><input type="range" min="1" max="3" value={props.selected.settings.tabletColumns ?? Math.min(props.selected.settings.columns, 2)} onChange={(event) => props.updateSelectedSettings('tabletColumns', Number(event.target.value))} /></label>
          <label><span>Mobile columns</span><input type="range" min="1" max="2" value={props.selected.settings.mobileColumns ?? 1} onChange={(event) => props.updateSelectedSettings('mobileColumns', Number(event.target.value))} /></label>
          <label className="gusy-switch-row"><span>Stack mobile</span><input type="checkbox" checked={props.selected.settings.mobileStack} onChange={(event) => props.updateSelectedSettings('mobileStack', event.target.checked)} /></label>
        </PanelSection>
        <PanelSection title="Spacing">
          <Segmented value={props.selected.settings.spacing || 'lg'} options={['compact', 'lg', 'xl']} onChange={(value) => props.updateSelectedSettings('spacing', value)} />
        </PanelSection>
        <PanelSection title="Typography">
          <Segmented value={props.selected.settings.textAlign || 'left'} options={['left', 'center', 'right']} onChange={(value) => props.updateSelectedSettings('textAlign', value as GusySection['settings']['textAlign'])} />
          <Segmented value={props.selected.settings.headingScale || 'standard'} options={['compact', 'standard', 'display']} onChange={(value) => props.updateSelectedSettings('headingScale', value as GusySection['settings']['headingScale'])} />
          <Segmented value={props.selected.settings.textWidth || 'standard'} options={['narrow', 'standard', 'wide']} onChange={(value) => props.updateSelectedSettings('textWidth', value as GusySection['settings']['textWidth'])} />
          <Segmented value={props.selected.settings.bodyScale || 'standard'} options={['compact', 'standard', 'large']} onChange={(value) => props.updateSelectedSettings('bodyScale', value as GusySection['settings']['bodyScale'])} />
        </PanelSection>
      </div>
    );
  }

  if (props.inspectorTab === 'motion') {
    return (
      <div className="gusy-panel-stack">
        <PanelSection title="Motion">
          <label className="gusy-switch-row">
            <span>Enable Motion</span>
            <input
              type="checkbox"
              checked={Boolean(props.selected.settings.motionEnabled)}
              onChange={(event) => props.updateSelectedSettings('motionEnabled', event.target.checked)}
            />
          </label>
          <label>
            <span>Entrance</span>
            <select
              value={props.selected.settings.motionEntrance || 'fade-up'}
              disabled={!props.selected.settings.motionEnabled}
              onChange={(event) => props.updateSelectedSettings('motionEntrance', event.target.value as GusySection['settings']['motionEntrance'])}
            >
              <option value="fade-up">Fade up</option>
              <option value="scale-in">Scale in</option>
              <option value="slide-in">Slide in</option>
            </select>
          </label>
          <label>
            <span>Duration</span>
            <input
              type="range"
              min="100"
              max="1200"
              value={props.selected.settings.motionDuration || 600}
              disabled={!props.selected.settings.motionEnabled}
              onChange={(event) => props.updateSelectedSettings('motionDuration', Number(event.target.value))}
            />
          </label>
        </PanelSection>
      </div>
    );
  }

  return (
    <div className="gusy-panel-stack">
      <PanelSection title="Section">
        <label><span>Label</span><input value={props.selected.label} onChange={(event) => props.updateSelected({ label: event.target.value })} /></label>
        <label><span>Title</span><textarea value={props.selected.title} onChange={(event) => props.updateSelected({ title: event.target.value })} /></label>
        <label><span>Text</span><textarea value={props.selected.body} onChange={(event) => props.updateSelected({ body: event.target.value })} /></label>
      </PanelSection>
      <SectionQualityPanel
        section={props.selected}
        updateSelected={props.updateSelected}
        addSelectedItem={props.addSelectedItem}
        onChooseBackgroundImage={props.onChooseBackgroundImage}
        onChooseItemImage={props.onChooseItemImage}
      />
      {(props.selected.type === 'hero' || sectionImage?.url || props.selected.settings.backgroundVideo?.url) && (
        <SectionImageControls
          section={props.selected}
          sectionImage={sectionImage}
          sectionVideo={props.selected.settings.backgroundVideo}
          updateSelectedSettings={props.updateSelectedSettings}
          onChooseBackgroundImage={props.onChooseBackgroundImage}
          onRemoveBackgroundImage={props.onRemoveBackgroundImage}
          onChooseBackgroundVideo={props.onChooseBackgroundVideo}
          onRemoveBackgroundVideo={props.onRemoveBackgroundVideo}
        />
      )}
      {showsButtonControls && (
        <PanelSection title="Buttons">
          <label><span>Primary label</span><input value={props.selected.cta?.label ?? ''} onChange={(event) => props.updateSelected({ cta: { ...(props.selected?.cta ?? {}), label: event.target.value } })} /></label>
          <label><span>Primary URL</span><input value={props.selected.cta?.url ?? ''} onChange={(event) => props.updateSelected({ cta: { ...(props.selected?.cta ?? {}), url: event.target.value } })} /></label>
          <ButtonDesignControls section={props.selected} updateSelectedSettings={props.updateSelectedSettings} />
          {(props.selected.type === 'hero' || props.selected.cta?.secondaryLabel || props.selected.cta?.secondaryUrl) && (
            <>
              <label><span>Secondary label</span><input value={props.selected.cta?.secondaryLabel ?? ''} onChange={(event) => props.updateSelected({ cta: { ...(props.selected?.cta ?? {}), secondaryLabel: event.target.value } })} /></label>
              <label><span>Secondary URL</span><input value={props.selected.cta?.secondaryUrl ?? ''} onChange={(event) => props.updateSelected({ cta: { ...(props.selected?.cta ?? {}), secondaryUrl: event.target.value } })} /></label>
            </>
          )}
        </PanelSection>
      )}
      {isNavigationSection && props.selected.items.length > 0 && (
        <PanelSection title="Navigation links">
          <div className="gusy-item-list is-link-list">
            {props.selected.items.map((item, index) => (
              <article key={`${props.selected?.id}-nav-${index}`}>
                <label>
                  <span>Link label</span>
                  <input value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} />
                </label>
                <label>
                  <span>Link URL</span>
                  <input value={item.body} onChange={(event) => props.updateSelectedItem(index, { body: event.target.value })} />
                </label>
                <ItemActionControls index={index} count={props.selected!.items.length} moveSelectedItem={props.moveSelectedItem} duplicateSelectedItem={props.duplicateSelectedItem} />
                <button type="button" onClick={() => props.removeSelectedItem(index)}>Remove link</button>
              </article>
            ))}
            <button type="button" onClick={props.addSelectedItem}>Add link</button>
          </div>
        </PanelSection>
      )}
      {isHeroSection && props.selected.items.length > 0 && (
        <PanelSection title="Proof points">
          <div className="gusy-item-list is-proof-list">
            {props.selected.items.slice(0, 3).map((item, index) => (
              <article key={`${props.selected?.id}-proof-${index}`}>
                <label>
                  <span>Metric</span>
                  <input value={item.label ?? ''} onChange={(event) => props.updateSelectedItem(index, { label: event.target.value })} />
                </label>
                <label>
                  <span>Caption</span>
                  <input value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} />
                </label>
                <ItemActionControls index={index} count={Math.min(props.selected!.items.length, 3)} moveSelectedItem={props.moveSelectedItem} duplicateSelectedItem={props.duplicateSelectedItem} />
              </article>
            ))}
          </div>
        </PanelSection>
      )}
      {isFaqSection && props.selected.items.length > 0 && (
        <PanelSection title="Questions">
          <div className="gusy-item-list is-faq-list">
            {props.selected.items.map((item, index) => (
              <article key={`${props.selected?.id}-faq-${index}`}>
                <label>
                  <span>Question</span>
                  <input value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} />
                </label>
                <label>
                  <span>Answer</span>
                  <textarea value={item.body} onChange={(event) => props.updateSelectedItem(index, { body: event.target.value })} />
                </label>
                <ItemActionControls index={index} count={props.selected!.items.length} moveSelectedItem={props.moveSelectedItem} duplicateSelectedItem={props.duplicateSelectedItem} />
                <button type="button" onClick={() => props.removeSelectedItem(index)}>Remove question</button>
              </article>
            ))}
            <button type="button" onClick={props.addSelectedItem}>Add question</button>
          </div>
        </PanelSection>
      )}
      {isFormSection && props.selected.items.length > 0 && (
        <PanelSection title="Fields">
          <div className="gusy-item-list is-form-fields">
            {props.selected.items.slice(0, 3).map((item, index) => (
              <article key={`${props.selected?.id}-field-${index}`}>
                <label>
                  <span>Field label</span>
                  <input value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} />
                </label>
                <label>
                  <span>Placeholder</span>
                  <textarea value={item.body} onChange={(event) => props.updateSelectedItem(index, { body: event.target.value })} />
                </label>
              </article>
            ))}
          </div>
        </PanelSection>
      )}
      {isPricingSection && props.selected.items.length > 0 && (
        <PanelSection title="Offers">
          <div className="gusy-item-list is-offer-list">
            {props.selected.items.map((item, index) => (
              <article key={`${props.selected?.id}-offer-${index}`}>
                <ItemImageControls item={item} index={index} updateSelectedItem={props.updateSelectedItem} onChooseItemImage={props.onChooseItemImage} onRemoveItemImage={props.onRemoveItemImage} />
                <label><span>Offer name</span><input value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} /></label>
                <label><span>Price</span><input value={item.label ?? ''} onChange={(event) => props.updateSelectedItem(index, { label: event.target.value })} /></label>
                <label><span>Details</span><textarea value={item.body} onChange={(event) => props.updateSelectedItem(index, { body: event.target.value })} /></label>
                <ItemActionControls index={index} count={props.selected!.items.length} moveSelectedItem={props.moveSelectedItem} duplicateSelectedItem={props.duplicateSelectedItem} />
                <button type="button" onClick={() => props.removeSelectedItem(index)}>Remove offer</button>
              </article>
            ))}
            <button type="button" onClick={props.addSelectedItem}>Add offer</button>
          </div>
        </PanelSection>
      )}
      {isReviewSection && props.selected.items.length > 0 && (
        <PanelSection title="Reviews">
          <div className="gusy-item-list is-review-list">
            {props.selected.items.map((item, index) => (
              <article key={`${props.selected?.id}-review-${index}`}>
                <ItemImageControls item={item} index={index} updateSelectedItem={props.updateSelectedItem} onChooseItemImage={props.onChooseItemImage} onRemoveItemImage={props.onRemoveItemImage} mediaLabel="Customer photo" />
                <label><span>Quote</span><textarea value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} /></label>
                <label><span>Customer</span><input value={item.body} onChange={(event) => props.updateSelectedItem(index, { body: event.target.value })} /></label>
                <label><span>Context</span><input value={item.label ?? ''} onChange={(event) => props.updateSelectedItem(index, { label: event.target.value })} /></label>
                <ItemActionControls index={index} count={props.selected!.items.length} moveSelectedItem={props.moveSelectedItem} duplicateSelectedItem={props.duplicateSelectedItem} />
                <button type="button" onClick={() => props.removeSelectedItem(index)}>Remove review</button>
              </article>
            ))}
            <button type="button" onClick={props.addSelectedItem}>Add review</button>
          </div>
        </PanelSection>
      )}
      {isMetricSection && props.selected.items.length > 0 && (
        <PanelSection title="Metrics">
          <div className="gusy-item-list is-metric-list">
            {props.selected.items.map((item, index) => (
              <article key={`${props.selected?.id}-metric-${index}`}>
                <label><span>Metric</span><input value={item.label ?? ''} onChange={(event) => props.updateSelectedItem(index, { label: event.target.value })} /></label>
                <label><span>Caption</span><input value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} /></label>
                <label><span>Detail</span><textarea value={item.body} onChange={(event) => props.updateSelectedItem(index, { body: event.target.value })} /></label>
                <ItemActionControls index={index} count={props.selected!.items.length} moveSelectedItem={props.moveSelectedItem} duplicateSelectedItem={props.duplicateSelectedItem} />
                <button type="button" onClick={() => props.removeSelectedItem(index)}>Remove metric</button>
              </article>
            ))}
            <button type="button" onClick={props.addSelectedItem}>Add metric</button>
          </div>
        </PanelSection>
      )}
      {isLogoSection && props.selected.items.length > 0 && (
        <PanelSection title="Logos">
          <div className="gusy-item-list is-logo-list">
            {props.selected.items.map((item, index) => (
              <article key={`${props.selected?.id}-logo-${index}`}>
                <label><span>Name</span><input value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} /></label>
                <label><span>Link or note</span><input value={item.body} onChange={(event) => props.updateSelectedItem(index, { body: event.target.value })} /></label>
                <ItemActionControls index={index} count={props.selected!.items.length} moveSelectedItem={props.moveSelectedItem} duplicateSelectedItem={props.duplicateSelectedItem} />
                <button type="button" onClick={() => props.removeSelectedItem(index)}>Remove logo</button>
              </article>
            ))}
            <button type="button" onClick={props.addSelectedItem}>Add logo</button>
          </div>
        </PanelSection>
      )}
      {isComparisonSection && props.selected.items.length > 0 && (
        <PanelSection title="Comparison rows">
          <div className="gusy-item-list is-comparison-list">
            {props.selected.items.map((item, index) => (
              <article key={`${props.selected?.id}-comparison-${index}`}>
                <label><span>Point</span><input value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} /></label>
                <label><span>Explanation</span><textarea value={item.body} onChange={(event) => props.updateSelectedItem(index, { body: event.target.value })} /></label>
                <label><span>Highlight</span><input value={item.label ?? ''} onChange={(event) => props.updateSelectedItem(index, { label: event.target.value })} /></label>
                <ItemActionControls index={index} count={props.selected!.items.length} moveSelectedItem={props.moveSelectedItem} duplicateSelectedItem={props.duplicateSelectedItem} />
                <button type="button" onClick={() => props.removeSelectedItem(index)}>Remove row</button>
              </article>
            ))}
            <button type="button" onClick={props.addSelectedItem}>Add row</button>
          </div>
        </PanelSection>
      )}
      {isFooterSection && props.selected.items.length > 0 && (
        <PanelSection title="Footer columns">
          <div className="gusy-item-list is-footer-list">
            {props.selected.items.map((item, index) => (
              <article key={`${props.selected?.id}-footer-${index}`}>
                <label><span>Column title</span><input value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} /></label>
                <label><span>Content</span><textarea value={item.body} onChange={(event) => props.updateSelectedItem(index, { body: event.target.value })} /></label>
                <ItemActionControls index={index} count={props.selected!.items.length} moveSelectedItem={props.moveSelectedItem} duplicateSelectedItem={props.duplicateSelectedItem} />
                <button type="button" onClick={() => props.removeSelectedItem(index)}>Remove column</button>
              </article>
            ))}
            <button type="button" onClick={props.addSelectedItem}>Add column</button>
          </div>
        </PanelSection>
      )}
      {!isHeroSection && !isFormSection && !isNavigationSection && !isFaqSection && !isPricingSection && !isReviewSection && !isMetricSection && !isLogoSection && !isComparisonSection && !isFooterSection && props.selected.items.length > 0 && (
        <PanelSection title="Cards">
          <div className="gusy-item-list is-card-list">
            {props.selected.items.map((item, index) => (
              <article key={`${props.selected?.id}-card-${index}`}>
                <ItemImageControls item={item} index={index} updateSelectedItem={props.updateSelectedItem} onChooseItemImage={props.onChooseItemImage} onRemoveItemImage={props.onRemoveItemImage} />
                <label><span>Badge</span><input value={item.label ?? ''} onChange={(event) => props.updateSelectedItem(index, { label: event.target.value })} /></label>
                <label><span>Title</span><input value={item.title} onChange={(event) => props.updateSelectedItem(index, { title: event.target.value })} /></label>
                <label><span>Description</span><textarea value={item.body} onChange={(event) => props.updateSelectedItem(index, { body: event.target.value })} /></label>
                <ItemActionControls index={index} count={props.selected!.items.length} moveSelectedItem={props.moveSelectedItem} duplicateSelectedItem={props.duplicateSelectedItem} />
                <button type="button" onClick={() => props.removeSelectedItem(index)}>Remove card</button>
              </article>
            ))}
            <button type="button" onClick={props.addSelectedItem}>Add card</button>
          </div>
        </PanelSection>
      )}
    </div>
  );
}

function ItemImageControls(props: {
  item: GusySection['items'][number];
  index: number;
  mediaLabel?: string;
  updateSelectedItem: (index: number, patch: Partial<GusySection['items'][number]>) => void;
  onChooseItemImage?: (index: number) => void;
  onRemoveItemImage?: (index: number) => void;
}) {
  return (
    <>
      {props.item.image?.url && (
        <div
          className="gusy-item-media-preview"
          style={{ backgroundImage: cssUrl(props.item.image.url) } as CSSProperties}
        >
          <span>{props.item.image.title || props.item.image.alt || props.item.title}</span>
        </div>
      )}
      <div className="gusy-item-media-actions">
        <button type="button" className="gusy-media-primary-button" onClick={() => props.onChooseItemImage?.(props.index)} disabled={!props.onChooseItemImage}>
          {props.item.image?.url ? `Change ${props.mediaLabel ?? 'image'}` : `Add ${props.mediaLabel ?? 'image'}`}
        </button>
        <button type="button" onClick={() => props.onRemoveItemImage?.(props.index)} disabled={!props.item.image?.url || !props.onRemoveItemImage}>Remove image</button>
      </div>
      <label>
        <span>{props.mediaLabel ?? 'Image'} URL</span>
        <input
          value={props.item.image?.url ?? ''}
          onChange={(event) => props.updateSelectedItem(props.index, {
            image: {
              id: props.item.image?.id ?? 0,
              url: event.target.value,
              alt: props.item.image?.alt || props.item.title,
              title: props.item.image?.title || props.item.title
            }
          })}
        />
      </label>
    </>
  );
}
