import { createMiniBrowser } from '@shared/components/mini-browser';
import { PALETTES } from '@shared/data/palettes';
import { getRecommendedPalette, isAmbiguousLocale, matchPalettesForLocale } from '@shared/services/locale';
import { autoByLocale, currentMode, currentPaletteCode, strictness } from '@shared/services/storage';
import type { MessageResponse } from '@shared/types/messages';
import type { FlagPalette, ThemeMode } from '@shared/types/theme';
import { exportCSS } from '@shared/utils/export';
import { getFlagSvg } from '@shared/utils/flags';
import { evaluateCompatibility, generateTokens } from '@shared/utils/tokens';

const MODE_KEYS: { mode: ThemeMode; msgKey: string }[] = [
  { mode: 'AMOLED', msgKey: 'modeAmoled' },
  { mode: 'DARK', msgKey: 'modeDark' },
  { mode: 'LIGHT', msgKey: 'modeLight' },
  { mode: 'DOMINANT_ONLY', msgKey: 'modeDominantOnly' },
];

/** Safe i18n helper — returns key if browser.i18n unavailable. */
function msg(key: string, ...subs: string[]): string {
  try {
    // Dynamic key from data arrays — cast needed for WXT strict i18n types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return browser.i18n.getMessage(key as any, subs) || key;
  } catch {
    return key;
  }
}

// State
let selectedPalette: FlagPalette | null = null;
let selectedMode: ThemeMode = 'DOMINANT_ONLY';
let currentStrictness = 0.7;
let themeApiAvailable = false;

async function checkThemeApi(): Promise<boolean> {
  try {
    const resp = (await browser.runtime.sendMessage({ type: 'HAS_THEME_API' })) as MessageResponse | undefined;
    return resp?.ok === true;
  } catch {
    return false;
  }
}

