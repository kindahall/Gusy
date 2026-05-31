import type { MouseEvent, ReactNode } from 'react';
import type { GusySection } from './types';
import { DEFAULT_FORM_FIELDS, FORM_SECTION_TYPES, shortText } from './schema';
import { GusySymbol } from './components';

type RenderSectionProps = {
  section: GusySection;
  index: number;
  editable?: boolean;
  onSectionTextChange?: (sectionId: string, patch: Partial<GusySection>) => void;
  onItemTextChange?: (sectionId: string, itemIndex: number, patch: Partial<GusySection['items'][number]>) => void;
};

export function sectionIcon(section: GusySection): string {
  const type = section.type.toLowerCase();
  if (type.includes('hero')) return 'H';
  if (type.includes('feature')) return 'F';
  if (type.includes('pricing')) return '$';
  if (type.includes('faq')) return '?';
  if (type.includes('form')) return 'I';
  if (type.includes('testimonial')) return 'T';
  return section.label.slice(0, 1).toUpperCase();
}

function commitText(current: string, next: string, onCommit?: (value: string) => void) {
  const normalized = next.replace(/\s+/g, ' ').trim();
  if (normalized && normalized !== current) {
    onCommit?.(normalized);
  }
}

function EditableText(props: {
  tag: 'span' | 'h1' | 'h2' | 'p' | 'strong' | 'small' | 'b' | 'i';
  value: string;
  max?: number;
  editable?: boolean;
  multiline?: boolean;
  className?: string;
  onCommit?: (value: string) => void;
}) {
  const Tag = props.tag;
  const value = props.editable ? props.value : shortText(props.value, props.max ?? 92);

  return (
    <Tag
      className={props.className}
      contentEditable={props.editable}
      suppressContentEditableWarning
      data-gusy-editable={props.editable ? 'true' : undefined}
      onBlur={(event) => commitText(props.value, event.currentTarget.textContent || '', props.onCommit)}
      onKeyDown={(event) => {
        if (!props.editable || props.multiline || event.key !== 'Enter') return;
        event.preventDefault();
        event.currentTarget.blur();
      }}
    >
      {value}
    </Tag>
  );
}

function itemImage(item: GusySection['items'][number]) {
  if (!item.image?.url) return null;

  return (
    <img
      className="gusy-render-item-image"
      src={item.image.url}
      alt={item.image.alt || item.title}
      loading="lazy"
    />
  );
}

function heroVideo(section: GusySection) {
  if (!section.settings.backgroundVideo?.url || section.settings.videoMode === 'background') return null;

  return (
    <video
      className="gusy-render-hero-image"
      src={section.settings.backgroundVideo.url}
      poster={section.settings.backgroundVideo.poster || section.settings.backgroundImage?.url}
      controls
      playsInline
    />
  );
}

function EditableButton(props: { children: ReactNode; className?: string; editable?: boolean }) {
  return (
    <button
      type="button"
      className={props.className}
      data-gusy-editable-button={props.editable ? 'true' : undefined}
      aria-label={props.editable ? 'Edit button label' : undefined}
      title={props.editable ? 'Edit button label' : undefined}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (!props.editable) return;
        const target = event.target instanceof HTMLElement ? event.target : null;
        const editableNode = target?.dataset.gusyEditable === 'true'
          ? target
          : event.currentTarget.querySelector<HTMLElement>('[data-gusy-editable="true"]');
        editableNode?.focus();
      }}
    >
      {props.children}
    </button>
  );
}

function formFields(section: GusySection): GusySection['items'] {
  return DEFAULT_FORM_FIELDS.map((defaultItem, itemIndex) => ({
    ...defaultItem,
    ...(section.items[itemIndex] ?? {})
  }));
}

