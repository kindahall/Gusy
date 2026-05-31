import { PanelSection } from './components';

export function PageCompletionPanel(props: {
  sectionTypes: string[];
  onQuickAdd: (type: string) => void;
  onOpenBlocks: () => void;
  onBuildPage: () => void;
  onRunAudit: () => void;
}) {
  const types = new Set(props.sectionTypes);
  const steps = [
    { type: 'hero', label: 'Clear opening', ready: types.has('hero') },
    { type: 'features', label: 'Services or offers', ready: types.has('features') },
    { type: 'testimonials', label: 'Reviews and proof', ready: types.has('testimonials') },
    { type: 'pricing', label: 'Prices or packages', ready: types.has('pricing') },
    { type: 'faq', label: 'Questions answered', ready: types.has('faq') },
    { type: 'form', label: 'Contact or booking', ready: types.has('form') }
  ];
  const remaining = steps.filter((step) => !step.ready);
  const nextStep = remaining[0];

  return (
    <PanelSection title="Build guide">
      <div className="gusy-build-guide">
        <strong>{remaining.length ? `${remaining.length} steps to finish` : 'Page structure ready'}</strong>
        <span>{remaining.length ? 'Add the missing business sections before publishing.' : 'Run an audit, then save or publish.'}</span>
      </div>
      <div className="gusy-build-checklist">
        {steps.map((step) => (
          <button
            key={step.type}
            type="button"
            data-ready={step.ready ? 'true' : 'false'}
            onClick={() => step.ready ? props.onRunAudit() : props.onQuickAdd(step.type)}
          >
            <span>{step.ready ? 'Done' : 'Add'}</span>
            <strong>{step.label}</strong>
          </button>
        ))}
      </div>
      <div className="gusy-panel-actions">
        <button type="button" className="gusy-primary-wide" onClick={() => nextStep ? props.onQuickAdd(nextStep.type) : props.onRunAudit()}>
          {nextStep ? `Add ${nextStep.label}` : 'Run audit'}
        </button>
        <button type="button" onClick={props.onOpenBlocks}>Sections</button>
      </div>
      <button type="button" onClick={props.onBuildPage}>Build full page</button>
    </PanelSection>
  );
}
