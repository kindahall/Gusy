import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BRAND_PRESETS,
  BRAND_RADIUS_OPTIONS,
  BRAND_TYPE_OPTIONS,
  isActivePreset,
  isActiveRadius,
  isActiveType
} from '../src/admin/brand';

describe('Gusy brand options', () => {
  it('keeps every preset production-ready with color and radius tokens', () => {
    for (const [key, preset] of Object.entries(BRAND_PRESETS)) {
      assert.ok(preset.label, `${key} has a label`);
      assert.ok(preset.tokens.colors?.primary, `${key} has primary color`);
      assert.ok(preset.tokens.colors?.accent, `${key} has accent color`);
      assert.ok(preset.tokens.radius?.lg, `${key} has large radius`);
      assert.ok(preset.tokens.typography?.fontFamily, `${key} has typography`);
    }
  });

  it('detects active preset, type and radius from current design tokens', () => {
    const design = BRAND_PRESETS.product.tokens;

    assert.equal(isActivePreset(design, 'product'), true);
    assert.equal(isActivePreset(design, 'local'), false);
    assert.equal(isActiveType(design, BRAND_TYPE_OPTIONS[0]), true);
    assert.equal(isActiveRadius({ radius: BRAND_RADIUS_OPTIONS[0].patch.radius }, BRAND_RADIUS_OPTIONS[0]), true);
  });
});