function init(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = '';
  app.className = 'welcome';

  // Header
  const header = document.createElement('header');
  header.className = 'welcome__header';
  header.innerHTML = `
    <h1 class="welcome__title">${msg('welcomeHeading')}</h1>
    <p class="welcome__subtitle">${msg('welcomeSubtitle')}</p>
  `;
  app.appendChild(header);

  // Detect locale and auto-recommend
  let locale = 'en';
  try {
    locale = browser.i18n.getUILanguage();
  } catch {
    /* dev fallback */
  }

  const recommended = getRecommendedPalette(locale);
  const ambiguous = isAmbiguousLocale(locale);
  const localeMatches = matchPalettesForLocale(locale);

  // Country picker section
  const countrySection = createSection('welcomeChooseCountry');

  // Search input
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'welcome__search';
  searchInput.placeholder = msg('searchPlaceholder');
  countrySection.appendChild(searchInput);

  // Region filter chips (Antarctica only via search)
  const regions = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
  const filtersRow = document.createElement('div');
  filtersRow.className = 'welcome__filters';
  let activeRegion: string | null = null;

  for (const region of regions) {
    const chip = document.createElement('button');
    chip.className = 'filter-chip';
    chip.textContent = region;
    chip.dataset.region = region;
    chip.addEventListener('click', () => {
      activeRegion = activeRegion === region ? null : region;
      for (const c of filtersRow.querySelectorAll('.filter-chip')) {
        c.classList.toggle('filter-chip--active', (c as HTMLElement).dataset.region === activeRegion);
      }
      filterCountryGrid();
    });
    filtersRow.appendChild(chip);
  }
  countrySection.appendChild(filtersRow);

  // Wave 1 top-20 by population — shown by default
  const WAVE1 = new Set([
    'IN',
    'CN',
    'US',
    'ID',
    'PK',
    'NG',
    'BR',
    'BD',
    'RU',
    'ET',
    'MX',
    'JP',
    'EG',
    'PH',
    'CD',
    'VN',
    'IR',
    'TR',
    'DE',
    'TH',
  ]);

  const grid = document.createElement('div');
  grid.className = 'country-grid';

  // Empty state
  const emptyState = document.createElement('div');
  emptyState.className = 'welcome__empty';
  emptyState.textContent = msg('noResults');
  emptyState.hidden = true;

  // Show locale matches first, then rest
  const orderedPalettes = ambiguous
    ? [...localeMatches, ...PALETTES.filter((p) => !localeMatches.includes(p))]
    : PALETTES;

  for (const palette of orderedPalettes) {
    const card = createCountryCard(palette, grid);
    grid.appendChild(card);
  }
  countrySection.appendChild(grid);
  countrySection.appendChild(emptyState);

  // Filter logic: default shows only Wave 1, search/filter reveals all
  function filterCountryGrid(): void {
    const query = searchInput.value.trim().toLowerCase();
    const isFiltering = !!query || !!activeRegion;
    let visibleCount = 0;

    for (const card of grid.querySelectorAll('.country-card') as NodeListOf<HTMLElement>) {
      const code = card.dataset.code ?? '';
      const palette = PALETTES.find((p) => p.countryCode === code);
      if (!palette) continue;

      let visible: boolean;
      if (!isFiltering) {
        // Default: only Wave 1
        visible = WAVE1.has(code);
      } else {
        const matchesSearch =
          !query ||
          palette.name_en.toLowerCase().includes(query) ||
          palette.name_ru.toLowerCase().includes(query) ||
          palette.countryCode.toLowerCase().includes(query);
        const matchesRegion = !activeRegion || palette.region === activeRegion;
        visible = matchesSearch && matchesRegion;
      }

      card.hidden = !visible;
      if (visible) visibleCount++;
    }

    emptyState.hidden = visibleCount > 0;
  }

  searchInput.addEventListener('input', filterCountryGrid);
  app.appendChild(countrySection);

  // Apply initial filter (show Wave 1 only)
  filterCountryGrid();

  // Auto-select recommended or first locale match
  if (recommended) {
    selectPalette(recommended, grid);
  }

  // Mode picker section
  const modeSection = createSection('welcomeChooseMode');
  const modeGrid = document.createElement('div');
  modeGrid.className = 'mode-grid';
  modeGrid.id = 'mode-grid';
  modeSection.appendChild(modeGrid);
  app.appendChild(modeSection);

  // Preview section
  const previewSection = createSection('welcomePreview');
  const previewContainer = document.createElement('div');
  previewContainer.className = 'token-preview';
  previewContainer.id = 'token-preview';
  previewSection.appendChild(previewContainer);
  app.appendChild(previewSection);

  // Export button (for webmasters — works without applying)
  const exportRow = document.createElement('div');
  exportRow.className = 'welcome__section';
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn--ghost';
  exportBtn.id = 'btn-export';
  exportBtn.textContent = 'Export CSS';
  exportBtn.disabled = true;
  exportBtn.addEventListener('click', () => {
    if (!selectedPalette) return;
    const tokens = generateTokens(selectedPalette, selectedMode, currentStrictness);
    const css = exportCSS(tokens);
    navigator.clipboard.writeText(css).then(() => {
      exportBtn.textContent = 'Copied!';
      setTimeout(() => {
        exportBtn.textContent = 'Export CSS';
      }, 1500);
    });
  });
  exportRow.appendChild(exportBtn);
  app.appendChild(exportRow);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'welcome__section';

  const btnRow = document.createElement('div');
  btnRow.className = 'welcome__actions';

  const applyBtn = document.createElement('button');
  applyBtn.className = 'btn btn--primary';
  applyBtn.id = 'btn-apply';
  applyBtn.textContent = msg('btnApply');
  applyBtn.disabled = true;
  applyBtn.addEventListener('click', handleApply);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn--ghost';
  resetBtn.id = 'btn-reset';
  resetBtn.textContent = msg('btnReset');
  resetBtn.addEventListener('click', handleReset);

  const galleryLink = document.createElement('button');
  galleryLink.className = 'btn btn--ghost';
  galleryLink.textContent = msg('btnBrowsePalettes');
  galleryLink.addEventListener('click', () => {
    browser.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
  });

  btnRow.appendChild(applyBtn);
  btnRow.appendChild(resetBtn);
  btnRow.appendChild(galleryLink);
  actions.appendChild(btnRow);

  // Auto-by-locale toggle
  const toggleRow = document.createElement('div');
  toggleRow.className = 'toggle-row';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'auto-locale';
  checkbox.addEventListener('change', () => {
    autoByLocale.setValue(checkbox.checked);
  });
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'toggle-row__label';
  toggleLabel.htmlFor = 'auto-locale';
  toggleLabel.textContent = msg('autoByLocale');
  toggleRow.appendChild(checkbox);
  toggleRow.appendChild(toggleLabel);
  actions.appendChild(toggleRow);

  const hint = document.createElement('p');
  hint.className = 'toggle-row__hint';
  hint.textContent = msg('autoByLocaleHint');
  actions.appendChild(hint);

  app.appendChild(actions);

  // Load saved state
  loadSavedState(grid);
  updateModeGrid();
  updatePreview();

  // Check if theme API is available (Firefox only)
  checkThemeApi().then((available) => {
    themeApiAvailable = available;
    if (!available) {
      applyBtn.textContent = msg('themeUnavailable');
      applyBtn.disabled = true;
      applyBtn.classList.replace('btn--primary', 'btn--ghost');
      resetBtn.disabled = true;
    }
  });
}

