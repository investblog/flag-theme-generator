import type { AdjustmentResult, Strictness, ThemeMode } from '../types/theme';
import { deltaE as colorDeltaE, hexToLch, lchToHex, relativeLuminance } from './color';

/**
 * Calculate WCAG 2.1 contrast ratio between two colors.
 * @returns Contrast ratio in range [1, 21]
 */
export function contrast(color1: string, color2: string): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Compute max allowed ΔE based on strictness and mode. */
function maxDeltaE(strictness: Strictness, mode: ThemeMode): number {
  if (mode === 'DOMINANT_ONLY') return 100;
  const strictCap = mode === 'LIGHT' ? 12 : 10;
  const relaxedCap = mode === 'LIGHT' ? 55 : 50;
  return strictCap + (relaxedCap - strictCap) * (1 - strictness);
}

/** Binary search for minimum L change from origL that meets minContrast vs bg. */
function searchLightness(
  origL: number,
  c: number,
  h: number,
  bg: string,
  minContrast: number,
  targetL: number,
): { hex: string; found: boolean } {
  let lo = Math.min(origL, targetL);
  let hi = Math.max(origL, targetL);
  let bestHex = '';

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const candidate = lchToHex(mid, c, h);
    if (contrast(candidate, bg) >= minContrast) {
      bestHex = candidate;
      if (targetL > origL) hi = mid;
      else lo = mid;
    } else {
      if (targetL > origL) lo = mid;
      else hi = mid;
    }
  }
  return { hex: bestHex, found: bestHex !== '' };
}

/**
 * Adjust a color to meet a minimum contrast ratio against a background.
 * Adjustment order: lightness → chroma reduction → limited hue shift.
 * Enforces maxDeltaE based on strictness + mode.
 */
export function adjustToContrast(
  color: string,
  bg: string,
  minContrast: number,
  strictness: Strictness,
  mode: ThemeMode,
): AdjustmentResult {
  if (contrast(color, bg) >= minContrast) {
    return { color, deltaE: 0, passes: true };
  }

  const budget = maxDeltaE(strictness, mode);
  const bgLum = relativeLuminance(bg);
  const [origL, origC, origH] = hexToLch(color);
  const targetL = bgLum < 0.5 ? 100 : 0;

  // Phase 1: Lightness-only search
  const p1 = searchLightness(origL, origC, origH, bg, minContrast, targetL);
  if (p1.found) {
    const de = colorDeltaE(color, p1.hex);
    if (de <= budget) {
      return { color: p1.hex, deltaE: de, passes: true };
    }
  }

  // Phase 2: Chroma reduction + lightness re-search
  let bestHex = p1.found ? p1.hex : color;
  let bestPasses = false;

  if (!p1.found || colorDeltaE(color, p1.hex) > budget) {
    let cLo = 0;
    let cHi = origC;

    for (let i = 0; i < 20; i++) {
      const midC = (cLo + cHi) / 2;
      const inner = searchLightness(origL, midC, origH, bg, minContrast, targetL);
      if (inner.found && colorDeltaE(color, inner.hex) <= budget) {
        bestHex = inner.hex;
        bestPasses = true;
        cLo = midC;
      } else {
        cHi = midC;
      }
    }

    if (bestPasses) {
      return { color: bestHex, deltaE: colorDeltaE(color, bestHex), passes: true };
    }
  }

  // Phase 3: Hue shift ±30°
  for (const dir of [-1, 1]) {
    for (let deg = 5; deg <= 30; deg += 5) {
      const shiftedH = (origH + dir * deg + 360) % 360;
      const inner = searchLightness(origL, origC, shiftedH, bg, minContrast, targetL);
      if (inner.found && colorDeltaE(color, inner.hex) <= budget) {
        return { color: inner.hex, deltaE: colorDeltaE(color, inner.hex), passes: true };
      }
    }
  }

  // Budget-capped fallback: return best color within budget even if contrast fails
  const de = colorDeltaE(color, bestHex);
  if (de > budget) {
    // Binary search for max L change within budget
    let bLo = origL;
    let bHi = p1.found ? (targetL > origL ? origL + (targetL - origL) : origL - (origL - targetL)) : targetL;
    // Determine the L of the best phase-1 result
    const [p1L] = p1.found ? hexToLch(p1.hex) : [targetL, origC, origH];
    bLo = Math.min(origL, p1L);
    bHi = Math.max(origL, p1L);
    let cappedHex = color;

    for (let i = 0; i < 20; i++) {
      const mid = (bLo + bHi) / 2;
      const candidate = lchToHex(mid, origC, origH);
      if (colorDeltaE(color, candidate) <= budget) {
        cappedHex = candidate;
        if (targetL > origL) bLo = mid;
        else bHi = mid;
      } else {
        if (targetL > origL) bHi = mid;
        else bLo = mid;
      }
    }
    return { color: cappedHex, deltaE: colorDeltaE(color, cappedHex), passes: false };
  }

  return { color: bestHex, deltaE: de, passes: contrast(bestHex, bg) >= minContrast && de <= budget };
}

// Re-export from tokens.ts to keep existing test imports working
export { evaluateCompatibility, generateTokens } from './tokens';
