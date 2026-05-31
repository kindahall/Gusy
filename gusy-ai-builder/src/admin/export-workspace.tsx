import type { ExportRecord, GusyBlueprint } from './types';

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ExportWorkspace(props: {
  blueprint: GusyBlueprint;
  exportText: string;
  importText: string;
  exportHistory: ExportRecord[];
  busy: boolean;
  setImportText: (text: string) => void;
  onExport: () => void;
  onCopy: () => void;
  onImport: () => void;
  onDownload: () => void;
  onUseHistory: (record: ExportRecord) => void;
  onSaveDraft: () => void;
  onSync: () => void;
  onPreview: () => void;
}) {
  const actions = [
    ['Save Draft', props.onSaveDraft, true],
    ['Publish', props.onSync, props.blueprint.page.sections.length > 0],
    ['Preview', props.onPreview, true],
    ['Export JSON', props.onExport, true],
    ['Copy JSON', props.onCopy, true],
    ['Download', props.onDownload, true]
  ] as const;
  const metrics = [
    ['Sections', String(props.blueprint.page.sections.length)],
    ['Slug', props.blueprint.page.slug],
    ['JSON', props.exportText ? 'Ready' : 'Not made'],
    ['Imports', props.importText.trim() ? 'Ready' : 'Paste JSON']
  ] as const;

  return (
    <section className="gusy-export-workspace">
      <header className="gusy-workspace-title">
        <h1>Export</h1>
        <button type="button" onClick={props.onExport} disabled={props.busy}>Export JSON</button>
      </header>
      <div className="gusy-export-actions">
        {actions.map(([label, action, enabled]) => (
          <button key={label} type="button" onClick={action} disabled={props.busy || !enabled}>
            <span>{label.slice(0, 1)}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>
      <div className="gusy-export-grid">
        <section className="gusy-export-status">
          <h2>Current Page</h2>
          <div>
            {metrics.map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
        </section>
        <section className="gusy-export-import">
          <h2>Import JSON</h2>
          <textarea value={props.importText} onChange={(event) => props.setImportText(event.target.value)} />
          <button type="button" onClick={props.onImport} disabled={props.busy || !props.importText.trim()}>Import JSON</button>
        </section>
      </div>
      <div className="gusy-export-grid">
        <section className="gusy-export-history">
          <h2>Recent</h2>
          <div className="gusy-export-table">
            {props.exportHistory.length === 0 && (
              <button type="button" onClick={props.onExport} disabled={props.busy}>
                <span>Create JSON</span>
                <b>Template</b>
                <small>Now</small>
              </button>
            )}
            {props.exportHistory.map((record) => (
              <button
                key={`${record.name}-${record.date}`}
                type="button"
                onClick={() => props.onUseHistory(record)}
                disabled={!record.payload}
                title={record.payload ? 'Load this export' : 'This older history item has no stored JSON'}
              >
                <span>{record.name}</span>
                <b>{record.type}</b>
                <small>{formatDate(record.date)}</small>
              </button>
            ))}
          </div>
        </section>
        <section className="gusy-export-json">
          <h2>JSON</h2>
          {props.exportText ? (
            <>
              <textarea readOnly value={props.exportText} />
              <div>
                <button type="button" onClick={props.onCopy}>Copy</button>
                <button type="button" onClick={props.onDownload}>Download</button>
              </div>
            </>
          ) : (
            <button type="button" onClick={props.onExport} disabled={props.busy}>Create JSON</button>
          )}
        </section>
      </div>
    </section>
  );
}
