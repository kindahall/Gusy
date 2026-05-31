import type { CSSProperties } from 'react';
import { cssUrl, resolveSectionAccent } from './schema';
import type { GusySection } from './types';

export function canvasSectionStyle(section: GusySection, colors: Record<string, string>): CSSProperties {
  return {
    '--section-accent': resolveSectionAccent(section, colors),
    '--section-motion-duration': `${section.settings.motionDuration || 600}ms`,
    ...(section.settings.backgroundImage?.url ? { '--section-background-image': cssUrl(section.settings.backgroundImage.url) } : {})
  } as CSSProperties;
}

export function CanvasBackgroundVideo({ section }: { section: GusySection }) {
  if (!section.settings.backgroundVideo?.url || section.settings.videoMode !== 'background') return null;

  return (
    <video
      className="gusy-render-background-video"
      src={section.settings.backgroundVideo.url}
      poster={section.settings.backgroundVideo.poster || section.settings.backgroundImage?.url}
      autoPlay
      muted
      loop
      playsInline
    />
  );
}
