import type { CSSProperties } from 'react';
import type { GusyAudit } from './types';

export function LaunchChecklist(props: {
  hasSections: boolean;
  isSaved: boolean;
  isPublished: boolean;
  audit: GusyAudit;
  busy: boolean;
  onThemes: () => void;
  onEdit: () => void;
  onAudit: () => void;
  onPublish: () => void;
}) {
  const checked = props.audit.score >= 85 && props.audit.issues.length === 0;
  const steps = [
    {
      label: 'Choose a base',
      done: props.hasSections,
      action: props.onThemes
    },
    {
      label: 'Edit content',
      done: props.hasSections && props.isSaved,
      action: props.onEdit
    },
    {
      label: 'Check quality',
      done: checked,
      action: props.onAudit
    },
    {
      label: 'Publish',
      done: props.isPublished,
      action: props.onPublish
    }
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const primaryAction = !props.hasSections
    ? props.onThemes
    : !checked
    ? props.onAudit
    : props.onPublish;
  const primaryLabel = !props.hasSections
    ? 'Choose theme'
    : !checked
    ? 'Run check'
    : props.isPublished
    ? 'Published'
    : 'Publish';

  return (
    <section className="gusy-launch-card">
      <header>
        <span>Launch</span>
        <b>{doneCount}/4</b>
      </header>
      <div className="gusy-launch-progress">
        <i style={{ '--progress': `${doneCount * 25}%` } as CSSProperties} />
      </div>
      <div className="gusy-launch-steps">
        {steps.map((step) => (
          <button key={step.label} type="button" data-done={step.done ? 'true' : 'false'} onClick={step.action} disabled={props.busy && !step.done}>
            <span>{step.done ? <>&#10003;</> : ''}</span>
            {step.label}
          </button>
        ))}
      </div>
      <button type="button" className="gusy-launch-primary" onClick={primaryAction} disabled={props.busy || props.isPublished && primaryLabel === 'Published'}>
        {primaryLabel}
      </button>
    </section>
  );
}
