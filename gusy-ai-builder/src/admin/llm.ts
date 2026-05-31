import type { GusyAgentMemory, GusyLLMDraft, GusyLLMSettings } from './types';

export const DEFAULT_LLM_SETTINGS: GusyLLMSettings = {
  enabled: false,
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-5.5',
  timeout: 45,
  hasApiKey: false,
  apiKeyPreview: '',
  configured: false
};

export const LLM_PROVIDER_DEFAULTS: Record<GusyLLMSettings['provider'], { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5.5' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-opus-4-1-20250805' },
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.5-pro' },
  'openai-compatible': { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5.5' },
  gateway: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-5.5' },
  codex: { baseUrl: '/Applications/Codex.app/Contents/Resources/codex', model: 'gpt-5.5' }
};

export const LLM_PROVIDER_LABELS: Record<GusyLLMSettings['provider'], string> = {
  openai: 'OpenAI',
  anthropic: 'Claude',
  gemini: 'Gemini',
  'openai-compatible': 'OpenAI Compatible',
  gateway: 'LLM Gateway',
  codex: 'OpenAI Codex'
};

export const EMPTY_AGENT_MEMORY: GusyAgentMemory = {
  business: '',
  audience: '',
  offer: '',
  tone: 'premium, clear',
  localMarket: '',
  brandVoice: '',
  primaryGoal: 'Generate qualified enquiries',
  keywords: [],
  notes: ''
};

export function createLlmDraft(settings: GusyLLMSettings = DEFAULT_LLM_SETTINGS): GusyLLMDraft {
  return {
    ...settings,
    apiKey: '',
    clearApiKey: false
  };
}

export function mergeLlmDraft(draft: GusyLLMDraft, patch: Partial<GusyLLMDraft>): GusyLLMDraft {
  return {
    ...draft,
    ...patch
  };
}

export function initialLlmStatus(settings: GusyLLMSettings = DEFAULT_LLM_SETTINGS): string {
  return settings.configured ? 'Connected' : 'Not connected';
}

export function savedLlmStatus(settings: GusyLLMSettings): string {
  return settings.configured ? 'Connected' : 'Saved';
}

export function llmTestStatus(response: { ok: boolean; model?: string; message?: string }): string {
  return response.ok ? `Connected: ${response.model || 'model ready'}` : response.message || 'Test failed';
}

export function llmErrorStatus(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
