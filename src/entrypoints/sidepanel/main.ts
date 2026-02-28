import { PALETTES } from '@shared/data/palettes';
import { getRegions } from '@shared/services/locale';
import { addRecentPalette, autoByLocale, currentMode, currentPaletteCode, strictness } from '@shared/services/storage';
import type { MessageResponse } from '@shared/types/messages';
import type { FlagPalette, ThemeMode, ThemeTokens } from '@shared/types/theme';
import { REQUIRED_PAIRS } from '@shared/types/theme';
import { contrast } from '@shared/utils/contrast';
import { exportCSS, exportJSON, exportTailwind } from '@shared/utils/export';
import { getFlagSvg } from '@shared/utils/flags';
import { evaluateCompatibility, generateTokens } from '@shared/utils/tokens';

const MODE_NAMES: Record<string, string> = {
  AMOLED: 'A',
  DARK: 'D',
  LIGHT: 'L',
};

const MODE_KEYS: { mode: ThemeMode; msgKey: string }[] = [
  { mode: 'AMOLED', msgKey: 'modeAmoled' },
  { mode: 'DARK', msgKey: 'modeDark' },
  { mode: 'LIGHT', msgKey: 'modeLight' },
  { mode: 'DOMINANT_ONLY', msgKey: 'modeDominantOnly' },
];

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
let canApplyTheme = false;
let selectedPalette: FlagPalette | null = null;
let selectedMode: ThemeMode = 'DOMINANT_ONLY';
let listEl: HTMLElement | null = null;

async function checkThemeApi(): Promise<boolean> {
  try {
    const resp = (await browser.runtime.sendMessage({ type: 'HAS_THEME_API' })) as MessageResponse | undefined;
    return resp?.ok === true;
  } catch {
    return false;
  }
}

async function init(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  try {
    currentStrictness = await strictness.getValue();
  } catch {
    /* use default */
  }

  try {
    const [savedCode, savedMode] = await Promise.all([currentPaletteCode.getValue(), currentMode.getValue()]);
    if (savedMode) selectedMode = savedMode;
    if (savedCode) {
      selectedPalette = PALETTES.find((p) => p.countryCode === savedCode) ?? null;
    }
  } catch {
    /* storage unavailable */
  }

  canApplyTheme = await checkThemeApi();

  app.innerHTML = '';
  app.className = 'sidepanel';

  // Header
  const header = document.createElement('header');
  header.className = 'sp-header';
  const title = document.createElement('h1');
  title.className = 'sp-header__title';
  title.textContent = msg('extName');
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'sp-header__settings';
  settingsBtn.textContent = '\u2699';
  settingsBtn.title = 'Settings';
  settingsBtn.addEventListener('click', openSettingsDrawer);
  header.appendChild(title);
  header.appendChild(settingsBtn);
  app.appendChild(header);

  // Search
  const search = document.createElement('input');
  search.className = 'sp-search';
  search.type = 'search';
  search.placeholder = 'Search countries...';
  search.addEventListener('input', () => {
    searchQuery = search.value.trim().toLowerCase();
    renderList();
  });
  app.appendChild(search);

  // Region filters
  const filters = document.createElement('div');
  filters.className = 'sp-filters';
  const allChip = createFilterChip('All', '', filters);
  allChip.classList.add('filter-chip--active');
  filters.appendChild(allChip);
  for (const region of getRegions()) {
    filters.appendChild(createFilterChip(region, region, filters));
  }
  app.appendChild(filters);

  // Palette list
  listEl = document.createElement('div');
  listEl.className = 'sp-list';
  listEl.id = 'sp-list';
  app.appendChild(listEl);

  renderList();
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
    renderList();
  });

  return chip;
}

function renderList(): void {
  if (!listEl) return;
  listEl.innerHTML = '';

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
    empty.className = 'sp-empty';
    empty.textContent = 'No palettes match your search.';
    listEl.appendChild(empty);
    return;
  }

  for (const palette of filtered) {
    const isSelected = selectedPalette?.countryCode === palette.countryCode;
    listEl.appendChild(createPaletteCard(palette, isSelected));
    if (isSelected) {
      listEl.appendChild(createDetailSection(palette));
    }
  }
}

