import {
  BRAND_COLOR_KEYS,
  BRAND_PRESETS,
  BRAND_RADIUS_OPTIONS,
  BRAND_SPACING_OPTIONS,
  BRAND_TYPE_OPTIONS,
  isActivePreset,
  isActiveRadius,
  isActiveType,
  type BrandPresetKey
} from './brand';
import { PanelSection, TemplateThumb } from './components';
import { getColors, getDesignSystem, type GusyDesignSystem } from './schema';
import type {
  GusyAudit,
  GusyBlueprint,
  GusyElementorPage,
  GusyTemplate,
  MigrationPreview
} from './types';

export function BlockInspector(props: { template: GusyTemplate; onInsert: (template: GusyTemplate) => void }) {
  return (
    <div className="gusy-panel-stack">
      <PanelSection title="Section">
        <div className="gusy-block-detail">
          <TemplateThumb type={props.template.section.type} />
          <strong>{props.template.title}</strong>
          <span>{props.template.section.type}</span>
        </div>
        <button type="button" className="gusy-primary-wide" onClick={() => props.onInsert(props.template)}>Add section</button>
      </PanelSection>
      <PanelSection title="Details">
        <div className="gusy-tag-row">
          {[props.template.section.type, props.template.variant, props.template.category].map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </PanelSection>
    </div>
  );
}

export function BrandInspector(props: {
  blueprint: GusyBlueprint;
  updateColor: (key: string, value: string) => void;
  onTokenPatch: (patch: GusyDesignSystem, message?: string) => void;
  onPreset: (key: BrandPresetKey) => void;
  onApplyTheme: () => void;
  onGenerateKit: () => void;
  onBuildPage: () => void;
  onSave: () => void;
  onOpenCanvas: () => void;
}) {
  const design = getDesignSystem(props.blueprint);
  const colors = getColors(props.blueprint);

  return (
    <div className="gusy-panel-stack">
      <PanelSection title="Style actions">
        <div className="gusy-panel-actions">
          <button type="button" className="gusy-primary-wide" onClick={props.onApplyTheme}>Use theme style</button>
          <button type="button" onClick={props.onGenerateKit}>AI style</button>
        </div>
        <button type="button" onClick={props.onBuildPage}>Create page</button>
        <button type="button" onClick={props.onOpenCanvas}>Edit page</button>
        <button type="button" onClick={props.onSave}>Save style</button>
      </PanelSection>
      <PanelSection title="Presets">
        <div className="gusy-brand-inspector-presets">
          {(Object.keys(BRAND_PRESETS) as BrandPresetKey[]).map((key) => (
            <button key={key} type="button" aria-pressed={isActivePreset(design, key)} onClick={() => props.onPreset(key)}>
              {BRAND_PRESETS[key].label}
            </button>
          ))}
        </div>
      </PanelSection>
      <PanelSection title="Palette">
        {BRAND_COLOR_KEYS.map((key) => (
          <label key={key} className="gusy-token-input">
            <span>{key}</span>
            <input type="color" value={colors[key] ?? '#111827'} onChange={(event) => props.updateColor(key, event.target.value)} />
            <input value={colors[key] ?? '#111827'} onChange={(event) => props.updateColor(key, event.target.value)} />
          </label>
        ))}
      </PanelSection>
      <PanelSection title="Type">
        <div className="gusy-brand-token-row">
          {BRAND_TYPE_OPTIONS.map((option) => (
            <button key={option.key} type="button" aria-pressed={isActiveType(design, option)} onClick={() => props.onTokenPatch(option.patch, `${option.label} type`)}>
              {option.label}
            </button>
          ))}
        </div>
      </PanelSection>
      <PanelSection title="Shape">
        <div className="gusy-brand-token-row">
          {BRAND_RADIUS_OPTIONS.map((option) => (
            <button key={option.key} type="button" aria-pressed={isActiveRadius(design, option)} onClick={() => props.onTokenPatch(option.patch, `${option.label} radius`)}>
              {option.label}
            </button>
          ))}
        </div>
        <div className="gusy-brand-current-token">{design.radius?.lg ?? '22px'}</div>
      </PanelSection>
      <PanelSection title="Spacing">
        <div className="gusy-brand-token-row">
          {BRAND_SPACING_OPTIONS.map((option) => (
            <button key={option.key} type="button" aria-pressed={design.spacing === option.key} onClick={() => props.onTokenPatch({ spacing: option.key }, `${option.key} spacing`)}>
              {option.label}
            </button>
          ))}
        </div>
      </PanelSection>
    </div>
  );
}

export function AuditInspector(props: { audit: GusyAudit; onRun: () => void; onFix: () => void }) {
  const hasIssues = props.audit.issues.length > 0;

  return (
    <div className="gusy-panel-stack">
      <PanelSection title="Audit Actions">
        <div className="gusy-audit-inspector-score">
          <strong>{props.audit.score}</strong>
          <span>{hasIssues ? `${props.audit.issues.length} issues` : 'Clean'}</span>
        </div>
        <button type="button" className="gusy-primary-wide" onClick={props.onRun}>Run Audit</button>
        <button type="button" onClick={props.onFix} disabled={!hasIssues}>Fix Issues</button>
      </PanelSection>
      <PanelSection title="Issues">
        <div className="gusy-audit-inspector-list">
          {hasIssues ? props.audit.issues.slice(0, 5).map((issue) => (
            <button key={issue} type="button" onClick={props.onFix}>
              <span>{issue}</span>
              <b>Fix</b>
            </button>
          )) : <p>No issues found.</p>}
        </div>
      </PanelSection>
    </div>
  );
}

export function ExportInspector(props: {
  blueprint: GusyBlueprint;
  exportText: string;
  importText: string;
  setImportText: (text: string) => void;
  onExport: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onSaveDraft: () => void;
  onSync: () => void;
  onPreview: () => void;
  onImport: () => void;
  busy: boolean;
}) {
  return (
    <div className="gusy-panel-stack">
      <PanelSection title="Export Actions">
        <div className="gusy-export-inspector-actions">
          <button type="button" className="gusy-primary-wide" onClick={props.onSaveDraft} disabled={props.busy}>Save Draft</button>
          <button type="button" onClick={props.onSync} disabled={props.busy || props.blueprint.page.sections.length === 0}>Publish</button>
          <button type="button" onClick={props.onPreview} disabled={props.busy}>Preview</button>
          <button type="button" onClick={props.onExport} disabled={props.busy}>Export JSON</button>
          <button type="button" onClick={props.onCopy} disabled={props.busy}>Copy JSON</button>
          <button type="button" onClick={props.onDownload} disabled={props.busy}>Download</button>
        </div>
      </PanelSection>
      <PanelSection title="Import JSON">
        <textarea value={props.importText} onChange={(event) => props.setImportText(event.target.value)} />
        <button type="button" onClick={props.onImport} disabled={props.busy || !props.importText.trim()}>Import JSON</button>
      </PanelSection>
      {props.exportText && <textarea className="gusy-export-mini" readOnly value={props.exportText} />}
    </div>
  );
}

export function MigrationInspector(props: {
  pages: GusyElementorPage[];
  preview: MigrationPreview | null;
  busy: boolean;
  hasCanvas: boolean;
  onScan: () => void;
  onPreview: (id: number) => void;
  onPreviewFirst: () => void;
  onOpenCanvas: () => void;
}) {
  const elementorCount = props.pages.filter((page) => page.hasElementorData).length;
  const wordpressCount = Math.max(0, props.pages.length - elementorCount);
  const recentPages = props.pages.slice(0, 6);
  const firstPage = props.pages[0];

  return (
    <div className="gusy-panel-stack">
      <PanelSection title="Migration Actions">
        <div className="gusy-migrate-inspector-meter">
          <article>
            <strong>{props.pages.length}</strong>
            <span>Pages</span>
          </article>
          <article>
            <strong>{elementorCount}</strong>
            <span>Elementor</span>
          </article>
          <article>
            <strong>{props.preview?.audit.score ?? 0}</strong>
            <span>Score</span>
          </article>
        </div>
        <div className="gusy-panel-actions gusy-migrate-actions">
          <button type="button" className="gusy-primary-wide" onClick={props.onScan} disabled={props.busy}>
            Scan
          </button>
          <button type="button" onClick={() => firstPage ? props.onPreview(firstPage.id) : props.onScan()} disabled={props.busy}>
            Convert First
          </button>
          <button type="button" onClick={props.onOpenCanvas} disabled={!props.hasCanvas}>
            Edit page
          </button>
        </div>
      </PanelSection>
      {props.preview && (
        <PanelSection title="Converted">
          <div className="gusy-migrate-converted-card">
            <strong>{props.preview.title}</strong>
            <span>{props.preview.source} · {props.preview.blueprint.page.sections.length} sections</span>
            <b>{props.preview.compatibility}% fit</b>
          </div>
        </PanelSection>
      )}
      {recentPages.length > 0 && (
        <PanelSection title="Pages">
          <div className="gusy-migrate-mini-list">
            {recentPages.map((page) => (
              <button key={page.id} type="button" onClick={() => props.onPreview(page.id)} disabled={props.busy}>
                <strong>{page.title}</strong>
                <span>{page.hasElementorData ? 'Elementor' : `${wordpressCount ? 'WP' : page.type}`} · {page.compatibility ?? 0}%</span>
              </button>
            ))}
          </div>
        </PanelSection>
      )}
    </div>
  );
}
