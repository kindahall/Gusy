import { useState } from 'react';
import { ScoreRing } from './components';
import { auditPassedChecks, auditSummaryChecks } from './audit-workflow-model';
import type { GusyAudit } from './types';

export function AuditWorkspace(props: {
  audit: GusyAudit;
  busy: boolean;
  hasSections: boolean;
  onRunAudit: () => void;
  onFix: () => void;
  onBuild: () => void;
  onSeo: () => void;
  onBlocks: () => void;
}) {
  const [view, setView] = useState<'issues' | 'passed'>('issues');
  const hasIssues = props.audit.issues.length > 0;
  const scoreState = props.audit.score >= 85 ? 'ready' : props.audit.score >= 70 ? 'warning' : 'danger';
  const summary = auditSummaryChecks(props.audit);
  const passedChecks = auditPassedChecks(props.audit);
  const quickActions = props.hasSections
    ? [
        ['Run Audit', props.onRunAudit, true],
        ['Fix Issues', props.onFix, hasIssues],
        ['Generate SEO', props.onSeo, true],
        ['Add sections', props.onBlocks, true]
      ] as const
    : [
        ['Create page', props.onBuild, true],
        ['Add sections', props.onBlocks, true],
        ['Run Audit', props.onRunAudit, true]
      ] as const;

  return (
    <section className="gusy-audit-workspace">
      <header className="gusy-workspace-title">
        <h1>Audit</h1>
        <div className="gusy-workspace-actions">
          <button type="button" onClick={props.onRunAudit} disabled={props.busy}>Run Audit</button>
          <button type="button" onClick={props.onFix} disabled={props.busy || !hasIssues}>Fix Issues</button>
        </div>
      </header>
      <div className={`gusy-audit-overview is-${scoreState}`}>
        <ScoreRing score={props.audit.score} />
        <div>
          <strong>{scoreState === 'ready' ? 'Ready to publish' : props.hasSections ? 'Needs work' : 'Page empty'}</strong>
          <div className="gusy-score-bar"><span style={{ width: `${props.audit.score}%` }} /></div>
          <dl>
            <div><dt>{props.audit.issues.length}</dt><dd>Issues</dd></div>
            <div><dt>{passedChecks.length}</dt><dd>Passed</dd></div>
            <div><dt>{props.audit.sectionCount}</dt><dd>Sections</dd></div>
          </dl>
          <div className="gusy-audit-actions">
            {quickActions.map(([label, action, enabled]) => (
              <button key={label} type="button" onClick={action} disabled={props.busy || !enabled}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="gusy-audit-cards">
        {summary.map((check) => (
          <article key={check.label} data-state={check.state}>
            <span>{check.icon}</span>
            <strong>{check.label}</strong>
            <b>{check.status}</b>
            <i />
          </article>
        ))}
      </div>
      <div className="gusy-issue-table">
        <header>
          <button type="button" aria-pressed={view === 'issues'} onClick={() => setView('issues')}>Issues <b>{props.audit.issues.length}</b></button>
          <button type="button" aria-pressed={view === 'passed'} onClick={() => setView('passed')}>Passed <b>{passedChecks.length}</b></button>
        </header>
        {view === 'issues' && props.audit.issues.length === 0 && (
          <p className="gusy-empty-state">No issues found.</p>
        )}
        {view === 'issues' && props.audit.issues.map((issue, index) => (
          <button key={issue} type="button" onClick={props.onFix}>
            <span>{index === 0 ? 'Error' : 'Notice'}</span>
            <strong>{issue}</strong>
            <small>{index === 0 ? 'High' : 'Low'}</small>
            <b>Fix</b>
          </button>
        ))}
        {view === 'passed' && passedChecks.length === 0 && (
          <p className="gusy-empty-state">No passed checks yet. Run the audit after adding the missing sections.</p>
        )}
        {view === 'passed' && passedChecks.map((check) => (
          <article key={check.label} className="gusy-passed-row">
            <span>Pass</span>
            <strong>{check.label}</strong>
            <small>{check.status}</small>
            <b>Ready</b>
          </article>
        ))}
      </div>
    </section>
  );
}
