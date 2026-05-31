import type { CSSProperties } from 'react';
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
import { ControlGroup, DeviceSwitch, GusySymbol } from './components';
import { RenderSection } from './section-renderer';
import { getColors, getDesignSystem, type GusyDesignSystem } from './schema';
import type { Device, GusyBlueprint } from './types';

export function BrandWorkspace(props: {
  blueprint: GusyBlueprint;
  device: Device;
  setDevice: (device: Device) => void;
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
  const typography = design.typography ?? {};
  const radius = design.radius ?? {};
  const hasSections = props.blueprint.page.sections.length > 0;
  const fontName = (typography.fontFamily ?? 'Inter').split(',')[0].replace(/"/g, '');
  const spacingOption = BRAND_SPACING_OPTIONS.find((option) => option.key === design.spacing) ?? BRAND_SPACING_OPTIONS[1];
  const headingSize = typography.scale === 'editorial' ? '38px' : typography.scale === 'compact' ? '30px' : '34px';
  const displaySize = typography.scale === 'editorial' ? '54px' : typography.scale === 'compact' ? '42px' : '48px';
  const brandStyle = {
    '--brand-primary': colors.primary ?? '#172033',
    '--brand-secondary': colors.secondary ?? '#F4F7FB',
    '--brand-accent': colors.accent ?? '#2F7CFF',
    '--brand-support': colors.support ?? '#18A86B',
    '--brand-surface': colors.surface ?? '#FFFFFF',
    '--brand-ink': colors.ink ?? '#111827',
    '--brand-muted': colors.muted ?? '#64748B',
    '--brand-line': colors.line ?? '#D9E3EF',
    '--brand-radius': radius.lg ?? '22px',
    '--brand-section-padding': spacingOption.section,
    '--brand-card-padding': spacingOption.card,
    '--brand-gap': spacingOption.gap,
    '--brand-h1': displaySize,
    '--brand-h2': headingSize,
    '--brand-body': typography.scale === 'compact' ? '14px' : '15px',
    '--brand-weight': typography.weight ?? '750',
    fontFamily: typography.fontFamily ?? 'Inter, ui-sans-serif, system-ui, sans-serif'
  } as CSSProperties;

  return (
    <section className="gusy-brand-workspace">
      <header className="gusy-workspace-title gusy-brand-title">
        <h1>Site style</h1>
        <div className="gusy-workspace-actions">
          <button type="button" onClick={props.onSave}>Save style</button>
        </div>
      </header>
      <div className="gusy-brand-grid">
        <aside className="gusy-brand-controls">
          <div className="gusy-brand-actions">
            <button type="button" onClick={props.onApplyTheme}>Use theme style</button>
            <button type="button" onClick={props.onGenerateKit}>AI style</button>
            <button type="button" onClick={props.onBuildPage}>Create page</button>
            <button type="button" onClick={props.onOpenCanvas}>Edit page</button>
          </div>
          <ControlGroup title="Presets">
            <div className="gusy-brand-presets">
              {(Object.keys(BRAND_PRESETS) as BrandPresetKey[]).map((key) => {
                const preset = BRAND_PRESETS[key];
                const presetColors = preset.tokens.colors ?? {};
                return (
                  <button key={key} type="button" aria-pressed={isActivePreset(design, key)} onClick={() => props.onPreset(key)}>
                    <span
                      className="gusy-brand-preset-strip"
                      style={{
                        background: `linear-gradient(90deg, ${presetColors.primary}, ${presetColors.accent}, ${presetColors.support})`
                      }}
                    />
                    <strong>{preset.label}</strong>
                  </button>
                );
              })}
            </div>
          </ControlGroup>
          <ControlGroup title="Colors">
            <div className="gusy-brand-color-grid">
              {BRAND_COLOR_KEYS.map((key) => (
                <label key={key}>
                  <span>{key}</span>
                  <input
                    type="color"
                    value={colors[key] ?? (key === 'primary' ? '#2563eb' : '#111827')}
                    onChange={(event) => props.updateColor(key, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </ControlGroup>
          <ControlGroup title="Type">
            <div className="gusy-brand-token-row">
              {BRAND_TYPE_OPTIONS.map((option) => (
                <button key={option.key} type="button" aria-pressed={isActiveType(design, option)} onClick={() => props.onTokenPatch(option.patch, `${option.label} type`)}>
                  {option.label}
                </button>
              ))}
            </div>
            <div className="gusy-brand-current-token">{fontName}</div>
          </ControlGroup>
          <ControlGroup title="Shape">
            <div className="gusy-brand-token-row">
              {BRAND_RADIUS_OPTIONS.map((option) => (
                <button key={option.key} type="button" aria-pressed={isActiveRadius(design, option)} onClick={() => props.onTokenPatch(option.patch, `${option.label} radius`)}>
                  {option.label}
                </button>
              ))}
            </div>
          </ControlGroup>
          <ControlGroup title="Spacing">
            <div className="gusy-brand-token-row">
              {BRAND_SPACING_OPTIONS.map((option) => (
                <button key={option.key} type="button" aria-pressed={design.spacing === option.key} onClick={() => props.onTokenPatch({ spacing: option.key }, `${option.key} spacing`)}>
                  {option.label}
                </button>
              ))}
            </div>
          </ControlGroup>
        </aside>
        <div className="gusy-brand-preview" data-device={props.device}>
          <header>
            <strong>Preview</strong>
            <DeviceSwitch device={props.device} setDevice={props.setDevice} />
          </header>
          <div className="gusy-brand-page" style={brandStyle}>
            {hasSections ? (
              <>
                <div className="gusy-brand-preview-head">
                  <GusySymbol />
                  <strong>{props.blueprint.page.title}</strong>
                  <span>{props.blueprint.page.sections.length} sections</span>
                </div>
                <div className="gusy-brand-sections">
                  {props.blueprint.page.sections.map((section, index) => (
                    <div key={section.id} className="gusy-brand-section">
                      <RenderSection section={section} index={index} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="gusy-brand-sample">
                <nav>
                  <GusySymbol />
                  <div>
                    <a>Home</a>
                    <a>Services</a>
                    <a>Proof</a>
                    <a>Contact</a>
                  </div>
                  <button type="button" onClick={props.onBuildPage}>Start</button>
                </nav>
                <section>
                  <div>
                    <span>Site style</span>
                    <h2>Launch a page that feels native to this site.</h2>
                    <p>Colors, type, radius and spacing are ready before the first section is added.</p>
                    <div>
                      <button type="button" onClick={props.onBuildPage}>Create page</button>
                      <button type="button" className="is-secondary" onClick={props.onGenerateKit}>AI style</button>
                    </div>
                  </div>
                  <i aria-hidden="true">
                    <b />
                    <b />
                    <b />
                  </i>
                </section>
                <div className="gusy-brand-cards">
                  <article><strong>Palette</strong><span>{BRAND_COLOR_KEYS.length} colors</span></article>
                  <article><strong>Type</strong><span>{fontName}</span></article>
                  <article><strong>Shape</strong><span>{radius.lg ?? '22px'}</span></article>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
