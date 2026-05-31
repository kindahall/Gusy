import type { ExportRecord, GusyBlueprint } from './types';

export const EXPORT_HISTORY_LIMIT = 12;

export function exportFilename(blueprint: GusyBlueprint): string {
  return `${blueprint.page.slug || 'gusy-page'}.json`;
}

export function exportPayload(exportText: string, blueprint: GusyBlueprint): string {
  return exportText || JSON.stringify({ blueprint }, null, 2);
}

export function prettyExportPayload(payload: unknown): string {
  return JSON.stringify(payload, null, 2);
}

export function exportRecord(
  name: string,
  type: string,
  destination: string,
  date = new Date().toISOString(),
  payload?: string
): ExportRecord {
  return {
    name,
    type,
    destination,
    date,
    payload
  };
}

export function prependExportHistory(
  history: ExportRecord[],
  record: ExportRecord,
  limit = EXPORT_HISTORY_LIMIT
): ExportRecord[] {
  return [record, ...history].slice(0, limit);
}

export function importPayloadReady(payload: string): boolean {
  return payload.trim().length > 0;
}

export function exportWorkflowError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
