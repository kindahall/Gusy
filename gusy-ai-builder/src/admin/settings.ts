import type { GusySettings } from './types';

export function normalizeInitialPostId(value: GusySettings['initialPostId']): number {
  const id = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value ?? 0);
  return Number.isFinite(id) && id > 0 ? id : 0;
}
