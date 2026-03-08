/**
 * flagtheme.com — static site generator.
 * Generates country pages (3 modes), Chrome themes, homepage,
 * catalog, region hubs, sprites, sitemap.
 * Generates localized country pages for non-EN languages.
 *
 * Run: npm run build (from site/)
 */
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import * as allFlags from 'country-flag-icons/string/3x2';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateChromeThemeZip, type ThemeInput, type ThemeAssets } from './chrome-theme.js';
import { buildUISprite, buildBrandSprite } from './sprites.js';
import { slugify, regionSlug, SITE_URL } from './templates/helpers.js';
import { countryPage, type CountryPageData } from './templates/country.js';
import { homePage } from './templates/homepage.js';
import { catalogPage } from './templates/catalog.js';
import { regionPage } from './templates/region.js';
import { registerLang, getCountryName } from './i18n/countries.js';
import { strings } from './i18n/strings.js';
import type { HreflangEntry } from './templates/layout.js';

import type { FlagPalette } from '../../src/shared/types/theme';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MONO_ROOT = resolve(ROOT, '..');
const shared = (p: string) => resolve(MONO_ROOT, 'src/shared', p);
const DIST = resolve(ROOT, 'dist');
const CSS_SRC = resolve(ROOT, 'src/assets/css/site.css');

const THEME_ASSETS: ThemeAssets = {
  mapSvgPath: resolve(MONO_ROOT, 'temp/world-map.min.svg'),
  fontPath: resolve(MONO_ROOT, 'temp/fonts/NotoSans-Regular.ttf'),
};

// Dynamic imports for shared modules (TS source via tsx)
const { PALETTES } = await import(pathToFileURL(shared('data/palettes.ts')).href);
const { generateTokens } = await import(pathToFileURL(shared('utils/tokens.ts')).href);

// --- config ---
const MODES = ['dark', 'light', 'amoled'] as const;
const MODE_API: Record<string, string> = { dark: 'DARK', light: 'LIGHT', amoled: 'AMOLED' };
const DEFAULT_MODE = 'dark';
const STRICTNESS = 0.7;
const POPULAR_CODES = [
  'US', 'GB', 'JP', 'BR', 'IN', 'DE', 'FR', 'IT', 'ES', 'MX',
  'CA', 'AU', 'KR', 'TR', 'PL', 'NL', 'SE', 'NO', 'CH', 'ZA',
];

/** Supported locales for full i18n (must have entries in strings.ts). */
const SUPPORTED_LANGS = new Set(Object.keys(strings));

// --- flags ---
const SKIP_ZIPS = process.argv.includes('--skip-zips');

// --- helpers ---
const FLAG_SVG = allFlags as Record<string, string>;

function getFlagSvg(code: string): string | undefined {
  return FLAG_SVG[code.toUpperCase()];
}

function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

/** Extract the primary non-EN base language from recommendedLocales. */
function getPrimaryLang(locales: string[]): string | null {
  for (const loc of locales) {
    const base = loc.split('-')[0];
    if (base !== 'en' && SUPPORTED_LANGS.has(base)) return base;
  }
  return null;
}

// --- start ---
const palettes = PALETTES as FlagPalette[];
console.log(`Building flagtheme.com — ${palettes.length} countries × ${MODES.length} modes\n`);
const startTime = Date.now();

// --- Register all supported locale data for country name lookups ---
for (const lang of SUPPORTED_LANGS) {
  if (lang !== 'en') await registerLang(lang);
}

// --- directories ---
ensureDir(DIST);
ensureDir(resolve(DIST, 'countries'));
ensureDir(resolve(DIST, 'downloads'));
ensureDir(resolve(DIST, 'regions'));
ensureDir(resolve(DIST, 'assets'));

// --- static assets ---
writeFileSync(resolve(DIST, 'assets', 'ui-icons.svg'), buildUISprite());
writeFileSync(resolve(DIST, 'assets', 'brand-icons.svg'), buildBrandSprite());
copyFileSync(CSS_SRC, resolve(DIST, 'assets', 'site.css'));
console.log('  Static assets copied (sprites + CSS)');

