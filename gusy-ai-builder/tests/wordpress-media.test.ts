import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { openWordPressImagePicker, openWordPressVideoPicker } from '../src/admin/wordpress-media';
import type { GusyBackgroundImage, GusyBackgroundVideo } from '../src/admin/types';

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
});

describe('WordPress media picker', () => {
  it('opens the media library and returns the selected image', () => {
    let selectCallback = () => undefined;
    let opened = false;
    let mediaOptions: Record<string, unknown> = {};
    let selected: GusyBackgroundImage | null = null;
    const statuses: string[] = [];

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        wp: {
          media: (options: Record<string, unknown>) => {
            mediaOptions = options;
            return {
              on: (event: string, callback: () => void) => {
                if (event === 'select') selectCallback = callback;
              },
              open: () => {
                opened = true;
              },
              state: () => ({
                get: () => ({
                  first: () => ({
                    toJSON: () => ({
                      id: 7,
                      url: 'https://example.test/full.jpg',
                      alt: 'Workshop',
                      title: 'Workshop hero',
                      sizes: {
                        large: { url: 'https://example.test/large.jpg' }
                      }
                    })
                  })
                })
              })
            };
          }
        }
      }
    });

    const result = openWordPressImagePicker({
      title: 'Choose background image',
      buttonText: 'Use as background',
      onImage: (image) => {
        selected = image;
      },
      onStatus: (status) => statuses.push(status)
    });

    selectCallback();

    assert.equal(result, true);
    assert.equal(opened, true);
    assert.deepEqual(mediaOptions, {
      title: 'Choose background image',
      button: { text: 'Use as background' },
      library: { type: 'image' },
      multiple: false
    });
    assert.deepEqual(selected, {
      id: 7,
      url: 'https://example.test/large.jpg',
      alt: 'Workshop',
      title: 'Workshop hero'
    });
    assert.deepEqual(statuses, ['Choose or upload an image']);
  });

  it('reports when WordPress media is unavailable', () => {
    const statuses: string[] = [];
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });

    const result = openWordPressImagePicker({
      title: 'Choose image',
      buttonText: 'Use image',
      onImage: () => undefined,
      onStatus: (status) => statuses.push(status)
    });

    assert.equal(result, false);
    assert.deepEqual(statuses, ['WordPress media library unavailable']);
  });

  it('opens the media library and returns the selected video', () => {
    let selectCallback = () => undefined;
    let opened = false;
    let mediaOptions: Record<string, unknown> = {};
    let selected: GusyBackgroundVideo | null = null;
    const statuses: string[] = [];

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        wp: {
          media: (options: Record<string, unknown>) => {
            mediaOptions = options;
            return {
              on: (event: string, callback: () => void) => {
                if (event === 'select') selectCallback = callback;
              },
              open: () => {
                opened = true;
              },
              state: () => ({
                get: () => ({
                  first: () => ({
                    toJSON: () => ({
                      id: 12,
                      url: 'https://example.test/hero.mp4',
                      title: 'Hero clip',
                      mime: 'video/mp4',
                      image: { src: 'https://example.test/poster.jpg' }
                    })
                  })
                })
              })
            };
          }
        }
      }
    });

    const result = openWordPressVideoPicker({
      title: 'Choose background video',
      buttonText: 'Use this video',
      onVideo: (video) => {
        selected = video;
      },
      onStatus: (status) => statuses.push(status)
    });

    selectCallback();

    assert.equal(result, true);
    assert.equal(opened, true);
    assert.deepEqual(mediaOptions, {
      title: 'Choose background video',
      button: { text: 'Use this video' },
      library: { type: 'video' },
      multiple: false
    });
    assert.deepEqual(selected, {
      id: 12,
      url: 'https://example.test/hero.mp4',
      title: 'Hero clip',
      poster: 'https://example.test/poster.jpg',
      mime: 'video/mp4'
    });
    assert.deepEqual(statuses, ['Choose or upload a video']);
  });
});