function createPaletteCard(palette: FlagPalette, isSelected: boolean): HTMLElement {
  const card = document.createElement('div');
  card.className = `sp-card${isSelected ? ' sp-card--selected' : ''}`;

  // Flag
  const flag = document.createElement('div');
  flag.className = 'sp-card__flag';
  flag.innerHTML = getFlagSvg(palette.countryCode) ?? '';
  card.appendChild(flag);

  // Info
  const info = document.createElement('div');
  info.className = 'sp-card__info';
  const name = document.createElement('div');
  name.className = 'sp-card__name';
  name.textContent = palette.name_en;
  const code = document.createElement('div');
  code.className = 'sp-card__code';
  code.textContent = palette.countryCode;
  info.appendChild(name);
  info.appendChild(code);
  card.appendChild(info);

  // Mode badges
  const report = evaluateCompatibility(palette, currentStrictness);
  const modes = document.createElement('div');
  modes.className = 'sp-card__modes';
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

  card.addEventListener('click', () => {
    if (selectedPalette?.countryCode === palette.countryCode) {
      selectedPalette = null;
    } else {
      selectedPalette = palette;
      // Auto-select best mode for this palette
      const r = evaluateCompatibility(palette, currentStrictness);
      if (selectedMode !== 'DOMINANT_ONLY' && !r.supports[selectedMode as 'AMOLED' | 'DARK' | 'LIGHT']) {
        if (r.supports.DARK) selectedMode = 'DARK';
        else if (r.supports.AMOLED) selectedMode = 'AMOLED';
        else if (r.supports.LIGHT) selectedMode = 'LIGHT';
        else selectedMode = 'DOMINANT_ONLY';
      }
    }
    renderList();
  });

  return card;
}

function createDetailSection(palette: FlagPalette): HTMLElement {
  const detail = document.createElement('div');
  detail.className = 'sp-detail';

  const report = evaluateCompatibility(palette, currentStrictness);

  // Mode picker
  const modeTitle = document.createElement('div');
  modeTitle.className = 'sp-section-title';
  modeTitle.textContent = msg('welcomeChooseMode');
  detail.appendChild(modeTitle);

  const modes = document.createElement('div');
  modes.className = 'sp-modes';
  for (const { mode, msgKey } of MODE_KEYS) {
    const btn = document.createElement('button');
    btn.className = `sp-modes__btn${mode === selectedMode ? ' sp-modes__btn--active' : ''}`;
    btn.textContent = msg(msgKey);

    const isSupported = mode === 'DOMINANT_ONLY' || report.supports[mode as 'AMOLED' | 'DARK' | 'LIGHT'];
    if (!isSupported) {
      btn.disabled = true;
    }

    btn.addEventListener('click', () => {
      if (!isSupported) return;
      selectedMode = mode;
      renderList();
    });
    modes.appendChild(btn);
  }
  detail.appendChild(modes);

  // Token grid
  const tokens = generateTokens(palette, selectedMode, currentStrictness);

  const tokensTitle = document.createElement('div');
  tokensTitle.className = 'sp-section-title';
  tokensTitle.textContent = msg('welcomePreview');
  detail.appendChild(tokensTitle);

  detail.appendChild(createTokenGrid(tokens));

  // Actions: Apply + Reset
  const actions = document.createElement('div');
  actions.className = 'sp-actions';

  const applyBtn = document.createElement('button');
  if (canApplyTheme) {
    applyBtn.className = 'btn btn--primary';
    applyBtn.textContent = msg('btnApply');
    applyBtn.addEventListener('click', () => handleApply(palette, applyBtn));
  } else {
    applyBtn.className = 'btn btn--ghost';
    applyBtn.textContent = msg('themeUnavailable');
    applyBtn.disabled = true;
  }

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn--ghost';
  resetBtn.textContent = msg('btnReset');
  resetBtn.disabled = !canApplyTheme;
  resetBtn.addEventListener('click', handleReset);

  actions.appendChild(applyBtn);
  actions.appendChild(resetBtn);
  detail.appendChild(actions);

  // Export section
  detail.appendChild(createExportSection(palette, tokens));

  // WCAG summary
  const wcagTitle = document.createElement('div');
  wcagTitle.className = 'sp-section-title';
  wcagTitle.textContent = 'WCAG Contrast';
  detail.appendChild(wcagTitle);
  detail.appendChild(createWcagSummary(tokens));

  return detail;
}

/* ============================================
   Token Grid
   ============================================ */

const TOKEN_LABELS: { key: keyof ThemeTokens; label: string }[] = [
  { key: 'bg', label: 'BG' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'mutedText', label: 'Muted' },
  { key: 'border', label: 'Border' },
  { key: 'accent', label: 'Accent' },
  { key: 'accent2', label: 'Accent 2' },
  { key: 'accentText', label: 'Acc. Text' },
  { key: 'link', label: 'Link' },
  { key: 'focusRing', label: 'Focus' },
];

