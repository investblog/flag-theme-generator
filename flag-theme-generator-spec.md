# Flag Theme Generator + Webmaster Color Export — Technical Specification (v0.3)

> **Stack target:** WXT (Chrome MV3, Edge MV3, Firefox MV2), TypeScript strict, Vanilla DOM + CSS Custom Properties (no UI frameworks), Biome, Vitest, `browser.i18n` (UI: EN/RU + 5 store-only locales).  
> **Hard constraints:** **0 external requests**, **0 runtime deps** (everything bundled), **render < 100ms**.

---

## 0) Product Summary

A cross‑browser extension that:

1) **Generates and applies** a **runtime browser theme** from **flag-inspired palettes** (where browser theme APIs allow it).  
2) Automatically **checks and fixes contrast** (WCAG thresholds) and **does not offer** modes that can’t pass without excessive color drift.  
3) Provides a **Webmaster Export**: a **contrast‑checked color scheme** exportable as **CSS variables / JSON tokens / Tailwind snippet**, usable without applying the theme.  
4) Growth strategy: rank for **theme-intent keywords** (“chrome theme”, “dark theme”, “amoled theme”, “theme generator”) + long-tail for **country/palette**.  
5) Monetization strategy: MVP **no payments**; **soft cross‑promo** to “Unified Colors for Webmasters” (by 301.st). Post‑MVP optional **freemium**.

---

## 1) Goals & Non‑Goals

### 1.1 Goals (MVP)
- Apply a recommended palette in **≤2 clicks** after install (except when a country choice is required).
- **Never** change a user’s theme without explicit action (unless user enabled “Auto by locale”).
- Provide **Export tokens** that are immediately usable in web projects and include a short **contrast report**.
- No network activity; no runtime dependencies.

### 1.2 Non‑Goals (MVP)
- Auto-extract dominant colors from flag images (PNG/SVG parsing) — later.
- Publishing individual “theme items” to the browser stores — out of scope.
- Payments/licensing — out of scope for MVP.

---

## 2) Platform, Framework, Performance

### 2.1 Targets
- Chrome: MV3
- Edge: MV3
- Firefox: MV2 (graceful degradation)

### 2.2 Engineering constraints
- TypeScript strict mode.
- Vanilla DOM rendering (no React/Vue/etc).
- CSS: custom properties + minimal CSS (no UI libraries).
- Startup render < **100ms** for popup/welcome/gallery on typical hardware.
- **0 network requests** (no analytics, no remote flags list, no CDN).

### 2.3 Tooling
- Biome: lint + format.
- Vitest: unit tests.
- WXT build pipeline.

---

## 3) Core Concepts

### 3.1 Entities

**FlagPalette**
- `countryCode` (ISO)
- `name_en`, `name_ru`
- `flagColors[]` (2–6 hex)
- `recommendedLocales[]` (e.g. `["pt-BR"]`)
- optional: `region`, `tags`

**ThemeMode**
- `AMOLED`, `DARK`, `LIGHT`
- `DOMINANT_ONLY` (contrast-safe fallback)

**Strictness**
- `0..1`, controls allowed drift from flag colors (ΔE cap).

### 3.2 Key UX Rule
UI must **not** show modes that can’t pass contrast under current strictness.  
If none pass → default to **DOMINANT_ONLY**.

---

## 4) MVP Country Set (Population-driven Wave 1)

MVP includes the 20 most populated countries (palette completeness) and supports marketing locales per reach:

**Wave 1 Countries (20):**
- IN, CN*, US, ID, PK, NG, BR, BD, RU, ET, MX, JP, EG, PH, CD, VN, IR, TR, DE, TH  
*CN palette supported; store reach may be limited.*

**UI Locales (in-extension):**
- EN, RU

**Store-only locales (+5):** (for listing copy, screenshots captions, etc.)
- PT-BR, ES-419, ID, JA, DE *(or TR instead of DE if prioritizing Turkey)*

> Rule: **Localize only for MVP markets** (avoid “49 languages spam” in early releases).

---

## 5) Theme Tokens & Mapping

### 5.1 ThemeTokens (minimum)
- `bg`, `surface`
- `text`, `mutedText`
- `border`
- `accent`, `accent2`
- `accentText`
- `link`
- `focusRing`

### 5.2 Mapping Strategy
- **Background & text**: derived from stable presets (per mode).  
- **Flag colors**: used mainly for `accent/accent2/link/focusRing` + optional very subtle tint/gradient.
- **DOMINANT_ONLY**: neutrals fixed; flag only affects accents/decor.

