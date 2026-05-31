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

describe('PHP security guardrails', () => {
  it('keeps REST payloads, leads and revisions bounded', () => {
    const rest = read('gusy-ai-builder/includes/class-gusy-rest-controller.php');

    assert.match(rest, /MAX_JSON_BYTES/);
    assert.match(rest, /limited_request_params/);
    assert.match(rest, /check_rate_limit/);
    assert.match(rest, /privacyConsent/);
    assert.match(rest, /delete_expired_leads/);
    assert.match(rest, /prune_revisions/);
  });

  it('filters page listings by per-post capability', () => {
    const rest = read('gusy-ai-builder/includes/class-gusy-rest-controller.php');

    assert.match(rest, /current_user_can\( 'edit_post', \$post->ID \)/);
    assert.match(rest, /current_user_can\( 'edit_post', \$existing->ID \)/);
    assert.match(rest, /Only Gusy pages can be set from this endpoint/);
  });

  it('requires WP-CLI for local write fixtures', () => {
    assert.match(read('imagn/import-online-elementor-test.php'), /defined\( 'WP_CLI' \)/);
    assert.match(read('gusy-base-theme/tools-create-preview-pages.php'), /defined\( 'WP_CLI' \)/);
  });

  it('documents LLM endpoint hardening and lead retention', () => {
    const llm = read('gusy-ai-builder/includes/class-gusy-llm-gateway.php');
    const docs = read('gusy-ai-builder/docs/security.md');

    assert.match(llm, /sanitize_remote_base_url/);
    assert.match(llm, /GUSY_ALLOW_PRIVATE_LLM_ENDPOINTS/);
    assert.match(docs, /180 days/);
    assert.match(docs, /WP-CLI only/);
  });
});
