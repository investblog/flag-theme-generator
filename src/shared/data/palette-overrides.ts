import type { FlagPalette } from '../types/theme';

/**
 * Manual overrides for generated palettes.
 *
 * Use this to fix bad generation results for specific countries.
 * Keys are ISO 3166-1 alpha-2 country codes (e.g., 'US', 'JP').
 * Override fields replace the generated values — omitted fields keep their generated values.
 *
 * After making changes, run tests to verify:
 *   npm test
 *
 * Example:
 *   'JP': { flagColors: ['#FFFFFF', '#BC002D', '#000000'] }
 */
export const PALETTE_OVERRIDES: Record<string, Partial<FlagPalette>> = {};