// --- precompute region data ---
const regionMap = new Map<string, FlagPalette[]>();
for (const p of palettes) {
  const r = p.region || 'Other';
  if (!regionMap.has(r)) regionMap.set(r, []);
  regionMap.get(r)!.push(p);
}
const regionList = [...regionMap.entries()]
  .filter(([name]) => name !== 'Antarctica')
  .map(([name, members]) => ({ name, slug: regionSlug(name), count: members.length }))
  .sort((a, b) => a.name.localeCompare(b.name));

// --- precompute which countries get localized pages ---
interface LocalizedEntry {
  palette: FlagPalette;
  lang: string;
  localizedName: string;
}
const localizedEntries: LocalizedEntry[] = [];
for (const palette of palettes) {
  const lang = getPrimaryLang(palette.recommendedLocales || []);
  if (lang) {
    const localizedName = getCountryName(palette.countryCode, lang, palette.name_en);
    localizedEntries.push({ palette, lang, localizedName });
  }
}
// Map: countryCode → lang for hreflang generation
const countryLangMap = new Map<string, string>();
for (const entry of localizedEntries) {
  countryLangMap.set(entry.palette.countryCode, entry.lang);
}

// --- track sitemap ---
interface SitemapEntry {
  loc: string;
  alternates?: { lang: string; href: string }[];
}
const sitemapEntries: SitemapEntry[] = [{ loc: SITE_URL + '/' }];

// --- generate country pages + Chrome themes ---
let count = 0;
for (const palette of palettes) {
  const slug = slugify(palette.name_en);
  const countryDir = resolve(DIST, 'countries', slug);
  ensureDir(countryDir);

  // Generate tokens for all modes
  const allTokens: Record<string, Record<string, string>> = {};
  for (const mode of MODES) {
    allTokens[mode] = generateTokens(palette, MODE_API[mode], STRICTNESS);
  }

  // Generate Chrome theme .zip for each mode (skip if already cached)
  if (!SKIP_ZIPS) {
    for (const mode of MODES) {
      const zipName = `${palette.countryCode.toLowerCase()}-${mode}.zip`;
      const zipPath = resolve(DIST, 'downloads', zipName);
      if (existsSync(zipPath)) continue;
      const themeInput: ThemeInput = {
        countryCode: palette.countryCode,
        name: palette.name_en,
        mode: MODE_API[mode],
        flagColors: palette.flagColors,
        tokens: allTokens[mode],
      };
      const zipBuffer = await generateChromeThemeZip(themeInput, THEME_ASSETS);
      writeFileSync(zipPath, zipBuffer);
    }
  }

  // Similar countries: same region, exclude self, max 6
  const region = palette.region || 'Other';
  const similar = (regionMap.get(region) || [])
    .filter(p => p.countryCode !== palette.countryCode)
    .slice(0, 6)
    .map(p => ({ name: p.name_en, slug: slugify(p.name_en), flagColors: p.flagColors as string[] }));

  // Build hreflang entries
  const hreflang: HreflangEntry[] = [
    { lang: 'x-default', href: `${SITE_URL}/countries/${slug}/` },
    { lang: 'en', href: `${SITE_URL}/countries/${slug}/` },
  ];
  const altLang = countryLangMap.get(palette.countryCode);
  if (altLang) {
    hreflang.push({ lang: altLang, href: `${SITE_URL}/${altLang}/countries/${slug}/` });
  }

  // Render EN country page
  const data: CountryPageData = {
    countryCode: palette.countryCode,
    name: palette.name_en,
    slug,
    flagColors: palette.flagColors as string[],
    region,
    regionSlug: regionSlug(region),
    tokens: allTokens,
    defaultMode: DEFAULT_MODE,
    similarCountries: similar,
    flagSvg: getFlagSvg(palette.countryCode),
    lang: 'en',
    hreflang,
  };
  writeFileSync(resolve(countryDir, 'index.html'), countryPage(data));
  sitemapEntries.push({ loc: `${SITE_URL}/countries/${slug}/`, alternates: hreflang });

  count++;
  if (count % 20 === 0) process.stdout.write(`  ${count}/${palettes.length}...\n`);
}
console.log(`  ${palettes.length} country pages + ${palettes.length * MODES.length} Chrome themes generated`);

