import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SECTION_STYLE_RESET, copySectionStyle } from '../src/admin/section-style-presets';
import type { GusySection } from '../src/admin/types';

function settings(): GusySection['settings'] {
  return {
    background: 'hero',
    spacing: 'xl',
    columns: 4,
    tabletColumns: 3,
    mobileColumns: 2,
    accent: 'support',
    width: 'full',
    textAlign: 'center',
    headingScale: 'display',
    textWidth: 'wide',
    bodyScale: 'large',
    buttonStyle: 'soft',
    buttonSize: 'lg',
    buttonShape: 'rounded',
    imageAspect: 'portrait',
    imagePosition: 'top',
    imageShape: 'soft',
    mobileStack: false,
    backgroundImage: {
      id: 42,
      url: 'https://example.test/photo.jpg',
      alt: 'Photo',
      title: 'Hero photo'
    },
    backgroundVideo: {
      id: 9,
      url: 'https://example.test/clip.mp4',
      title: 'Clip',
      poster: 'https://example.test/poster.jpg'
    },
    videoMode: 'background',
    motionEnabled: true,
    motionEntrance: 'scale-in',
    motionDuration: 900
  };
}

describe('Gusy section style presets', () => {
  it('copies visual section styling without sharing nested media objects', () => {
    const source = settings();
    const copied = copySectionStyle(source);

    assert.deepEqual(copied, source);
    assert.notEqual(copied.backgroundImage, source.backgroundImage);
    assert.notEqual(copied.backgroundVideo, source.backgroundVideo);
  });

  it('resets sections to a clean editable style baseline', () => {
    assert.deepEqual(SECTION_STYLE_RESET, {
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
    });
  });
});
