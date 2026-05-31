import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

describe('Gusy page canvas tools', () => {
  it('keeps professional quick creation and edit tools visible on the selected section', () => {
    const source = readFileSync(new URL('../src/admin/page-canvas.tsx', import.meta.url), 'utf8');
    const annotationMarkers = readFileSync(new URL('../src/admin/canvas-annotation-markers.tsx', import.meta.url), 'utf8');
    const sectionControls = readFileSync(new URL('../src/admin/canvas-section-controls.tsx', import.meta.url), 'utf8');
    const sectionMedia = readFileSync(new URL('../src/admin/canvas-section-media.tsx', import.meta.url), 'utf8');
    const blockPalette = readFileSync(new URL('../src/admin/canvas-block-palette.tsx', import.meta.url), 'utf8');

    assert.match(source, /CanvasAnnotationMarkers/);
    assert.match(source, /CanvasSectionControls/);
    assert.match(source, /CanvasToolbelt/);
    assert.match(source, /EmptyCanvas/);
    assert.match(annotationMarkers, /gusy-annotation-marker/);
    assert.match(sectionControls, /Edit this section/);
    assert.match(sectionControls, /Open section library/);
    assert.match(sectionControls, /testimonials/);
    assert.match(sectionControls, /Add \{block\.label\}/);
    assert.match(sectionControls, /Shorten this section/);
    assert.match(sectionControls, /const STYLE_GROUPS/);
    assert.match(blockPalette, /QUICK_BLOCKS/);
    assert.match(blockPalette, /Create page/);
    assert.match(source, /data-motion-enabled/);
    assert.match(sectionMedia, /--section-motion-duration/);
    assert.match(source, /data-text-align/);
    assert.match(source, /data-heading-scale/);
    assert.match(source, /data-text-width/);
    assert.match(source, /data-body-scale/);
    assert.match(source, /data-button-style/);
    assert.match(source, /data-button-size/);
    assert.match(source, /data-button-shape/);
    assert.match(source, /data-image-aspect/);
    assert.match(source, /data-image-position/);
    assert.match(source, /data-image-shape/);
    assert.match(source, /data-has-background-video/);
    assert.match(source, /data-video-mode/);
    assert.match(sectionMedia, /gusy-render-background-video/);
    assert.match(sectionControls, /Columns updated/);
  });
});
