/**
 * Shared template helpers.
 */
export const SITE_URL = 'https://flagtheme.com';

export const TOKEN_KEYS = [
  'bg', 'surface', 'text', 'mutedText', 'border',
  'accent', 'accent2', 'accentText', 'link', 'focusRing',
] as const;

/** Maps ThemeTokens keys → CSS variable suffixes (--uc-{suffix}). */
export const TOKEN_CSS: Record<string, string> = {
  bg: 'bg', surface: 'surface', text: 'text', mutedText: 'muted-text',
  border: 'border', accent: 'accent', accent2: 'accent2',
  accentText: 'accent-text', link: 'link', focusRing: 'focus-ring',
};

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function regionSlug(region: string): string {
  return region.toLowerCase().replace(/\s+/g, '-');
}

export function icon(id: string, size = 20): string {
  return `<svg class="i" width="${size}" height="${size}"><use href="/assets/ui-icons.svg#${id}"/></svg>`;
}

export function brandIcon(id: string, size = 20): string {
  return `<svg class="i" width="${size}" height="${size}"><use href="/assets/brand-icons.svg#${id}"/></svg>`;
}

/** Generates `:root { --uc-bg: #...; ... }` content (no wrapper). */
export function cssVarsBlock(tokens: Record<string, string>): string {
  return TOKEN_KEYS.map(k => `--uc-${TOKEN_CSS[k]}: ${tokens[k]};`).join(' ');
}

/** Generates JS object literal `{'bg':'#...','surface':'#...'}` using CSS suffixes as keys. */
export function jsTokenMap(tokens: Record<string, string>): string {
  return '{' + TOKEN_KEYS.map(k => `'${TOKEN_CSS[k]}':'${tokens[k]}'`).join(',') + '}';
}

/** Escape HTML special chars in text content. */
export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
