import { describe, expect, it } from 'vitest';
import type { FlagPalette } from '../types/theme';
import { CONTRAST_THRESHOLDS, REQUIRED_PAIRS } from '../types/theme';
import { adjustToContrast, contrast, evaluateCompatibility, generateTokens } from './contrast';

/** Helper: create a minimal FlagPalette for testing */
function makePalette(colors: [string, string, ...string[]], overrides?: Partial<FlagPalette>): FlagPalette {
  return {
    countryCode: 'XX',
    name_en: 'Test',
    name_ru: 'Тест',
    flagColors: colors,
    recommendedLocales: ['en'],
    ...overrides,
  };
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

describe('contrast()', () => {
  it('returns 21 for black on white', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('returns 1 for identical colors', () => {
    expect(contrast('#abcdef', '#abcdef')).toBeCloseTo(1, 1);
  });

  it('is symmetric: contrast(a, b) === contrast(b, a)', () => {
    const a = '#336699';
    const b = '#ffcc00';
    expect(contrast(a, b)).toBeCloseTo(contrast(b, a), 5);
  });

  it('returns a value in [1, 21]', () => {
    const ratio = contrast('#1a2b3c', '#d4e5f6');
    expect(ratio).toBeGreaterThanOrEqual(1);
    expect(ratio).toBeLessThanOrEqual(21);
  });
});

describe('adjustToContrast()', () => {
  it('returns the original color unchanged when it already passes', () => {
    const result = adjustToContrast('#ffffff', '#000000', 4.5, 0.8, 'DARK');
    expect(result.passes).toBe(true);
    expect(result.deltaE).toBeCloseTo(0, 1);
    expect(result.color).toBe('#ffffff');
  });

  it('adjusts a color to meet the minimum contrast', () => {
    // Gray on dark gray — low contrast, should be adjusted
    const result = adjustToContrast('#555555', '#333333', 4.5, 0.5, 'DARK');
    expect(result.passes).toBe(true);
    const ratio = contrast(result.color, '#333333');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('respects deltaE cap — high strictness limits drift', () => {
    const result = adjustToContrast('#555555', '#333333', 4.5, 0.95, 'DARK');
    // Strict mode: deltaE should not exceed ~12
    expect(result.deltaE).toBeLessThanOrEqual(12);
  });

  it('improves contrast monotonically (or returns passes=false)', () => {
    const original = contrast('#666666', '#222222');
    const result = adjustToContrast('#666666', '#222222', 7.0, 0.5, 'DARK');
    if (result.passes) {
      const adjusted = contrast(result.color, '#222222');
      expect(adjusted).toBeGreaterThanOrEqual(original);
    } else {
      // If it can't pass, deltaE cap was hit — that's acceptable
      expect(result.passes).toBe(false);
    }
  });
});

describe('evaluateCompatibility()', () => {
  const palette = makePalette(['#ff0000', '#ffffff', '#0000ff']);

  it('returns a supports object with AMOLED, DARK, LIGHT keys', () => {
    const report = evaluateCompatibility(palette, 0.7);
    expect(report.supports).toHaveProperty('AMOLED');
    expect(report.supports).toHaveProperty('DARK');
    expect(report.supports).toHaveProperty('LIGHT');
  });

  it('sets dominantOnlyRequired when no mode passes', () => {
    // A very neutral palette at very high strictness might fail all modes
    const neutral = makePalette(['#808080', '#909090']);
    const report = evaluateCompatibility(neutral, 0.99);
    if (!report.supports.AMOLED && !report.supports.DARK && !report.supports.LIGHT) {
      expect(report.dominantOnlyRequired).toBe(true);
    }
  });

  it('provides valid reason codes when modes are disabled', () => {
    const report = evaluateCompatibility(palette, 0.7);
    const validCodes = [
      'LOW_CONTRAST_LINK',
      'LOW_CONTRAST_ACCENT_TEXT',
      'EXCESSIVE_COLOR_SHIFT_REQUIRED',
      'NEUTRAL_ONLY_FLAG',
    ];
    for (const reason of report.reasons) {
      expect(validCodes).toContain(reason.code);
    }
  });

  it('returns metrics and adjustments objects', () => {
    const report = evaluateCompatibility(palette, 0.7);
    expect(report.metrics).toBeDefined();
    expect(report.adjustments).toBeDefined();
  });
});

describe('generateTokens()', () => {
  const palette = makePalette(['#002868', '#bf0a30', '#ffffff']);

  it('returns all 10 token keys as valid hex colors', () => {
    const tokens = generateTokens(palette, 'DARK', 0.7);
    const keys: (keyof typeof tokens)[] = [
      'bg',
      'surface',
      'text',
      'mutedText',
      'border',
      'accent',
      'accent2',
      'accentText',
      'link',
      'focusRing',
    ];
    for (const key of keys) {
      expect(tokens[key]).toMatch(HEX_RE);
    }
  });

  it('text/bg contrast meets normalText threshold (≥ 4.5)', () => {
    const tokens = generateTokens(palette, 'DARK', 0.7);
    const ratio = contrast(tokens.text, tokens.bg);
    expect(ratio).toBeGreaterThanOrEqual(CONTRAST_THRESHOLDS.normalText);
  });

  it('DOMINANT_ONLY satisfies all required contrast pairs', () => {
    const tokens = generateTokens(palette, 'DOMINANT_ONLY', 0.7);
    for (const pair of REQUIRED_PAIRS) {
      const ratio = contrast(tokens[pair.a], tokens[pair.b]);
      expect(ratio).toBeGreaterThanOrEqual(pair.threshold);
    }
  });
});
