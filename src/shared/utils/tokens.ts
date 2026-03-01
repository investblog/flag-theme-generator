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
import { chroma as colorChroma, deltaE as colorDeltaE, hexToLch, lchToHex } from './color';
import { adjustToContrast, contrast } from './contrast';

/* ============================================
   Diversification constants
   ============================================ */
const MIN_CHROMATIC = 12; // LCH chroma below this → achromatic
const MIN_DIVERSITY_DE = 8; // minimum ΔE between link↔accent, focusRing↔accent2
const DIVERSITY_L_SHIFT = 12; // LCH lightness shift step for diversification
const BORDER_TINT_CHROMA = 8; // subtle chroma applied to tinted border
const CONTRAST_BUFFER = 0.5; // headroom above WCAG minimums during generation

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

/* ============================================
   Candidate pool builder
   ============================================ */

interface CandidatePool {
  chromatic: string[];
  achromatic: string[];
}

/**
 * Separate flag colors into chromatic/achromatic buckets.
 * When only 1 chromatic color exists, synthesize a secondary via +40° hue shift.
 * Guarantees ≥2 chromatic candidates (or 0 if fully achromatic).
 */
function buildCandidatePool(flagColors: string[], bg: string): CandidatePool {
  const chromatic: string[] = [];
  const achromatic: string[] = [];
  for (const c of flagColors) {
    if (colorChroma(c) >= MIN_CHROMATIC) {
      chromatic.push(c);
    } else {
      achromatic.push(c);
    }
  }
  // Synthesize a secondary when only 1 chromatic source
  if (chromatic.length === 1) {
    const [l, c, h] = hexToLch(chromatic[0]);
    chromatic.push(lchToHex(l, c, (h + 40) % 360));
  }
  // Fully achromatic — synthesize from bg hue
  if (chromatic.length === 0) {
    const [bgL, , bgH] = hexToLch(bg);
    const synthL = bgL < 50 ? 65 : 45;
    chromatic.push(lchToHex(synthL, 30, bgH));
    chromatic.push(lchToHex(synthL, 30, (bgH + 40) % 360));
  }
  return { chromatic, achromatic };
}

/* ============================================
   Token diversification
   ============================================ */

/**
 * Shift `token` away from `peer` until ΔE ≥ MIN_DIVERSITY_DE.
 * Lightness shifts lighter in dark modes, darker in light.
 * Falls back to hue shift if lightness alone is insufficient.
 * Returns original if nothing achieves diversity without breaking contrast.
 */
function diversifyFromPeer(
  token: string,
  peer: string,
  bg: string,
  surface: string,
  minContrast: number,
  isDark: boolean,
): string {
  if (colorDeltaE(token, peer) >= MIN_DIVERSITY_DE) return token;

  const [origL, origC, origH] = hexToLch(token);

  // Phase 1: lightness shift
  for (let step = 1; step <= 4; step++) {
    const shift = DIVERSITY_L_SHIFT * step;
    const newL = isDark ? Math.min(100, origL + shift) : Math.max(0, origL - shift);
    const candidate = lchToHex(newL, origC, origH);
    if (
      colorDeltaE(candidate, peer) >= MIN_DIVERSITY_DE &&
      contrast(candidate, bg) >= minContrast &&
      contrast(candidate, surface) >= minContrast
    ) {
      return candidate;
    }
  }

  // Phase 2: hue shift ±20°
  for (const dir of [-1, 1]) {
    for (let deg = 10; deg <= 20; deg += 10) {
      const candidate = lchToHex(origL, origC, (origH + dir * deg + 360) % 360);
      if (
        colorDeltaE(candidate, peer) >= MIN_DIVERSITY_DE &&
        contrast(candidate, bg) >= minContrast &&
        contrast(candidate, surface) >= minContrast
      ) {
        return candidate;
      }
    }
  }

  return token; // better identical than broken contrast
}

/* ============================================
   Border tinting
   ============================================ */

/**
 * Apply the lowest-chroma flag color's hue to the preset border at chroma ~BORDER_TINT_CHROMA.
 * Validates border/bg ≥ 1.5, border/surface ≥ 1.5. Returns preset border if validation fails.
 */
