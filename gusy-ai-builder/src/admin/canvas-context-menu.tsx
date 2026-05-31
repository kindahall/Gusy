import type { CSSProperties } from 'react';
import {
  QUICK_BLOCKS,
  SECTION_ACCENT_KEYS,
  SECTION_BACKGROUND_OPTIONS,
  SECTION_SPACING_OPTIONS,
  SECTION_WIDTH_OPTIONS
} from './builder-options';
import { cssUrl } from './schema';
import type { CanvasMenuState, GusySection } from './types';

export function CanvasContextMenu(props: {
  menu: CanvasMenuState;
  section?: GusySection;
  colors: Record<string, string>;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: () => void;
  onAdd: (type: string) => void;
  onOpenBlocks: () => void;
  onOpenBrand: () => void;
  onRunAudit: () => void;
  onAskAgent: () => void;
  onBuildAI: () => void;
  onBackground: (background: string) => void;
  onBackgroundImage: () => void;
  onRemoveBackgroundImage: () => void;
  onBackgroundVideo: () => void;
  onRemoveBackgroundVideo: () => void;
  onClearBackgroundMedia: () => void;
  onAccent: (accent: string) => void;
  onWidth: (width: string) => void;
  onSpacing: (spacing: string) => void;
  onColumns: (columns: number) => void;
  onImprove: () => void;
  onAnnotate: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onStyle: () => void;
  onDelete: () => void;
}) {
  const left = Math.min(props.menu.x, Math.max(18, window.innerWidth - 336));
  const top = Math.min(props.menu.y, Math.max(18, window.innerHeight - 620));
  const accentKeys = SECTION_ACCENT_KEYS.filter((key) => props.colors[key]);
  const hasBackgroundImage = Boolean(props.section?.settings.backgroundImage?.url);
  const hasBackgroundVideo = Boolean(props.section?.settings.backgroundVideo?.url);
  const hasBackgroundMedia = hasBackgroundImage || hasBackgroundVideo;

  return (
    <div className="gusy-context-layer" onMouseDown={props.onClose} onContextMenu={(event) => event.preventDefault()}>
      <section
        className="gusy-context-menu"
        style={{ left, top } as CSSProperties}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <strong>{props.section ? props.section.label : 'Page editor'}</strong>
          <button type="button" onClick={props.onClose}>Close</button>
        </header>
        {props.section && (
          <div className="gusy-context-group">
            <div className="gusy-context-label-row">
              <div className="gusy-context-label">Background</div>
            </div>
            <div className="gusy-context-media-actions is-wide">
              <button type="button" className="gusy-context-media-trigger" onClick={props.onBackgroundImage}>
                <span>IMG</span>
                <strong>{hasBackgroundImage ? 'Replace image' : 'Upload image'}</strong>
              </button>
              <button type="button" className="gusy-context-media-trigger is-video" onClick={props.onBackgroundVideo}>
                <span>VID</span>
                <strong>{hasBackgroundVideo ? 'Replace video' : 'Upload video'}</strong>
              </button>
              <button
                type="button"
                onClick={props.onClearBackgroundMedia}
                disabled={!hasBackgroundMedia}
              >
                Clear
              </button>
            </div>
            <div className="gusy-context-strip">
              {SECTION_BACKGROUND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={(props.section?.settings.background || 'plain') === option.value}
                  onClick={() => props.onBackground(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {hasBackgroundImage && props.section.settings.backgroundImage?.url && (
              <>
                <div
                  className="gusy-context-media-preview"
                  style={{ backgroundImage: cssUrl(props.section.settings.backgroundImage.url) } as CSSProperties}
                >
                  <span>{props.section.settings.backgroundImage.title || 'Background image'}</span>
                </div>
                <div className="gusy-context-media-row">
                  <button type="button" onClick={props.onBackgroundImage}>Replace</button>
                  <button type="button" onClick={props.onRemoveBackgroundImage}>Remove</button>
                </div>
              </>
            )}
            {hasBackgroundVideo && props.section.settings.backgroundVideo?.url && (
              <div className="gusy-context-media-row">
                <button type="button" onClick={props.onBackgroundVideo}>Replace video</button>
                <button type="button" onClick={props.onRemoveBackgroundVideo}>Remove video</button>
              </div>
            )}
            <div className="gusy-context-label">Color</div>
            <div className="gusy-context-swatches">
              {accentKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`Use ${key} accent`}
                  aria-pressed={(props.section?.settings.accent || 'accent') === key}
                  style={{ backgroundColor: props.colors[key] } as CSSProperties}
                  onClick={() => props.onAccent(key)}
                />
              ))}
            </div>
            <div className="gusy-context-label">Layout</div>
            <div className="gusy-context-strip">
              {SECTION_WIDTH_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={(props.section?.settings.width || 'wide') === option.value}
                  onClick={() => props.onWidth(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="gusy-context-strip">
              {SECTION_SPACING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={(props.section?.settings.spacing || 'lg') === option.value}
                  onClick={() => props.onSpacing(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="gusy-context-strip">
              {[1, 2, 3, 4].map((columns) => (
                <button
                  key={columns}
                  type="button"
                  aria-pressed={(props.section?.settings.columns || 1) === columns}
                  onClick={() => props.onColumns(columns)}
                >
                  {columns} col
                </button>
              ))}
            </div>
          </div>
        )}
        {props.section && (
          <div className="gusy-context-group">
            <button type="button" onClick={props.onImprove}>Improve with AI</button>
            <button type="button" onClick={props.onAnnotate}>Annotate</button>
            <button type="button" onClick={props.onDuplicate}>Duplicate</button>
            <button type="button" onClick={props.onMoveUp} disabled={!props.canMoveUp}>Move up</button>
            <button type="button" onClick={props.onMoveDown} disabled={!props.canMoveDown}>Move down</button>
            <button type="button" onClick={props.onStyle}>Open inspector</button>
            <button type="button" className="is-danger" onClick={props.onDelete}>Delete</button>
          </div>
        )}
        <div className="gusy-context-group">
          {QUICK_BLOCKS.slice(1, 6).map((block) => (
            <button key={block.type} type="button" onClick={() => props.onAdd(block.type)}>
              <span>{block.icon}</span>
              Add {block.label}
            </button>
          ))}
        </div>
        <div className="gusy-context-group">
          <button type="button" onClick={props.onBuildAI}>Create with AI</button>
          <button type="button" onClick={props.onOpenBlocks}>Section library</button>
          <button type="button" onClick={props.onOpenBrand}>Brand kit</button>
          <button type="button" onClick={props.onRunAudit}>Audit</button>
          <button type="button" onClick={props.onAskAgent}>Ask Gusy</button>
        </div>
      </section>
    </div>
  );
}
