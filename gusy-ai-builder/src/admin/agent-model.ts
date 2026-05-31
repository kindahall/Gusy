import { EMPTY_AGENT_MEMORY } from './llm';
import { shortText } from './schema';
import type {
  AgentMessage,
  GusyAgentContext,
  GusyAgentMemory,
  GusyAgentResponse,
  GusyAudit,
  GusyBlueprint,
  GusyLLMSettings,
  GusySection,
  LeftTab
} from './types';

export const AGENT_THREAD_LIMIT = 10;

export const AGENT_WELCOME_MESSAGE: AgentMessage = {
  id: 'agent-welcome',
  role: 'agent',
  text: 'Ask me what to do next in Gusy. I can guide setup, blocks, audit, migration, export and publishing.'
};

export function normalizeAgentMemory(memory?: Partial<GusyAgentMemory>): GusyAgentMemory {
  return {
    ...EMPTY_AGENT_MEMORY,
    ...(memory || {}),
    keywords: Array.isArray(memory?.keywords) ? memory.keywords : []
  };
}

export function inferAgentMemoryFromText(
  text: string,
  current: GusyAgentMemory = EMPTY_AGENT_MEMORY,
  now = new Date()
): GusyAgentMemory {
  const clean = text.trim();
  const cityMatch = clean.match(/\b(?:in|at|a|à|sur)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ-]+)/);
  const keywords = clean
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9\s-]/gi, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 8);

  return {
    ...current,
    business: current.business || shortText(clean, 72),
    audience: current.audience || 'Qualified visitors',
    offer: current.offer || shortText(clean, 96),
    tone: clean.toLowerCase().includes('premium') ? 'premium, clear' : current.tone || 'clear, useful',
    localMarket: current.localMarket || cityMatch?.[1] || '',
    brandVoice: current.brandVoice || 'Direct, confident and practical.',
    primaryGoal: current.primaryGoal || 'Generate qualified enquiries',
    keywords: Array.from(new Set([...(current.keywords || []), ...keywords])).slice(0, 12),
    notes: [current.notes, clean].filter(Boolean).join('\n').slice(0, 1200),
    lastUpdatedAt: now.toISOString()
  };
}

export function buildAgentContext(options: {
  activeTab: LeftTab;
  blueprint: GusyBlueprint;
  selected?: GusySection;
  audit: GusyAudit;
  llmSettings: GusyLLMSettings;
  canPublish: boolean;
  postId: number | null;
  memory: GusyAgentMemory;
}): GusyAgentContext {
  return {
    activeTab: options.activeTab,
    pageTitle: options.blueprint.page.title,
    sectionCount: options.blueprint.page.sections.length,
    selectedType: options.selected?.type ?? '',
    auditScore: options.audit.score,
    llmConfigured: options.llmSettings.configured,
    canPublish: options.canPublish,
    postId: options.postId ?? 0,
    memory: options.memory
  };
}

export function appendAgentMessage(
  messages: AgentMessage[],
  message: AgentMessage,
  limit = AGENT_THREAD_LIMIT
): AgentMessage[] {
  return [...messages, message].slice(-limit);
}

export function agentReplyStatus(response: GusyAgentResponse): string {
  return response.source?.type === 'llm-product-agent' ? 'Agent answered' : 'Product guidance';
}

export function agentErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Agent failed';
}
