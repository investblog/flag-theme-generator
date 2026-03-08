/**
 * flagtheme.com — static site generator.
 * Generates country pages, Chrome themes, homepage, sitemap.
 *
 * Run: npm run build (from site/)
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateChromeThemeZip, type ThemeInput, type ThemeAssets } from './chrome-theme.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MONO_ROOT = resolve(ROOT, '..');
const shared = (p: string) => resolve(MONO_ROOT, 'src/shared', p);
const DIST = resolve(ROOT, 'dist');

const THEME_ASSETS: ThemeAssets = {
  mapSvgPath: resolve(MONO_ROOT, 'temp/world-map.min.svg'),
  fontPath: resolve(MONO_ROOT, 'temp/fonts/NotoSans-Regular.ttf'),
};

// Dynamic imports for shared modules (TS source via tsx)
const { PALETTES } = await import(pathToFileURL(shared('data/palettes.ts')).href);
const { generateTokens } = await import(pathToFileURL(shared('utils/tokens.ts')).href);

import type { FlagPalette } from '../../src/shared/types/theme';

// --- config ---
const MODES = ['DARK'] as const; // MVP: DARK only, expand to LIGHT/AMOLED later
const STRICTNESS = 0.7;
const SITE_URL = 'https://flagtheme.com';

// --- helpers ---
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

// --- build steps ---
console.log(`Building flagtheme.com — ${PALETTES.length} countries × ${MODES.length} modes\n`);
const startTime = Date.now();

ensureDir(DIST);
ensureDir(resolve(DIST, 'countries'));
ensureDir(resolve(DIST, 'downloads'));

// Track all pages for sitemap
const sitemapUrls: string[] = [SITE_URL + '/'];

// --- generate country pages + Chrome themes ---
let count = 0;
for (const palette of PALETTES as FlagPalette[]) {
  const slug = slugify(palette.name_en);
  const countryDir = resolve(DIST, 'countries', slug);
  ensureDir(countryDir);

  for (const mode of MODES) {
    const tokens = generateTokens(palette, mode, STRICTNESS);

    // Generate Chrome theme .zip
    const themeInput: ThemeInput = {
      countryCode: palette.countryCode,
      name: palette.name_en,
      mode,
      flagColors: palette.flagColors,
      tokens,
    };
    const zipBuffer = await generateChromeThemeZip(themeInput, THEME_ASSETS);
    const zipName = `${palette.countryCode.toLowerCase()}-${mode.toLowerCase()}.zip`;
    writeFileSync(resolve(DIST, 'downloads', zipName), zipBuffer);

    // Country page
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${palette.name_en} Browser Theme — Flag Theme</title>
  <meta name="description" content="Download a ${palette.name_en} flag-inspired browser theme for Chrome and Firefox. Free, beautiful, WCAG-accessible.">
  <style>
    :root {
      --uc-bg: ${tokens.bg};
      --uc-surface: ${tokens.surface};
      --uc-text: ${tokens.text};
      --uc-muted-text: ${tokens.mutedText};
      --uc-border: ${tokens.border};
      --uc-accent: ${tokens.accent};
      --uc-accent2: ${tokens.accent2};
      --uc-accent-text: ${tokens.accentText};
      --uc-link: ${tokens.link};
      --uc-focus-ring: ${tokens.focusRing};
    }
    body { background: var(--uc-bg); color: var(--uc-text); font-family: system-ui, sans-serif; margin: 0; padding: 2rem; }
    h1 { color: var(--uc-accent); }
    a { color: var(--uc-link); }
    .chip { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 1rem; background: var(--uc-surface); border: 1px solid var(--uc-border); color: var(--uc-muted-text); font-size: 0.875rem; }
  </style>
</head>
<body>
  <h1>${palette.name_en} Browser Theme</h1>
  <p>A beautiful browser theme inspired by the flag of ${palette.name_en}.</p>
  <p>
    <span class="chip">${mode}</span>
    <span class="chip">${palette.flagColors.length} colors</span>
  </p>
  <p><a href="/downloads/${palette.countryCode.toLowerCase()}-${mode.toLowerCase()}.zip">Download for Chrome</a></p>
  <p><a href="/countries/">← All countries</a></p>
</body>
</html>`;

    writeFileSync(resolve(countryDir, 'index.html'), html);
  }

  sitemapUrls.push(`${SITE_URL}/countries/${slug}/`);
  count++;
  if (count % 20 === 0) process.stdout.write(`  ${count}/${PALETTES.length}...\n`);
}

console.log(`  ${PALETTES.length} country pages + Chrome themes generated`);

// --- countries index ---
const countriesIndex = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Country Themes — Flag Theme</title>
  <style>body { font-family: system-ui, sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
  .card { padding: 1rem; border-radius: 0.5rem; border: 1px solid #ddd; text-decoration: none; color: inherit; }
  .card:hover { background: #f5f5f5; }</style>
</head>
<body>
  <h1>All Country Themes</h1>
  <div class="grid">
    ${(PALETTES as FlagPalette[]).map((p: FlagPalette) =>
      `<a class="card" href="/countries/${slugify(p.name_en)}/">${p.name_en}</a>`
    ).join('\n    ')}
  </div>
</body>
</html>`;

writeFileSync(resolve(DIST, 'countries', 'index.html'), countriesIndex);
sitemapUrls.push(`${SITE_URL}/countries/`);

// --- homepage (placeholder) ---
const homepage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flag Theme — Browser Themes Inspired by Country Flags</title>
  <meta name="description" content="Free browser themes for Chrome and Firefox inspired by flags of 190+ countries. Download or apply instantly.">
</head>
<body>
  <h1>Flag Theme</h1>
  <p>Browser themes inspired by country flags. 190+ countries, dark and light modes.</p>
  <p><a href="/countries/">Browse all countries →</a></p>
</body>
</html>`;

writeFileSync(resolve(DIST, 'index.html'), homepage);

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
