import { RenderSection } from './section-renderer';
import type { GusyElementorPage, MigrationPreview } from './types';

export function MigrationWorkspace(props: {
  pages: GusyElementorPage[];
  preview: MigrationPreview | null;
  busy: boolean;
  onScan: () => void;
  onPreview: (id: number) => void;
  onOpenCanvas: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  const elementorCount = props.pages.filter((page) => page.hasElementorData).length;
  const selectedPage = props.preview ? props.pages.find((page) => page.id === props.preview?.pageId) : props.pages[0];
  const bestCompatibility = props.pages.reduce((score, page) => Math.max(score, page.compatibility ?? 0), 0);
  const metrics = [
    ['Candidates', String(props.pages.length)],
    ['Elementor', String(elementorCount)],
    ['Converted', props.preview ? String(props.preview.blueprint.page.sections.length) : '0'],
    ['Score', props.preview ? String(props.preview.audit.score) : bestCompatibility ? String(bestCompatibility) : '0']
  ] as const;
  const sourceTypes = Array.from(new Set(props.pages.map((page) => page.source ?? (page.hasElementorData ? 'elementor' : 'wordpress'))));

  return (
    <section className="gusy-migrate-workspace">
      <header className="gusy-workspace-title">
        <div>
          <span className="gusy-elementor-mark">E</span>
          <h1>Migration</h1>
        </div>
        <div className="gusy-workspace-actions">
          <button type="button" onClick={props.onScan} disabled={props.busy}>Scan</button>
          <button type="button" onClick={() => selectedPage && props.onPreview(selectedPage.id)} disabled={props.busy || !selectedPage}>Convert</button>
          <button type="button" onClick={props.onOpenCanvas} disabled={!props.preview}>Edit page</button>
        </div>
      </header>
      <div className="gusy-migrate-action-strip">
        {metrics.map(([label, value]) => (
          <button key={label} type="button" onClick={label === 'Candidates' ? props.onScan : props.preview ? props.onOpenCanvas : props.onScan}>
            <span>{label}</span>
            <strong>{value}</strong>
          </button>
        ))}
      </div>
      <div className="gusy-migrate-grid">
        <section className="gusy-migrate-source">
          <header>
            <h2>Pages</h2>
            <button type="button" onClick={props.onScan} disabled={props.busy}>Scan</button>
          </header>
          <div className="gusy-migrate-list">
            {props.pages.length === 0 && <button type="button" onClick={props.onScan}>Scan WordPress</button>}
            {props.pages.map((page) => (
              <button key={page.id} type="button" aria-pressed={props.preview?.pageId === page.id} onClick={() => props.onPreview(page.id)}>
                <b>{page.title}</b>
                <span>{page.compatibility ?? 0}%</span>
                <small>{page.hasElementorData ? 'Elementor' : 'WordPress'} · {page.status}</small>
              </button>
            ))}
          </div>
        </section>
        <section className="gusy-migrate-map">
          <h2>Map</h2>
          {selectedPage ? (
            <>
              <div className="gusy-migrate-map-card">
                <strong>{selectedPage.title}</strong>
                <span>{selectedPage.hasElementorData ? 'Elementor' : 'WordPress'}</span>
              </div>
              <div className="gusy-migrate-metrics">
                <article><span>Content</span><strong>{selectedPage.textCount ?? 0}</strong></article>
                <article><span>Widgets</span><strong>{selectedPage.widgetCount ?? 0}</strong></article>
                <article><span>Fit</span><strong>{selectedPage.compatibility ?? 0}%</strong></article>
              </div>
              <div className="gusy-migrate-tags">
                {sourceTypes.map((source) => <span key={source}>{source}</span>)}
                {(selectedPage.warnings ?? []).slice(0, 3).map((warning) => <span key={warning}>{warning}</span>)}
              </div>
              <button type="button" className="gusy-primary-wide" onClick={() => props.onPreview(selectedPage.id)} disabled={props.busy}>Convert Selected</button>
            </>
          ) : (
            <button type="button" onClick={props.onScan}>Scan WordPress</button>
          )}
        </section>
        <section className="gusy-migrate-preview-panel">
          <header>
            <h2>Preview</h2>
            <div>
              <button type="button" onClick={props.onSaveDraft} disabled={!props.preview || props.busy}>Save</button>
              <button type="button" onClick={props.onPublish} disabled={!props.preview || props.busy}>Publish</button>
            </div>
          </header>
          {props.preview ? (
            <div className="gusy-migrate-preview">
              <div className="gusy-migrate-preview-head">
                <strong>{props.preview.blueprint.page.title}</strong>
                <span>{props.preview.blueprint.page.sections.length} sections · {props.preview.audit.score}</span>
              </div>
              <div className="gusy-migrate-preview-sections">
                {props.preview.blueprint.page.sections.slice(0, 3).map((section, index) => (
                  <article key={section.id}>
                    <RenderSection section={section} index={index} />
                  </article>
                ))}
              </div>
              <button type="button" className="gusy-primary-wide" onClick={props.onOpenCanvas}>Edit page</button>
            </div>
          ) : (
            <div className="gusy-migrate-preview is-empty">
              <strong>{props.pages.length ? 'Choose a page' : 'Scan WordPress'}</strong>
              <button type="button" onClick={props.pages.length ? () => props.onPreview(props.pages[0].id) : props.onScan} disabled={props.busy}>
                {props.pages.length ? 'Convert First' : 'Scan'}
              </button>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
