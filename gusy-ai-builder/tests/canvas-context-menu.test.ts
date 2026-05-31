import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CanvasContextMenu } from '../src/admin/canvas-context-menu';
import type { CanvasMenuState, GusySection } from '../src/admin/types';

const menu: CanvasMenuState = { x: 40, y: 40, sectionId: 'hero' };

const baseSection: GusySection = {
  id: 'hero',
  type: 'hero',
  variant: 'default',
  label: 'Hero',
  kicker: 'Kicker',
  title: 'Title',
  body: 'Body',
  items: [],
  settings: {
    background: 'plain',
    spacing: 'lg',
    columns: 2,
    mobileStack: true
  }
};

function collectText(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node || typeof node !== 'object') return '';

  const children = (node as { props?: { children?: unknown } }).props?.children;
  if (Array.isArray(children)) return children.map(collectText).join(' ');
  return collectText(children);
}

function renderContext(section: GusySection = baseSection): string {
  Object.defineProperty(globalThis, 'window', {
    value: { innerWidth: 1280, innerHeight: 860 },
    configurable: true
  });

  return collectText(CanvasContextMenu({
    menu,
    section,
    colors: { primary: '#102326', accent: '#2a4598', support: '#5c8d89' },
    canMoveUp: true,
    canMoveDown: true,
    onClose: () => undefined,
    onAdd: () => undefined,
    onOpenBlocks: () => undefined,
    onOpenBrand: () => undefined,
    onRunAudit: () => undefined,
    onAskAgent: () => undefined,
    onBuildAI: () => undefined,
    onBackground: () => undefined,
    onBackgroundImage: () => undefined,
    onRemoveBackgroundImage: () => undefined,
    onBackgroundVideo: () => undefined,
    onRemoveBackgroundVideo: () => undefined,
    onClearBackgroundMedia: () => undefined,
    onAccent: () => undefined,
    onWidth: () => undefined,
    onSpacing: () => undefined,
    onColumns: () => undefined,
    onImprove: () => undefined,
    onAnnotate: () => undefined,
    onDuplicate: () => undefined,
    onMoveUp: () => undefined,
    onMoveDown: () => undefined,
    onStyle: () => undefined,
    onDelete: () => undefined
  }));
}

describe('Canvas context menu', () => {
  it('exposes a direct WordPress media command for section backgrounds', () => {
    const markup = renderContext();

    assert.match(markup, /Upload image/);
    assert.match(markup, /Upload video/);
    assert.match(markup, /IMG/);
    assert.match(markup, /VID/);
    assert.match(markup, /Clear/);
  });

  it('shows replace and preview controls when a background image exists', () => {
    const markup = renderContext({
      ...baseSection,
      settings: {
        ...baseSection.settings,
        background: 'hero',
        backgroundImage: {
          id: 12,
          url: 'https://example.test/hero.jpg',
          title: 'Hero photo'
        }
      }
    });

    assert.match(markup, /Replace image/);
    assert.match(markup, /Hero photo/);
  });

  it('shows replace controls when a background video exists', () => {
    const markup = renderContext({
      ...baseSection,
      settings: {
        ...baseSection.settings,
        background: 'hero',
        backgroundVideo: {
          id: 22,
          url: 'https://example.test/hero.mp4',
          title: 'Hero reel'
        },
        videoMode: 'background'
      }
    });

    assert.match(markup, /Replace video/);
    assert.match(markup, /Remove video/);
  });
});