function createSection(labelMsgKey: string): HTMLElement {
  const section = document.createElement('section');
  section.className = 'welcome__section';
  const label = document.createElement('h2');
  label.className = 'welcome__section-label';
  label.textContent = msg(labelMsgKey);
  section.appendChild(label);
  return section;
}

function createCountryCard(palette: FlagPalette, grid: HTMLElement): HTMLElement {
  const card = document.createElement('div');
  card.className = 'country-card';
  card.dataset.code = palette.countryCode;

  const flag = document.createElement('div');
  flag.className = 'country-card__flag';
  flag.innerHTML = getFlagSvg(palette.countryCode) ?? '';

  const name = document.createElement('span');
  name.className = 'country-card__name';
  name.textContent = palette.name_en;

  card.appendChild(flag);
  card.appendChild(name);

  card.addEventListener('click', () => {
    selectPalette(palette, grid);
  });

  return card;
}

function selectPalette(palette: FlagPalette, grid: HTMLElement): void {
  selectedPalette = palette;

  // Update selection UI
  for (const card of grid.querySelectorAll('.country-card')) {
    card.classList.toggle('country-card--selected', (card as HTMLElement).dataset.code === palette.countryCode);
  }

  updateModeGrid();
  updatePreview();

  const applyBtn = document.getElementById('btn-apply') as HTMLButtonElement | null;
  if (applyBtn && themeApiAvailable) applyBtn.disabled = false;

  const exportBtnEl = document.getElementById('btn-export') as HTMLButtonElement | null;
  if (exportBtnEl) exportBtnEl.disabled = false;
}

function updateModeGrid(): void {
  const grid = document.getElementById('mode-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const report = selectedPalette ? evaluateCompatibility(selectedPalette, currentStrictness) : null;

  for (const { mode, msgKey } of MODE_KEYS) {
    const card = document.createElement('div');
    card.className = 'mode-card';
    card.dataset.mode = mode;

    const isSupported = mode === 'DOMINANT_ONLY' || report?.supports[mode as 'AMOLED' | 'DARK' | 'LIGHT'];

    if (!isSupported) {
      card.classList.add('mode-card--disabled');
      card.title = msg('modeDisabledTooltip', msg(msgKey));
    }

    if (mode === selectedMode) {
      card.classList.add('mode-card--selected');
    }

    const label = document.createElement('span');
    label.className = 'mode-card__label';
    label.textContent = msg(msgKey);
    card.appendChild(label);

    card.addEventListener('click', () => {
      if (!isSupported) return;
      selectedMode = mode;
      updateModeGrid();
      updatePreview();
    });

    grid.appendChild(card);
  }
}

function updatePreview(): void {
  const container = document.getElementById('token-preview');
  if (!container || !selectedPalette) return;
  container.innerHTML = '';

  const tokens = generateTokens(selectedPalette, selectedMode, currentStrictness);
  container.appendChild(createMiniBrowser(tokens));
}

async function handleApply(): Promise<void> {
  if (!selectedPalette) return;

  const applyBtn = document.getElementById('btn-apply') as HTMLButtonElement | null;

  try {
    await currentPaletteCode.setValue(selectedPalette.countryCode);
    await currentMode.setValue(selectedMode);
    await strictness.setValue(currentStrictness);
  } catch {
    // Storage may be unavailable in dev
  }

  try {
    await browser.runtime.sendMessage({
      type: 'APPLY_THEME',
      paletteCode: selectedPalette.countryCode,
      mode: selectedMode,
      strictness: currentStrictness,
    });
  } catch {
    // background not ready
  }

  if (applyBtn) {
    const origText = applyBtn.textContent;
    applyBtn.textContent = msg('themeApplied');
    setTimeout(() => {
      applyBtn.textContent = origText;
    }, 1500);
  }
}

async function handleReset(): Promise<void> {
  await currentPaletteCode.setValue(null);
  await currentMode.setValue('DOMINANT_ONLY');

  try {
    await browser.runtime.sendMessage({ type: 'RESET_THEME' });
  } catch {
    /* background not ready */
  }
}

async function loadSavedState(grid: HTMLElement): Promise<void> {
  try {
    const [savedCode, savedMode, savedStrictness] = await Promise.all([
      currentPaletteCode.getValue(),
      currentMode.getValue(),
      strictness.getValue(),
    ]);

    if (savedMode) selectedMode = savedMode;
    if (savedStrictness) currentStrictness = savedStrictness;

    if (savedCode) {
      const palette = PALETTES.find((p) => p.countryCode === savedCode);
      if (palette) selectPalette(palette, grid);
    }
  } catch {
    // Storage unavailable in dev — use defaults
  }
}

init();