---

## 6) Contrast & Color Adjustment

### 6.1 Contrast thresholds (shared across UI + tests)
- Normal text: **≥ 4.5**
- Small text (≤12px): **≥ 7.0**
- Icons/large text: **≥ 3.0**
- Borders/dividers: **≥ 1.5** (or 2.0 if stricter)

### 6.2 Required contrast pairs
- `text↔bg`, `mutedText↔bg`
- `text↔surface`, `mutedText↔surface`
- `link↔bg`, `link↔surface`
- `accent↔bg`
- `accentText↔accent`
- `focusRing↔bg/surface`
- `border↔bg/surface`

### 6.3 Adjustment function contract
`adjustToContrast(color, background, minContrast, strictness, mode) -> { color, deltaE, passes }`

Adjustment order:
1) Lightness
2) Saturation
3) Limited hue shift

Enforce `maxDeltaE(strictness, mode)`:
- strict ~0.9 → 10–12
- relaxed ~0.3 → 18–24

---

## 7) Mode Compatibility & Fallback

### 7.1 API contract
`evaluateCompatibility(palette, strictness) -> CompatibilityReport`

**CompatibilityReport**
- `supports: { AMOLED: bool, DARK: bool, LIGHT: bool }`
- `dominantOnlyRequired: bool`
- `reasons: Array<{mode, code, details?}>`
- `metrics: { mode: { pair: number } }`
- `adjustments: { mode: { token: { from,to,deltaE } } }`

**Reason codes (MVP)**
- `LOW_CONTRAST_LINK`
- `LOW_CONTRAST_ACCENT_TEXT`
- `EXCESSIVE_COLOR_SHIFT_REQUIRED`
- `NEUTRAL_ONLY_FLAG`

### 7.2 DOMINANT_ONLY definition
- `bg/surface/text/muted/border` = stable base preset (default: DARK)
- flag impacts:
  - `accent`, `accent2`, `link`, `focusRing`
  - optional: tiny tint/gradient (5–12% intensity)

---

## 8) UI/UX Specification

### 8.1 Pages/Surfaces

**A) Welcome Page (required, first-run onboarding)**
- Trigger: `onInstalled` (and major updates)
- Steps:
  1) Detect `browser.i18n.getUILanguage()`
  2) If ambiguous locale → country chooser
  3) Mode picker shows only supported modes; if fallback → default `DOMINANT_ONLY`
  4) Preview:
     - Mini‑browser mock (fast)
     - Live Preview / Revert (best-effort)
  5) Apply / Reset
  6) Toggle: “Auto-select by locale” (default OFF)

**B) Popup (quick actions)**
- Current palette + mode
- Buttons: Apply, Reset, Auto toggle
- Recent palettes (3–5)
- “Open Gallery”

**C) Gallery Page (catalog)**
- Search
- Filters: region / popular / favorites / modes supported
- Palette cards: swatches + contrast badge + supported modes
- Actions: Preview, Apply, Export

### 8.2 Mini-browser Preview (Contrast Debugger)
**5 scenes (tabs inside preview):**
1) Tabs/Omnibox
2) NTP/Cards
3) Controls (focus/disabled)
4) Alerts/States
5) Table/Dense UI

**Indicators:**
- Contrast badges (`Tab text: 4.1`) near key widgets
- Highlight failing elements + tooltip reason
- “Adjustment report”: original vs adjusted swatches, ΔE, key pair contrasts

### 8.3 Webmaster Export (must-have for traffic)
Export must work **without applying** the theme.

**Export drawer content:**
- Copy CSS Variables
- Copy Tailwind Snippet
- Download `tokens.json`
- WCAG summary (3–5 pairs): `text/bg`, `link/bg`, `accentText/accent`, etc.

**Formats**
1) CSS:
   ```css
   :root{
     --uc-bg:#...;
     --uc-surface:#...;
     --uc-text:#...;
     --uc-muted:#...;
     --uc-border:#...;
     --uc-accent:#...;
     --uc-accent-2:#...;
     --uc-accent-text:#...;
     --uc-link:#...;
     --uc-focus:#...;
   }
   ```
2) Tailwind snippet:
   ```js
   // tailwind.config.js
   export default {
     theme: {
       extend: {
         colors: { uc: { bg:"...", surface:"...", text:"...", accent:"..." } }
       }
     }
   }
   ```
3) JSON tokens:
   ```json
   {
     "meta": { "countryCode":"JP", "mode":"DARK", "strictness":0.8 },
     "tokens": { "bg":"#...", "text":"#..." },
     "report": { "contrast": { "text/bg": 12.3 } }
   }
   ```

