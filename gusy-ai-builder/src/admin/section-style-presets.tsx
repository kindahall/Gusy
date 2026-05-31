import { useState } from 'react';
import { PanelSection } from './components';
import type { GusySection } from './types';

type SectionStylePreset = {
  key: string;
  label: string;
  note: string;
  settings: Partial<GusySection['settings']>;
};

export const SECTION_STYLE_PRESETS: SectionStylePreset[] = [
  {
    key: 'editorial',
    label: 'Editorial',
    note: 'Large, image-led and premium.',
    settings: { background: 'hero', spacing: 'xl', width: 'wide', columns: 2, tabletColumns: 2, mobileColumns: 1, mobileStack: true, textAlign: 'left', headingScale: 'display', textWidth: 'wide', bodyScale: 'large', buttonStyle: 'solid', buttonSize: 'lg', buttonShape: 'pill', imageAspect: 'landscape', imagePosition: 'center', imageShape: 'soft' }
  },
  {
    key: 'conversion',
    label: 'Conversion',
    note: 'Clear cards and direct action.',
    settings: { background: 'elevated', spacing: 'lg', width: 'wide', columns: 3, tabletColumns: 2, mobileColumns: 1, mobileStack: true, textAlign: 'left', headingScale: 'standard', textWidth: 'standard', bodyScale: 'standard', buttonStyle: 'solid', buttonSize: 'md', buttonShape: 'pill', imageAspect: 'landscape', imagePosition: 'center', imageShape: 'rounded' }
  },
  {
    key: 'compact',
    label: 'Compact',
    note: 'Dense section for scanning.',
    settings: { background: 'plain', spacing: 'compact', width: 'boxed', columns: 2, tabletColumns: 2, mobileColumns: 1, mobileStack: true, textAlign: 'left', headingScale: 'compact', textWidth: 'narrow', bodyScale: 'compact', buttonStyle: 'soft', buttonSize: 'sm', buttonShape: 'rounded', imageAspect: 'square', imagePosition: 'center', imageShape: 'rounded' }
  }
];

export const SECTION_STYLE_RESET: Partial<GusySection['settings']> = {
  background: 'plain',
  spacing: 'lg',
  columns: 2,
  tabletColumns: 2,
  mobileColumns: 1,
  accent: 'accent',
  width: 'wide',
  textAlign: 'left',
  headingScale: 'standard',
  textWidth: 'standard',
  bodyScale: 'standard',
  buttonStyle: 'solid',
  buttonSize: 'md',
  buttonShape: 'pill',
  imageAspect: 'landscape',
  imagePosition: 'center',
  imageShape: 'rounded',
  mobileStack: true,
  backgroundImage: undefined,
  backgroundVideo: undefined,
  videoMode: 'inline',
  motionEnabled: false,
  motionEntrance: 'fade-up',
  motionDuration: 600
};

export function copySectionStyle(settings: GusySection['settings']): Partial<GusySection['settings']> {
  return {
    background: settings.background,
    spacing: settings.spacing,
    columns: settings.columns,
    tabletColumns: settings.tabletColumns,
    mobileColumns: settings.mobileColumns,
    accent: settings.accent,
    width: settings.width,
    textAlign: settings.textAlign,
    headingScale: settings.headingScale,
    textWidth: settings.textWidth,
    bodyScale: settings.bodyScale,
    buttonStyle: settings.buttonStyle,
    buttonSize: settings.buttonSize,
    buttonShape: settings.buttonShape,
    imageAspect: settings.imageAspect,
    imagePosition: settings.imagePosition,
    imageShape: settings.imageShape,
    mobileStack: settings.mobileStack,
    backgroundImage: settings.backgroundImage ? { ...settings.backgroundImage } : undefined,
    backgroundVideo: settings.backgroundVideo ? { ...settings.backgroundVideo } : undefined,
    videoMode: settings.videoMode,
    motionEnabled: settings.motionEnabled,
    motionEntrance: settings.motionEntrance,
    motionDuration: settings.motionDuration
  };
}

export function SectionStylePanel(props: {
  settings: GusySection['settings'];
  onApply: (settings: Partial<GusySection['settings']>) => void;
}) {
  const [copiedStyle, setCopiedStyle] = useState<Partial<GusySection['settings']> | null>(null);

  return (
    <>
      <PanelSection title="Style actions">
        <div className="gusy-style-action-grid">
          <button type="button" onClick={() => setCopiedStyle(copySectionStyle(props.settings))}>Copy style</button>
          <button type="button" onClick={() => copiedStyle && props.onApply(copiedStyle)} disabled={!copiedStyle}>Paste style</button>
          <button type="button" onClick={() => props.onApply(SECTION_STYLE_RESET)}>Reset style</button>
        </div>
      </PanelSection>
      <PanelSection title="Style presets">
        <div className="gusy-style-preset-grid">
          {SECTION_STYLE_PRESETS.map((preset) => (
            <button key={preset.key} type="button" className="gusy-style-preset-card" onClick={() => props.onApply(preset.settings)}>
              <strong>{preset.label}</strong>
              <span>{preset.note}</span>
            </button>
          ))}
        </div>
      </PanelSection>
    </>
  );
}
