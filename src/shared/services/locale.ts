import { getPalettesByLocale, PALETTES } from '../data/palettes';
import type { FlagPalette } from '../types/theme';

/** Detect the browser UI locale via browser.i18n API. */
export function detectLocale(): string {
  try {
    return browser.i18n.getUILanguage();
  } catch {
    return 'en';
  }
}

/**
 * Map a BCP 47 locale to matching palettes.
 * Tries full tag first, then primary subtag.
 */
export function matchPalettesForLocale(locale: string): FlagPalette[] {
  const results = getPalettesByLocale(locale);
  if (results.length > 0) return results;

  // Fallback: try primary subtag (e.g. 'en-US' → 'en')
  const primary = locale.split('-')[0];
  if (primary !== locale) {
    return getPalettesByLocale(primary);
  }
  return [];
}

/**
 * Check if a locale is ambiguous (maps to multiple countries).
 * E.g. 'en' matches US, IN, NG — user must choose.
 */
export function isAmbiguousLocale(locale: string): boolean {
  return matchPalettesForLocale(locale).length > 1;
}

/**
 * Get the best single palette for a locale, or null if ambiguous/unknown.
 * Returns a palette only when the locale uniquely identifies one country.
 */
export function getRecommendedPalette(locale: string): FlagPalette | null {
  const matches = matchPalettesForLocale(locale);
  return matches.length === 1 ? matches[0] : null;
}

/** Get all unique regions from the palette data. */
export function getRegions(): string[] {
  const regions = new Set<string>();
  for (const p of PALETTES) {
    if (p.region) regions.add(p.region);
  }
  return [...regions].sort();
}
