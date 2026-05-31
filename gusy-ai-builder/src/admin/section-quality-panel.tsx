import { PanelSection } from './components';
import {
  defaultSectionCta,
  sectionQualityIssues,
  sectionQualityScore,
  shortenSectionCopy
} from './section-quality';
import type { GusySection } from './types';

export function SectionQualityPanel(props: {
  section: GusySection;
  updateSelected: (patch: Partial<GusySection>) => void;
  addSelectedItem: () => void;
  onChooseBackgroundImage?: () => void;
  onChooseItemImage?: (index: number) => void;
}) {
  const issues = sectionQualityIssues(props.section);
  const score = sectionQualityScore(props.section);
  const hasCopyIssue = issues.some((issue) => issue.action === 'shorten-copy');
  const hasCtaIssue = issues.some((issue) => issue.action === 'add-cta');
  const hasImageIssue = issues.some((issue) => issue.action === 'add-image');
  const itemIssue = issues.find((issue) => issue.action === 'add-item');
  const itemImageIssue = issues.find((issue) => issue.action === 'add-item-image');
  const missingItems = itemIssue?.missing ?? 1;
  const hasItemIssue = Boolean(itemIssue);
  const hasItemImageIssue = Boolean(itemImageIssue);
  const itemImageLabel = props.section.type === 'testimonials' ? 'Add customer photo' : 'Add card image';

  function addDefaultCta() {
    const fallback = defaultSectionCta(props.section);
    props.updateSelected({
      cta: {
        ...props.section.cta,
        label: props.section.cta?.label || fallback.label,
        url: props.section.cta?.url || fallback.url
      }
    });
  }

  function addMissingItems() {
    for (let index = 0; index < missingItems; index += 1) {
      props.addSelectedItem();
    }
  }

  return (
    <PanelSection title="Section quality">
      <div className="gusy-section-quality" data-ready={issues.length === 0}>
        <div className="gusy-section-quality-head">
          <strong>{issues.length === 0 ? 'Ready to publish' : `${score}% ready`}</strong>
          <span>{issues.length === 0 ? 'Core content, images and actions are in place.' : 'Fix the visible gaps before this section goes live.'}</span>
        </div>
        {issues.length > 0 && (
          <ul>
            {issues.slice(0, 5).map((issue) => (
              <li key={issue.key} data-severity={issue.severity}>{issue.label}</li>
            ))}
          </ul>
        )}
        {(hasCopyIssue || hasCtaIssue || hasImageIssue || hasItemIssue || hasItemImageIssue) && (
          <div className="gusy-section-quality-actions">
            {hasCopyIssue && <button type="button" onClick={() => props.updateSelected(shortenSectionCopy(props.section))}>Shorten copy</button>}
            {hasCtaIssue && <button type="button" onClick={addDefaultCta}>Add CTA</button>}
            {hasImageIssue && <button type="button" onClick={props.onChooseBackgroundImage} disabled={!props.onChooseBackgroundImage}>Add image</button>}
            {hasItemImageIssue && <button type="button" onClick={() => props.onChooseItemImage?.(itemImageIssue?.itemIndex ?? 0)} disabled={!props.onChooseItemImage}>{itemImageLabel}</button>}
            {hasItemIssue && <button type="button" onClick={addMissingItems}>Add {missingItems} item{missingItems > 1 ? 's' : ''}</button>}
          </div>
        )}
      </div>
    </PanelSection>
  );
}
