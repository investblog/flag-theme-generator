# Changelog

All notable changes to Flag Theme Generator are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] - 2026-03-09

### Added

- **198 country palettes** — flag-inspired color themes covering every recognized country, each with dominant flag colors and recommended locales
- **Three rendering modes** — Dark, Light, and AMOLED themes per country with instant preview switching
- **WCAG contrast validation** — every token pair validated for accessibility; per-mode quality scoring (excellent / good / acceptable / limited)
- **Token generation pipeline** — OKLCH color math with configurable strictness (0–1) controlling maximum allowed color drift from original flag colors
- **Welcome page** — onboarding surface with full country picker, mode selector, live browser preview, and token grid
- **Side panel** — compact browse/apply/export interface with palette drawer, search, region filters, and quality badges
- **One-click apply** — Firefox themes applied natively via `browser.theme` API
- **Chrome/Edge site integration** — "Download Theme" button linking to [flagtheme.com](https://flagtheme.com) for `.zip` theme files when browser theme API is unavailable
- **Auto-apply by locale** — automatically suggests the theme matching the browser language on first install
- **Design token export** — copy CSS variables (`--uc-` prefix), Tailwind config (`uc` namespace), or JSON tokens with country/mode/strictness metadata
- **Flag SVG download** — download any country flag as a clean SVG file from the side panel
- **Settings drawer** — configurable strictness slider and auto-by-locale toggle
- **Warning system** — localized quality warnings with severity badges (low contrast, high drift, limited palette)
- **Cross-browser builds** — Chrome MV3, Edge MV3, Firefox MV2 via WXT framework
- **Internationalization** — English and Russian locale support via `browser.i18n`
- **Custom icons** — puzzle-piece-with-flag toolbar and sidebar icons at 16/32/48/128px
- **Zero network requests** — fully local, no analytics, no telemetry

### Site ([flagtheme.com](https://flagtheme.com))

- **374 pages** — 198 country pages + homepage + catalog + 5 region hubs, all in 12 languages
- **594 Chrome theme .zip files** — downloadable themes for all countries × 3 modes
- **12 languages** — EN, ES, FR, AR, PT, DE, IT, NL, ZH, JA, KO, TR
- **Extension promo** — CTA section on country pages with feature list and store links
- **Inline flag SVGs** — country flag before h1 on every country page
- **SEO** — JSON-LD (SoftwareApplication + FAQPage), hreflang cross-linking, XML sitemap with XSL stylesheet
- **Hosted on Cloudflare Pages**
