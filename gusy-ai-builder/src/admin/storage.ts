import {
  ANNOTATIONS_STORAGE_KEY,
  DEVICE_STORAGE_KEY,
  EXPORT_HISTORY_KEY,
  STORAGE_KEY
} from './builder-options';
import { createBlankBlueprint, normalizeBlueprint } from './schema';
import type { Device, ExportRecord, GusyAnnotation, GusyBlueprint, GusySettings } from './types';

function localStorageRef(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const storage = localStorageRef();
  if (!storage) return fallback;

  try {
    const stored = storage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  const storage = localStorageRef();
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort; the editor state still lives in React.
  }
}

function isAnnotation(value: unknown): value is GusyAnnotation {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<GusyAnnotation>;
  return Boolean(item.id && item.sectionId && item.note);
}

function isExportRecord(value: unknown): value is ExportRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ExportRecord>;
  return Boolean(item.name && item.type && item.date);
}

export function readInitialBlueprint(settings: GusySettings): GusyBlueprint {
  if (settings.initialEdit || settings.initialPostId) {
    return createBlankBlueprint(settings);
  }

  const stored = readJson<GusyBlueprint | null>(STORAGE_KEY, null);
  return stored ? normalizeBlueprint(stored, settings) : createBlankBlueprint(settings);
}

export function persistBlueprint(blueprint: GusyBlueprint): void {
  writeJson(STORAGE_KEY, blueprint);
}

export function cloneBlueprint(blueprint: GusyBlueprint): GusyBlueprint {
  return JSON.parse(JSON.stringify(blueprint)) as GusyBlueprint;
}

export function readDevice(defaultDevice: Device = 'desktop'): Device {
  const stored = readJson<string | null>(DEVICE_STORAGE_KEY, null);
  return stored === 'tablet' || stored === 'mobile' || stored === 'desktop' ? stored : defaultDevice;
}

export function persistDevice(device: Device): void {
  writeJson(DEVICE_STORAGE_KEY, device);
}

export function readAnnotations(): GusyAnnotation[] {
  return readJson<unknown[]>(ANNOTATIONS_STORAGE_KEY, []).filter(isAnnotation);
}

export function persistAnnotations(annotations: GusyAnnotation[]): void {
  writeJson(ANNOTATIONS_STORAGE_KEY, annotations.slice(-80));
}

export function readExportHistory(): ExportRecord[] {
  return readJson<unknown[]>(EXPORT_HISTORY_KEY, []).filter(isExportRecord);
}

export function persistExportHistory(history: ExportRecord[]): void {
  writeJson(EXPORT_HISTORY_KEY, history.slice(0, 12));
}
