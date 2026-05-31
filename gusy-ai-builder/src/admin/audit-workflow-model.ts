import type { GusyAudit } from './types';

export type AuditSummaryCheck = {
  label: string;
  status: string;
  icon: string;
  state: 'good' | 'bad';
};

export function auditSuccessStatus(score: number): string {
  return `Audit ${Number.isFinite(score) ? score : 0}`;
}

export function auditErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Audit failed';
}

export function isAuditStatusBad(status: string): boolean {
  const normalized = status.toLowerCase().trim();
  return [
    'missing',
    'needs',
    'not run',
    'planned',
    'failed',
    'error',
    'unavailable',
    'add a',
    'add an',
    'add at least'
  ].some((needle) => normalized.includes(needle)) || normalized.startsWith('add ');
}

export function auditSummaryChecks(audit: GusyAudit): AuditSummaryCheck[] {
  return [
    ['SEO', audit.summary.seo, 'S'],
    ['Performance', audit.summary.performance, 'P'],
    ['Accessibility', audit.summary.accessibility, 'A'],
    ['Structure', audit.sectionCount ? `${audit.sectionCount} sections` : 'Missing', 'B'],
    ['Conversion', audit.summary.conversion, 'C']
  ].map(([label, status, icon]) => ({
    label,
    status,
    icon,
    state: isAuditStatusBad(String(status)) ? 'bad' : 'good'
  }));
}

export function auditPassedChecks(audit: GusyAudit): AuditSummaryCheck[] {
  return auditSummaryChecks(audit).filter((check) => check.state === 'good');
}
