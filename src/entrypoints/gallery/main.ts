import { PALETTES } from '@shared/data/palettes';
import { getRegions } from '@shared/services/locale';
import { addRecentPalette, currentMode, currentPaletteCode, strictness } from '@shared/services/storage';
import type { FlagPalette, ThemeMode } from '@shared/types/theme';
import { REQUIRED_PAIRS } from '@shared/types/theme';
import { contrast } from '@shared/utils/contrast';
import { exportCSS, exportJSON, exportTailwind } from '@shared/utils/export';
import { evaluateCompatibility, generateTokens } from '@shared/utils/tokens';

const MODE_NAMES: Record<string, string> = {
  AMOLED: 'A',
  DARK: 'D',
  LIGHT: 'L',
};

function msg(key: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return browser.i18n.getMessage(key as any) || key;
  } catch {
    return key;
  }
}

// State
let searchQuery = '';
let activeRegion = '';
let currentStrictness = 0.7;

async function init(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  try {
    currentStrictness = await strictness.getValue();
  } catch {
    /* use default */
  }

  app.innerHTML = '';
  app.className = 'gallery';

  // Header
  const header = document.createElement('header');
  header.className = 'gallery__header';
  const title = document.createElement('h1');
  title.className = 'gallery__title';
  title.textContent = msg('btnOpenGallery');
  header.appendChild(title);
  app.appendChild(header);

  // Toolbar: search + region filters
  const toolbar = document.createElement('div');
  toolbar.className = 'gallery__toolbar';

  const search = document.createElement('input');
  search.className = 'gallery__search';
  search.type = 'search';
  search.placeholder = 'Search countries...';
  search.addEventListener('input', () => {
    searchQuery = search.value.trim().toLowerCase();
    renderGrid(grid);
  });
  toolbar.appendChild(search);

  const filters = document.createElement('div');
  filters.className = 'gallery__filters';

  // "All" chip
  const allChip = createFilterChip('All', '', filters);
  allChip.classList.add('filter-chip--active');
  filters.appendChild(allChip);

  for (const region of getRegions()) {
    filters.appendChild(createFilterChip(region, region, filters));
  }
  toolbar.appendChild(filters);
  app.appendChild(toolbar);

  // Card grid
  const grid = document.createElement('div');
  grid.className = 'gallery__grid';
  grid.id = 'gallery-grid';
  app.appendChild(grid);

  renderGrid(grid);
}

function createFilterChip(label: string, region: string, container: HTMLElement): HTMLElement {
  const chip = document.createElement('button');
  chip.className = 'filter-chip';
  chip.textContent = label;
  chip.dataset.region = region;

  chip.addEventListener('click', () => {
    activeRegion = region;
    for (const c of container.querySelectorAll('.filter-chip')) {
      c.classList.toggle('filter-chip--active', (c as HTMLElement).dataset.region === region);
    }
    const grid = document.getElementById('gallery-grid');
    if (grid) renderGrid(grid);
  });

  return chip;
}

