import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { UI_LANGUAGE_KEY, type UiLanguage } from './i18n';
import type { CanvasMenuState } from './types';

export function useAppLifecycle(options: {
  initialPostId: number | null;
  uiLanguage: UiLanguage;
  loadAgentMemory: () => Promise<void>;
  loadPage: (id: number) => Promise<void>;
  loadPages: () => Promise<void>;
  loadThemeKits: () => Promise<void>;
  redoVersion: () => void;
  restoreVersion: () => void;
  setCanvasMenu: Dispatch<SetStateAction<CanvasMenuState | null>>;
  setPaletteOpen: Dispatch<SetStateAction<boolean>>;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        options.setCanvasMenu(null);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        options.setPaletteOpen((open) => !open);
      }
      if ((event.metaKey || event.ctrlKey) && (event.shiftKey && event.key.toLowerCase() === 'z' || event.key.toLowerCase() === 'y')) {
        event.preventDefault();
        options.redoVersion();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        options.restoreVersion();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(UI_LANGUAGE_KEY, options.uiLanguage);
    } catch {
      // UI translation still works for the current session.
    }
  }, [options.uiLanguage]);

  useEffect(() => {
    void options.loadPages();
    void options.loadThemeKits();
    void options.loadAgentMemory();
    if (options.initialPostId) {
      void options.loadPage(options.initialPostId);
    }
  }, []);
}
