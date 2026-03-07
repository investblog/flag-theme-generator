import type { CompatibilityReport, ThemeMode } from '../types/theme';

const SUPPORTED_MODES: ThemeMode[] = ['AMOLED', 'DARK', 'LIGHT'];

export const MODE_KEYS: { mode: ThemeMode; msgKey: string }[] = [
  { mode: 'AMOLED', msgKey: 'modeAmoled' },
  { mode: 'DARK', msgKey: 'modeDark' },
  { mode: 'LIGHT', msgKey: 'modeLight' },
  { mode: 'DOMINANT_ONLY', msgKey: 'modeDominantOnly' },
];

export function msg(key: string, ...subs: string[]): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return browser.i18n.getMessage(key as any, subs) || key;
  } catch {
    return key;
  }
}

export function getModeLabel(mode: ThemeMode): string {
  return msg(MODE_KEYS.find((entry) => entry.mode === mode)?.msgKey ?? 'modeDominantOnly');
}

export function getBestMode(report: CompatibilityReport): ThemeMode {
  const supported = SUPPORTED_MODES.filter((mode) => report.supports[mode as 'AMOLED' | 'DARK' | 'LIGHT']);
  if (supported.length === 0) return 'DOMINANT_ONLY';
  return [...supported].sort(
    (a, b) =>
      report.quality[b as 'AMOLED' | 'DARK' | 'LIGHT'].score - report.quality[a as 'AMOLED' | 'DARK' | 'LIGHT'].score,
  )[0];
}

export function getQualityTone(score: number): string {
  if (score >= 90) return msg('qualityToneExcellent');
  if (score >= 78) return msg('qualityToneStrong');
  if (score >= 62) return msg('qualityToneBalanced');
  return msg('qualityToneFragile');
}

export function getWarningSeverity(warning: string): 'info' | 'warning' | 'caution' {
  switch (warning) {
    case 'HEAVY_COLOR_ADJUSTMENT':
      return 'caution';
    case 'LOW_ROLE_DIVERSITY':
    case 'THIN_CONTRAST_MARGIN':
      return 'warning';
    default:
      return 'info';
  }
}

export function getWarningTag(warning: string): string {
  switch (warning) {
    case 'USES_SYNTHETIC_SOURCE':
      return msg('qualityWarningTagSynthetic');
    case 'LOW_ROLE_DIVERSITY':
      return msg('qualityWarningTagDiversity');
    case 'THIN_CONTRAST_MARGIN':
      return msg('qualityWarningTagHeadroom');
    case 'HEAVY_COLOR_ADJUSTMENT':
      return msg('qualityWarningTagAdjustment');
    case 'NEUTRAL_SOURCE_PALETTE':
      return msg('qualityWarningTagNeutral');
    default:
      return msg('qualityWarningTagAdjustment');
  }
}

export function getWarningCopy(warning: string): string {
  switch (warning) {
    case 'USES_SYNTHETIC_SOURCE':
      return msg('qualityWarningCopySynthetic');
    case 'LOW_ROLE_DIVERSITY':
      return msg('qualityWarningCopyDiversity');
    case 'THIN_CONTRAST_MARGIN':
      return msg('qualityWarningCopyHeadroom');
    case 'HEAVY_COLOR_ADJUSTMENT':
      return msg('qualityWarningCopyAdjustment');
    case 'NEUTRAL_SOURCE_PALETTE':
      return msg('qualityWarningCopyNeutral');
    default:
      return msg('qualityWarningCopyAdjustment');
  }
}

export function summarizeMode(report: CompatibilityReport, mode: ThemeMode): string {
  if (mode === 'DOMINANT_ONLY') return msg('qualitySummaryFallback');
  if (!report.supports[mode as 'AMOLED' | 'DARK' | 'LIGHT']) return msg('qualitySummaryUnavailable');
  const quality = report.quality[mode as 'AMOLED' | 'DARK' | 'LIGHT'];
  if (quality.warnings.length === 0) return msg('qualitySummaryClear', getQualityTone(quality.score));
  return msg('qualitySummaryTradeoffs', getQualityTone(quality.score), String(quality.warnings.length));
}

export function pickMode(current: ThemeMode, report: CompatibilityReport): ThemeMode {
  if (current === 'DOMINANT_ONLY') return getBestMode(report);
  if (!report.supports[current as 'AMOLED' | 'DARK' | 'LIGHT']) return getBestMode(report);
  return current;
}
