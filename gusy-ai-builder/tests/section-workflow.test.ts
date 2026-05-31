import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

describe('Gusy section workflow', () => {
  it('uses professional default templates for quick creation', () => {
    const source = readFileSync(new URL('../src/admin/section-workflow.ts', import.meta.url), 'utf8');

    assert.match(source, /PREFERRED_QUICK_TEMPLATES/);
    assert.match(source, /hero-local-service/);
    assert.match(source, /features-grid/);
    assert.match(source, /testimonials-slider/);
    assert.match(source, /pricing-two-plans/);
  });
});
