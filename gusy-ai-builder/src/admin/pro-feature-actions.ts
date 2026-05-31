import type { Dispatch, SetStateAction } from 'react';
import { hasFeature, openUpgrade, proStatus } from './features';
import type { GusySettings, LeftTab } from './types';

type MaybePromise = void | Promise<unknown>;

function guardFeature(settings: GusySettings, setStatus: (status: string) => void, feature: string, label: string): boolean {
  if (hasFeature(settings, feature)) return true;
  setStatus(proStatus(settings, label));
  openUpgrade(settings);
  return false;
}

export function createBaseFeatureActions(
  settings: GusySettings,
  actions: {
    setStatus: (status: string) => void;
    setLeftTab: (tab: LeftTab) => void;
    setAgentOpen: Dispatch<SetStateAction<boolean>>;
    askProductAgent: (message: string) => MaybePromise;
    loadMigrationPages: () => MaybePromise;
    previewFirstElementorPage: () => MaybePromise;
  }
) {
  return {
    selectTab(tab: LeftTab) {
      if (tab === 'migrate' && !guardFeature(settings, actions.setStatus, 'migration.elementor', 'Elementor migration')) return;
      actions.setLeftTab(tab);
    },
    openAgentPanel() {
      if (!guardFeature(settings, actions.setStatus, 'ai.product_agent', 'Assistant')) return;
      actions.setAgentOpen(true);
    },
    askProductAgent(message: string) {
      if (!guardFeature(settings, actions.setStatus, 'ai.product_agent', 'Assistant')) return;
      return actions.askProductAgent(message);
    },
    loadMigrationPages() {
      if (!guardFeature(settings, actions.setStatus, 'migration.elementor', 'Elementor migration')) return;
      return actions.loadMigrationPages();
    },
    previewFirstElementorPage() {
      if (!guardFeature(settings, actions.setStatus, 'migration.elementor', 'Elementor migration')) return;
      return actions.previewFirstElementorPage();
    }
  };
}

export function createAgentFeatureActions(
  settings: GusySettings,
  actions: {
    setStatus: (status: string) => void;
    askAgent: (message?: string) => MaybePromise;
    buildBrandKit: (instruction: string) => MaybePromise;
  }
) {
  return {
    askAgent(message?: string) {
      if (!guardFeature(settings, actions.setStatus, 'ai.product_agent', 'Assistant')) return;
      return actions.askAgent(message);
    },
    buildBrandKit(instruction: string) {
      if (!guardFeature(settings, actions.setStatus, 'ai.brand_kit', 'AI style')) return;
      return actions.buildBrandKit(instruction);
    }
  };
}
