import { describe, expect, it } from 'vitest';
import { chroma, deltaE, hexToLch, hexToRgb, lchToHex, relativeLuminance, rgbToHex } from './color';

describe('hexToRgb / rgbToHex', () => {
  it('round-trips common colors', () => {
    for (const hex of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#1a2b3c']) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });

  it('clamps out-of-range values', () => {
    expect(rgbToHex([300, -10, 128])).toBe('#ff0080');
  });
});

describe('relativeLuminance', () => {
  it('black = 0', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('white = 1', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('mid-gray ≈ 0.2', () => {
    const lum = relativeLuminance('#808080');
    expect(lum).toBeGreaterThan(0.18);
    expect(lum).toBeLessThan(0.25);
  });
});

describe('hexToLch / lchToHex', () => {
  it('round-trips for primary colors within ΔE < 1', () => {
    for (const hex of ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000']) {
      const [l, c, h] = hexToLch(hex);
      const result = lchToHex(l, c, h);
      expect(deltaE(hex, result)).toBeLessThan(1);
    }
  });

  it('black has L ≈ 0', () => {
    const [l] = hexToLch('#000000');
    expect(l).toBeCloseTo(0, 0);
  });

  it('white has L ≈ 100', () => {
    const [l] = hexToLch('#ffffff');
    expect(l).toBeCloseTo(100, 0);
  });
});

describe('deltaE', () => {
  it('identical colors = 0', () => {
    expect(deltaE('#abcdef', '#abcdef')).toBeCloseTo(0, 5);
  });

  it('black vs white ≈ 100', () => {
    const d = deltaE('#000000', '#ffffff');
    expect(d).toBeGreaterThan(90);
    expect(d).toBeLessThan(110);
  });
});

describe('chroma', () => {
  it('pure red has high chroma (≈ 104)', () => {
    const c = chroma('#ff0000');
    expect(c).toBeGreaterThan(90);
    expect(c).toBeLessThan(120);
  });

  it('neutral gray has near-zero chroma', () => {
    expect(chroma('#808080')).toBeLessThan(1);
  });
});

describe('gamut clamping', () => {
  it('out-of-gamut LCH produces valid hex', () => {
    // High chroma at mid lightness may be out of sRGB
    const hex = lchToHex(50, 150, 270);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});
