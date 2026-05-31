import type { DragEvent as ReactDragEvent } from 'react';
import { QUICK_BLOCKS } from './builder-options';
import { GusySymbol } from './components';

export function CanvasToolbelt(props: {
  onDragBlock: (event: ReactDragEvent, type: string) => void;
  onResetDrag: () => void;
  onQuickAdd: (type: string) => void;
}) {
  return (
    <div className="gusy-canvas-toolbelt">
      {QUICK_BLOCKS.map((block) => (
        <button
          key={block.type}
          type="button"
          draggable
          onDragStart={(event) => props.onDragBlock(event, block.type)}
          onDragEnd={props.onResetDrag}
          onClick={() => props.onQuickAdd(block.type)}
        >
          <span>{block.icon}</span>
          {block.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyCanvas(props: {
  onDragBlock: (event: ReactDragEvent, type: string) => void;
  onResetDrag: () => void;
  onQuickAdd: (type: string) => void;
  onOpenBlocks: () => void;
  onGeneratePage: () => void;
}) {
  return (
    <div className="gusy-empty-canvas">
      <header>
        <GusySymbol />
        <strong>Page editor</strong>
      </header>
      <div className="gusy-empty-canvas-actions">
        {QUICK_BLOCKS.slice(0, 4).map((block) => (
          <button
            key={block.type}
            type="button"
            draggable
            onDragStart={(event) => props.onDragBlock(event, block.type)}
            onDragEnd={props.onResetDrag}
            onClick={() => props.onQuickAdd(block.type)}
          >
            <span>{block.icon}</span>
            <strong>{block.label}</strong>
          </button>
        ))}
      </div>
      <div className="gusy-empty-canvas-footer">
        <button type="button" onClick={props.onOpenBlocks}>Add sections</button>
        <button type="button" onClick={props.onGeneratePage}>Create page</button>
      </div>
    </div>
  );
}
