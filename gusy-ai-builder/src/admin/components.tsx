import type { CSSProperties, ReactNode } from 'react';
import type { Device } from './types';

export function ControlGroup(props: { title: string; children: ReactNode }) {
  return (
    <section className="gusy-control-group">
      <h3>{props.title}</h3>
      {props.children}
    </section>
  );
}

export function PanelSection(props: { title: string; children: ReactNode }) {
  return (
    <section className="gusy-panel-section">
      <h3>{props.title}</h3>
      {props.children}
    </section>
  );
}

export function UpgradeNotice(props: { title: string; body?: string; actionLabel?: string; onUpgrade: () => void }) {
  return (
    <section className="gusy-upgrade-notice">
      <strong>{props.title}</strong>
      {props.body && <p>{props.body}</p>}
      <button type="button" onClick={props.onUpgrade}>{props.actionLabel || 'Upgrade'}</button>
    </section>
  );
}

export function Segmented(props: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="gusy-segmented">
      {props.options.map((option) => (
        <button key={option} type="button" aria-pressed={props.value === option} onClick={() => props.onChange(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}

export function ScoreRing(props: { score: number }) {
  return (
    <div className="gusy-score-ring" style={{ '--score': `${props.score * 3.6}deg` } as CSSProperties}>
      <strong>{props.score}</strong>
      <span>/100</span>
    </div>
  );
}

export function GusySymbol() {
  return <span className="gusy-symbol">G</span>;
}

export function DeviceSwitch(props: { device: Device; setDevice: (device: Device) => void }) {
  return (
    <div className="gusy-device-switch" aria-label="Preview device">
      {(['desktop', 'tablet', 'mobile'] as Device[]).map((device) => (
        <button
          key={device}
          type="button"
          aria-pressed={props.device === device}
          onClick={() => props.setDevice(device)}
        >
          <span>{device === 'desktop' ? 'D' : device === 'tablet' ? 'T' : 'M'}</span>
          {device[0].toUpperCase() + device.slice(1)}
        </button>
      ))}
    </div>
  );
}

export function TemplateThumb({ type }: { type: string }) {
  return (
    <i className={`gusy-template-thumb is-${type}`} aria-hidden="true">
      <b />
      <b />
      <b />
      <b />
    </i>
  );
}
