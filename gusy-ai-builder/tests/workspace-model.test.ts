import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { blockCategories, blockCategoryCount, filterBlockTemplates } from '../src/admin/workspace-model';
import type { GusySection, GusyTemplate } from '../src/admin/types';

function section(type: string): GusySection {
  return {
    id: `section-${type}`,
    type,
    variant: 'default',
    label: type,
    kicker: '',
    title: type,
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

function template(id: string, category: string, title: string, type: string, intent = ''): GusyTemplate {
  return {
    id,
    category,
    title,
    type,
    variant: 'default',
    intent,
    preview: '',
    section: section(type)
  };
}

describe('Gusy workspace model', () => {
  const templates = [
    template('hero-local', 'Hero', 'Local service hero', 'hero', 'Book local leads'),
    template('pricing-saas', 'Commerce', 'SaaS pricing', 'pricing', 'Sell subscriptions'),
    template('faq-sales', 'Support', 'Conversion FAQ', 'faq', 'Answer objections')
  ];

  it('keeps block categories stable with All first', () => {
    assert.deepEqual(blockCategories(templates), ['All', 'Hero', 'Commerce', 'Support']);
    assert.equal(blockCategoryCount(templates, 'All'), 3);
    assert.equal(blockCategoryCount(templates, 'Commerce'), 1);
  });

  it('filters blocks by category and product intent', () => {
    assert.deepEqual(filterBlockTemplates(templates, 'Hero', '').map((item) => item.id), ['hero-local']);
    assert.deepEqual(filterBlockTemplates(templates, 'All', 'subscriptions').map((item) => item.id), ['pricing-saas']);
    assert.deepEqual(filterBlockTemplates(templates, 'Commerce', 'faq'), []);
  });
});