// --- generate localized country pages ---
let l10nCount = 0;
for (const { palette, lang, localizedName } of localizedEntries) {
  const slug = slugify(palette.name_en);
  const langDir = resolve(DIST, lang, 'countries', slug);
  ensureDir(langDir);

  // Recompute tokens (same as EN)
  const allTokens: Record<string, Record<string, string>> = {};
  for (const mode of MODES) {
    allTokens[mode] = generateTokens(palette, MODE_API[mode], STRICTNESS);
  }

  const region = palette.region || 'Other';
  const similar = (regionMap.get(region) || [])
    .filter(p => p.countryCode !== palette.countryCode)
    .slice(0, 6)
    .map(p => ({
      name: getCountryName(p.countryCode, lang, p.name_en),
      slug: slugify(p.name_en),
      flagColors: p.flagColors as string[],
    }));

  const hreflang: HreflangEntry[] = [
    { lang: 'x-default', href: `${SITE_URL}/countries/${slug}/` },
    { lang: 'en', href: `${SITE_URL}/countries/${slug}/` },
    { lang, href: `${SITE_URL}/${lang}/countries/${slug}/` },
  ];

  const data: CountryPageData = {
    countryCode: palette.countryCode,
    name: palette.name_en,
    slug,
    flagColors: palette.flagColors as string[],
    region,
    regionSlug: regionSlug(region),
    tokens: allTokens,
    defaultMode: DEFAULT_MODE,
    similarCountries: similar,
    flagSvg: getFlagSvg(palette.countryCode),
    localizedName,
    lang,
    hreflang,
  };
  writeFileSync(resolve(langDir, 'index.html'), countryPage(data));
  sitemapEntries.push({ loc: `${SITE_URL}/${lang}/countries/${slug}/`, alternates: hreflang });
  l10nCount++;
}
console.log(`  ${l10nCount} localized country pages generated (${[...new Set(localizedEntries.map(e => e.lang))].sort().join(', ')})`);

// --- catalog page ---
const catalogData = {
  countries: palettes.map(p => ({
    name: p.name_en,
    slug: slugify(p.name_en),
    flagColors: p.flagColors as string[],
    region: p.region || 'Other',
  })),
  regions: regionList,
};
writeFileSync(resolve(DIST, 'countries', 'index.html'), catalogPage(catalogData));
sitemapEntries.push({ loc: `${SITE_URL}/countries/` });
console.log('  Catalog page generated');

// --- region pages ---
for (const [rName, members] of regionMap) {
  if (rName === 'Antarctica') continue;
  const rSlug = regionSlug(rName);
  const rDir = resolve(DIST, 'regions', rSlug);
  ensureDir(rDir);

  writeFileSync(resolve(rDir, 'index.html'), regionPage({
    name: rName,
    slug: rSlug,
    countries: members.map(p => ({
      name: p.name_en,
      slug: slugify(p.name_en),
      flagColors: p.flagColors as string[],
    })),
    allRegions: regionList,
  }));
  sitemapEntries.push({ loc: `${SITE_URL}/regions/${rSlug}/` });
}
console.log(`  ${regionMap.size - 1} region pages generated`);

// --- homepage ---
const popular = POPULAR_CODES
  .map(code => palettes.find(p => p.countryCode === code))
  .filter(Boolean)
  .map(p => ({ name: p!.name_en, slug: slugify(p!.name_en), flagColors: p!.flagColors as string[] }));
const allCountries = palettes.map(p => ({ name: p.name_en, slug: slugify(p.name_en), code: p.countryCode }));

writeFileSync(resolve(DIST, 'index.html'), homePage({
  popularCountries: popular,
  regions: regionList,
  allCountries,
  totalCount: palettes.length,
}));
console.log('  Homepage generated');

// --- sitemap.xml ---
const lastmod = new Date().toISOString().split('T')[0];
function sitemapUrl(entry: SitemapEntry): string {
  const lines = [`  <url>`, `    <loc>${entry.loc}</loc>`, `    <lastmod>${lastmod}</lastmod>`];
  if (entry.alternates) {
    for (const alt of entry.alternates) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${alt.href}"/>`);
    }
  }
  lines.push(`  </url>`);
  return lines.join('\n');
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapEntries.map(sitemapUrl).join('\n')}
</urlset>`;
copyFileSync(resolve(ROOT, 'src/assets/sitemap.xsl'), resolve(DIST, 'sitemap.xsl'));
writeFileSync(resolve(DIST, 'sitemap.xml'), sitemap);

// --- robots.txt ---
writeFileSync(resolve(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nDone in ${elapsed}s — ${sitemapEntries.length} pages → ${DIST}`);
