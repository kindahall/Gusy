import { QUICK_BLOCKS } from './builder-options';
import type { DropPlacement, GusySection } from './types';

const QUICK_INSERTS = QUICK_BLOCKS.filter((block) => ['features', 'testimonials', 'pricing', 'faq', 'form'].includes(block.type));

const STYLE_GROUPS: Array<{
  label: string;
  key: keyof Pick<GusySection['settings'], 'background' | 'width' | 'spacing'>;
  options: Array<{ label: string; value: string }>;
}> = [
  {
    label: 'Background',
    key: 'background',
    options: [
      { label: 'Plain', value: 'plain' },
      { label: 'Soft', value: 'soft' },
      { label: 'Raised', value: 'elevated' },
      { label: 'Hero', value: 'hero' }
    ]
  },
  {
    label: 'Width',
    key: 'width',
    options: [
      { label: 'Boxed', value: 'boxed' },
      { label: 'Wide', value: 'wide' },
      { label: 'Full', value: 'full' }
    ]
  },
  {
    label: 'Spacing',
    key: 'spacing',
    options: [
      { label: 'Tight', value: 'compact' },
      { label: 'Normal', value: 'lg' },
      { label: 'Roomy', value: 'xl' }
    ]
  }
];

export function CanvasSectionControls(props: {
  section: GusySection;
  index: number;
  sectionCount: number;
  onOpenBlocks: () => void;
  onQuickAdd: (type: string, targetId?: string, placement?: DropPlacement) => void;
  onAnnotate: (sectionId: string) => void;
  onUpdateSectionSettings: (sectionId: string, patch: Partial<GusySection['settings']>, message?: string) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onTransform: (instruction: string) => void;
  onChooseBackgroundImage: (sectionId: string) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <>
      <div className="gusy-section-toolbar" onClick={(event) => event.stopPropagation()}>
        <span>{props.section.label}</span>
        <button type="button" onClick={() => props.onMoveSection(props.section.id, -1)} disabled={props.index === 0}>Up</button>
        <button type="button" onClick={() => props.onMoveSection(props.section.id, 1)} disabled={props.index === props.sectionCount - 1}>Down</button>
        <button type="button" onClick={() => props.onTransform('Improve this section for clarity, conversion and professional tone.')}>Improve</button>
        <button type="button" onClick={() => props.onTransform('Shorten this section while keeping the key business information.')}>Shorten</button>
        <button type="button" onClick={() => props.onChooseBackgroundImage(props.section.id)}>Media</button>
        <button type="button" onClick={props.onDuplicate}>Copy</button>
        <button type="button" onClick={props.onRemove}>Delete</button>
      </div>
      <div className="gusy-section-dock" onClick={(event) => event.stopPropagation()}>
        <header>
          <strong>Edit this section</strong>
          <span>Click text to edit. Use quick tools for structure, style and media.</span>
        </header>
        <div className="gusy-section-tool-row">
          <button type="button" onClick={() => props.onOpenBlocks()}>Open section library</button>
          {QUICK_INSERTS.map((block) => (
            <button key={block.type} type="button" onClick={() => props.onQuickAdd(block.type, props.section.id, 'after')}>
              Add {block.label}
            </button>
          ))}
          <button type="button" onClick={() => props.onAnnotate(props.section.id)}>Add note</button>
        </div>
        <div className="gusy-section-style-grid">
          {STYLE_GROUPS.map((group) => (
            <div key={group.key} className="gusy-section-style-group">
              <span>{group.label}</span>
              <div>
                {group.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={(props.section.settings[group.key] || '') === option.value}
                    onClick={() => props.onUpdateSectionSettings(props.section.id, { [group.key]: option.value }, `${group.label} updated`)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="gusy-section-style-group">
            <span>Columns</span>
            <div>
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  aria-pressed={(props.section.settings.columns || 1) === count}
                  onClick={() => props.onUpdateSectionSettings(props.section.id, { columns: count }, 'Columns updated')}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
