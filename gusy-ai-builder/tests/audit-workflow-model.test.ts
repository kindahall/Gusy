import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  auditErrorMessage,
  auditPassedChecks,
  auditSuccessStatus,
  auditSummaryChecks
} from '../src/admin/audit-workflow-model';
import type { GusyAudit } from '../src/admin/types';

describe('Gusy audit workflow model', () => {
  it('formats audit statuses predictably', () => {
    assert.equal(auditSuccessStatus(91), 'Audit 91');
    assert.equal(auditSuccessStatus(Number.NaN), 'Audit 0');
  });

  it('keeps audit errors useful without leaking unknown values', () => {
    assert.equal(auditErrorMessage(new Error('REST failed')), 'REST failed');
    assert.equal(auditErrorMessage('nope'), 'Audit failed');
  });

  it('derives real passed checks from audit summary instead of a fake tab', () => {
    const audit: GusyAudit = {
      summary: {
        seo: 'Add a FAQ to improve SEO coverage.',
        performance: 'Good',
        accessibility: 'Contrast and visible focus are planned.',
        conversion: 'Needs CTA path'
      },
      issues: ['Missing meta description', 'Conversion section is missing'],
      sectionCount: 3,
      types: ['hero', 'features', 'faq'],
      score: 76
    };

    assert.deepEqual(auditSummaryChecks(audit).map((check) => [check.label, check.state]), [
      ['SEO', 'bad'],
      ['Performance', 'good'],
      ['Accessibility', 'bad'],
      ['Structure', 'good'],
      ['Conversion', 'bad']
    ]);
    assert.deepEqual(auditPassedChecks(audit).map((check) => check.label), ['Performance', 'Structure']);
  });
});
