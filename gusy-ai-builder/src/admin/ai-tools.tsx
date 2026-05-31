import { useState } from 'react';
import type {
  AgentMessage,
  AnnotationDraft,
  GusyAgentAction,
  GusyAgentMemory,
  GusySection,
  GusyTemplate,
  LeftTab,
  PendingAgentAction
} from './types';

export function AIBar(props: {
  prompt: string;
  setPrompt: (prompt: string) => void;
  busy: boolean;
  agentBusy: boolean;
  selected?: GusySection;
  hasSections: boolean;
  tab: LeftTab;
  onGenerate: (promptOverride?: string) => void;
  onTransform: (instruction: string) => void;
  onAskAgent: (message?: string) => void;
  onFinishPage: () => void;
  onBuildBrandKit: () => void;
  onApplyTheme: () => void;
  onRunAudit: () => void;
  onScanElementor: () => void;
  onOpenBlocks: () => void;
}) {
  const cleanPrompt = props.prompt.trim();
  const fallbackBuildPrompt = 'Create a modern, conversion-focused WordPress page in English.';
  const agentPrompt = cleanPrompt || 'Guide me to the next useful action in Gusy.';

  function runPrimary() {
    if (props.tab === 'brand') {
      props.onBuildBrandKit();
      return;
    }
    if (props.selected) {
      props.onTransform(cleanPrompt || 'Improve this selected section.');
      return;
    }
    if (props.tab === 'migrate') {
      props.onScanElementor();
      return;
    }
    if (props.hasSections) {
      props.onFinishPage();
      return;
    }
    props.onGenerate(cleanPrompt || fallbackBuildPrompt);
  }

  const actions = props.tab === 'brand'
    ? [
        { label: 'Theme', run: props.onApplyTheme },
        { label: 'AI style', run: props.onBuildBrandKit },
        { label: 'Assistant', run: () => props.onAskAgent(cleanPrompt || 'Build a brand kit from this project and WordPress theme.') }
      ]
    : props.selected
    ? [
        { label: 'Improve', run: () => props.onTransform(cleanPrompt || 'Improve this selected section.') },
        { label: 'Shorten', run: () => props.onTransform('Shorten this selected section.') },
        { label: 'Tone', run: () => props.onTransform('Change this selected section to a premium, clear tone.') }
      ]
      : props.tab === 'migrate'
      ? [
          { label: 'Assistant', run: () => props.onAskAgent(cleanPrompt || 'Guide this Elementor migration.') },
          { label: 'Build', run: () => props.onGenerate(cleanPrompt || fallbackBuildPrompt) }
        ]
      : props.hasSections
        ? [
            { label: 'Audit', run: props.onRunAudit },
            { label: 'Assistant', run: () => props.onAskAgent(agentPrompt) }
          ]
        : [
            { label: 'Sections', run: props.onOpenBlocks },
            { label: 'Assistant', run: () => props.onAskAgent(agentPrompt) }
          ];

  const primaryLabel = props.tab === 'brand' ? 'Kit' : props.selected ? 'Apply' : props.tab === 'migrate' ? 'Scan' : props.hasSections ? 'Finish' : 'Build';

  return (
    <section className="gusy-ai-bar">
      <span className="gusy-ai-badge">AI</span>
      <input
        value={props.prompt}
        onChange={(event) => props.setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            runPrimary();
          }
        }}
        placeholder={props.tab === 'brand' ? 'Describe the brand to generate...' : props.selected ? 'Change the selected section...' : 'Tell Gusy what to build or fix...'}
      />
      <div className="gusy-ai-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.run}
            disabled={props.busy || props.agentBusy && action.label === 'Assistant'}
          >
            {action.label}
          </button>
        ))}
      </div>
      <button type="button" className="is-primary" disabled={props.busy} onClick={runPrimary}>
        {primaryLabel}
      </button>
    </section>
  );
}