---

## 9) Cross-browser Capabilities

### 9.1 Theme apply
- Chrome/Edge: supported (apply/reset).
- Firefox MV2: implement **capabilities detection**:
  - If theme API unavailable → “Export only” (apply disabled, rest works).

### 9.2 Preview/Revert behavior
- Preview saves last applied snapshot best-effort.
- If reliable revert not possible → “Revert will reset to default” message.

---

## 10) Permissions
Minimum:
- `storage`
- `theme` (where supported)
Optional:
- `downloads` (only if using downloads API; otherwise data URL download)

---

## 11) Test Plan (Vitest)

### 11.1 Unit tests (required)
- `contrast()` correctness
- `adjustToContrast()`:
  - improves contrast monotonically (or fails safely)
  - honors max ΔE for strictness
- `evaluateCompatibility()`:
  - disables unsupported modes
  - triggers DOMINANT_ONLY when needed
- `generateTokens()`:
  - DOMINANT_ONLY always satisfies thresholds for required pairs

### 11.2 Non-functional checks
- No external requests (static audit)
- UI render < 100ms (manual benchmark note)

---

## 12) Promotion (ASO/SEO) Requirements

### 12.1 Core positioning
We target the same intent users have when searching for **themes**:
- “chrome theme”
- “dark theme / amoled theme / black theme”
- “minimal theme”
- “high contrast theme / theme for eyes / night theme”
- “theme generator / custom theme”
- “flag colors theme / country theme / palette theme”
+ localized equivalents in store-only locales.

### 12.2 Store listing must show
- Gallery of flag palettes
- Mini-browser contrast badges
- Export tokens drawer (CSS/Tailwind/JSON)

### 12.3 Localization policy
- UI: EN/RU only
- Store: +5 locales aligned to MVP markets (no broad language spam)

---

## 13) Monetization Strategy (Phased)

### 13.1 Phase 1 (MVP): no payments
- Add a small, non-intrusive block in Export/Settings:
  - **“Unified Colors for Webmasters” (by 301.st)**
  - CTA: “Open”
- Rationale: convert webmaster traffic without paywall friction.

### 13.2 Phase 2 (Post-MVP): optional freemium
- Free: MVP 20 palettes + export CSS/JSON
- Pro: 200+ palettes + premium styles + advanced tuning + extended export formats + unlimited presets
> Payments are a separate spec (not MVP).

---

## 14) UX Recommendations (Concrete)

### 14.1 What goes where (to keep popup fast and UX clean)

**Popup (fast, 1-2 actions):**
- Current palette swatch + mode label
- `Apply` / `Reset`
- `Auto by locale` toggle
- “Recent palettes” chips (max 5)
- “Open Gallery” link

**Welcome Page (decision + education):**
- Clear statement: “This extension changes your browser theme.”
- Recommended palette card (from locale), with big `Preview` + `Apply`
- Mode picker with disabled states + tooltips (why unavailable)
- Mini-browser preview with 5 scenes
- Export button (for webmasters) right under preview

**Gallery (exploration):**
- Search at top (instant)
- Filters row: Popular / Favorites / Regions / Supported modes
- Cards with:
  - country name
  - 2–4 swatches
  - badges: `WCAG OK`, supported modes icons
  - actions: Preview, Apply, Export

### 14.2 Drawers over modals
Use slide-in drawers:
- Export drawer
- Palette details drawer (report + ΔE + contrast pairs)
- Settings drawer

### 14.3 Icon & branding (store + toolbar)
**Toolbar icon:** simple, readable at 16–32px:
- A generic **flag** glyph + **palette swatches** (2–3 dots)
- Optional **check/shield** overlay (“contrast checked”)
Avoid detailed flags (won’t read at 16px).

**Store promo hero:**
- Mini-browser with highlighted tabs bar
- 2–3 swatches + “WCAG checked”
- Optional subtle world map/grid background

### 14.4 Microcopy (avoid negative reviews)
- Never auto-apply on install without explicit click.
- When enabling Auto: “Auto may change theme when your browser language changes.”
- When mode disabled: “This palette can’t meet contrast targets in Light mode.”

---

## 15) Acceptance Criteria (MVP)
- No network traffic.
- No runtime deps.
- Theme change only on explicit user action (unless Auto enabled).
- Modes offered only when compatible; otherwise DOMINANT_ONLY default.
- Export is available without applying theme; includes WCAG summary.
- Popup/welcome/gallery render fast (<100ms target; measured locally).
