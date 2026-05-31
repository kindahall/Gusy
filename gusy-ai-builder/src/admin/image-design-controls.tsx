import type { CSSProperties } from 'react';
import { PanelSection, Segmented } from './components';
import { cssUrl } from './schema';
import type { GusyBackgroundImage, GusyBackgroundVideo, GusySection } from './types';

type SectionSettingValue = GusySection['settings'][keyof GusySection['settings']];

export function SectionImageControls(props: {
  section: GusySection;
  sectionImage?: GusyBackgroundImage;
  sectionVideo?: GusyBackgroundVideo;
  updateSelectedSettings: (key: keyof GusySection['settings'], value: SectionSettingValue) => void;
  onChooseBackgroundImage?: () => void;
  onRemoveBackgroundImage?: () => void;
  onChooseBackgroundVideo?: () => void;
  onRemoveBackgroundVideo?: () => void;
}) {
  const image = props.sectionImage;
  const video = props.sectionVideo;

  return (
    <PanelSection title="Section image">
      <div className="gusy-background-media-control">
        {image?.url && (
          <div className="gusy-background-media-preview" style={{ backgroundImage: cssUrl(image.url) } as CSSProperties}>
            <span>{image.title || image.alt || props.section.title}</span>
          </div>
        )}
        <label>
          <span>Image URL</span>
          <input
            value={image?.url ?? ''}
            onChange={(event) => props.updateSelectedSettings('backgroundImage', {
              id: image?.id ?? 0,
              url: event.target.value,
              alt: image?.alt || props.section.title || '',
              title: image?.title || props.section.title || ''
            })}
          />
        </label>
        <div className="gusy-image-design-controls">
          <strong>Frame</strong>
          <Segmented value={props.section.settings.imageAspect || 'landscape'} options={['landscape', 'portrait', 'square']} onChange={(value) => props.updateSelectedSettings('imageAspect', value as GusySection['settings']['imageAspect'])} />
          <Segmented value={props.section.settings.imagePosition || 'center'} options={['center', 'top', 'bottom']} onChange={(value) => props.updateSelectedSettings('imagePosition', value as GusySection['settings']['imagePosition'])} />
          <Segmented value={props.section.settings.imageShape || 'rounded'} options={['rounded', 'square', 'soft']} onChange={(value) => props.updateSelectedSettings('imageShape', value as GusySection['settings']['imageShape'])} />
        </div>
        <div className="gusy-image-design-controls">
          <strong>Video</strong>
          <label>
            <span>Video URL</span>
            <input
              value={video?.url ?? ''}
              onChange={(event) => props.updateSelectedSettings('backgroundVideo', {
                id: video?.id ?? 0,
                url: event.target.value,
                title: video?.title || props.section.title || '',
                poster: video?.poster || image?.url || ''
              })}
            />
          </label>
          <Segmented value={props.section.settings.videoMode || 'inline'} options={['inline', 'background']} onChange={(value) => props.updateSelectedSettings('videoMode', value as GusySection['settings']['videoMode'])} />
          <div className="gusy-item-media-actions">
            <button type="button" className="gusy-media-primary-button" onClick={props.onChooseBackgroundVideo}>
              {video?.url ? 'Change video' : 'Add video'}
            </button>
            <button type="button" onClick={props.onRemoveBackgroundVideo} disabled={!video?.url}>Remove video</button>
          </div>
        </div>
        <div className="gusy-item-media-actions">
          <button type="button" className="gusy-media-primary-button" onClick={props.onChooseBackgroundImage}>
            {image?.url ? 'Change image' : 'Add image'}
          </button>
          <button type="button" onClick={props.onRemoveBackgroundImage} disabled={!image?.url}>Remove image</button>
        </div>
      </div>
    </PanelSection>
  );
}
