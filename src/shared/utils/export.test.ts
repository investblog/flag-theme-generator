import { describe, expect, it } from 'vitest';
import type { ThemeTokens } from '../types/theme';
import { exportCSS, exportJSON, exportShadcn, exportTailwind, exportTokensStudio } from './export';

const SAMPLE_TOKENS: ThemeTokens = {
  bg: '#1a1a2e',
  surface: '#22223a',
  text: '#e8e8ed',
  mutedText: '#a0a0b0',
  border: '#404060',
  accent: '#ff9933',
  accent2: '#138808',
  accentText: '#ffffff',
  link: '#ff9933',
  focusRing: '#138808',
};

describe('exportCSS', () => {
  it('produces valid CSS custom properties with --uc- prefix', () => {
    const css = exportCSS(SAMPLE_TOKENS);
    expect(css).toContain(':root {');
    expect(css).toContain('--uc-bg: #1a1a2e;');
    expect(css).toContain('--uc-surface: #22223a;');
    expect(css).toContain('--uc-text: #e8e8ed;');
    expect(css).toContain('--uc-muted: #a0a0b0;');
    expect(css).toContain('--uc-border: #404060;');
    expect(css).toContain('--uc-accent: #ff9933;');
    expect(css).toContain('--uc-accent-2: #138808;');
    expect(css).toContain('--uc-accent-text: #ffffff;');
    expect(css).toContain('--uc-link: #ff9933;');
    expect(css).toContain('--uc-focus: #138808;');
  });

  it('has exactly 10 variable declarations', () => {
    const css = exportCSS(SAMPLE_TOKENS);
    const matches = css.match(/--uc-/g);
    expect(matches).toHaveLength(10);
  });
});

describe('exportTailwind', () => {
  it('produces a valid Tailwind config snippet', () => {
    const tw = exportTailwind(SAMPLE_TOKENS);
    expect(tw).toContain('// tailwind.config.js');
    expect(tw).toContain('export default {');
    expect(tw).toContain('uc: {');
    expect(tw).toContain("bg: '#1a1a2e'");
    expect(tw).toContain("accent: '#ff9933'");
  });

  it('uses the uc namespace for all tokens', () => {
    const tw = exportTailwind(SAMPLE_TOKENS);
    expect(tw).toContain("surface: '#22223a'");
    expect(tw).toContain("text: '#e8e8ed'");
    expect(tw).toContain("muted: '#a0a0b0'");
    expect(tw).toContain("focus: '#138808'");
  });
});

describe('exportJSON', () => {
  it('includes meta, tokens, and contrast report', () => {
    const json = exportJSON(SAMPLE_TOKENS, 'IN', 'DARK', 0.7);
    const parsed = JSON.parse(json);
    expect(parsed.meta).toEqual({ countryCode: 'IN', mode: 'DARK', strictness: 0.7 });
    expect(parsed.tokens.bg).toBe('#1a1a2e');
    expect(parsed.tokens.accent).toBe('#ff9933');
    expect(parsed.report.contrast).toBeDefined();
    expect(parsed.report.contrast['text / bg']).toBeGreaterThan(4.5);
  });

  it('includes all 12 required contrast pairs in report', () => {
    const json = exportJSON(SAMPLE_TOKENS, 'IN', 'DARK', 0.7);
    const parsed = JSON.parse(json);
    const pairs = Object.keys(parsed.report.contrast);
    expect(pairs).toHaveLength(12);
    expect(pairs).toContain('text / bg');
    expect(pairs).toContain('accentText / accent');
    expect(pairs).toContain('border / surface');
  });

  it('produces valid JSON', () => {
    const json = exportJSON(SAMPLE_TOKENS, 'JP', 'AMOLED', 0.95);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('exportShadcn', () => {
  it('produces @layer base with shadcn/ui variable names', () => {
    const css = exportShadcn(SAMPLE_TOKENS);
    expect(css).toContain('@layer base {');
    expect(css).toContain(':root {');
    expect(css).toContain('--background:');
    expect(css).toContain('--foreground:');
    expect(css).toContain('--primary:');
    expect(css).toContain('--primary-foreground:');
    expect(css).toContain('--muted-foreground:');
    expect(css).toContain('--border:');
    expect(css).toContain('--ring:');
  });

  it('uses HSL values without hsl() wrapper', () => {
    const css = exportShadcn(SAMPLE_TOKENS);
    // Should contain "H S% L%" format, not hex or hsl()
    expect(css).not.toContain('#');
    expect(css).not.toContain('hsl(');
    // White (#ffffff) should be "0 0% 100%"
    expect(css).toContain('0 0% 100%');
  });

  it('has all 17 shadcn/ui variables', () => {
    const css = exportShadcn(SAMPLE_TOKENS);
    const vars = css.match(/--[\w-]+:/g);
    expect(vars).toHaveLength(17);
  });
});

describe('exportTokensStudio', () => {
  it('produces valid W3C DTCG JSON', () => {
    const json = exportTokensStudio(SAMPLE_TOKENS, 'IN', 'DARK');
    const parsed = JSON.parse(json);
    expect(parsed['flag-theme']).toBeDefined();
    expect(parsed['flag-theme'].$description).toBe('IN DARK');
  });

  it('contains all 10 token roles with $value and $type', () => {
    const json = exportTokensStudio(SAMPLE_TOKENS, 'US', 'LIGHT');
    const parsed = JSON.parse(json);
    const group = parsed['flag-theme'];
    expect(group.bg.$value).toBe('#1a1a2e');
    expect(group.bg.$type).toBe('color');
    expect(group.surface.$value).toBe('#22223a');
    expect(group.accent.$value).toBe('#ff9933');
    expect(group.focus.$value).toBe('#138808');
  });

  it('produces valid JSON', () => {
    const json = exportTokensStudio(SAMPLE_TOKENS, 'JP', 'AMOLED');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
