import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

describe('Gusy admin CSS structure', () => {
  it('keeps large admin surfaces outside the main stylesheet', () => {
    const adminCss = readFileSync('assets/css/admin.css', 'utf8');
    const aiToolsCss = readFileSync('assets/css/admin-ai-tools.css', 'utf8');
    const canvasCss = readFileSync('assets/css/admin-canvas.css', 'utf8');
    const inspectorCss = readFileSync('assets/css/admin-inspector.css', 'utf8');
    const workspaceCss = readFileSync('assets/css/admin-workspaces.css', 'utf8');

    assert.ok(adminCss.includes('@import "./admin-ai-tools.css";'));
    assert.ok(adminCss.includes('@import "./admin-canvas.css";'));
    assert.ok(adminCss.includes('@import "./admin-inspector.css";'));
    assert.ok(adminCss.includes('@import "./admin-workspaces.css";'));
    assert.match(adminCss, /body\.toplevel_page_gusy-ai-builder \.wp-pointer/);
    assert.ok(adminCss.split('\n').length < 1500);
    assert.match(aiToolsCss, /gusy-ai-bar/);
    assert.match(aiToolsCss, /gusy-agent-panel/);
    assert.match(aiToolsCss, /gusy-context-menu/);
    assert.match(canvasCss, /gusy-canvas-workspace/);
    assert.match(canvasCss, /gusy-section-toolbar/);
    assert.match(inspectorCss, /gusy-right-tabs/);
    assert.match(inspectorCss, /gusy-panel-stack/);
    assert.match(inspectorCss, /gusy-background-media-control/);
    assert.match(workspaceCss, /@layer gusy-workspaces/);
    assert.match(workspaceCss, /gusy-blocks-workspace/);
    assert.match(workspaceCss, /gusy-brand-workspace/);
    assert.match(workspaceCss, /gusy-migrate-workspace/);
    assert.doesNotMatch(adminCss, /gusy-panel-stack/);
    assert.doesNotMatch(adminCss, /@layer gusy-workspaces \{/);
  });
});
