import type { GusySettings } from './types';

export function hasFeature(settings: GusySettings, feature: string): boolean {
  return Boolean(settings.features?.[feature]);
}

export function isProPlan(settings: GusySettings): boolean {
  return settings.isPro === true || settings.plan === 'pro';
}

export function planLabel(settings: GusySettings): string {
  return isProPlan(settings) ? 'Pro' : 'Free';
}

export function upgradeUrl(settings: GusySettings): string {
  return settings.upgradeUrl || 'admin.php?page=gusy-ai-builder&gusy_upgrade=pro';
}

export function proStatus(settings: GusySettings, label = 'Pro feature'): string {
  return isProPlan(settings) ? label : `${label} requires Pro`;
}

export function openUpgrade(settings: GusySettings) {
  const url = upgradeUrl(settings);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}