function renderGrid(grid: HTMLElement): void {
  grid.innerHTML = '';

  const filtered = PALETTES.filter((p) => {
    if (activeRegion && p.region !== activeRegion) return false;
    if (searchQuery) {
      const haystack = `${p.name_en} ${p.name_ru} ${p.countryCode}`.toLowerCase();
      if (!haystack.includes(searchQuery)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'gallery__empty';
    empty.textContent = 'No palettes match your search.';
    grid.appendChild(empty);
    return;
  }

  for (const palette of filtered) {
    grid.appendChild(createPaletteCard(palette));
  }
}

function createPaletteCard(palette: FlagPalette): HTMLElement {
  const card = document.createElement('div');
  card.className = 'palette-card';

  // Header: name + code
  const header = document.createElement('div');
  header.className = 'palette-card__header';
  const name = document.createElement('span');
  name.className = 'palette-card__name';
  name.textContent = palette.name_en;
  const code = document.createElement('span');
  code.className = 'palette-card__code';
  code.textContent = palette.countryCode;
  header.appendChild(name);
  header.appendChild(code);
  card.appendChild(header);

  // Swatches
  const swatches = document.createElement('div');
  swatches.className = 'palette-card__swatches';
  for (const color of palette.flagColors) {
    const s = document.createElement('div');
    s.className = 'palette-card__swatch';
    s.style.backgroundColor = color;
    swatches.appendChild(s);
  }
  card.appendChild(swatches);

  // Mode badges
  const report = evaluateCompatibility(palette, currentStrictness);
  const modes = document.createElement('div');
  modes.className = 'palette-card__modes';
  for (const [key, label] of Object.entries(MODE_NAMES)) {
    const badge = document.createElement('span');
    badge.className = 'mode-badge';
    badge.textContent = label;
    if (report.supports[key as 'AMOLED' | 'DARK' | 'LIGHT']) {
      badge.classList.add('mode-badge--supported');
    }
    modes.appendChild(badge);
  }
  card.appendChild(modes);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'palette-card__actions';

  const applyBtn = document.createElement('button');
  applyBtn.className = 'btn btn--primary';
  applyBtn.textContent = msg('btnApply');
  applyBtn.addEventListener('click', () => applyPalette(palette));

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn--secondary';
  exportBtn.textContent = 'Export';
  exportBtn.addEventListener('click', () => openExportDrawer(palette));

  actions.appendChild(applyBtn);
  actions.appendChild(exportBtn);
  card.appendChild(actions);

  return card;
}

async function applyPalette(palette: FlagPalette): Promise<void> {
  let mode: ThemeMode = 'DOMINANT_ONLY';
  try {
    mode = await currentMode.getValue();
  } catch {
    /* use default */
  }

  // If current mode isn't supported, fall back to best available
  const report = evaluateCompatibility(palette, currentStrictness);
  if (mode !== 'DOMINANT_ONLY' && !report.supports[mode as 'AMOLED' | 'DARK' | 'LIGHT']) {
    if (report.supports.DARK) mode = 'DARK';
    else if (report.supports.AMOLED) mode = 'AMOLED';
    else if (report.supports.LIGHT) mode = 'LIGHT';
    else mode = 'DOMINANT_ONLY';
  }

  await currentPaletteCode.setValue(palette.countryCode);
  await currentMode.setValue(mode);
  await addRecentPalette(palette.countryCode);

  try {
    await browser.runtime.sendMessage({
      type: 'APPLY_THEME',
      paletteCode: palette.countryCode,
      mode,
      strictness: currentStrictness,
    });
  } catch {
    /* background not ready */
  }
}

/* ============================================
   Export Drawer
   ============================================ */

function pickExportMode(palette: FlagPalette): ThemeMode {
  const report = evaluateCompatibility(palette, currentStrictness);
  if (report.supports.DARK) return 'DARK';
  if (report.supports.AMOLED) return 'AMOLED';
  if (report.supports.LIGHT) return 'LIGHT';
  return 'DOMINANT_ONLY';
}

function openExportDrawer(palette: FlagPalette): void {
  // Remove existing drawer if any
  document.querySelector('.drawer')?.remove();

  const mode = pickExportMode(palette);
  const tokens = generateTokens(palette, mode, currentStrictness);

  const drawer = document.createElement('aside');
  drawer.className = 'drawer';

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'drawer__overlay';
  overlay.addEventListener('click', () => drawer.remove());
  drawer.appendChild(overlay);

  // Panel
  const panel = document.createElement('div');
  panel.className = 'drawer__panel';

  // Header
  const header = document.createElement('header');
  header.className = 'drawer__header';
  const title = document.createElement('h2');
  title.className = 'drawer__header-title';
  title.textContent = `Export — ${palette.name_en}`;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'drawer__close';
  closeBtn.textContent = '\u00d7';
  closeBtn.addEventListener('click', () => drawer.remove());
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'drawer__body';

  // CSS section
  body.appendChild(createCodeSection('CSS Variables', exportCSS(tokens)));

  // Tailwind section
  body.appendChild(createCodeSection('Tailwind Config', exportTailwind(tokens)));

  // JSON section
  body.appendChild(createCodeSection('JSON Tokens', exportJSON(tokens, palette.countryCode, mode, currentStrictness)));

  // WCAG summary
  body.appendChild(createWcagSummary(tokens));

  // Promo block per spec §13.1
  const promo = document.createElement('div');
  promo.className = 'drawer__promo';
  const promoText = document.createElement('p');
  promoText.className = 'drawer__promo-text';
  promoText.textContent = 'Unified Colors for Webmasters';
  const promoLink = document.createElement('a');
  promoLink.className = 'drawer__promo-link';
  promoLink.href = 'https://301.st';
  promoLink.target = '_blank';
  promoLink.rel = 'noopener';
  promoLink.textContent = 'Open';
  promo.appendChild(promoText);
  promo.appendChild(promoLink);
  body.appendChild(promo);

  panel.appendChild(body);
  drawer.appendChild(panel);
  document.body.appendChild(drawer);
}

function createCodeSection(title: string, code: string): HTMLElement {
  const section = document.createElement('div');
  section.className = 'drawer__section';

  const heading = document.createElement('h3');
  heading.className = 'drawer__section-title';
  heading.textContent = title;
  section.appendChild(heading);

  const block = document.createElement('div');
  block.className = 'drawer__code-block';
  block.textContent = code;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'drawer__copy-btn';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('drawer__copy-btn--copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('drawer__copy-btn--copied');
      }, 1500);
    } catch {
      /* clipboard unavailable */
    }
  });
  block.appendChild(copyBtn);
  section.appendChild(block);

  return section;
}

function createWcagSummary(tokens: import('@shared/types/theme').ThemeTokens): HTMLElement {
  const section = document.createElement('div');
  section.className = 'drawer__section';

  const heading = document.createElement('h3');
  heading.className = 'drawer__section-title';
  heading.textContent = 'WCAG Contrast Summary';
  section.appendChild(heading);

  const table = document.createElement('table');
  table.className = 'wcag-summary';

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Pair</th><th>Ratio</th><th>Required</th><th>Status</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const pair of REQUIRED_PAIRS) {
    const ratio = contrast(tokens[pair.a], tokens[pair.b]);
    const passes = ratio >= pair.threshold;
    const tr = document.createElement('tr');

    const tdPair = document.createElement('td');
    tdPair.textContent = pair.label;
    const tdRatio = document.createElement('td');
    tdRatio.textContent = ratio.toFixed(2);
    const tdRequired = document.createElement('td');
    tdRequired.textContent = `${pair.threshold}:1`;
    const tdStatus = document.createElement('td');
    tdStatus.className = passes ? 'wcag-summary__pass' : 'wcag-summary__fail';
    tdStatus.textContent = passes ? 'Pass' : 'Fail';

    tr.appendChild(tdPair);
    tr.appendChild(tdRatio);
    tr.appendChild(tdRequired);
    tr.appendChild(tdStatus);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  section.appendChild(table);

  return section;
}

init();
