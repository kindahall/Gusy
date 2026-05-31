import type { MouseEvent as ReactMouseEvent } from 'react';
import { BLOCK_DRAG_MIME, DEFAULT_BUILD_PROMPT } from './builder-options';
import { GusySymbol } from './components';

export function StartWorkspace(props: {
  hasSections: boolean;
  onCreateAI: (promptOverride?: string) => void;
  onOpenThemes: () => void;
  onImportElementor: () => void;
  onOpenCanvas: () => void;
  onOpenBlocks: () => void;
  onQuickAdd: (type: string) => void;
  onContextMenu: (event: ReactMouseEvent, sectionId?: string) => void;
}) {
  if (props.hasSections) {
    return (
      <section className="gusy-start-shell">
        <div className="gusy-start-card is-continue" onContextMenu={props.onContextMenu}>
          <GusySymbol />
          <h1>Continue your site</h1>
          <div className="gusy-start-actions">
            <button type="button" onClick={props.onOpenCanvas}>Edit page</button>
            <button type="button" onClick={props.onOpenBlocks}>Add section</button>
            <button type="button" onClick={props.onOpenThemes}>Change theme</button>
            <button type="button" onClick={() => props.onCreateAI(DEFAULT_BUILD_PROMPT)}>Improve with AI</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="gusy-start-shell">
      <div
        className="gusy-start-card"
        onContextMenu={props.onContextMenu}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(event) => {
          event.preventDefault();
          const type = event.dataTransfer.getData(BLOCK_DRAG_MIME) || event.dataTransfer.getData('text/plain');
          if (type) props.onQuickAdd(type);
        }}
      >
        <button type="button" className="gusy-add-node" onClick={props.onOpenBlocks}>+</button>
        <GusySymbol />
        <h1>Start with a professional base</h1>
        <div className="gusy-start-options">
          <button type="button" onClick={props.onOpenThemes}>
            <span className="is-themes">T</span>
            <strong>Theme kits</strong>
          </button>
          <button type="button" onClick={() => props.onCreateAI(DEFAULT_BUILD_PROMPT)}>
            <span className="is-ai">AI</span>
            <strong>Build with AI</strong>
          </button>
          <button type="button" onClick={props.onImportElementor}>
            <span className="is-elementor">E</span>
            <strong>Import Elementor</strong>
          </button>
          <button type="button" onClick={props.onOpenBlocks}>
            <span>+</span>
            <strong>Add sections</strong>
          </button>
        </div>
      </div>
    </section>
  );
}