export function AnnotationPanel(props: {
  draft: AnnotationDraft;
  section?: GusySection;
  busy: boolean;
  onChange: (note: string) => void;
  onSave: () => void;
  onApply: () => void;
  onRemove?: () => void;
  onClose: () => void;
}) {
  const canApply = Boolean(props.draft.note.trim()) && Boolean(props.section) && !props.busy;

  return (
    <section className="gusy-annotation-panel">
      <header>
        <strong>Annotation</strong>
        <span>{props.section?.label ?? 'Section'}</span>
        <button type="button" onClick={props.onClose}>Close</button>
      </header>
      <textarea
        autoFocus
        value={props.draft.note}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            if (canApply) props.onApply();
          }
        }}
        placeholder="Tell Gusy what to change..."
      />
      <footer>
        {props.onRemove && <button type="button" onClick={props.onRemove}>Delete</button>}
        <button type="button" onClick={props.onSave} disabled={!props.draft.note.trim() || !props.section}>Save</button>
        <button type="button" className="is-primary" onClick={props.onApply} disabled={!canApply}>
          Apply with AI
        </button>
      </footer>
    </section>
  );
}

export function ProductAgentPanel(props: {
  messages: AgentMessage[];
  memory: GusyAgentMemory;
  pendingAction: PendingAgentAction | null;
  busy: boolean;
  onAction: (action: GusyAgentAction) => void;
  onApplyPending: () => void;
  onCancelPending: () => void;
  onUndo: () => void;
  onAsk: (message: string) => void;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');

  function submit() {
    const clean = message.trim();
    if (!clean) return;
    props.onAsk(clean);
    setMessage('');
  }

  return (
    <section className="gusy-agent-panel">
      <header>
        <strong>Gusy Assistant</strong>
        <button type="button" onClick={props.onUndo}>Undo</button>
        <button type="button" onClick={props.onClose}>Close</button>
      </header>
      <div className="gusy-agent-memory">
        <span>{props.memory.business || 'No project memory yet'}</span>
        <small>{props.memory.tone || 'clear'}{props.memory.localMarket ? ` / ${props.memory.localMarket}` : ''}</small>
      </div>
      <div className="gusy-agent-thread">
        {props.messages.map((item) => (
          <article key={item.id} data-role={item.role}>
            <p>{item.text}</p>
            {item.actions && item.actions.length > 0 && (
              <div>
                {item.actions.map((action) => (
                  <button key={`${item.id}-${action.type}-${action.label}`} type="button" onClick={() => props.onAction(action)}>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
        {props.busy && <article data-role="agent"><p>Thinking...</p></article>}
      </div>
      {props.pendingAction && (
        <div className="gusy-agent-pending">
          <strong>{props.pendingAction.action.label}</strong>
          <p>{props.pendingAction.summary}</p>
          <div>
            <button type="button" onClick={props.onApplyPending}>Apply</button>
            <button type="button" onClick={props.onCancelPending}>Cancel</button>
          </div>
        </div>
      )}
      <footer>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
          placeholder="Ask about Gusy..."
        />
        <button type="button" onClick={submit} disabled={props.busy || !message.trim()}>Send</button>
      </footer>
    </section>
  );
}

export function CommandPalette(props: {
  commands: Array<{ label: string; action: () => void }>;
  templates: GusyTemplate[];
  onAddTemplate: (template: GusyTemplate) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const commands = props.commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()));
  const templates = props.templates
    .filter((template) => `${template.title} ${template.type} ${template.category}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="gusy-command-backdrop" onMouseDown={props.onClose}>
      <div className="gusy-command" onMouseDown={(event) => event.stopPropagation()}>
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Command or block" />
        <div>
          {templates.map((template) => (
            <button key={template.id} type="button" onClick={() => { props.onAddTemplate(template); props.onClose(); }}>
              Add {template.title}
            </button>
          ))}
          {commands.map((command) => (
            <button key={command.label} type="button" onClick={() => { command.action(); props.onClose(); }}>
              {command.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
