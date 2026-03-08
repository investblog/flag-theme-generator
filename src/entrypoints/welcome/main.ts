import { PALETTES } from '@shared/data/palettes';
import { getRecommendedPalette, isAmbiguousLocale, matchPalettesForLocale } from '@shared/services/locale';
import { autoByLocale, currentMode, currentPaletteCode, strictness } from '@shared/services/storage';
import type { MessageResponse } from '@shared/types/messages';
import type { FlagPalette, ThemeMode, ThemeTokens } from '@shared/types/theme';
import { exportCSS } from '@shared/utils/export';
import { getFlagSvg } from '@shared/utils/flags';
import {
  getBestMode,
  getModeLabel,
  getQualityTone,
  getWarningCopy,
  getWarningSeverity,
  getWarningTag,
  MODE_KEYS,
  msg,
  pickMode,
  summarizeMode,
} from '@shared/utils/quality';
import { evaluateCompatibility, generateTokens } from '@shared/utils/tokens';

const TOKEN_CARDS: { key: keyof ThemeTokens; label: string; bg: keyof ThemeTokens; fg: keyof ThemeTokens }[] = [
  { key: 'bg', label: 'BG', bg: 'bg', fg: 'text' },
  { key: 'surface', label: 'Surface', bg: 'surface', fg: 'text' },
  { key: 'text', label: 'Text', bg: 'bg', fg: 'text' },
  { key: 'mutedText', label: 'Muted', bg: 'bg', fg: 'mutedText' },
  { key: 'border', label: 'Border', bg: 'bg', fg: 'border' },
  { key: 'accent', label: 'Accent', bg: 'bg', fg: 'accent' },
  { key: 'accent2', label: 'Accent 2', bg: 'bg', fg: 'accent2' },
  { key: 'accentText', label: 'Acc. Text', bg: 'accent', fg: 'accentText' },
  { key: 'link', label: 'Link', bg: 'bg', fg: 'link' },
  { key: 'focusRing', label: 'Focus', bg: 'surface', fg: 'focusRing' },
];

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

  const header = document.createElement('header');
  header.className = 'welcome__header';
  header.innerHTML = `
    <h1 class="welcome__title">${msg('welcomeHeading')}</h1>
    <p class="welcome__subtitle">${msg('welcomeSubtitle')}</p>
  `;
  app.appendChild(header);

  let locale = 'en';
  try {
    locale = browser.i18n.getUILanguage();
  } catch {
    /* dev fallback */
  }

  const recommended = getRecommendedPalette(locale);
  const ambiguous = isAmbiguousLocale(locale);
  const localeMatches = matchPalettesForLocale(locale);

  const countrySection = createSection('welcomeChooseCountry');
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'welcome__search';
  searchInput.placeholder = msg('searchPlaceholder');
  countrySection.appendChild(searchInput);

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

  const emptyState = document.createElement('div');
  emptyState.className = 'welcome__empty';
  emptyState.textContent = msg('noResults');
  emptyState.hidden = true;

  const orderedPalettes = ambiguous
    ? [...localeMatches, ...PALETTES.filter((p) => !localeMatches.includes(p))]
    : PALETTES;

  for (const palette of orderedPalettes) {
    const card = createCountryCard(palette, grid);
    grid.appendChild(card);
  }
  countrySection.appendChild(grid);
  countrySection.appendChild(emptyState);

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
  filterCountryGrid();

  if (recommended) {
    selectPalette(recommended, grid);
  }

  const modeSection = createSection('welcomeChooseMode');
  const modeGrid = document.createElement('div');
  modeGrid.className = 'mode-grid';
  modeGrid.id = 'mode-grid';
  modeSection.appendChild(modeGrid);
  app.appendChild(modeSection);

  const qualitySection = createSection('qualitySection');
  const qualityContainer = document.createElement('div');
  qualityContainer.className = 'quality-panel';
  qualityContainer.id = 'quality-summary';
  qualitySection.appendChild(qualityContainer);
  app.appendChild(qualitySection);

  const previewSection = createSection('welcomePreview');
  const previewContainer = document.createElement('div');
  previewContainer.className = 'token-preview';
  previewContainer.id = 'token-preview';
  previewSection.appendChild(previewContainer);
  app.appendChild(previewSection);

  const exportRow = document.createElement('div');
  exportRow.className = 'welcome__section';
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn--ghost';
  exportBtn.id = 'btn-export';
  exportBtn.textContent = msg('btnExportCss');
  exportBtn.disabled = true;
  exportBtn.addEventListener('click', () => {
    if (!selectedPalette) return;
    const tokens = generateTokens(selectedPalette, selectedMode, currentStrictness);
    const css = exportCSS(tokens);
    navigator.clipboard.writeText(css).then(() => {
      exportBtn.textContent = msg('btnCopied');
      setTimeout(() => {
        exportBtn.textContent = msg('btnExportCss');
      }, 1500);
    });
  });
  exportRow.appendChild(exportBtn);
  app.appendChild(exportRow);

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
    galleryLink.textContent = msg('sidepanelHint');
    galleryLink.classList.add('text-ok');
    setTimeout(() => {
      galleryLink.textContent = msg('btnBrowsePalettes');
      galleryLink.classList.remove('text-ok');
    }, 3000);
  });

  btnRow.appendChild(applyBtn);
  btnRow.appendChild(resetBtn);
  btnRow.appendChild(galleryLink);
  actions.appendChild(btnRow);

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

  loadSavedState(grid);
  updateModeGrid();
  updateQualitySummary();
  updatePreview();

  checkThemeApi().then((available) => {
    themeApiAvailable = available;
    if (!available) {
      applyBtn.textContent = msg('themeUnavailable');
      applyBtn.disabled = true;
      applyBtn.classList.replace('btn--primary', 'btn--ghost');
      resetBtn.disabled = true;
    } else if (selectedPalette) {
      applyBtn.disabled = false;
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
  const report = evaluateCompatibility(selectedPalette, currentStrictness);
  selectedMode = pickMode(selectedMode, report);

  for (const card of grid.querySelectorAll('.country-card')) {
    card.classList.toggle('country-card--selected', (card as HTMLElement).dataset.code === palette.countryCode);
  }

  updateModeGrid();
  updateQualitySummary();
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
  if (report) selectedMode = pickMode(selectedMode, report);
  const bestMode = report ? getBestMode(report) : 'DOMINANT_ONLY';

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

    const labelRow = document.createElement('div');
    labelRow.className = 'mode-card__row';

    const label = document.createElement('span');
    label.className = 'mode-card__label';
    label.textContent = msg(msgKey);
    labelRow.appendChild(label);

    if (mode === bestMode && mode !== 'DOMINANT_ONLY') {
      const badge = document.createElement('span');
      badge.className = 'mode-card__badge';
      badge.textContent = msg('qualityTop');
      labelRow.appendChild(badge);
    }

    const score = document.createElement('span');
    score.className = 'mode-card__score';
    score.textContent =
      mode === 'DOMINANT_ONLY' || !report
        ? msg('qualitySafeShort')
        : `${report.quality[mode as 'AMOLED' | 'DARK' | 'LIGHT'].score}/100`;

    const hint = document.createElement('span');
    hint.className = 'mode-card__hint';
    hint.textContent = report ? summarizeMode(report, mode) : msg('pickCountryPreview');

    card.appendChild(labelRow);
    card.appendChild(score);
    card.appendChild(hint);

    card.addEventListener('click', () => {
      if (!isSupported) return;
      selectedMode = mode;
      updateModeGrid();
      updateQualitySummary();
      updatePreview();
    });

    grid.appendChild(card);
  }
}

function updateQualitySummary(): void {
  const container = document.getElementById('quality-summary');
  if (!container) return;
  container.innerHTML = '';

  if (!selectedPalette) {
    container.innerHTML = `<p class="quality-panel__empty">${msg('qualityEmpty')}</p>`;
    return;
  }

  const report = evaluateCompatibility(selectedPalette, currentStrictness);
  selectedMode = pickMode(selectedMode, report);
  const activeMode = selectedMode === 'DOMINANT_ONLY' ? getBestMode(report) : selectedMode;
  const bestMode = getBestMode(report);
  const quality = activeMode === 'DOMINANT_ONLY' ? null : report.quality[activeMode as 'AMOLED' | 'DARK' | 'LIGHT'];

  const hero = document.createElement('div');
  hero.className = 'quality-panel__hero';

  const heroLabel = document.createElement('span');
  heroLabel.className = 'quality-panel__eyebrow';
  heroLabel.textContent = bestMode === activeMode ? msg('qualityRecommended') : msg('qualityCurrent');

  const heroTitle = document.createElement('div');
  heroTitle.className = 'quality-panel__title';
  heroTitle.textContent = getModeLabel(activeMode);

  const heroMeta = document.createElement('div');
  heroMeta.className = 'quality-panel__meta';
  heroMeta.textContent = quality
    ? msg('qualityMeta', String(quality.score), getQualityTone(quality.score))
    : msg('qualitySafeMeta');

  const heroBody = document.createElement('p');
  heroBody.className = 'quality-panel__body';
  heroBody.textContent =
    activeMode === 'DOMINANT_ONLY'
      ? msg('qualitySafeBody')
      : msg('qualityBestPick', getModeLabel(bestMode), summarizeMode(report, activeMode));

  hero.appendChild(heroLabel);
  hero.appendChild(heroTitle);
  hero.appendChild(heroMeta);
  hero.appendChild(heroBody);
  container.appendChild(hero);

  if (quality) {
    const stats = document.createElement('div');
    stats.className = 'quality-panel__stats';
    for (const [label, value] of [
      [msg('qualityStatFidelity'), quality.fidelity],
      [msg('qualityStatHeadroom'), quality.contrastHeadroom],
      [msg('qualityStatDistinctness'), quality.distinctness],
    ] as const) {
      const stat = document.createElement('div');
      stat.className = 'quality-stat';
      stat.innerHTML = `<span class="quality-stat__label">${label}</span><strong class="quality-stat__value">${Math.round(value * 100)}%</strong>`;
      stats.appendChild(stat);
    }
    container.appendChild(stats);

    const warningWrap = document.createElement('div');
    warningWrap.className = 'quality-panel__warnings';
    if (quality.warnings.length === 0) {
      const item = document.createElement('div');
      item.className = 'quality-warning quality-warning--ok';
      item.textContent = msg('qualityNoTradeoffs');
      warningWrap.appendChild(item);
    } else {
      for (const warning of quality.warnings) {
        const item = document.createElement('div');
        item.className = `quality-warning quality-warning--${getWarningSeverity(warning)}`;
        item.textContent = `${getWarningTag(warning)}: ${getWarningCopy(warning)}`;
        warningWrap.appendChild(item);
      }
    }
    container.appendChild(warningWrap);
  }
}

function updatePreview(): void {
  const container = document.getElementById('token-preview');
  if (!container || !selectedPalette) return;
  container.innerHTML = '';

  const tokens = generateTokens(selectedPalette, selectedMode, currentStrictness);
  const grid = document.createElement('div');
  grid.className = 'token-grid';

  for (const { key, label, bg, fg } of TOKEN_CARDS) {
    const hex = tokens[key];
    const card = document.createElement('div');
    card.className = 'token-grid__card';
    card.style.background = tokens[bg];
    card.style.color = tokens[fg];

    const lbl = document.createElement('span');
    lbl.className = 'token-grid__label';
    lbl.textContent = label;

    const val = document.createElement('span');
    val.className = 'token-grid__hex';
    val.textContent = hex;

    card.appendChild(lbl);
    card.appendChild(val);
    grid.appendChild(card);
  }

  container.appendChild(grid);
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

  let response: MessageResponse | undefined;
  try {
    response = (await browser.runtime.sendMessage({
      type: 'APPLY_THEME',
      paletteCode: selectedPalette.countryCode,
      mode: selectedMode,
      strictness: currentStrictness,
    })) as MessageResponse | undefined;
  } catch {
    response = { ok: false, error: 'Background not ready' };
  }

  if (applyBtn) {
    const origText = applyBtn.textContent;
    if (!response || response.ok) {
      applyBtn.textContent = msg('themeApplied');
      setTimeout(() => {
        applyBtn.textContent = origText;
      }, 1500);
    } else {
      applyBtn.textContent = response.error ?? msg('themeUnavailable');
      applyBtn.classList.replace('btn--primary', 'btn--ghost');
      setTimeout(() => {
        applyBtn.textContent = origText;
        applyBtn.classList.replace('btn--ghost', 'btn--primary');
      }, 3000);
    }
  }
}

async function handleReset(): Promise<void> {
  await currentPaletteCode.setValue(null);
  await currentMode.setValue('DOMINANT_ONLY');
  selectedMode = 'DOMINANT_ONLY';

  try {
    await browser.runtime.sendMessage({ type: 'RESET_THEME' });
  } catch {
    /* background not ready */
  }

  updateModeGrid();
  updateQualitySummary();
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
    // Storage unavailable in dev -> use defaults
  }
}

init();
