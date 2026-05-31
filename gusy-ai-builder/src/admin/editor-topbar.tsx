import { DeviceSwitch } from './components';
import { shortText } from './schema';
import type { UiLanguage } from './i18n';
import type { Device } from './types';

export function Topbar(props: {
  title: string;
  status: string;
  busy: boolean;
  device: Device;
  canPublish: boolean;
  canUndo: boolean;
  canRedo: boolean;
  annotationMode: boolean;
  annotationCount: number;
  uiLanguage: UiLanguage;
  setUiLanguage: (language: UiLanguage) => void;
  setDevice: (device: Device) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPages: () => void;
  onOpenPageSettings: () => void;
  onOpenPalette: () => void;
  onOpenAgent: () => void;
  onToggleAnnotations: () => void;
  onSave: () => void;
  saveLabel: string;
  onPublish: () => void;
  publishLabel: string;
  showPublish: boolean;
  onPreview: () => void;
  planLabel: string;
}) {
  return (
    <header className="gusy-topbar">
      <div className="gusy-top-left">
        <span className="gusy-logo-mark">G</span>
        <span className="gusy-plan-pill">{props.planLabel}</span>
        <button type="button" className="gusy-page-select" onClick={props.onOpenPages} title="Open pages">
          <strong>{shortText(props.title, 24)}</strong>
          <span>Pages</span>
        </button>
        <button type="button" className="gusy-top-icon is-settings" onClick={props.onOpenPageSettings}>
          Settings
        </button>
      </div>

      <div className="gusy-history-actions">
        <button type="button" onClick={props.onUndo} disabled={!props.canUndo}>Undo</button>
        <button type="button" onClick={props.onRedo} disabled={!props.canRedo}>Redo</button>
      </div>

      <DeviceSwitch device={props.device} setDevice={props.setDevice} />

      <div className="gusy-top-actions">
        <div className="gusy-language-switch" aria-label="Interface language">
          {(['en', 'fr'] as UiLanguage[]).map((language) => (
            <button
              key={language}
              type="button"
              aria-pressed={props.uiLanguage === language}
              onClick={() => props.setUiLanguage(language)}
            >
              {language.toUpperCase()}
            </button>
          ))}
        </div>
        <button type="button" className="gusy-top-icon" onClick={props.onPreview} disabled={props.busy}>View</button>
        <span className="gusy-status" data-busy={props.busy ? 'true' : 'false'}>{props.busy ? 'Working' : props.status}</span>
        <button
          type="button"
          className="gusy-annotation-top-button"
          aria-pressed={props.annotationMode}
          onClick={props.onToggleAnnotations}
        >
          Annotate{props.annotationCount ? ` ${props.annotationCount}` : ''}
        </button>
        <button type="button" className="gusy-draft-button" onClick={props.onSave} disabled={props.busy}>{props.saveLabel}</button>
        <button type="button" className="gusy-agent-top-button" onClick={props.onOpenAgent}>Assistant</button>
        {props.showPublish && (
          <button type="button" className="gusy-publish-button" onClick={props.onPublish} disabled={props.busy || !props.canPublish}>
            {props.publishLabel}
          </button>
        )}
        <button type="button" className="gusy-top-icon" onClick={props.onOpenPalette} title="Commands">Cmd</button>
      </div>
    </header>
  );
}
