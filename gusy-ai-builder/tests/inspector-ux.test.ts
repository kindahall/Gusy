import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

describe('Gusy inspector UX', () => {
  it('starts with business-building guidance instead of technical gateway settings', () => {
    const source = readFileSync(new URL('../src/admin/inspector-panels.tsx', import.meta.url), 'utf8');
    const canvasInspector = readFileSync(new URL('../src/admin/canvas-inspector.tsx', import.meta.url), 'utf8');
    const completionPanel = readFileSync(new URL('../src/admin/page-completion-panel.tsx', import.meta.url), 'utf8');
    const llmPanel = readFileSync(new URL('../src/admin/llm-gateway-panel.tsx', import.meta.url), 'utf8');
    const rightPanel = readFileSync(new URL('../src/admin/right-panel.tsx', import.meta.url), 'utf8');

    assert.match(completionPanel, /function PageCompletionPanel/);
    assert.match(completionPanel, /Build guide/);
    assert.match(completionPanel, /Add the missing business sections before publishing/);
    assert.match(completionPanel, /Reviews and proof/);
    assert.match(completionPanel, /Build full page/);
    assert.match(canvasInspector, /function CanvasInspector/);
    assert.match(canvasInspector, /QUICK_BLOCKS/);
    assert.match(source, /showLlmGateway/);
    assert.match(source, /LLMGatewayPanel/);
    assert.match(rightPanel, /showLlmGateway=\{props\.tab === 'layers'/);
    assert.match(llmPanel, /AI Connection/);
    assert.match(llmPanel, /OpenAI Codex/);
    assert.match(llmPanel, /LLM_PROVIDER_DEFAULTS/);
    assert.doesNotMatch(source, /defaultValue=/);
    assert.doesNotMatch(source, /HTML Tag/);
    assert.match(source, /motionEntrance/);
    assert.match(source, /motionDuration/);
    assert.match(source, /SectionQualityPanel/);
    assert.doesNotMatch(source, /export function CanvasInspector/);
    assert.doesNotMatch(source, /function PageCompletionPanel/);
    assert.doesNotMatch(source, /export function LLMGatewayPanel/);
  });
});
