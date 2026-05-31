import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LLM_SETTINGS,
  LLM_PROVIDER_DEFAULTS,
  createLlmDraft,
  initialLlmStatus,
  llmErrorStatus,
  llmTestStatus,
  mergeLlmDraft,
  savedLlmStatus
} from '../src/admin/llm';

describe('Gusy LLM configuration', () => {
  it('defaults to the requested modern OpenAI model', () => {
    assert.equal(DEFAULT_LLM_SETTINGS.provider, 'openai');
    assert.equal(DEFAULT_LLM_SETTINGS.model, 'gpt-5.5');
    assert.equal(LLM_PROVIDER_DEFAULTS.openai.model, 'gpt-5.5');
  });

  it('keeps provider defaults available for the supported gateways', () => {
    assert.ok(LLM_PROVIDER_DEFAULTS.anthropic.model.startsWith('claude-'));
    assert.ok(LLM_PROVIDER_DEFAULTS.gemini.model.startsWith('gemini-'));
    assert.equal(LLM_PROVIDER_DEFAULTS.codex.model, 'gpt-5.5');
  });

  it('creates editable drafts without leaking saved API keys', () => {
    const draft = createLlmDraft({
      ...DEFAULT_LLM_SETTINGS,
      hasApiKey: true,
      apiKeyPreview: 'sk-...1234',
      configured: true
    });

    assert.equal(draft.apiKey, '');
    assert.equal(draft.clearApiKey, false);
    assert.equal(draft.hasApiKey, true);
    assert.equal(draft.apiKeyPreview, 'sk-...1234');
  });

  it('merges gateway draft changes without dropping sensitive flags', () => {
    const draft = createLlmDraft({
      ...DEFAULT_LLM_SETTINGS,
      provider: 'gateway',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'openai/gpt-5.5',
      hasApiKey: true,
      apiKeyPreview: 'sk-...1234'
    });

    const next = mergeLlmDraft(draft, { model: 'anthropic/claude-opus-4-1', clearApiKey: true });

    assert.equal(next.provider, 'gateway');
    assert.equal(next.model, 'anthropic/claude-opus-4-1');
    assert.equal(next.hasApiKey, true);
    assert.equal(next.clearApiKey, true);
  });

  it('returns explicit statuses for save and test outcomes', () => {
    assert.equal(initialLlmStatus(DEFAULT_LLM_SETTINGS), 'Not connected');
    assert.equal(savedLlmStatus({ ...DEFAULT_LLM_SETTINGS, configured: false }), 'Saved');
    assert.equal(savedLlmStatus({ ...DEFAULT_LLM_SETTINGS, configured: true }), 'Connected');
    assert.equal(llmTestStatus({ ok: true, model: 'gpt-5.5' }), 'Connected: gpt-5.5');
    assert.equal(llmTestStatus({ ok: false, message: 'Bad key' }), 'Bad key');
    assert.equal(llmTestStatus({ ok: false }), 'Test failed');
  });

  it('normalizes unknown gateway errors for the UI', () => {
    assert.equal(llmErrorStatus(new Error('Network failed'), 'Fallback'), 'Network failed');
    assert.equal(llmErrorStatus('nope', 'Fallback'), 'Fallback');
  });
});
