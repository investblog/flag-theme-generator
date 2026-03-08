# flagtheme.com — Site Build

## What This Is

Static site generator for flagtheme.com — an SEO catalog of browser themes by country.
Lives inside the dark-theme-generator monorepo, shares `src/shared/` with the extension.

## Tech Stack

- **Hosting:** Cloudflare Pages (static output in `dist/`)
- **Build:** TypeScript (tsx), template literals for HTML
- **Styles:** CSS variables from token pipeline + base from extension
- **Images:** resvg-js for SVG→PNG (NTP maps, attribution)
- **Themes:** archiver for Chrome .zip themes
- **Flags:** country-flag-icons (SVG 3:2)
- **No framework** — plain TS build script, no React/Vue/SSR

## Shared Code (from extension)

Import via relative paths (`../src/shared/`):
- `data/palettes` — palette dataset (198 countries)
- `utils/tokens` — `generateTokens(palette, mode, strictness)` → ThemeTokens
- `utils/color` — color math (OKLCH, contrast, deltaE)
- `utils/flags` — `getFlagSvg(countryCode)` → SVG string
- `types/theme` — FlagPalette, ThemeMode, ThemeTokens

## Commands

```bash
cd site/
npm install
npm run build          # Generate all pages + themes → dist/
npm run preview        # Local preview via wrangler
npm run deploy         # Deploy to CF Pages
```

## Site Structure

```
/                          — homepage (search, popular, regions)
/countries/                — full catalog
/countries/{slug}/         — country SEO page (main surface)
/regions/{slug}/           — regional hub
/downloads/{code}-{mode}.zip — Chrome theme files
```

## Build Pipeline

```
palettes.ts
  → for each country × mode:
      → generateTokens() → CSS variables
      → HTML template → /countries/{slug}/index.html
      → Chrome theme manifest + NTP PNG → /downloads/{code}-{mode}.zip
  → index.html, /countries/index.html
  → /regions/{slug}/index.html
  → sitemap.xml, robots.txt
```

## Localization

- Wave 1: EN (base) + ES (test multilingual)
- Country-language pages for long-tail SEO (e.g., `/tr/countries/turkey/` in Turkish)
- RU not on launch (CF blocked from Russia)
- All UI strings in `src/i18n/`

## Design Tokens

Each country page is styled with its own tokens via CSS custom properties.
The `--uc-` prefix from the extension is used for consistency.
