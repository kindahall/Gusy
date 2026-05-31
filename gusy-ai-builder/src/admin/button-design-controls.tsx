import { Segmented } from './components';
import type { GusySection } from './types';

type SectionSettingValue = GusySection['settings'][keyof GusySection['settings']];

export function ButtonDesignControls(props: {
  section: GusySection;
  updateSelectedSettings: (key: keyof GusySection['settings'], value: SectionSettingValue) => void;
}) {
  return (
    <div className="gusy-button-design-controls">
      <strong>Design</strong>
      <Segmented value={props.section.settings.buttonStyle || 'solid'} options={['solid', 'soft', 'outline']} onChange={(value) => props.updateSelectedSettings('buttonStyle', value as GusySection['settings']['buttonStyle'])} />
      <Segmented value={props.section.settings.buttonSize || 'md'} options={['sm', 'md', 'lg']} onChange={(value) => props.updateSelectedSettings('buttonSize', value as GusySection['settings']['buttonSize'])} />
      <Segmented value={props.section.settings.buttonShape || 'pill'} options={['pill', 'rounded', 'square']} onChange={(value) => props.updateSelectedSettings('buttonShape', value as GusySection['settings']['buttonShape'])} />
    </div>
  );
}
