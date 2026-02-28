import type { ThemeMode, ThemeTokens } from '../types/theme';
import { REQUIRED_PAIRS } from '../types/theme';
import { contrast } from './contrast';

/** Map token keys to their CSS variable names with --uc- prefix per spec §8.3 */
const TOKEN_CSS_MAP: Record<keyof ThemeTokens, string> = {
  bg: '--uc-bg',
  surface: '--uc-surface',
  text: '--uc-text',
  mutedText: '--uc-muted',
  border: '--uc-border',
  accent: '--uc-accent',
  accent2: '--uc-accent-2',
  accentText: '--uc-accent-text',
  link: '--uc-link',
  focusRing: '--uc-focus',
};

/** Map token keys to their Tailwind namespace keys */
const TOKEN_TW_MAP: Record<keyof ThemeTokens, string> = {
  bg: 'bg',
  surface: 'surface',
  text: 'text',
  mutedText: 'muted',
  border: 'border',
  accent: 'accent',
  accent2: 'accent2',
  accentText: 'accentText',
  link: 'link',
  focusRing: 'focus',
};

/** Generate CSS custom properties block */
export function exportCSS(tokens: ThemeTokens): string {
  const lines = Object.entries(TOKEN_CSS_MAP).map(
    ([key, varName]) => `  ${varName}: ${tokens[key as keyof ThemeTokens]};`,
  );
  return `:root {\n${lines.join('\n')}\n}`;
}

/** Generate Tailwind config snippet */
export function exportTailwind(tokens: ThemeTokens): string {
  const entries = Object.entries(TOKEN_TW_MAP).map(
    ([key, twKey]) => `          ${twKey}: '${tokens[key as keyof ThemeTokens]}'`,
  );
  return `// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        uc: {
${entries.join(',\n')}
        }
      }
    }
  }
}`;
}

/** Compute contrast ratios for the 5 key pairs shown in WCAG summary */
function computeContrastReport(tokens: ThemeTokens): Record<string, number> {
  const report: Record<string, number> = {};
  for (const pair of REQUIRED_PAIRS) {
    const ratio = contrast(tokens[pair.a], tokens[pair.b]);
    report[pair.label] = Math.round(ratio * 100) / 100;
  }
  return report;
}

/** Generate JSON tokens export with metadata and contrast report */
export function exportJSON(tokens: ThemeTokens, countryCode: string, mode: ThemeMode, strictness: number): string {
  const output = {
    meta: { countryCode, mode, strictness },
    tokens: { ...tokens },
    report: { contrast: computeContrastReport(tokens) },
  };
  return JSON.stringify(output, null, 2);
}
