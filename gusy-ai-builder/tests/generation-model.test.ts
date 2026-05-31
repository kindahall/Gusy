import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generatedPageStatus,
  generatedSectionStatus,
  generationErrorMessage,
  transformedSectionStatus
} from '../src/admin/generation-model';

describe('Gusy generation model', () => {
  it('reports LLM-backed page, section and transform statuses with model names', () => {
    const source = { type: 'llm-gateway', model: 'gpt-5.5' };

    assert.equal(generatedPageStatus(source), 'Generated: gpt-5.5');
    assert.equal(generatedSectionStatus(source), 'Section generated: gpt-5.5');
    assert.equal(transformedSectionStatus(source), 'Updated: gpt-5.5');
  });

  it('uses local statuses when generation falls back to deterministic builders', () => {
    assert.equal(generatedPageStatus(), 'Generated locally');
    assert.equal(generatedSectionStatus({ type: 'template' }), 'Section added');
    assert.equal(transformedSectionStatus({ type: 'local-transform' }), 'Updated');
  });

  it('normalizes unknown generation failures without hiding real errors', () => {
    assert.equal(generationErrorMessage(new Error('Gateway timeout'), 'Failed'), 'Gateway timeout');
    assert.equal(generationErrorMessage('boom', 'Failed'), 'Failed');
  });
});