function createTokenGrid(tokens: ThemeTokens): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'sp-tokens';

  for (const { key, label } of TOKEN_LABELS) {
    const hex = tokens[key];
    const card = document.createElement('button');
    card.className = 'sp-token';
    card.title = `Copy ${hex}`;

    const swatch = document.createElement('span');
    swatch.className = 'sp-token__swatch';
    swatch.style.background = hex;

    const lbl = document.createElement('span');
    lbl.className = 'sp-token__label';
    lbl.textContent = label;

    const val = document.createElement('span');
    val.className = 'sp-token__hex';
    val.textContent = hex;

    card.appendChild(swatch);
    card.appendChild(lbl);
    card.appendChild(val);

    card.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(hex);
        card.classList.add('text-ok');
        setTimeout(() => card.classList.remove('text-ok'), 2000);
      } catch {
        /* clipboard unavailable */
      }
    });

    grid.appendChild(card);
  }

  return grid;
}

/* ============================================
   Export Section (inline tabbed)
   ============================================ */

type ExportTab = 'css' | 'tailwind' | 'json';

function createExportSection(palette: FlagPalette, tokens: ThemeTokens): HTMLElement {
  const section = document.createElement('div');
  section.className = 'sp-export';

  const title = document.createElement('div');
  title.className = 'sp-section-title';
  title.textContent = 'Export';
  section.appendChild(title);

  const tabs = document.createElement('div');
  tabs.className = 'sp-export__tabs';

  const codeBlock = document.createElement('div');
  codeBlock.className = 'sp-export__code';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'sp-export__copy';
  copyBtn.title = 'Copy';
  copyBtn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  let activeTab: ExportTab = 'css';

  function getCode(tab: ExportTab): string {
    switch (tab) {
      case 'css':
        return exportCSS(tokens);
      case 'tailwind':
        return exportTailwind(tokens);
      case 'json':
        return exportJSON(tokens, palette.countryCode, selectedMode, currentStrictness);
    }
  }

  function renderTab(tab: ExportTab): void {
    activeTab = tab;
    codeBlock.textContent = getCode(tab);
    codeBlock.appendChild(copyBtn);

    for (const t of tabs.querySelectorAll('.sp-export__tab')) {
      t.classList.toggle('sp-export__tab--active', (t as HTMLElement).dataset.tab === tab);
    }
  }

  for (const [key, label] of [
    ['css', 'CSS'],
    ['tailwind', 'Tailwind'],
    ['json', 'JSON'],
  ] as [ExportTab, string][]) {
    const tabBtn = document.createElement('button');
    tabBtn.className = `sp-export__tab${key === activeTab ? ' sp-export__tab--active' : ''}`;
    tabBtn.dataset.tab = key;
    tabBtn.textContent = label;
    tabBtn.addEventListener('click', () => renderTab(key));
    tabs.appendChild(tabBtn);
  }

  section.appendChild(tabs);

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(getCode(activeTab));
      copyBtn.classList.add('text-ok');
      setTimeout(() => copyBtn.classList.remove('text-ok'), 2000);
    } catch {
      /* clipboard unavailable */
    }
  });

  codeBlock.textContent = getCode(activeTab);
  codeBlock.appendChild(copyBtn);
  section.appendChild(codeBlock);

  return section;
}

/* ============================================
   WCAG Summary Table
   ============================================ */

function createWcagSummary(tokens: ThemeTokens): HTMLElement {
  const table = document.createElement('table');
  table.className = 'wcag-summary';

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Pair</th><th>Ratio</th><th>Req</th><th></th></tr>';
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

  return table;
}

/* ============================================
   Apply / Reset Handlers
   ============================================ */

async function handleApply(palette: FlagPalette, btn: HTMLButtonElement): Promise<void> {
  try {
    await currentPaletteCode.setValue(palette.countryCode);
    await currentMode.setValue(selectedMode);
    await strictness.setValue(currentStrictness);
    await addRecentPalette(palette.countryCode);
  } catch {
    // Storage may be unavailable
  }

  let response: MessageResponse | undefined;
  try {
    response = (await browser.runtime.sendMessage({
      type: 'APPLY_THEME',
      paletteCode: palette.countryCode,
      mode: selectedMode,
      strictness: currentStrictness,
    })) as MessageResponse | undefined;
  } catch {
    response = { ok: false, error: 'Theme API unavailable' };
  }

  const origText = btn.textContent;
  if (!response || response.ok) {
    btn.textContent = msg('themeApplied');
    setTimeout(() => {
      btn.textContent = origText;
    }, 1500);
  } else {
    btn.textContent = msg('themeUnavailable');
    btn.classList.replace('btn--primary', 'btn--ghost');
    setTimeout(() => {
      btn.textContent = origText;
      btn.classList.replace('btn--ghost', 'btn--primary');
    }, 3000);
  }
}

