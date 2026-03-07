import { describe, expect, it } from 'vitest';
import { REQUIRED_PAIRS } from '../types/theme';
import { contrast } from '../utils/contrast';
import { evaluateCompatibility, generateTokens } from '../utils/tokens';
import { getPaletteByCode, getPalettesByLocale, PALETTES } from './palettes';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const WAVE1_CODES = [
  'IN',
  'CN',
  'US',
  'ID',
  'PK',
  'NG',
  'BR',
  'BD',
  'RU',
  'ET',
  'MX',
  'JP',
  'EG',
  'PH',
  'CD',
  'VN',
  'IR',
  'TR',
  'DE',
  'TH',
];

const VALID_REGIONS = new Set(['Africa', 'Americas', 'Antarctica', 'Asia', 'Europe', 'Oceania']);

describe('PALETTES data integrity', () => {
  it('contains at least 190 countries', () => {
    expect(PALETTES.length).toBeGreaterThanOrEqual(190);
  });

  it('includes all Wave 1 country codes', () => {
    const codes = PALETTES.map((p) => p.countryCode);
    for (const code of WAVE1_CODES) {
      expect(codes).toContain(code);
    }
  });

  it('has unique country codes', () => {
    const codes = PALETTES.map((p) => p.countryCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('each palette has 2-6 valid hex colors', () => {
    for (const p of PALETTES) {
      expect(p.flagColors.length).toBeGreaterThanOrEqual(2);
      expect(p.flagColors.length).toBeLessThanOrEqual(6);
      for (const c of p.flagColors) {
        expect(c).toMatch(HEX_RE);
      }
    }
  });

  it('each palette has non-empty names', () => {
    for (const p of PALETTES) {
      expect(p.name_en.length).toBeGreaterThan(0);
      expect(p.name_ru.length).toBeGreaterThan(0);
    }
  });

  it('each palette has at least one locale (except AQ)', () => {
    for (const p of PALETTES) {
      if (p.countryCode === 'AQ') {
        expect(p.recommendedLocales).toHaveLength(0);
      } else {
        expect(p.recommendedLocales.length, `${p.countryCode} should have locales`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('each palette has a valid region', () => {
    for (const p of PALETTES) {
      expect(VALID_REGIONS.has(p.region!), `${p.countryCode} region "${p.region}" is invalid`).toBe(true);
    }
  });
});

describe('palette lookups', () => {
  it('getPaletteByCode returns correct palette', () => {
    const us = getPaletteByCode('US');
    expect(us?.name_en).toBe('United States');
  });

  it('getPaletteByCode returns undefined for unknown code', () => {
    expect(getPaletteByCode('ZZ')).toBeUndefined();
  });

  it('getPalettesByLocale finds palettes by prefix match', () => {
    const results = getPalettesByLocale('en-US');
    expect(results.some((p) => p.countryCode === 'US')).toBe(true);
  });

  it('getPalettesByLocale is case-insensitive', () => {
    const results = getPalettesByLocale('PT-BR');
    expect(results.some((p) => p.countryCode === 'BR')).toBe(true);
  });
});

describe('pipeline smoke test all palettes', { timeout: 60_000 }, () => {
  it('every palette generates valid DOMINANT_ONLY tokens passing all pairs', () => {
    for (const palette of PALETTES) {
      const tokens = generateTokens(palette, 'DOMINANT_ONLY', 0.7);
      for (const pair of REQUIRED_PAIRS) {
        const ratio = contrast(tokens[pair.a], tokens[pair.b]);
        expect(ratio, `${palette.countryCode} ${pair.label}`).toBeGreaterThanOrEqual(pair.threshold);
      }
    }
  });

  it('every palette produces a well-formed compatibility report', () => {
    for (const palette of PALETTES) {
      const report = evaluateCompatibility(palette, 0.7);
      expect(report.supports).toHaveProperty('AMOLED');
      expect(report.supports).toHaveProperty('DARK');
      expect(report.supports).toHaveProperty('LIGHT');
      expect(report.metrics).toBeDefined();
      expect(report.adjustments).toBeDefined();
      expect(report.quality).toBeDefined();
      for (const mode of ['AMOLED', 'DARK', 'LIGHT'] as const) {
        expect(report.quality[mode].score).toBeGreaterThanOrEqual(0);
        expect(report.quality[mode].score).toBeLessThanOrEqual(100);
        expect(report.quality[mode].warnings).toBeInstanceOf(Array);
      }
    }
  });
});
