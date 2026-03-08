/**
 * flagtheme.com — static site generator.
 * Generates country pages (3 modes), Chrome themes, homepage,
 * catalog, region hubs, sprites, sitemap.
 *
 * Run: npm run build (from site/)
 */
import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateChromeThemeZip, type ThemeInput, type ThemeAssets } from './chrome-theme.js';
import { buildUISprite, buildBrandSprite } from './sprites.js';
import { slugify, regionSlug, SITE_URL } from './templates/helpers.js';
import { countryPage, type CountryPageData } from './templates/country.js';
import { homePage } from './templates/homepage.js';
import { catalogPage } from './templates/catalog.js';
import { regionPage } from './templates/region.js';

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

// --- helpers ---
function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

// --- start ---
const palettes = PALETTES as FlagPalette[];
console.log(`Building flagtheme.com — ${palettes.length} countries × ${MODES.length} modes\n`);
const startTime = Date.now();

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

// --- track sitemap ---
const sitemapUrls: string[] = [SITE_URL + '/'];

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

  // Generate Chrome theme .zip for each mode
  for (const mode of MODES) {
    const themeInput: ThemeInput = {
      countryCode: palette.countryCode,
      name: palette.name_en,
      mode: MODE_API[mode],
      flagColors: palette.flagColors,
      tokens: allTokens[mode],
    };
    const zipBuffer = await generateChromeThemeZip(themeInput, THEME_ASSETS);
    const zipName = `${palette.countryCode.toLowerCase()}-${mode}.zip`;
    writeFileSync(resolve(DIST, 'downloads', zipName), zipBuffer);
  }

  // Similar countries: same region, exclude self, max 6
  const region = palette.region || 'Other';
  const similar = (regionMap.get(region) || [])
    .filter(p => p.countryCode !== palette.countryCode)
    .slice(0, 6)
    .map(p => ({ name: p.name_en, slug: slugify(p.name_en), flagColors: p.flagColors as string[] }));

  // Render country page
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
  };
  writeFileSync(resolve(countryDir, 'index.html'), countryPage(data));
  sitemapUrls.push(`${SITE_URL}/countries/${slug}/`);

  count++;
  if (count % 20 === 0) process.stdout.write(`  ${count}/${palettes.length}...\n`);
}
console.log(`  ${palettes.length} country pages + ${palettes.length * MODES.length} Chrome themes generated`);

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
sitemapUrls.push(`${SITE_URL}/countries/`);
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
  sitemapUrls.push(`${SITE_URL}/regions/${rSlug}/`);
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
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemapindex.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;
writeFileSync(resolve(DIST, 'sitemap.xml'), sitemap);

// --- robots.txt ---
writeFileSync(resolve(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nDone in ${elapsed}s — ${sitemapUrls.length} pages → ${DIST}`);
