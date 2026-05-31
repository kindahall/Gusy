import { useState } from 'react';
import apiFetch from './api';
import {
  AGENT_WELCOME_MESSAGE,
  agentErrorMessage,
  agentReplyStatus,
  appendAgentMessage,
  inferAgentMemoryFromText,
  normalizeAgentMemory
} from './agent-model';
import type {
  AgentMessage,
  GusyAgentContext,
  GusyAgentMemory,
  GusyAgentResponse,
  PendingAgentAction
} from './types';

export function useProductAgent(options: {
  getContext: (memory: GusyAgentMemory) => GusyAgentContext;
  setStatus: (status: string) => void;
}) {
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentMemory, setAgentMemory] = useState<GusyAgentMemory>(() => normalizeAgentMemory());
  const [pendingAgentAction, setPendingAgentAction] = useState<PendingAgentAction | null>(null);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([AGENT_WELCOME_MESSAGE]);

  async function loadAgentMemory() {
    try {
      const response = await apiFetch<{ memory: GusyAgentMemory }>({ path: '/gusy/v1/agent/memory' });
      setAgentMemory(normalizeAgentMemory(response.memory));
    } catch {
      setAgentMemory(normalizeAgentMemory());
    }
  }

  function inferMemoryFromText(text: string): GusyAgentMemory {
    return inferAgentMemoryFromText(text, agentMemory);
  }

  async function saveAgentMemory(memory: GusyAgentMemory) {
    try {
      const response = await apiFetch<{ memory: GusyAgentMemory }>({
        path: '/gusy/v1/agent/memory',
        method: 'POST',
        data: memory
      });
      const nextMemory = normalizeAgentMemory(response.memory);
      setAgentMemory(nextMemory);
      options.setStatus('Memory saved');
      return nextMemory;
    } catch (error) {
      options.setStatus(error instanceof Error ? error.message : 'Memory save failed');
      return memory;
    }
  }

  function appendMessage(message: AgentMessage) {
    setAgentOpen(true);
    setAgentMessages((current) => appendAgentMessage(current, message));
  }

  function queuePendingAgentAction(pendingAction: PendingAgentAction) {
    setPendingAgentAction(pendingAction);
    setAgentOpen(true);
  }

  function clearPendingAgentAction() {
    setPendingAgentAction(null);
  }

  async function askProductAgent(message: string) {
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      options.setStatus('Agent message required');
      setAgentOpen(true);
      return;
    }

    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanMessage
    };

    setAgentOpen(true);
    setAgentBusy(true);
    setAgentMessages((current) => appendAgentMessage(current, userMessage));
    options.setStatus('Agent thinking');

    try {
      const response = await apiFetch<GusyAgentResponse>({
        path: '/gusy/v1/agent/chat',
        method: 'POST',
        data: {
          message: cleanMessage,
          context: options.getContext(agentMemory)
        }
      });
      setAgentMessages((current) =>
        appendAgentMessage(current, {
          id: `agent-${Date.now()}`,
          role: 'agent' as const,
          text: response.reply,
          actions: response.actions
        })
      );
      options.setStatus(agentReplyStatus(response));
    } catch (error) {
      const text = agentErrorMessage(error);
      setAgentMessages((current) =>
        appendAgentMessage(current, {
          id: `agent-error-${Date.now()}`,
          role: 'agent' as const,
          text
        })
      );
      options.setStatus(text);
    } finally {
      setAgentBusy(false);
    }
  }

  return {
    agentBusy,
    agentMemory,
    agentMessages,
    agentOpen,
    appendAgentMessage: appendMessage,
    askProductAgent,
    clearPendingAgentAction,
    inferMemoryFromText,
    loadAgentMemory,
    pendingAgentAction,
    queuePendingAgentAction,
    saveAgentMemory,
    setAgentOpen
  };
}
