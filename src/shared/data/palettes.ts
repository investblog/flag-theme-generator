import type { FlagPalette } from '../types/theme';
import { PALETTE_OVERRIDES } from './palette-overrides';
import { GENERATED_PALETTES } from './palettes-generated';

/** Apply manual overrides on top of generated palettes. */
function applyOverrides(): FlagPalette[] {
  return GENERATED_PALETTES.map((p) => {
    const override = PALETTE_OVERRIDES[p.countryCode];
    return override ? { ...p, ...override } : p;
  });
}

/** All flag palettes (~196 countries + Antarctica). */
export const PALETTES: FlagPalette[] = applyOverrides();

/** Lookup a palette by ISO country code. */
export function getPaletteByCode(code: string): FlagPalette | undefined {
  return PALETTES.find((p) => p.countryCode === code);
}

/** Find palettes matching a BCP 47 locale tag (bidirectional prefix match). */
export function getPalettesByLocale(locale: string): FlagPalette[] {
  const lower = locale.toLowerCase();
  return PALETTES.filter((p) =>
    p.recommendedLocales.some((l) => {
      const rl = l.toLowerCase();
      return lower.startsWith(rl) || rl.startsWith(lower);
    }),
  );
}
