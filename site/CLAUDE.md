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
- **Flags:** country-flag-icons (SVG 3:2) — inline in country page h1
- **No framework** — plain TS build script, no React/Vue/SSR

## Shared Code (from extension)

Import via relative paths (`../src/shared/`):
- `data/palettes` — palette dataset (198 countries)
- `utils/tokens` — `generateTokens(palette, mode, strictness)` → ThemeTokens
- `utils/color` — color math (OKLCH, contrast, deltaE)
- `types/theme` — FlagPalette, ThemeMode, ThemeTokens

## Commands

```bash
cd site/
npm install
npm run build              # Generate all pages + themes → dist/
npm run build -- --skip-zips  # Skip zip generation (fast rebuild)
npm run preview            # Local preview via wrangler
npm run deploy             # Deploy to CF Pages
```

## Site Structure

```
/                              — homepage (search, popular, regions)
/countries/                    — full catalog
/countries/{slug}/             — country SEO page (main surface)
/regions/{slug}/               — regional hub (5: africa, americas, asia, europe, oceania)
/{lang}/                       — localized homepage
/{lang}/countries/             — localized catalog
/{lang}/countries/{slug}/      — localized country page
/{lang}/regions/{slug}/        — localized regional hub
/downloads/{code}-{mode}.zip   — Chrome theme files (594 total)
/assets/                       — site.css, ui-icons.svg, brand-icons.svg
```

## Build Pipeline

```
palettes.ts (198 countries)
  → for each country × mode (dark/light/amoled):
      → generateTokens() → CSS variables
      → HTML template → /countries/{slug}/index.html
      → Chrome theme manifest + NTP PNG → /downloads/{code}-{mode}.zip
  → localized country pages (/{lang}/countries/{slug}/)
  → homepage, catalog, region pages (EN + 11 locales)
  → sitemap.xml (374 URLs), robots.txt
```

## Localization (12 languages)

- **Languages:** EN (base), ES, FR, AR, PT, DE, IT, NL, ZH, JA, KO, TR
- **Strings:** `src/i18n/strings.ts` — `SiteStrings` interface, `t()` template, `getStrings(lang)`
- **Country names:** `src/i18n/countries.ts` — wraps `i18n-iso-countries`
- **All templates i18n-aware:** homepage, catalog, region, country
- Country pages localized per `recommendedLocales` from palette data
- Homepage/catalog/region generated for all 11 non-EN languages
- hreflang cross-linking + language switcher dropdown
- RU skipped (CF blocked from Russia)

## Country Page Features

- Inline flag SVG before h1
- Browser preview mockup with mode switcher (Dark/Light/AMOLED)
- CTA: Download Chrome, Get Firefox, Copy CSS
- Extension promo section with feature list + "Coming soon" store buttons (Chrome/Edge/Firefox)
- Flag swatches + design token grid
- Similar themes + FAQ accordion + JSON-LD

## Design Tokens

Each country page is styled with its own tokens via CSS custom properties.
The `--uc-` prefix from the extension is used for consistency.
