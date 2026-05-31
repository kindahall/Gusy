import { useEffect, useState } from 'react';
import { LaunchChecklist } from './launch-checklist';
import { PageNameEditor } from './page-name-editor';
import type { GusyAudit, GusyRevision, GusySavedPage, LeftTab } from './types';

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

export function Sidebar(props: {
  active: LeftTab;
  currentTitle: string;
  currentSlug: string;
  currentStatus: string;
  postId: number | null;
  pages: GusySavedPage[];
  revisions: GusyRevision[];
  audit: GusyAudit;
  busy: boolean;
  onChange: (tab: LeftTab) => void;
  onOpenAgent: () => void;
  onRunAudit: () => void;
  onPublish: () => void;
  onSaveSnapshot: () => void;
  onLoadPage: (id: number) => void;
  onNewPage: () => void;
  onPageNameDraftChange: (title: string, slug?: string) => void;
  onRenamePage: (title: string, slug?: string) => void;
  onRestoreRevision: (revision: GusyRevision) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const primaryItems: Array<{ id: LeftTab; label: string; icon: string }> = [
    { id: 'pages', label: 'Start', icon: 'S' },
    { id: 'themes', label: 'Themes', icon: 'T' },
    { id: 'layers', label: 'Edit', icon: 'E' },
    { id: 'blocks', label: 'Add blocks', icon: '+' },
    { id: 'audit', label: 'Publish', icon: 'P' }
  ];
  const advancedItems: Array<{ id: LeftTab; label: string; icon: string }> = [
    { id: 'brand', label: 'Design', icon: 'D' },
    { id: 'migrate', label: 'Import', icon: 'I' },
    { id: 'export', label: 'Backup', icon: 'B' }
  ];
  const advancedActive = advancedItems.some((item) => item.id === props.active);

  useEffect(() => {
    if (advancedActive) setAdvancedOpen(true);
  }, [advancedActive]);

  return (
    <aside className="gusy-sidebar">
      <LaunchChecklist
        hasSections={props.audit.sectionCount > 0}
        isSaved={Boolean(props.postId)}
        isPublished={props.currentStatus === 'publish'}
        audit={props.audit}
        busy={props.busy}
        onThemes={() => props.onChange('themes')}
        onEdit={() => props.onChange('layers')}
        onAudit={props.onRunAudit}
        onPublish={props.onPublish}
      />

      <nav className="gusy-nav" aria-label="Gusy navigation">
        {primaryItems.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={props.active === item.id}
            onClick={() => props.onChange(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
            {item.id === 'audit' && <b>{props.audit.score}</b>}
          </button>
        ))}
        <button
          type="button"
          className="gusy-advanced-toggle"
          aria-expanded={advancedOpen || advancedActive}
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          <span>...</span>
          Advanced
        </button>
        {(advancedOpen || advancedActive) && advancedItems.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={props.active === item.id}
            onClick={() => props.onChange(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button type="button" className="gusy-agent-nav-button" onClick={props.onOpenAgent}>
          <span>G</span>
          Assistant
          <b>AI</b>
        </button>
      </nav>

      <section className="gusy-side-section">
        <header>
          <span>Saved pages</span>
          <button type="button" onClick={props.onNewPage}>+</button>
        </header>
        <PageNameEditor
          title={props.currentTitle}
          slug={props.currentSlug}
          busy={props.busy}
          isSaved={Boolean(props.postId)}
          onDraftChange={props.onPageNameDraftChange}
          onSave={props.onRenamePage}
        />
        <div className="gusy-side-list">
          {props.pages.length === 0 && <p className="gusy-empty-row">No pages yet.</p>}
          {props.pages.slice(0, 5).map((page) => (
            <button key={page.id} type="button" onClick={() => props.onLoadPage(page.id)}>
              <span>{page.title || `Page ${page.id}`}</span>
              <small>{page.status}</small>
              <i />
            </button>
          ))}
        </div>
      </section>

      <section className="gusy-side-section is-revisions">
        <header>
          <span>Revisions</span>
          <button type="button" onClick={props.onSaveSnapshot} disabled={props.busy}>Save</button>
        </header>
        <div className="gusy-revisions">
          {props.revisions.length === 0 && (
            <button type="button" className="gusy-revision-empty-action" onClick={props.onSaveSnapshot} disabled={props.busy}>
              <span>Create snapshot</span>
              <b>0</b>
            </button>
          )}
          {props.revisions.slice(0, 4).map((revision, index) => (
            <button key={revision.id} type="button" onClick={() => props.onRestoreRevision(revision)}>
              <span>{formatDate(revision.createdAt)}</span>
              <small>{revision.sectionCount} sections</small>
              {index === 0 && <b>Latest</b>}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
