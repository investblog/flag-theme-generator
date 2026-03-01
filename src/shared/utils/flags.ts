import * as allFlags from 'country-flag-icons/string/3x2';

const FLAG_SVG = allFlags as Record<string, string>;

export function getFlagSvg(countryCode: string): string | undefined {
  return FLAG_SVG[countryCode.toUpperCase()];
}
