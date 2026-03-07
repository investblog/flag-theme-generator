import { describe, expect, it } from 'vitest';
import { getPaletteByCode } from '../data/palettes';
import type { FlagPalette, ThemeMode } from '../types/theme';
import { REQUIRED_PAIRS } from '../types/theme';
import { deltaE } from './color';
import { contrast } from './contrast';
import { evaluateCompatibility, generateTokens } from './tokens';

function makePalette(colors: [string, string, ...string[]], overrides?: Partial<FlagPalette>): FlagPalette {
  return {
    countryCode: 'XX',
    name_en: 'Test',
    name_ru: 'Test',
    flagColors: colors,
    recommendedLocales: ['en'],
    ...overrides,
  };
}

describe('generateTokens preset validation', () => {
  it('DARK preset-only pairs pass thresholds', () => {
    const palette = makePalette(['#ff0000', '#ffffff']);
    const tokens = generateTokens(palette, 'DARK', 0.7);
    expect(contrast(tokens.text, tokens.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.text, tokens.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.mutedText, tokens.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.border, tokens.bg)).toBeGreaterThanOrEqual(1.5);
    expect(contrast(tokens.border, tokens.surface)).toBeGreaterThanOrEqual(1.5);
  });

  it('AMOLED preset-only pairs pass thresholds', () => {
    const palette = makePalette(['#00ff00', '#ffff00']);
    const tokens = generateTokens(palette, 'AMOLED', 0.7);
    expect(contrast(tokens.text, tokens.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.border, tokens.bg)).toBeGreaterThanOrEqual(1.5);
  });

  it('LIGHT preset-only pairs pass thresholds', () => {
    const palette = makePalette(['#0000ff', '#ff0000']);
    const tokens = generateTokens(palette, 'LIGHT', 0.7);
    expect(contrast(tokens.text, tokens.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.border, tokens.bg)).toBeGreaterThanOrEqual(1.5);
  });
});