function tintBorder(presetBorder: string, flagColors: string[], bg: string, surface: string): string {
  // Find the lowest-chroma chromatic color (skip fully achromatic)
  let bestHue = -1;
  let bestChroma = Number.POSITIVE_INFINITY;
  for (const c of flagColors) {
    const chr = colorChroma(c);
    if (chr >= MIN_CHROMATIC && chr < bestChroma) {
      bestChroma = chr;
      bestHue = hexToLch(c)[2];
    }
  }
  // No chromatic colors → fallback to highest-chroma color's hue for subtle tint
  if (bestHue < 0) {
    let maxChr = 0;
    for (const c of flagColors) {
      const chr = colorChroma(c);
      if (chr > maxChr) {
        maxChr = chr;
        bestHue = hexToLch(c)[2];
      }
    }
  }
  if (bestHue < 0) return presetBorder;

  const [borderL] = hexToLch(presetBorder);
  const tinted = lchToHex(borderL, BORDER_TINT_CHROMA, bestHue);

  if (contrast(tinted, bg) >= 1.5 && contrast(tinted, surface) >= 1.5) {
    return tinted;
  }
  return presetBorder;
}

interface TokensWithSources {
  tokens: ThemeTokens;
  sources: Record<string, string>;
}

/** Generate tokens with source tracking for compatibility evaluation. */
function generateTokensInternal(palette: FlagPalette, mode: ThemeMode, strictness: Strictness): TokensWithSources {
  const preset = MODE_PRESETS[mode];
  const { bg, surface, text, mutedText, border: presetBorder } = preset;
  const isDark = mode !== 'LIGHT';

  // — Phase A: Build candidate pool —
  const pool = buildCandidatePool(palette.flagColors, bg);
  const ranked = rankFlagColors(pool.chromatic, bg);
  const primary = ranked[0];
  // Pick a secondary from a different source than primary
  const secondary = ranked.find((c) => colorDeltaE(c, primary) >= MIN_DIVERSITY_DE) ?? ranked[1] ?? primary;

  // — Phase B: Assign accent/accent2 from best candidates —
  // accent: primary, ≥ 3.0 vs bg (+ buffer for readability headroom)
  const accentAdj = adjustToContrast(primary, bg, 3.0 + CONTRAST_BUFFER, strictness, mode);
  const accent = accentAdj.color;

  // accent2: secondary, ≥ 3.0 vs bg
  const accent2Adj = adjustToContrast(secondary, bg, 3.0 + CONTRAST_BUFFER, strictness, mode);
  const accent2 = accent2Adj.color;

  // — Phase C: Adjust all tokens via existing adjustToContrast —
  // link: primary, ≥ 4.5 vs bg AND surface
  const linkTargetBg = contrast(primary, bg) <= contrast(primary, surface) ? bg : surface;
  const linkResult = adjustToContrast(primary, linkTargetBg, 4.5 + CONTRAST_BUFFER, strictness, mode);
  let link = linkResult.color;

  // focusRing: secondary, ≥ 3.0 vs bg AND surface
  const focusTargetBg = contrast(secondary, bg) <= contrast(secondary, surface) ? bg : surface;
  const focusResult = adjustToContrast(secondary, focusTargetBg, 3.0 + CONTRAST_BUFFER, strictness, mode);
  let focusRing = focusResult.color;

  // accentText: white or black on accent, ≥ 4.5 vs accent
  const whiteOnAccent = contrast('#ffffff', accent);
  const blackOnAccent = contrast('#000000', accent);
  const accentTextBase = whiteOnAccent >= blackOnAccent ? '#ffffff' : '#000000';
  const accentTextAdj = adjustToContrast(accentTextBase, accent, 4.5 + CONTRAST_BUFFER, strictness, mode);
  const accentText = accentTextAdj.color;

  // — Phase D: Diversify link↔accent, focusRing↔accent2 —
  link = diversifyFromPeer(link, accent, bg, surface, 4.5 + CONTRAST_BUFFER, isDark);
  focusRing = diversifyFromPeer(focusRing, accent2, bg, surface, 3.0 + CONTRAST_BUFFER, isDark);

  // — Phase E: Tint border with flag hue —
  const border = tintBorder(presetBorder, palette.flagColors, bg, surface);

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