export function RenderSection({ section, index, editable, onSectionTextChange, onItemTextChange }: RenderSectionProps) {
  const sectionText = (key: 'kicker' | 'title' | 'body') => (value: string) => onSectionTextChange?.(section.id, { [key]: value });
  const ctaText = (key: 'label' | 'secondaryLabel') => (value: string) => onSectionTextChange?.(section.id, { cta: { ...(section.cta ?? {}), [key]: value } });
  const itemText = (itemIndex: number, key: keyof GusySection['items'][number]) => (value: string) => onItemTextChange?.(section.id, itemIndex, { [key]: value });

  if (section.type === 'header') {
    return (
      <div className="gusy-render is-header">
        <GusySymbol />
        <nav>
          {section.items.slice(0, 4).map((item, itemIndex) => (
            <EditableText key={`${section.id}-nav-${itemIndex}`} tag="span" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
          ))}
        </nav>
        {section.cta?.label && (
          <EditableButton editable={editable}>
            <EditableText tag="span" value={section.cta.label} editable={editable} onCommit={ctaText('label')} />
          </EditableButton>
        )}
      </div>
    );
  }

  if (section.type === 'footer') {
    return (
      <div className="gusy-render is-footer">
        <GusySymbol />
        <div>
          {section.items.slice(0, 3).map((item, itemIndex) => (
            <article key={`${section.id}-footer-${itemIndex}`}>
              <EditableText tag="strong" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
              <EditableText tag="p" value={item.body} max={54} editable={editable} multiline onCommit={itemText(itemIndex, 'body')} />
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'logos') {
    return (
      <div className="gusy-render is-logos">
        <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
        <EditableText tag="h2" value={section.title} max={72} editable={editable} onCommit={sectionText('title')} />
        <div>
          {section.items.slice(0, 6).map((item, itemIndex) => (
            <EditableText key={`${section.id}-logo-${itemIndex}`} tag="strong" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'features') {
    return (
      <div className="gusy-render is-features">
        <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
        <EditableText tag="h2" value={section.title} max={72} editable={editable} onCommit={sectionText('title')} />
        <div>
          {section.items.slice(0, 4).map((item, itemIndex) => (
            <article key={`${section.id}-feature-${itemIndex}`}>
              {itemImage(item)}
              <EditableText tag="b" value={item.label || sectionIcon(section)} editable={editable} onCommit={itemText(itemIndex, 'label')} />
              <EditableText tag="strong" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
              <EditableText tag="p" value={item.body} max={72} editable={editable} multiline onCommit={itemText(itemIndex, 'body')} />
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'pricing') {
    return (
      <div className="gusy-render is-pricing">
        <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
        <EditableText tag="h2" value={section.title} max={72} editable={editable} onCommit={sectionText('title')} />
        <div>
          {section.items.slice(0, 3).map((item, itemIndex) => (
            <article key={`${section.id}-price-${itemIndex}`}>
              {itemImage(item)}
              <EditableText tag="strong" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
              {item.label && <EditableText tag="b" value={item.label} editable={editable} onCommit={itemText(itemIndex, 'label')} />}
              <EditableText tag="p" value={item.body} max={70} editable={editable} multiline onCommit={itemText(itemIndex, 'body')} />
              {section.cta?.label && (
                <EditableButton editable={editable}>
                  <EditableText tag="span" value={section.cta.label} editable={editable} onCommit={ctaText('label')} />
                </EditableButton>
              )}
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'testimonials') {
    return (
      <div className="gusy-render is-testimonials">
        <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
        <EditableText tag="h2" value={section.title} max={72} editable={editable} onCommit={sectionText('title')} />
        <div>
          {section.items.slice(0, 3).map((item, itemIndex) => (
            <article key={`${section.id}-review-${itemIndex}`}>
              {itemImage(item)}
              <b>*****</b>
              <EditableText tag="p" value={item.title} max={82} editable={editable} multiline onCommit={itemText(itemIndex, 'title')} />
              <EditableText tag="strong" value={item.body || ''} max={56} editable={editable} onCommit={itemText(itemIndex, 'body')} />
              <EditableText tag="small" value={item.label || ''} max={32} editable={editable} onCommit={itemText(itemIndex, 'label')} />
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'stats') {
    return (
      <div className="gusy-render is-stats">
        <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
        <EditableText tag="h2" value={section.title} max={72} editable={editable} onCommit={sectionText('title')} />
        <div>
          {section.items.slice(0, 4).map((item, itemIndex) => (
            <article key={`${section.id}-stat-${itemIndex}`}>
              <EditableText tag="b" value={item.label || '0'} editable={editable} onCommit={itemText(itemIndex, 'label')} />
              <EditableText tag="strong" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
              <EditableText tag="p" value={item.body} max={62} editable={editable} multiline onCommit={itemText(itemIndex, 'body')} />
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'comparison') {
    return (
      <div className="gusy-render is-comparison">
        <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
        <EditableText tag="h2" value={section.title} max={72} editable={editable} onCommit={sectionText('title')} />
        <div>
          {section.items.slice(0, 5).map((item, itemIndex) => (
            <article key={`${section.id}-comparison-${itemIndex}`}>
              <EditableText tag="strong" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
              <EditableText tag="p" value={item.body} max={70} editable={editable} multiline onCommit={itemText(itemIndex, 'body')} />
              <EditableText tag="b" value={item.label || 'Value'} editable={editable} onCommit={itemText(itemIndex, 'label')} />
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (['cta', 'sticky-offer'].includes(section.type)) {
    return (
      <div className="gusy-render is-cta">
        <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
        <EditableText tag="h2" value={section.title} max={72} editable={editable} onCommit={sectionText('title')} />
        <EditableText tag="p" value={section.body} max={130} editable={editable} multiline onCommit={sectionText('body')} />
        {(section.cta?.label || section.cta?.secondaryLabel) && (
          <div className="gusy-render-actions">
            {section.cta?.label && (
              <EditableButton editable={editable}>
                <EditableText tag="span" value={section.cta.label} editable={editable} onCommit={ctaText('label')} />
              </EditableButton>
            )}
            {section.cta?.secondaryLabel && (
              <EditableButton editable={editable} className="is-secondary">
                <EditableText tag="span" value={section.cta.secondaryLabel} editable={editable} onCommit={ctaText('secondaryLabel')} />
              </EditableButton>
            )}
          </div>
        )}
      </div>
    );
  }

  if (section.type === 'faq') {
    return (
      <div className="gusy-render is-faq">
        <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
        <EditableText tag="h2" value={section.title} max={72} editable={editable} onCommit={sectionText('title')} />
        {section.items.slice(0, 4).map((item, itemIndex) => (
          <p key={`${section.id}-faq-${itemIndex}`}>
            <EditableText tag="b" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
            <span>+</span>
          </p>
        ))}
      </div>
    );
  }

  if (FORM_SECTION_TYPES.includes(section.type)) {
    return (
      <div className="gusy-render is-form">
        <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
        <EditableText tag="h2" value={section.title} max={72} editable={editable} onCommit={sectionText('title')} />
        <div>
          {formFields(section).map((item, itemIndex) => (
            <EditableText key={`${section.id}-field-${itemIndex}`} tag="i" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
          ))}
          {section.cta?.label && (
            <EditableButton editable={editable}>
              <EditableText tag="span" value={section.cta.label} editable={editable} onCommit={ctaText('label')} />
            </EditableButton>
          )}
        </div>
      </div>
    );
  }

  if (!['hero'].includes(section.type)) {
    return (
      <div className={`gusy-render is-utility is-${section.type}`}>
        <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
        <EditableText tag="h2" value={section.title} max={72} editable={editable} onCommit={sectionText('title')} />
        <EditableText tag="p" value={section.body} max={120} editable={editable} multiline onCommit={sectionText('body')} />
        <div>
          {section.items.slice(0, 3).map((item, itemIndex) => (
            <article key={`${section.id}-utility-${itemIndex}`}>
              {itemImage(item)}
              <EditableText tag="b" value={item.label || sectionIcon(section)} editable={editable} onCommit={itemText(itemIndex, 'label')} />
              <EditableText tag="strong" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
              <EditableText tag="p" value={item.body} max={62} editable={editable} multiline onCommit={itemText(itemIndex, 'body')} />
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`gusy-render is-hero ${index > 0 ? 'is-compact' : ''}`}>
      <EditableText tag="span" value={section.kicker || section.label} editable={editable} onCommit={sectionText('kicker')} />
      <EditableText tag="h1" value={section.title} max={92} editable={editable} onCommit={sectionText('title')} />
      <EditableText tag="p" value={section.body} max={150} editable={editable} multiline onCommit={sectionText('body')} />
      {(section.cta?.label || section.cta?.secondaryLabel) && (
        <div className="gusy-render-actions">
          {section.cta?.label && (
            <EditableButton editable={editable}>
              <EditableText tag="span" value={section.cta.label} editable={editable} onCommit={ctaText('label')} />
            </EditableButton>
          )}
          {section.cta?.secondaryLabel && (
            <EditableButton editable={editable} className="is-secondary">
              <EditableText tag="span" value={section.cta.secondaryLabel} editable={editable} onCommit={ctaText('secondaryLabel')} />
            </EditableButton>
          )}
        </div>
      )}
      {section.items.length > 0 && (
        <div className="gusy-render-hero-proof">
          {section.items.slice(0, 3).map((item, itemIndex) => (
            <article key={`${section.id}-proof-${itemIndex}`}>
              <EditableText tag="b" value={item.label || `0${itemIndex + 1}`} editable={editable} onCommit={itemText(itemIndex, 'label')} />
              <EditableText tag="span" value={item.title} editable={editable} onCommit={itemText(itemIndex, 'title')} />
            </article>
          ))}
        </div>
      )}
      {heroVideo(section)}
      {!section.settings.backgroundVideo?.url && section.settings.backgroundImage?.url && (
        <img
          className="gusy-render-hero-image"
          src={section.settings.backgroundImage.url}
          alt={section.settings.backgroundImage.alt || section.title}
          loading={index === 0 ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
}
