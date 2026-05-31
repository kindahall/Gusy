import { openWordPressImagePicker, openWordPressVideoPicker } from './wordpress-media';
import type { GusySection } from './types';

type UseMediaWorkflowOptions = {
  setStatus: (status: string) => void;
  updateSectionSettingsById: (
    sectionId: string,
    patch: Partial<GusySection['settings']>,
    message?: string
  ) => void;
  updateSelectedItem: (index: number, patch: Partial<GusySection['items'][number]>) => void;
};

export function useMediaWorkflow({
  setStatus,
  updateSectionSettingsById,
  updateSelectedItem
}: UseMediaWorkflowOptions) {
  function chooseBackgroundImage(sectionId: string) {
    openWordPressImagePicker({
      title: 'Choose background image',
      buttonText: 'Use as background',
      onStatus: setStatus,
      onImage: (backgroundImage) => {
        updateSectionSettingsById(sectionId, { background: 'hero', backgroundImage }, 'Background image set');
      }
    });
  }

  function removeBackgroundImage(sectionId: string) {
    updateSectionSettingsById(sectionId, { backgroundImage: undefined }, 'Background image removed');
  }

  function chooseBackgroundVideo(sectionId: string) {
    openWordPressVideoPicker({
      title: 'Choose background video',
      buttonText: 'Use this video',
      onStatus: setStatus,
      onVideo: (backgroundVideo) => {
        updateSectionSettingsById(sectionId, { background: 'hero', backgroundVideo, videoMode: 'background' }, 'Background video set');
      }
    });
  }

  function removeBackgroundVideo(sectionId: string) {
    updateSectionSettingsById(sectionId, { backgroundVideo: undefined, videoMode: 'inline' }, 'Background video removed');
  }

  function chooseItemImage(index: number) {
    openWordPressImagePicker({
      title: 'Choose item image',
      buttonText: 'Use this image',
      onStatus: setStatus,
      onImage: (image) => {
        updateSelectedItem(index, { image });
        setStatus('Item image set');
      }
    });
  }

  function removeItemImage(index: number) {
    updateSelectedItem(index, { image: undefined });
    setStatus('Item image removed');
  }

  return {
    chooseBackgroundImage,
    chooseBackgroundVideo,
    chooseItemImage,
    removeBackgroundImage,
    removeBackgroundVideo,
    removeItemImage
  };
}
