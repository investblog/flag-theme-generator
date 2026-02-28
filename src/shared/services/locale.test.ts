import { describe, expect, it } from 'vitest';
import { getRecommendedPalette, getRegions, isAmbiguousLocale, matchPalettesForLocale } from './locale';

describe('matchPalettesForLocale', () => {
  it('matches exact locale tag', () => {
    const results = matchPalettesForLocale('pt-BR');
    expect(results.some((p) => p.countryCode === 'BR')).toBe(true);
  });

  it('falls back to primary subtag', () => {
    const results = matchPalettesForLocale('de-AT');
    expect(results.some((p) => p.countryCode === 'DE')).toBe(true);
  });

  it('returns empty for unknown locale', () => {
    expect(matchPalettesForLocale('xx-YY')).toHaveLength(0);
  });

  it('returns multiple matches for ambiguous locale', () => {
    // 'en' matches US (en-US, en) and IN (en-IN) and NG (en-NG)
    const results = matchPalettesForLocale('en');
    expect(results.length).toBeGreaterThan(1);
  });
});

describe('isAmbiguousLocale', () => {
  it('en is ambiguous (matches US, IN, NG)', () => {
    expect(isAmbiguousLocale('en')).toBe(true);
  });

  it('ja is not ambiguous (matches only JP)', () => {
    expect(isAmbiguousLocale('ja')).toBe(false);
  });

  it('unknown locale is not ambiguous (0 matches)', () => {
    expect(isAmbiguousLocale('xx')).toBe(false);
  });
});

describe('getRecommendedPalette', () => {
  it('returns single match for unambiguous locale', () => {
    const palette = getRecommendedPalette('ja');
    expect(palette?.countryCode).toBe('JP');
  });

  it('returns null for ambiguous locale', () => {
    expect(getRecommendedPalette('en')).toBeNull();
  });

  it('returns null for unknown locale', () => {
    expect(getRecommendedPalette('xx')).toBeNull();
  });
});

describe('getRegions', () => {
  it('returns sorted unique regions', () => {
    const regions = getRegions();
    expect(regions).toContain('Asia');
    expect(regions).toContain('Europe');
    expect(regions).toContain('Africa');
    expect(regions).toContain('Americas');
    // Sorted
    expect(regions).toEqual([...regions].sort());
  });
});
