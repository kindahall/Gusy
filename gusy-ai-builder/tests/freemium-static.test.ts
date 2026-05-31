import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const workspace = dirname(root);

function read(path: string): string {
  return readFileSync(join(workspace, path), 'utf8');
}

describe('Free and Pro product split', () => {
  it('keeps paid features behind server-side feature flags', () => {
    const features = read('gusy-ai-builder/includes/class-gusy-feature-manager.php');
    const rest = read('gusy-ai-builder/includes/class-gusy-rest-controller.php');

    assert.match(features, /gusy_ai_builder_features/);
    assert.match(features, /theme_kits\.import_full/);
    assert.match(features, /migration\.elementor/);
    assert.match(rest, /require_feature\( 'ai\.llm_gateway'/);
    assert.match(rest, /require_feature\( 'migration\.elementor'/);
    assert.match(rest, /require_theme_kit_available/);
    assert.match(rest, /can_use_llm_gateway/);
  });

  it('ships a separate Pro add-on that unlocks paid flags', () => {
    const pro = read('gusy-ai-builder-pro/gusy-ai-builder-pro.php');

    assert.match(pro, /Plugin Name: Gusy AI Builder Pro/);
    assert.match(pro, /Requires Plugins: gusy-ai-builder/);
    assert.match(pro, /gusy_ai_builder_plan/);
    assert.match(pro, /'pages\.revisions'/);
    assert.match(pro, /'ai\.product_agent'/);
    assert.match(pro, /'theme_kits\.all'/);
  });

  it('exposes plan-aware UI affordances without relying on JS for enforcement', () => {
    assert.match(read('gusy-ai-builder/src/admin/features.ts'), /hasFeature/);
    assert.match(read('gusy-ai-builder/src/admin/components.tsx'), /UpgradeNotice/);
    assert.match(read('gusy-ai-builder/src/admin/theme-workspace.tsx'), /locked/);
    assert.match(read('gusy-ai-builder/src/admin/llm-gateway-panel.tsx'), /LLM Gateway is Pro/);
  });
});