async function handleReset(): Promise<void> {
  selectedPalette = null;
  selectedMode = 'DOMINANT_ONLY';

  await currentPaletteCode.setValue(null);
  await currentMode.setValue('DOMINANT_ONLY');

  try {
    await browser.runtime.sendMessage({ type: 'RESET_THEME' });
  } catch {
    /* background not ready */
  }

  renderList();
}

/* ============================================
   Settings Drawer
   ============================================ */

function openSettingsDrawer(): void {
  document.querySelector('.drawer')?.remove();

  const drawer = document.createElement('aside');
  drawer.className = 'drawer';

  const overlay = document.createElement('div');
  overlay.className = 'drawer__overlay';
  overlay.addEventListener('click', () => drawer.remove());
  drawer.appendChild(overlay);

  const panel = document.createElement('div');
  panel.className = 'drawer__panel';

  // Header
  const header = document.createElement('header');
  header.className = 'drawer__header';
  const title = document.createElement('h2');
  title.className = 'drawer__header-title';
  title.textContent = 'Settings';
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

  // Strictness slider
  const strictSection = document.createElement('div');
  strictSection.className = 'drawer__section';
  const strictTitle = document.createElement('h3');
  strictTitle.className = 'drawer__section-title';
  strictTitle.textContent = 'Color Strictness';
  strictSection.appendChild(strictTitle);

  const strictDesc = document.createElement('p');
  strictDesc.className = 'settings__desc';
  strictDesc.textContent = 'Controls how much flag colors can be adjusted to meet contrast requirements.';
  strictSection.appendChild(strictDesc);

  const sliderRow = document.createElement('div');
  sliderRow.className = 'settings__slider-row';
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'settings__slider';
  slider.min = '0';
  slider.max = '1';
  slider.step = '0.05';
  slider.value = String(currentStrictness);
  const sliderValue = document.createElement('span');
  sliderValue.className = 'settings__slider-value';
  sliderValue.textContent = `${Math.round(currentStrictness * 100)}%`;

  slider.addEventListener('input', () => {
    const val = Number.parseFloat(slider.value);
    sliderValue.textContent = `${Math.round(val * 100)}%`;
  });

  slider.addEventListener('change', async () => {
    currentStrictness = Number.parseFloat(slider.value);
    await strictness.setValue(currentStrictness);
    renderList();
  });

  sliderRow.appendChild(slider);
  sliderRow.appendChild(sliderValue);
  strictSection.appendChild(sliderRow);

  const strictLabels = document.createElement('div');
  strictLabels.className = 'settings__slider-labels';
  const relaxedLabel = document.createElement('span');
  relaxedLabel.textContent = 'Relaxed';
  const strictLabel = document.createElement('span');
  strictLabel.textContent = 'Strict';
  strictLabels.appendChild(relaxedLabel);
  strictLabels.appendChild(strictLabel);
  strictSection.appendChild(strictLabels);

  body.appendChild(strictSection);

  // Auto-by-locale toggle
  const autoSection = document.createElement('div');
  autoSection.className = 'drawer__section';
  const autoTitle = document.createElement('h3');
  autoTitle.className = 'drawer__section-title';
  autoTitle.textContent = 'Auto by Locale';
  autoSection.appendChild(autoTitle);

  const autoRow = document.createElement('div');
  autoRow.className = 'settings__toggle-row';
  const autoCheckbox = document.createElement('input');
  autoCheckbox.type = 'checkbox';
  autoCheckbox.id = 'settings-auto-locale';
  const autoLabel = document.createElement('label');
  autoLabel.htmlFor = 'settings-auto-locale';
  autoLabel.className = 'settings__toggle-label';
  autoLabel.textContent = msg('autoByLocale');
  autoRow.appendChild(autoCheckbox);
  autoRow.appendChild(autoLabel);
  autoSection.appendChild(autoRow);

  const autoHint = document.createElement('p');
  autoHint.className = 'settings__desc';
  autoHint.textContent = msg('autoByLocaleHint');
  autoSection.appendChild(autoHint);

  autoByLocale.getValue().then((v) => {
    autoCheckbox.checked = v;
  });
  autoCheckbox.addEventListener('change', () => {
    autoByLocale.setValue(autoCheckbox.checked);
  });

  body.appendChild(autoSection);

  // Promo per spec
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

init();
