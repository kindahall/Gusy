import { useState } from 'react';
import apiFetch from './api';
import {
  DEFAULT_LLM_SETTINGS,
  createLlmDraft,
  initialLlmStatus,
  llmErrorStatus,
  llmTestStatus,
  mergeLlmDraft,
  savedLlmStatus
} from './llm';
import type { GusyLLMDraft, GusyLLMSettings, GusySettings } from './types';

type LlmTestResponse = {
  ok: boolean;
  provider: string;
  model: string;
  message: string;
};

export function useLlmGateway(settings: GusySettings, setGlobalStatus: (status: string) => void) {
  const initialSettings = settings.llm ?? DEFAULT_LLM_SETTINGS;
  const [llmSettings, setLlmSettings] = useState<GusyLLMSettings>(() => initialSettings);
  const [llmDraft, setLlmDraft] = useState<GusyLLMDraft>(() => createLlmDraft(initialSettings));
  const [llmBusy, setLlmBusy] = useState(false);
  const [llmStatus, setLlmStatus] = useState(() => initialLlmStatus(initialSettings));

  function updateLlmDraft(patch: Partial<GusyLLMDraft>) {
    setLlmDraft((current) => mergeLlmDraft(current, patch));
  }

  async function saveLlmSettings() {
    setLlmBusy(true);
    setLlmStatus('Saving');

    try {
      const response = await apiFetch<{ settings: GusyLLMSettings }>({
        path: '/gusy/v1/llm/settings',
        method: 'POST',
        data: llmDraft
      });
      setLlmSettings(response.settings);
      setLlmDraft(createLlmDraft(response.settings));
      setLlmStatus(savedLlmStatus(response.settings));
      setGlobalStatus('LLM settings saved');
    } catch (error) {
      const message = llmErrorStatus(error, 'LLM save failed');
      setLlmStatus(message);
      setGlobalStatus(message);
    } finally {
      setLlmBusy(false);
    }
  }

  async function testLlmGateway() {
    setLlmBusy(true);
    setLlmStatus('Testing');

    try {
      const response = await apiFetch<LlmTestResponse>({
        path: '/gusy/v1/llm/test',
        method: 'POST',
        data: llmDraft
      });
      const message = llmTestStatus(response);
      setLlmStatus(message);
      setGlobalStatus(message);
    } catch (error) {
      const message = llmErrorStatus(error, 'LLM test failed');
      setLlmStatus(message);
      setGlobalStatus(message);
    } finally {
      setLlmBusy(false);
    }
  }

  return {
    llmBusy,
    llmDraft,
    llmSettings,
    llmStatus,
    saveLlmSettings,
    testLlmGateway,
    updateLlmDraft
  };
}
