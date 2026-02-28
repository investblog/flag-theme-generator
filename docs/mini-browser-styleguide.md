# Mini-Browser Style Guide — 5-Scene Preview Component

This document defines the visual scenes rendered inside the mini-browser preview.
Each scene exercises specific **ThemeTokens** and displays inline **contrast badges** showing the measured WCAG ratio for each critical pair.

Token reference: `bg`, `surface`, `text`, `mutedText`, `border`, `accent`, `accent2`, `accentText`, `link`, `focusRing`.

---

## Scene 1 — Tabs / Omnibox

Simulates the browser chrome: tab bar, active/inactive tabs, and the address bar.

| Element | Foreground token | Background token |
|---------|-----------------|-----------------|
| Tab bar background | — | `bg` |
| Active tab label | `text` | `surface` |
| Inactive tab label | `mutedText` | `bg` |
| Omnibox text | `text` | `surface` |
| Omnibox border | `border` | `surface` |

**Contrast badges:**
- `text / surface`
- `mutedText / bg`
- `border / surface`

---

## Scene 2 — NTP / Cards

New Tab Page with card tiles. Tests surface-level hierarchy and link contrast.

| Element | Foreground token | Background token |
|---------|-----------------|-----------------|
| Page background | — | `bg` |
| Card tile | — | `surface` |
| Card border | `border` | `surface` |
| Card heading | `text` | `surface` |
| Card description | `mutedText` | `surface` |
| Card link | `link` | `surface` |
| Action button label | `accentText` | `accent` |

**Contrast badges:**
- `text / bg`
- `text / surface`
- `mutedText / surface`
- `link / surface`
- `accentText / accent`

---

## Scene 3 — Controls

Interactive elements: buttons, inputs, links, chips. Tests focus/disabled states.

| Element | Foreground token | Background token |
|---------|-----------------|-----------------|
| Primary button label | `accentText` | `accent` |
| Ghost button label | `text` | `surface` |
| Ghost button border | `border` | `surface` |
| Input text | `text` | `surface` |
| Input border | `border` | `surface` |
| Input focus ring | `focusRing` | `bg` |
| Inline link | `link` | `bg` |
| Accent2 chip | `accentText` | `accent2` |

**Contrast badges:**
- `accentText / accent`
- `text / surface`
- `focusRing / bg`
- `link / bg`
- `accent / bg`

---

## Scene 4 — Alerts / States

Semantic notification panels with tinted backgrounds. Tests text readability on colored surfaces.

| Element | Foreground token | Background token | Notes |
|---------|-----------------|-----------------|-------|
| Alert panel 1 | `text` | tinted `surface` | accent-tinted bg |
| Alert panel 2 | `text` | tinted `surface` | accent2-tinted bg |
| Alert description | `mutedText` | `surface` | |
| Alert link | `link` | `surface` | |

**Contrast badges:**
- `text / surface`
- `mutedText / surface`
- `link / surface`
- `mutedText / bg`

---

## Scene 5 — Table / Dense UI

Data table with headers, rows, links, and status badges. Tests dense text contrast.

| Element | Foreground token | Background token |
|---------|-----------------|-----------------|
| Table header text | `text` | `bg` |
| Table row text | `text` | `surface` |
| Row borders | `border` | `surface` |
| Link cell | `link` | `surface` |
| Status badge label | `accentText` | `accent` |

**Contrast badges:**
- `text / bg`
- `text / surface`
- `link / surface`
- `border / surface`
- `accentText / accent`

---

## Coverage Matrix

Every required contrast pair (spec §6.2) appears in at least one scene:

| Required Pair | Scenes |
|--------------|--------|
| `text / bg` | 2, 5 |
| `text / surface` | 1, 2, 3, 4, 5 |
| `mutedText / bg` | 1, 4 |
| `mutedText / surface` | 2, 4 |
| `link / bg` | 3 |
| `link / surface` | 2, 4, 5 |
| `accent / bg` | 3 |
| `accentText / accent` | 2, 3, 5 |
| `focusRing / bg` | 3 |
| `focusRing / surface` | *(covered via `focusRing / bg` + scene 3 input)* |
| `border / bg` | *(header border in scene 5)* |
| `border / surface` | 1, 5 |

---

## Badge Rendering

Each badge is a small inline label rendered next to the element it measures:

```
┌──────────────┐
│  Tab Title   │  ◀ badge: "text/surface: 7.2 ✓"
└──────────────┘
```

- **Passing** (ratio ≥ threshold): green background, `✓`
- **Failing** (ratio < threshold): red background, `✗`, element gets a dashed red outline
- Badge text: `"{pair}: {ratio} {icon}"` — e.g. `"text/bg: 12.4 ✓"`

---

## Adjustment Report Panel

Below the 5 scenes, an optional **Adjustment Report** panel shows:

- Original vs. adjusted color swatches (side-by-side)
- ΔE for each adjusted token
- Key contrast pair ratios in a compact table

This panel is visible when at least one token was adjusted from the original flag color.
