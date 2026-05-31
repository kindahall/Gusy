import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  agentErrorMessage,
  agentReplyStatus,
  appendAgentMessage,
  buildAgentContext,
  inferAgentMemoryFromText,
  normalizeAgentMemory
} from '../src/admin/agent-model';
import { DEFAULT_LLM_SETTINGS, EMPTY_AGENT_MEMORY } from '../src/admin/llm';
import type { AgentMessage, GusyAudit, GusyBlueprint, GusySection } from '../src/admin/types';

function section(id: string, type = 'hero'): GusySection {
  return {
    id,
    type,
    variant: 'default',
    label: type,
    kicker: '',
    title: id,
    body: '',
    items: [],
    settings: {
      background: 'plain',
      spacing: 'lg',
      columns: 2,
      mobileStack: true
    }
  };
}

function blueprint(sections: GusySection[] = [section('hero')]): GusyBlueprint {
  return {
    schemaVersion: '1.0',
    page: {
      title: 'Home',
      slug: 'home',
      language: 'en',
      seo: { metaTitle: 'Home', metaDescription: '' },
      designSystem: {},
      sections
    }
  };
}

const audit: GusyAudit = {
  summary: {},
  issues: [],
  sectionCount: 1,
  types: ['hero'],
  score: 91
};

describe('Gusy product agent model', () => {
  it('normalizes missing project memory into a safe product profile', () => {
    const memory = normalizeAgentMemory({ business: 'Studio Nova', keywords: undefined });

    assert.equal(memory.business, 'Studio Nova');
    assert.equal(memory.primaryGoal, 'Generate qualified enquiries');
    assert.deepEqual(memory.keywords, []);
  });

  it('infers durable product memory from a user brief without overwriting known fields', () => {
    const memory = inferAgentMemoryFromText(
      'Premium florist in Lyon for wedding bouquets and local delivery.',
      { ...EMPTY_AGENT_MEMORY, business: 'Maison Fleur' },
      new Date('2026-05-26T10:00:00.000Z')
    );

    assert.equal(memory.business, 'Maison Fleur');
    assert.equal(memory.localMarket, 'Lyon');
    assert.equal(memory.tone, 'premium, clear');
    assert.ok(memory.keywords.includes('florist'));
    assert.ok(memory.keywords.includes('wedding'));
    assert.equal(memory.lastUpdatedAt, '2026-05-26T10:00:00.000Z');
  });

  it('builds the strict context sent to the product agent', () => {
    const context = buildAgentContext({
      activeTab: 'layers',
      blueprint: blueprint([section('hero'), section('faq', 'faq')]),
      selected: section('faq', 'faq'),
      audit,
      llmSettings: { ...DEFAULT_LLM_SETTINGS, configured: true },
      canPublish: true,
      postId: null,
      memory: { ...EMPTY_AGENT_MEMORY, business: 'Maison Fleur' }
    });

    assert.equal(context.activeTab, 'layers');
    assert.equal(context.sectionCount, 2);
    assert.equal(context.selectedType, 'faq');
    assert.equal(context.auditScore, 91);
    assert.equal(context.llmConfigured, true);
    assert.equal(context.postId, 0);
    assert.equal(context.memory.business, 'Maison Fleur');
  });

  it('keeps the visible agent thread bounded', () => {
    const messages: AgentMessage[] = Array.from({ length: 10 }, (_, index) => ({
      id: `m-${index}`,
      role: 'agent' as const,
      text: `${index}`
    }));
    const next = appendAgentMessage(messages, { id: 'm-10', role: 'user', text: 'next' }, 4);

    assert.deepEqual(next.map((message) => message.id), ['m-7', 'm-8', 'm-9', 'm-10']);
  });

  it('turns backend agent replies and errors into clear UI statuses', () => {
    assert.equal(agentReplyStatus({ reply: 'ok', intent: 'build', actions: [], source: { type: 'llm-product-agent' } }), 'Agent answered');
    assert.equal(agentReplyStatus({ reply: 'ok', intent: 'guide', actions: [] }), 'Product guidance');
    assert.equal(agentErrorMessage(new Error('Agent unavailable')), 'Agent unavailable');
    assert.equal(agentErrorMessage('nope'), 'Agent failed');
  });
});
