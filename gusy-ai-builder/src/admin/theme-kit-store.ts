import { useState } from 'react';
import apiFetch from './api';
import {
  normalizeThemeSettings,
  themeImportStatus,
  themeKitLoadStatus,
  themeWorkflowError
} from './theme-kit-model';
import type {
  GusyThemeBusinessProfile,
  GusyThemeCustomizeResponse,
  GusyThemeImportResponse,
  GusyThemeKit,
  GusyThemePreviewResponse,
  GusyThemeKitResponse,
  GusyThemeSettings
} from './types';

export function useThemeKitWorkflow(options: {
  adoptSavedPage: (page?: { id?: number; viewLink?: string; previewLink?: string; editLink?: string; status?: string }) => Promise<void>;
  openImportedPage: (page?: GusyThemeImportResponse['pages'][number]) => Promise<void>;
  loadPages: () => Promise<void>;
  setStatus: (status: string) => void;
}) {
  const [themeKits, setThemeKits] = useState<GusyThemeKit[]>([]);
  const [themeSettings, setThemeSettings] = useState<GusyThemeSettings>(() => normalizeThemeSettings());
  const [themeKitsAvailable, setThemeKitsAvailable] = useState(false);
  const [themeStatus, setThemeStatus] = useState('Loading kits');
  const [themesBusy, setThemesBusy] = useState(false);

  async function loadThemeKits() {
    try {
      const response = await apiFetch<GusyThemeKitResponse>({ path: '/gusy/v1/theme-kits' });
      setThemeKits(response.kits || []);
      setThemeKitsAvailable(Boolean(response.available));
      setThemeSettings(normalizeThemeSettings(response.settings));
      setThemeStatus(themeKitLoadStatus(response));
    } catch (error) {
      setThemeKits([]);
      setThemeKitsAvailable(false);
      setThemeStatus(themeWorkflowError(error, 'Could not load theme kits'));
    }
  }

  async function saveThemeSettings(patch: Partial<GusyThemeSettings>) {
    const nextSettings = { ...themeSettings, ...patch };
    setThemeSettings(nextSettings);
    setThemeStatus('Saving theme settings');

    try {
      const response = await apiFetch<{ settings: GusyThemeSettings }>({
        path: '/gusy/v1/theme-settings',
        method: 'POST',
        data: nextSettings
      });
      setThemeSettings(normalizeThemeSettings(response.settings));
      setThemeStatus('Theme settings saved');
    } catch (error) {
      setThemeStatus(themeWorkflowError(error, 'Theme settings failed'));
    }
  }

  async function importThemeKit(kit: GusyThemeKit, scope: 'single' | 'full' = 'full') {
    setThemesBusy(true);
    setThemeStatus(`Importing ${kit.name}`);

    try {
      const response = await apiFetch<GusyThemeImportResponse>({
        path: '/gusy/v1/theme-kits/import',
        method: 'POST',
        data: {
          slug: kit.slug,
          language: kit.language,
          scope,
          setHome: themeSettings.setHomeOnImport
        }
      });
      setThemeSettings(normalizeThemeSettings(response.settings));
      setThemeStatus(themeImportStatus(response));
      options.setStatus(`${response.kit.name} imported`);
      await options.loadPages();
      await loadThemeKits();
      await options.adoptSavedPage(response.pages[0]);
      const pageToEdit = response.pages.find((page) => page.type === 'home') ?? response.pages[0];
      await options.openImportedPage(pageToEdit);
    } catch (error) {
      const message = themeWorkflowError(error, 'Theme import failed');
      setThemeStatus(message);
      options.setStatus(message);
    } finally {
      setThemesBusy(false);
    }
  }

  async function previewThemePage(kit: GusyThemeKit, type: string, profile?: GusyThemeBusinessProfile) {
    setThemesBusy(true);
    setThemeStatus(`Previewing ${kit.name}`);

    try {
      const response = await apiFetch<GusyThemePreviewResponse>({
        path: '/gusy/v1/theme-kits/preview',
        method: 'POST',
        data: {
          slug: kit.slug,
          language: kit.language,
          type,
          profile
        }
      });
      setThemeStatus(`${response.page.title} preview ready`);
      return response;
    } catch (error) {
      const message = themeWorkflowError(error, 'Theme preview failed');
      setThemeStatus(message);
      options.setStatus(message);
      return null;
    } finally {
      setThemesBusy(false);
    }
  }

  async function customizeThemeKit(kit: GusyThemeKit, profile: GusyThemeBusinessProfile) {
    setThemesBusy(true);
    setThemeStatus(`Customizing ${kit.name}`);

    try {
      const response = await apiFetch<GusyThemeCustomizeResponse>({
        path: '/gusy/v1/theme-kits/customize',
        method: 'POST',
        data: {
          slug: kit.slug,
          language: kit.language,
          setHome: themeSettings.setHomeOnImport,
          profile
        }
      });
      setThemeSettings(normalizeThemeSettings(response.settings));
      setThemeStatus(themeImportStatus(response));
      options.setStatus(`${response.kit.name} customized`);
      await options.loadPages();
      await loadThemeKits();
      await options.adoptSavedPage(response.pages[0]);
      const pageToEdit = response.pages.find((page) => page.type === 'home') ?? response.pages[0];
      await options.openImportedPage(pageToEdit);
    } catch (error) {
      const message = themeWorkflowError(error, 'Theme customization failed');
      setThemeStatus(message);
      options.setStatus(message);
    } finally {
      setThemesBusy(false);
    }
  }

  return {
    customizeThemeKit,
    importThemeKit,
    loadThemeKits,
    previewThemePage,
    saveThemeSettings,
    themeKits,
    themeKitsAvailable,
    themeSettings,
    themeStatus,
    themesBusy
  };
}
