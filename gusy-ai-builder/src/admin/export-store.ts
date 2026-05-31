import { useEffect, useState } from 'react';
import apiFetch from './api';
import {
  exportFilename,
  exportPayload,
  exportRecord,
  exportWorkflowError,
  importPayloadReady,
  prependExportHistory,
  prettyExportPayload
} from './export-model';
import { normalizeBlueprint } from './schema';
import { persistExportHistory, readExportHistory } from './storage';
import type { ExportRecord, GusyAudit, GusyBlueprint, GusySettings, LeftTab } from './types';

type ReplaceBlueprint = (
  blueprint: GusyBlueprint,
  options?: { recordHistory?: boolean; selectedId?: string; resetAudit?: boolean }
) => void;

export function useExportWorkflow(
  settings: GusySettings,
  options: {
    blueprint: GusyBlueprint;
    clearPageAnnotations: () => void;
    replaceBlueprint: ReplaceBlueprint;
    resetCurrentPage: () => void;
    setAudit: (audit: GusyAudit | null) => void;
    setBusy: (busy: boolean) => void;
    setLeftTab: (tab: LeftTab) => void;
    setStatus: (status: string) => void;
  }
) {
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [exportHistory, setExportHistory] = useState(() => readExportHistory());

  useEffect(() => {
    persistExportHistory(exportHistory);
  }, [exportHistory]);

  function pushHistory(name: string, type: string, destination: string, payload?: string) {
    setExportHistory((current) => prependExportHistory(current, exportRecord(name, type, destination, new Date().toISOString(), payload)));
  }

  async function exportBlueprint() {
    options.setBusy(true);
    options.setStatus('Exporting');
    try {
      const response = await apiFetch<{ filename: string; export: unknown }>({
        path: '/gusy/v1/page/export',
        method: 'POST',
        data: { blueprint: options.blueprint }
      });
      const payload = prettyExportPayload(response.export);
      setExportText(payload);
      pushHistory(response.filename, 'JSON Template', 'Local', payload);
      options.setLeftTab('export');
      options.setStatus(response.filename);
    } catch (error) {
      options.setStatus(exportWorkflowError(error, 'Export failed'));
    } finally {
      options.setBusy(false);
    }
  }

  function downloadExportFile() {
    const filename = exportFilename(options.blueprint);
    const payload = exportPayload(exportText, options.blueprint);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
    pushHistory(filename, 'JSON File', 'Download', payload);
    options.setStatus('Downloaded');
  }

  function useExportRecord(record: ExportRecord) {
    if (!record.payload) {
      options.setStatus('Export payload unavailable');
      return;
    }
    setExportText(record.payload);
    options.setLeftTab('export');
    options.setStatus(`${record.name} loaded`);
  }

  async function copyExportText() {
    const payload = exportPayload(exportText, options.blueprint);
    try {
      await navigator.clipboard.writeText(payload);
      options.setStatus('JSON copied');
    } catch {
      const visibleTextarea = document.querySelector<HTMLTextAreaElement>('.gusy-export-json textarea, .gusy-export-mini');
      if (visibleTextarea) {
        visibleTextarea.focus();
        visibleTextarea.select();
        options.setStatus('JSON selected');
        return;
      }
      const textarea = document.createElement('textarea');
      textarea.value = payload;
      textarea.setAttribute('readonly', 'readonly');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      options.setStatus(copied ? 'JSON copied' : 'JSON ready');
    }
  }

  async function importBlueprint() {
    if (!importPayloadReady(importText)) {
      options.setStatus('Paste JSON first');
      return;
    }
    options.setBusy(true);
    options.setStatus('Importing');
    try {
      const response = await apiFetch<{ blueprint: GusyBlueprint; audit: GusyAudit }>({
        path: '/gusy/v1/page/import',
        method: 'POST',
        data: { payload: importText }
      });
      const normalized = normalizeBlueprint(response.blueprint, settings);
      options.replaceBlueprint(normalized, { recordHistory: true, resetAudit: false });
      options.clearPageAnnotations();
      options.resetCurrentPage();
      options.setAudit(response.audit);
      options.setLeftTab('layers');
      options.setStatus('Imported');
    } catch (error) {
      options.setStatus(exportWorkflowError(error, 'Import failed'));
    } finally {
      options.setBusy(false);
    }
  }

  return {
    copyExportText,
    downloadExportFile,
    exportBlueprint,
    exportHistory,
    exportText,
    importBlueprint,
    importText,
    useExportRecord,
    setImportText
  };
}
