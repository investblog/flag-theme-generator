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

/** Inline puzzle-piece logo SVG (branded). */
export function logoSvg(size = 24): string {
  return `<svg class="i" width="${size}" height="${size}" viewBox="0 0 512 512" fill="currentColor"><path d="M404.48 256c0 31.1 25.21 56.32 56.32 56.32V460.8H312.32c0-31.11-25.22-56.32-56.32-56.32s-56.32 25.21-56.32 56.32H51.2V312.32c31.1 0 56.32-25.22 56.32-56.32S82.3 199.68 51.2 199.68V51.2h148.48c0 31.1 25.21 56.32 56.32 56.32s56.32-25.22 56.32-56.32H460.8v148.48c-31.11 0-56.32 25.21-56.32 56.32Z"/></svg>`;
}

/** BreadcrumbList JSON-LD. */
export function breadcrumbLd(items: { name: string; url: string }[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: it.url,
    })),
  });
}
