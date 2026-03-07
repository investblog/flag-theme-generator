# Current Handoff

## Product Shape

- Active surfaces: `welcome`, `sidepanel`, `background`
- Do not reason about the product as `popup + gallery`
- Browser targets: Chrome MV3, Edge MV3, Firefox MV2

## Important Files

- `src/entrypoints/background/index.ts`
  - Theme API checks
  - Apply/reset flow
  - Install/startup behavior
  - Locale auto-apply

- `src/entrypoints/welcome/main.ts`
  - Onboarding and full preview
  - Country picker with Wave 1 default visibility
  - Mode cards ranked by `CompatibilityReport.quality`
  - Export/apply/reset/auto-locale actions

- `src/entrypoints/sidepanel/main.ts`
  - Fast palette browsing
  - Drawer-based details
  - Export tabs, WCAG table, settings

- `src/shared/utils/tokens.ts`
  - Core token generation

- `src/shared/utils/quality.ts`
  - Shared mode ranking
  - Mode labels
  - Warning severity/tag/copy mapping
  - Quality summaries used by both UIs

## Behavior Invariants

- `generateTokens()` must always return all 10 tokens
- All `REQUIRED_PAIRS` must pass
- `evaluateCompatibility()` should not hard-fail a mode only because of neutral colors or large drift
- `DOMINANT_ONLY` is the safe fallback, not the preferred happy path
- Warning codes must stay aligned with `src/public/_locales/en/messages.json` and `src/public/_locales/ru/messages.json`

## Verification Baseline

Before merging meaningful UI or token changes:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run build:edge
npm run build:firefox
```

## Recent State

- `codex/role-based-theme-generator` has already been merged into `main`
- Shared quality helpers were extracted into `src/shared/utils/quality.ts`
- Browser builds were validated locally for Chrome, Edge, and Firefox
- Local agent-only files `AGENTS.md` and `CLAUDE.md` are ignored by git, so tracked handoff belongs here in `docs/`
