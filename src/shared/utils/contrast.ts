import type {
  AdjustmentResult,
  CompatibilityReport,
  FlagPalette,
  Strictness,
  ThemeMode,
  ThemeTokens,
} from '../types/theme';

/**
 * Calculate WCAG 2.1 contrast ratio between two colors.
 * @param color1 Hex color string (e.g. '#ffffff')
 * @param color2 Hex color string (e.g. '#000000')
 * @returns Contrast ratio in range [1, 21]
 */
export function contrast(color1: string, color2: string): number {
  throw new Error('Not implemented');
}

/**
 * Adjust a color to meet a minimum contrast ratio against a background.
 * Adjustment order: lightness → saturation → limited hue shift.
 * Enforces maxDeltaE based on strictness + mode.
 */
export function adjustToContrast(
  color: string,
  bg: string,
  minContrast: number,
  strictness: Strictness,
  mode: ThemeMode,
): AdjustmentResult {
  throw new Error('Not implemented');
}

/**
 * Evaluate which theme modes a palette can support at a given strictness.
 * Returns a full compatibility report with metrics, reasons, and adjustments.
 */
export function evaluateCompatibility(palette: FlagPalette, strictness: Strictness): CompatibilityReport {
  throw new Error('Not implemented');
}

/**
 * Generate the 10 ThemeTokens from a palette, mode, and strictness.
 * All required contrast pairs are validated.
 */
export function generateTokens(palette: FlagPalette, mode: ThemeMode, strictness: Strictness): ThemeTokens {
  throw new Error('Not implemented');
}
