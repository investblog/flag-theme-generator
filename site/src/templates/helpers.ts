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
  return `<svg class="i i--${id}" width="${size}" height="${size}"><use href="/assets/brand-icons.svg#${id}"/></svg>`;
}

/** Generates `:root { --uc-bg: #...; ... }` content (no wrapper). */
export function cssVarsBlock(tokens: Record<string, string>): string {
  return TOKEN_KEYS.map(k => `--uc-${TOKEN_CSS[k]}: ${tokens[k]};`).join(' ');
}

/** Generates JS object literal `{'bg':'#...','surface':'#...'}` using CSS suffixes as keys. */
export function jsTokenMap(tokens: Record<string, string>): string {
  return '{' + TOKEN_KEYS.map(k => `'${TOKEN_CSS[k]}':'${tokens[k]}'`).join(',') + '}';
}

/** AMO locale prefix mapping (site lang → AMO path segment). */
const AMO_LOCALE: Record<string, string> = {
  en: 'en-US', es: 'es-ES', fr: 'fr', ar: 'en-US', pt: 'pt-PT',
  de: 'de', it: 'it', nl: 'nl', zh: 'zh-CN', ja: 'ja', ko: 'ko', tr: 'tr',
};

/** Localized AMO addon URL. */
export function amoUrl(lang: string): string {
  const loc = AMO_LOCALE[lang] || 'en-US';
  return `https://addons.mozilla.org/${loc}/firefox/addon/flag-theme-generator/`;
}

/** Escape HTML special chars in text content. */
export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Inline puzzle-piece logo SVG (full color, SA flag). */
export function logoSvg(size = 24): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" style="vertical-align:-.15em"><defs><clipPath id="ftlc"><path d="M51.2 51.2h148.48c0 31.1 25.22 56.32 56.32 56.32s56.32-25.22 56.32-56.32H460.8v148.48c-31.1 0-56.32 25.22-56.32 56.32s25.22 56.32 56.32 56.32V460.8H312.32c0-31.1-25.22-56.32-56.32-56.32s-56.32 25.22-56.32 56.32H51.2V312.32c31.1 0 56.32-25.22 56.32-56.32S82.3 199.68 51.2 199.68z"/></clipPath></defs><g clip-path="url(#ftlc)"><path fill="#de3930" d="M0 0h512v512z"/><path fill="#3f419a" d="M0 512h512V0z"/><path fill="#007b4e" d="M0 204.8h512v102.4H0z"/><path fill="#007b4e" d="M153.6 256 512 153.6v204.8z"/><path fill="#de3930" d="M0 0h512v512H0z"/><path fill="#3f419a" d="M0 512h512L0 0z"/><path fill="#fff" d="m128 256 384-145.92v33.28L128 289.28z"/><path fill="#fff" d="m128 222.72 384 145.92v33.28L128 256z"/><path fill="#007b4e" d="m128 256 384-128v256z"/><path fill="#fdb517" d="M0 0v512l174.08-256z"/><path d="M0 0v512l140.8-256z"/></g><path d="M404.48 256c0 31.1 25.21 56.32 56.32 56.32V460.8H312.32c0-31.11-25.22-56.32-56.32-56.32s-56.32 25.21-56.32 56.32H51.2V312.32c31.1 0 56.32-25.22 56.32-56.32S82.3 199.68 51.2 199.68V51.2h148.48c0 31.1 25.21 56.32 56.32 56.32s56.32-25.22 56.32-56.32H460.8v148.48c-31.11 0-56.32 25.21-56.32 56.32Z" fill="none" stroke="#121212" stroke-width="7.68"/></svg>`;
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
