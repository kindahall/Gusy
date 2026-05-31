import { QUICK_BLOCKS } from './builder-options';
import { PanelSection } from './components';
import { PageCompletionPanel } from './page-completion-panel';

export function CanvasInspector(props: {
  onQuickAdd: (type: string) => void;
  onOpenBlocks: () => void;
  onBuildPage: () => void;
  onRunAudit: () => void;
}) {
  return (
    <div className="gusy-panel-stack">
      <PageCompletionPanel
        sectionTypes={[]}
        onQuickAdd={props.onQuickAdd}
        onOpenBlocks={props.onOpenBlocks}
        onBuildPage={props.onBuildPage}
        onRunAudit={props.onRunAudit}
      />
      <PanelSection title="Page editor">
        <div className="gusy-canvas-inspector-actions">
          {QUICK_BLOCKS.map((block) => (
            <button key={block.type} type="button" onClick={() => props.onQuickAdd(block.type)}>
              <span>{block.icon}</span>
              <strong>{block.label}</strong>
            </button>
          ))}
        </div>
        <div className="gusy-panel-actions">
          <button type="button" className="gusy-primary-wide" onClick={props.onOpenBlocks}>Add sections</button>
          <button type="button" onClick={props.onBuildPage}>Create page</button>
        </div>
        <button type="button" onClick={props.onRunAudit}>Run Audit</button>
      </PanelSection>
    </div>
  );
}
