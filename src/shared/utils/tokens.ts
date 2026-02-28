import type {
  CompatibilityReason,
  CompatibilityReport,
  FlagPalette,
  ModeAdjustments,
  ModeMetrics,
  Strictness,
  ThemeMode,
  ThemeTokens,
} from '../types/theme';
import { REQUIRED_PAIRS } from '../types/theme';
import { chroma as colorChroma, deltaE as colorDeltaE } from './color';
import { adjustToContrast, contrast } from './contrast';

/** Static neutral tokens per mode — verified to pass all preset-only contrast pairs. */
const MODE_PRESETS: Record<ThemeMode, Pick<ThemeTokens, 'bg' | 'surface' | 'text' | 'mutedText' | 'border'>> = {
  AMOLED: {
    bg: '#000000',
    surface: '#0a0a0a',
    text: '#e8e8e8',
    mutedText: '#a0a0a0',
    border: '#333333',
  },
  DARK: {
    bg: '#1a1a2e',
    surface: '#22223a',
    text: '#e8e8ed',
    mutedText: '#a0a0b0',
    border: '#404060',
  },
  LIGHT: {
    bg: '#ffffff',
    surface: '#f5f5f7',
    text: '#1a1a2e',
    mutedText: '#6c6c7e',
    border: '#c8c8d0',
  },
  DOMINANT_ONLY: {
    bg: '#1a1a2e',
    surface: '#22223a',
    text: '#e8e8ed',
    mutedText: '#a0a0b0',
    border: '#404060',
  },
};

/** Rank flag colors by visual prominence: chroma * 0.6 + contrast vs bg * 0.4. */
function rankFlagColors(flagColors: string[], bg: string): string[] {
  return [...flagColors]
    .map((c) => ({
      color: c,
      score: colorChroma(c) * 0.6 + contrast(c, bg) * 0.4,
    }))
    .sort((a, b) => b.score - a.score)
    .map((e) => e.color);
}

interface TokensWithSources {
  tokens: ThemeTokens;
  sources: Record<string, string>;
}

/** Generate tokens with source tracking for compatibility evaluation. */
function generateTokensInternal(palette: FlagPalette, mode: ThemeMode, strictness: Strictness): TokensWithSources {
  const preset = MODE_PRESETS[mode];
  const { bg, surface, text, mutedText, border } = preset;
  const ranked = rankFlagColors(palette.flagColors, bg);

  const primary = ranked[0];
  const secondary = ranked.length > 1 ? ranked[1] : primary;

  // accent: ranked[0], ≥ 3.0 vs bg
  const accentAdj = adjustToContrast(primary, bg, 3.0, strictness, mode);
  const accent = accentAdj.color;

  // accent2: ranked[1] (or hue-shifted ranked[0]), ≥ 3.0 vs bg
  const accent2Adj = adjustToContrast(secondary, bg, 3.0, strictness, mode);
  const accent2 = accent2Adj.color;

  // link: ranked[0], ≥ 4.5 vs bg AND surface — adjust against harder target first
  const linkTargetBg = contrast(primary, bg) <= contrast(primary, surface) ? bg : surface;
  const linkResult = adjustToContrast(primary, linkTargetBg, 4.5, strictness, mode);
  const link = linkResult.color;

  // focusRing: secondary, ≥ 3.0 vs bg AND surface — adjust against harder target first
  const focusTargetBg = contrast(secondary, bg) <= contrast(secondary, surface) ? bg : surface;
  const focusResult = adjustToContrast(secondary, focusTargetBg, 3.0, strictness, mode);
  const focusRing = focusResult.color;

  // accentText: white or black on accent, ≥ 4.5 vs accent
  const whiteOnAccent = contrast('#ffffff', accent);
  const blackOnAccent = contrast('#000000', accent);
  const accentTextBase = whiteOnAccent >= blackOnAccent ? '#ffffff' : '#000000';
  const accentTextAdj = adjustToContrast(accentTextBase, accent, 4.5, strictness, mode);
  const accentText = accentTextAdj.color;

  return {
    tokens: { bg, surface, text, mutedText, border, accent, accent2, accentText, link, focusRing },
    sources: {
      accent: primary,
      accent2: secondary,
      link: primary,
      focusRing: secondary,
      accentText: accentTextBase,
    },
  };
}

/**
 * Generate the 10 ThemeTokens from a palette, mode, and strictness.
 * All required contrast pairs are validated.
 */
export function generateTokens(palette: FlagPalette, mode: ThemeMode, strictness: Strictness): ThemeTokens {
  return generateTokensInternal(palette, mode, strictness).tokens;
}

/**
 * Evaluate which theme modes a palette can support at a given strictness.
 * Returns a full compatibility report with metrics, reasons, and adjustments.
 */
export function evaluateCompatibility(palette: FlagPalette, strictness: Strictness): CompatibilityReport {
  const modes: (ThemeMode & ('AMOLED' | 'DARK' | 'LIGHT'))[] = ['AMOLED', 'DARK', 'LIGHT'];
  const supports: Record<'AMOLED' | 'DARK' | 'LIGHT', boolean> = { AMOLED: true, DARK: true, LIGHT: true };
  const reasons: CompatibilityReason[] = [];
  const metrics: ModeMetrics = {};
  const adjustments: ModeAdjustments = {};

  // Detect neutral-only flag (all flag colors have low chroma)
  const isNeutral = palette.flagColors.every((c) => colorChroma(c) < 10);

  for (const mode of modes) {
    const { tokens, sources } = generateTokensInternal(palette, mode, strictness);
    const modeMetrics: Record<string, number> = {};
    const modeAdjustments: Record<string, { from: string; to: string; deltaE: number }> = {};
    let modePass = true;

    // Check all required contrast pairs
    for (const pair of REQUIRED_PAIRS) {
      const ratio = contrast(tokens[pair.a], tokens[pair.b]);
      modeMetrics[pair.label] = ratio;
      if (ratio < pair.threshold) {
        modePass = false;
        if (pair.a === 'link') {
          reasons.push({ mode, code: 'LOW_CONTRAST_LINK', details: `${pair.label}: ${ratio.toFixed(2)}` });
        } else if (pair.a === 'accentText') {
          reasons.push({
            mode,
            code: 'LOW_CONTRAST_ACCENT_TEXT',
            details: `${pair.label}: ${ratio.toFixed(2)}`,
          });
        }
      }
    }

    // Compute adjustments for flag-derived tokens
    for (const key of Object.keys(sources) as (keyof typeof sources)[]) {
      const from = sources[key];
      const to = tokens[key as keyof ThemeTokens];
      const de = colorDeltaE(from, to);
      modeAdjustments[key] = { from, to, deltaE: de };

      const strictCap = mode === 'LIGHT' ? 12 : 10;
      const relaxedCap = mode === 'LIGHT' ? 24 : 18;
      const cap = strictCap + (relaxedCap - strictCap) * (1 - strictness);
      if (de > cap) {
        modePass = false;
        reasons.push({
          mode,
          code: 'EXCESSIVE_COLOR_SHIFT_REQUIRED',
          details: `${key}: ΔE ${de.toFixed(1)} > cap ${cap.toFixed(1)}`,
        });
      }
    }

    if (isNeutral) {
      modePass = false;
      reasons.push({ mode, code: 'NEUTRAL_ONLY_FLAG' });
    }

    supports[mode] = modePass;
    metrics[mode] = modeMetrics;
    adjustments[mode] = modeAdjustments;
  }

  const dominantOnlyRequired = !supports.AMOLED && !supports.DARK && !supports.LIGHT;

  return { supports, dominantOnlyRequired, reasons, metrics, adjustments };
}
