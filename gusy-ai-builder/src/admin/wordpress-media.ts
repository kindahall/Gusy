import { backgroundImageFromAttachment, backgroundVideoFromAttachment } from './schema';
import type { GusyBackgroundImage, GusyBackgroundVideo } from './types';

type ImagePickerOptions = {
  title: string;
  buttonText: string;
  onImage: (image: GusyBackgroundImage) => void;
  onStatus: (status: string) => void;
};

type VideoPickerOptions = {
  title: string;
  buttonText: string;
  onVideo: (video: GusyBackgroundVideo) => void;
  onStatus: (status: string) => void;
};

export function openWordPressImagePicker({ title, buttonText, onImage, onStatus }: ImagePickerOptions): boolean {
  const mediaFactory = window.wp?.media;
  if (!mediaFactory) {
    onStatus('WordPress media library unavailable');
    return false;
  }

  const frame = mediaFactory({
    title,
    button: { text: buttonText },
    library: { type: 'image' },
    multiple: false
  });

  frame.on('select', () => {
    const attachment = frame.state().get('selection').first()?.toJSON();
    if (!attachment) {
      onStatus('No image selected');
      return;
    }

    const image = backgroundImageFromAttachment(attachment);
    if (!image) {
      onStatus('Selected media has no image URL');
      return;
    }

    onImage(image);
  });

  frame.open();
  onStatus('Choose or upload an image');
  return true;
}

export function openWordPressVideoPicker({ title, buttonText, onVideo, onStatus }: VideoPickerOptions): boolean {
  const mediaFactory = window.wp?.media;
  if (!mediaFactory) {
    onStatus('WordPress media library unavailable');
    return false;
  }

  const frame = mediaFactory({
    title,
    button: { text: buttonText },
    library: { type: 'video' },
    multiple: false
  });

  frame.on('select', () => {
    const attachment = frame.state().get('selection').first()?.toJSON();
    if (!attachment) {
      onStatus('No video selected');
      return;
    }

    const video = backgroundVideoFromAttachment(attachment);
    if (!video) {
      onStatus('Selected media has no video URL');
      return;
    }

    onVideo(video);
  });

  frame.open();
  onStatus('Choose or upload a video');
  return true;
}