describe('generateTokens accentText', () => {
  it('accentText always contrasts >= 4.5 vs accent', () => {
    for (const colors of [
      ['#ff0000', '#ffffff'],
      ['#002868', '#bf0a30', '#ffffff'],
      ['#009639', '#ffffff', '#ce1126'],
    ] as [string, string, ...string[]][]) {
      for (const mode of ['DARK', 'LIGHT', 'AMOLED', 'DOMINANT_ONLY'] as const) {
        const tokens = generateTokens(makePalette(colors), mode, 0.5);
        const ratio = contrast(tokens.accentText, tokens.accent);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe('evaluateCompatibility', () => {
  it('neutral-only flag is detected but does not disable all three theme modes', () => {
    const neutral = makePalette(['#808080', '#909090']);
    const report = evaluateCompatibility(neutral, 0.7);
    expect(report.reasons.some((r) => r.code === 'NEUTRAL_ONLY_FLAG')).toBe(true);
    expect(report.supports.AMOLED).toBe(true);
    expect(report.supports.DARK).toBe(true);
    expect(report.supports.LIGHT).toBe(true);
  });

  it('drift warnings do not automatically disable a mode', () => {
    const palette = makePalette(['#bc002d', '#ffffff']);
    const report = evaluateCompatibility(palette, 0.9);
    const hasDriftReason = report.reasons.some((r) => r.code === 'EXCESSIVE_COLOR_SHIFT_REQUIRED');
    expect(hasDriftReason).toBe(true);
    expect(report.supports.AMOLED || report.supports.DARK || report.supports.LIGHT).toBe(true);
  });

  it('problematic real palettes now support all three modes', () => {
    for (const code of ['PK', 'FI', 'GR', 'SR', 'VA']) {
      const palette = getPaletteByCode(code);
      expect(palette).toBeTruthy();
      if (!palette) continue;
      const report = evaluateCompatibility(palette, 0.7);
      expect(report.supports.AMOLED, `${code} AMOLED`).toBe(true);
      expect(report.supports.DARK, `${code} DARK`).toBe(true);
      expect(report.supports.LIGHT, `${code} LIGHT`).toBe(true);
    }
  });

  it('DOMINANT_ONLY works with any palette', () => {
    const palette = makePalette(['#002868', '#bf0a30', '#ffffff']);
    const tokens = generateTokens(palette, 'DOMINANT_ONLY', 0.7);
    for (const pair of REQUIRED_PAIRS) {
      const ratio = contrast(tokens[pair.a], tokens[pair.b]);
      expect(ratio).toBeGreaterThanOrEqual(pair.threshold);
    }
  });
});

describe('role-based token diversification', () => {
  const twocolorFlags: [string, [string, string, ...string[]]][] = [
    ['Japan', ['#bc002d', '#ffffff']],
    ['Indonesia', ['#ce1126', '#ffffff']],
    ['Turkey', ['#e30a17', '#ffffff']],
    ['USA', ['#002868', '#bf0a30', '#ffffff']],
  ];
  const allModes: ThemeMode[] = ['DARK', 'LIGHT', 'AMOLED', 'DOMINANT_ONLY'];

  it('link differs from accent for representative two-color flags across all modes', () => {
    for (const [name, colors] of twocolorFlags) {
      for (const mode of allModes) {
        const tokens = generateTokens(makePalette(colors), mode, 0.5);
        const de = deltaE(tokens.link, tokens.accent);
        expect(de, `${name} ${mode}: link/accent deltaE=${de.toFixed(1)}`).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('focusRing differs from accent2 for representative two-color flags across all modes', () => {
    for (const [name, colors] of twocolorFlags) {
      for (const mode of allModes) {
        const tokens = generateTokens(makePalette(colors), mode, 0.5);
        const de = deltaE(tokens.focusRing, tokens.accent2);
        expect(de, `${name} ${mode}: focus/accent2 deltaE=${de.toFixed(1)}`).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('interactive roles remain distinct on a three-color flag before post-shift collapse', () => {
    const tokens = generateTokens(makePalette(['#002868', '#bf0a30', '#ffffff']), 'DARK', 0.7);
    expect(deltaE(tokens.link, tokens.accent)).toBeGreaterThanOrEqual(8);
    expect(deltaE(tokens.focusRing, tokens.accent2)).toBeGreaterThanOrEqual(8);
  });

  it('all REQUIRED_PAIRS still pass for representative flags after role assignment', () => {
    for (const [name, colors] of twocolorFlags) {
      for (const mode of allModes) {
        const tokens = generateTokens(makePalette(colors), mode, 0.5);
        for (const pair of REQUIRED_PAIRS) {
          const ratio = contrast(tokens[pair.a], tokens[pair.b]);
          expect(ratio, `${name} ${mode}: ${pair.label} = ${ratio.toFixed(2)} < ${pair.threshold}`).toBeGreaterThanOrEqual(
            pair.threshold,
          );
        }
      }
    }
  });
});

describe('border tinting', () => {
  it('border is tinted for chromatic flags', () => {
    const palette = makePalette(['#002868', '#bf0a30', '#ffffff']);
    const tokens = generateTokens(palette, 'DARK', 0.7);
    expect(tokens.border).not.toBe('#404060');
  });

  it('tinted border still passes contrast thresholds', () => {
    for (const colors of [
      ['#ff0000', '#ffffff'],
      ['#002868', '#bf0a30', '#ffffff'],
      ['#009639', '#ffffff', '#ce1126'],
    ] as [string, string, ...string[]][]) {
      for (const mode of ['DARK', 'LIGHT', 'AMOLED', 'DOMINANT_ONLY'] as const) {
        const tokens = generateTokens(makePalette(colors), mode, 0.7);
        expect(contrast(tokens.border, tokens.bg)).toBeGreaterThanOrEqual(1.5);
        expect(contrast(tokens.border, tokens.surface)).toBeGreaterThanOrEqual(1.5);
      }
    }
  });
});
