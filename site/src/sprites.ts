/**
 * SVG sprite builder.
 * Reads icons from @mdi/svg, produces two sprite files:
 *   - ui-icons.svg   (currentColor — inherits from CSS)
 *   - brand-icons.svg (preserved brand colors)
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const MDI = resolve(DIR, '../node_modules/@mdi/svg/svg');

// --- UI icons (fill: currentColor) ---
const UI_ICONS: Record<string, string> = {
  'magnify': 'magnify',
  'copy': 'content-copy',
  'check': 'check',
  'check-circle': 'check-circle-outline',
  'download': 'download',
  'external': 'open-in-new',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'close': 'close',
  'theme-toggle': 'theme-light-dark',
  'translate': 'translate',
  'menu': 'menu',
  'globe': 'earth',
  'star': 'star-outline',
  'arrow-right': 'arrow-right',
  'palette': 'palette',
  'info': 'information-outline',
  'share': 'share-variant',
  'filter': 'filter-variant',
};

// --- Brand icons (explicit fill color) ---
const BRAND_ICONS: Record<string, { file: string; color: string }> = {
  'chrome': { file: 'google-chrome', color: '#4285F4' },
  'firefox': { file: 'firefox', color: '#FF7139' },
  'edge': { file: 'microsoft-edge', color: '#0078D7' },
  'brave': { file: 'shield-half-full', color: '#FB542B' },
};

function extractPath(name: string): string {
  const svg = readFileSync(resolve(MDI, `${name}.svg`), 'utf-8');
  const m = svg.match(/<path d="([^"]+)"/);
  if (!m) throw new Error(`No <path> in ${name}.svg`);
  return m[1];
}

export function buildUISprite(): string {
  const symbols = Object.entries(UI_ICONS)
    .map(([id, file]) =>
      `  <symbol id="${id}" viewBox="0 0 24 24"><path d="${extractPath(file)}"/></symbol>`)
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols}\n</svg>\n`;
}

export function buildBrandSprite(): string {
  const symbols = Object.entries(BRAND_ICONS)
    .map(([id, { file, color }]) =>
      `  <symbol id="${id}" viewBox="0 0 24 24"><path fill="${color}" d="${extractPath(file)}"/></symbol>`)
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols}\n</svg>\n`;
}
