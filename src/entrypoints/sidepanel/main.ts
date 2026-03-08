import { PALETTES } from '@shared/data/palettes';
import { getRegions } from '@shared/services/locale';
import { addRecentPalette, autoByLocale, currentMode, currentPaletteCode, strictness } from '@shared/services/storage';
import type { MessageResponse } from '@shared/types/messages';
import type { CompatibilityReport, FlagPalette, ThemeMode, ThemeTokens } from '@shared/types/theme';
import { REQUIRED_PAIRS } from '@shared/types/theme';
import { contrast } from '@shared/utils/contrast';
import { exportCSS, exportJSON, exportTailwind } from '@shared/utils/export';
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
import { countryPageUrl } from '@shared/utils/site';
import { evaluateCompatibility, generateTokens } from '@shared/utils/tokens';

function svgIcon(pathD: string, size = 16): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

const ICON_COPY =
  'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1';
const ICON_DOWNLOAD = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
const ICON_X = 'M18 6 6 18M6 6l12 12';
const ICON_PIPETTE =
  'm12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12M18 9l.4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3zM2 22l.414-.414';

const MODE_NAMES: Record<string, string> = {
  AMOLED: 'A',
  DARK: 'D',
  LIGHT: 'L',
};

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

let searchQuery = '';
let activeRegion = '';
let currentStrictness = 0.7;
let canApplyTheme = false;
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
    const savedMode = await currentMode.getValue();
    if (savedMode) selectedMode = savedMode;
  } catch {
    /* storage unavailable */
  }

  canApplyTheme = await checkThemeApi();

  app.innerHTML = '';
  app.className = 'sidepanel';

  const header = document.createElement('header');
  header.className = 'sp-header';
  const title = document.createElement('h1');
  title.className = 'sp-header__title';
  title.textContent = msg('extName');
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'sp-header__settings';
  settingsBtn.textContent = '\u2699';
  settingsBtn.title = msg('settingsTitle');
  settingsBtn.addEventListener('click', openSettingsDrawer);
  header.appendChild(title);
  header.appendChild(settingsBtn);
  app.appendChild(header);

  const search = document.createElement('input');
  search.className = 'sp-search';
  search.type = 'search';
  search.placeholder = msg('searchPlaceholder');
  search.addEventListener('input', () => {
    searchQuery = search.value.trim().toLowerCase();
    renderList();
  });
  app.appendChild(search);

  const filters = document.createElement('div');
  filters.className = 'sp-filters';
  const allChip = createFilterChip(msg('searchAllRegions'), '', filters);
  allChip.classList.add('filter-chip--active');
  filters.appendChild(allChip);
  for (const region of getRegions()) {
    if (region === 'Antarctica') continue;
    filters.appendChild(createFilterChip(region, region, filters));
  }
  app.appendChild(filters);

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

  const isFiltering = !!searchQuery || !!activeRegion;
  const filtered = PALETTES.filter((p) => {
    if (!isFiltering) return WAVE1.has(p.countryCode);
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
    empty.textContent = msg('noResults');
    listEl.appendChild(empty);
    return;
  }

  for (const palette of filtered) {
    listEl.appendChild(createPaletteCard(palette));
  }
}

function createPaletteCard(palette: FlagPalette): HTMLElement {
  const card = document.createElement('div');
  card.className = 'sp-card';

  const flag = document.createElement('div');
  flag.className = 'sp-card__flag';
  flag.innerHTML = getFlagSvg(palette.countryCode) ?? '';
  card.appendChild(flag);

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

  const report = evaluateCompatibility(palette, currentStrictness);
  const bestMode = getBestMode(report);
  const bestQuality = bestMode === 'DOMINANT_ONLY' ? null : report.quality[bestMode as 'AMOLED' | 'DARK' | 'LIGHT'];
  const summary = document.createElement('div');
  summary.className = 'sp-card__summary';
  summary.textContent = bestQuality ? `${getModeLabel(bestMode)} - ${bestQuality.score}/100` : msg('modeDominantOnly');
  info.appendChild(summary);
  card.appendChild(info);

  const modes = document.createElement('div');
  modes.className = 'sp-card__modes';
  for (const [key, label] of Object.entries(MODE_NAMES)) {
    const badge = document.createElement('span');
    badge.className = 'mode-badge';
    badge.textContent = label;
    if (report.supports[key as 'AMOLED' | 'DARK' | 'LIGHT']) {
      badge.classList.add('mode-badge--supported');
    }
    if (bestMode === key) {
      badge.classList.add('mode-badge--best');
    }
    modes.appendChild(badge);
  }
  card.appendChild(modes);

  card.addEventListener('click', () => {
    const r = evaluateCompatibility(palette, currentStrictness);
    selectedMode = getBestMode(r);
    openPaletteDrawer(palette);
  });

  return card;
}

function createQualityBlock(report: CompatibilityReport, mode: ThemeMode, compact = false): HTMLElement {
  const block = document.createElement('section');
  block.className = `sp-quality${compact ? ' sp-quality--compact' : ''}`;
  const activeMode = mode === 'DOMINANT_ONLY' ? getBestMode(report) : mode;
  const quality = activeMode === 'DOMINANT_ONLY' ? null : report.quality[activeMode as 'AMOLED' | 'DARK' | 'LIGHT'];
  const bestMode = getBestMode(report);

  const header = document.createElement('div');
  header.className = 'sp-quality__header';
  header.innerHTML = `
    <span class="sp-quality__eyebrow">${bestMode === activeMode ? msg('qualityRecommended') : msg('qualityCurrent')}</span>
    <strong class="sp-quality__title">${getModeLabel(activeMode)}</strong>
    <span class="sp-quality__meta">${quality ? `${quality.score}/100 - ${getQualityTone(quality.score)}` : msg('qualitySafeMeta')}</span>
  `;
  block.appendChild(header);

  const body = document.createElement('p');
  body.className = 'sp-quality__body';
  body.textContent =
    activeMode === 'DOMINANT_ONLY'
      ? msg('qualitySafeBody')
      : msg('qualityBestPick', getModeLabel(bestMode), summarizeMode(report, activeMode));
  block.appendChild(body);

  if (quality) {
    const stats = document.createElement('div');
    stats.className = 'sp-quality__stats';
    for (const [label, value] of [
      [msg('qualityStatFidelity'), quality.fidelity],
      [msg('qualityStatHeadroom'), quality.contrastHeadroom],
      [msg('qualityStatDistinct'), quality.distinctness],
    ] as const) {
      const chip = document.createElement('span');
      chip.className = 'sp-quality__stat';
      chip.textContent = `${label} ${Math.round(value * 100)}%`;
      stats.appendChild(chip);
    }
    block.appendChild(stats);

    const warnings = document.createElement('div');
    warnings.className = 'sp-quality__warnings';
    if (quality.warnings.length === 0) {
      const item = document.createElement('span');
      item.className = 'sp-quality__warning sp-quality__warning--ok';
      item.textContent = msg('qualityNoTradeoffs');
      warnings.appendChild(item);
    } else {
      for (const warning of quality.warnings) {
        const item = document.createElement('span');
        item.className = `sp-quality__warning sp-quality__warning--${getWarningSeverity(warning)}`;
        item.textContent = compact ? getWarningTag(warning) : `${getWarningTag(warning)}: ${getWarningCopy(warning)}`;
        warnings.appendChild(item);
      }
    }
    block.appendChild(warnings);
  }

  return block;
}

function openPaletteDrawer(palette: FlagPalette): void {
  document.querySelector('.drawer')?.remove();

  const drawer = document.createElement('aside');
  drawer.className = 'drawer';

  document.documentElement.style.overflow = 'hidden';
  const closeDrawer = () => {
    document.documentElement.style.overflow = '';
    drawer.remove();
  };

  const overlay = document.createElement('div');
  overlay.className = 'drawer__overlay';
  overlay.addEventListener('click', closeDrawer);
  drawer.appendChild(overlay);

  const panel = document.createElement('div');
  panel.className = 'drawer__panel';

  const header = document.createElement('header');
  header.className = 'drawer__header';

  const titleRow = document.createElement('div');
  titleRow.className = 'drawer__title';

  const flagSvg = getFlagSvg(palette.countryCode);
  if (flagSvg) {
    const flagEl = document.createElement('span');
    flagEl.className = 'sp-card__flag';
    flagEl.innerHTML = flagSvg;
    titleRow.appendChild(flagEl);
  }

  const nameEl = document.createElement('span');
  nameEl.className = 'drawer__palette-name';
  nameEl.textContent = palette.name_en;
  titleRow.appendChild(nameEl);

  const codeEl = document.createElement('span');
  codeEl.className = 'drawer__palette-code';
  codeEl.textContent = palette.countryCode;
  titleRow.appendChild(codeEl);

  header.appendChild(titleRow);

  const headerActions = document.createElement('div');
  headerActions.className = 'drawer__header-actions';

  if (flagSvg) {
    const copySvgBtn = document.createElement('button');
    copySvgBtn.className = 'drawer__icon-btn';
    copySvgBtn.title = msg('copySvg');
    copySvgBtn.appendChild(svgIcon(ICON_COPY));
    copySvgBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(flagSvg);
        copySvgBtn.classList.add('text-ok');
        setTimeout(() => copySvgBtn.classList.remove('text-ok'), 2000);
      } catch {
        /* clipboard unavailable */
      }
    });

    const dlBtn = document.createElement('button');
    dlBtn.className = 'drawer__icon-btn';
    dlBtn.title = msg('downloadSvg');
    dlBtn.appendChild(svgIcon(ICON_DOWNLOAD));
    dlBtn.addEventListener('click', () => {
      const blob = new Blob([flagSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flag-${palette.countryCode.toLowerCase()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    });

    headerActions.appendChild(copySvgBtn);
    headerActions.appendChild(dlBtn);
  }

  let showContrast = false;
  const contrastBtn = document.createElement('button');
  contrastBtn.className = 'drawer__icon-btn';
  contrastBtn.title = msg('contrastAnalysis');
  contrastBtn.appendChild(svgIcon(ICON_PIPETTE));
  contrastBtn.addEventListener('click', () => {
    showContrast = !showContrast;
    contrastBtn.classList.toggle('drawer__icon-btn--active', showContrast);
    const section = body.querySelector('.drawer__contrast-section') as HTMLElement | null;
    if (section) section.hidden = !showContrast;
  });
  headerActions.appendChild(contrastBtn);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'drawer__icon-btn';
  closeBtn.title = msg('close');
  closeBtn.appendChild(svgIcon(ICON_X));
  closeBtn.addEventListener('click', closeDrawer);
  headerActions.appendChild(closeBtn);

  header.appendChild(headerActions);
  panel.appendChild(header);

  const body = document.createElement('div');
  body.className = 'drawer__body drawer__body--palette';

  function renderDrawerBody(): void {
    body.innerHTML = '';

    const report = evaluateCompatibility(palette, currentStrictness);
    selectedMode = pickMode(selectedMode, report);

    body.appendChild(createQualityBlock(report, selectedMode));

    const modeTitle = document.createElement('div');
    modeTitle.className = 'sp-section-title';
    modeTitle.textContent = msg('welcomeChooseMode');
    body.appendChild(modeTitle);

    const modes = document.createElement('div');
    modes.className = 'sp-modes';
    for (const { mode, msgKey } of MODE_KEYS) {
      const btn = document.createElement('button');
      btn.className = `sp-modes__btn${mode === selectedMode ? ' sp-modes__btn--active' : ''}`;
      const isSupported = mode === 'DOMINANT_ONLY' || report.supports[mode as 'AMOLED' | 'DARK' | 'LIGHT'];
      btn.textContent =
        mode === 'DOMINANT_ONLY' || !report
          ? msg(msgKey)
          : `${msg(msgKey)} - ${report.quality[mode as 'AMOLED' | 'DARK' | 'LIGHT'].score}`;

      if (!isSupported) btn.disabled = true;
      btn.title = summarizeMode(report, mode);

      btn.addEventListener('click', () => {
        if (!isSupported) return;
        selectedMode = mode;
        renderDrawerBody();
      });
      modes.appendChild(btn);
    }
    body.appendChild(modes);

    const tokens = generateTokens(palette, selectedMode, currentStrictness);

    body.style.setProperty('--bg', tokens.bg);
    body.style.setProperty('--bg-elevated', tokens.surface);
    body.style.setProperty('--bg-soft', tokens.surface);
    body.style.setProperty('--text-main', tokens.text);
    body.style.setProperty('--text-muted', tokens.mutedText);
    body.style.setProperty('--text-subtle', tokens.mutedText);
    body.style.setProperty('--border-subtle', tokens.border);
    body.style.setProperty('--primary', tokens.accent);
    body.style.setProperty('--ok', tokens.accent2);
    body.style.background = tokens.bg;
    body.style.color = tokens.text;

    const tokensTitle = document.createElement('div');
    tokensTitle.className = 'sp-section-title';
    tokensTitle.textContent = msg('welcomePreview');
    body.appendChild(tokensTitle);
    body.appendChild(createTokenGrid(tokens));

    const detailScroll = document.createElement('div');
    detailScroll.className = 'drawer__detail-scroll';

    const contrastSection = document.createElement('div');
    contrastSection.className = 'drawer__contrast-section';
    contrastSection.hidden = !showContrast;
    const contrastTitle = document.createElement('div');
    contrastTitle.className = 'sp-section-title';
    contrastTitle.textContent = msg('contrastTitle');
    contrastSection.appendChild(contrastTitle);
    contrastSection.appendChild(createWcagSummary(tokens));
    detailScroll.appendChild(contrastSection);

    detailScroll.appendChild(createExportSection(palette, tokens));
    body.appendChild(detailScroll);
  }

  renderDrawerBody();
  panel.appendChild(body);

  const footer = document.createElement('footer');
  footer.className = 'drawer__footer';

  const footerActions = document.createElement('div');
  footerActions.className = 'sp-actions';

  if (canApplyTheme) {
    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn btn--primary';
    applyBtn.textContent = msg('btnApply');
    applyBtn.addEventListener('click', () => handleApply(palette, applyBtn));
    footerActions.appendChild(applyBtn);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn--ghost';
    resetBtn.textContent = msg('btnReset');
    resetBtn.addEventListener('click', () => {
      handleReset();
      closeDrawer();
    });
    footerActions.appendChild(resetBtn);
  } else {
    const dlLink = document.createElement('a');
    dlLink.className = 'btn btn--primary';
    dlLink.textContent = msg('downloadTheme');
    dlLink.href = countryPageUrl(palette.name_en);
    dlLink.target = '_blank';
    dlLink.rel = 'noopener';
    footerActions.appendChild(dlLink);
  }
  footer.appendChild(footerActions);
  panel.appendChild(footer);

  drawer.appendChild(panel);
  document.body.appendChild(drawer);
}

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

function createTokenGrid(tokens: ThemeTokens): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'sp-tokens';

  for (const { key, label, bg, fg } of TOKEN_CARDS) {
    const hex = tokens[key];
    const card = document.createElement('button');
    card.className = 'sp-token';
    card.title = `Copy ${hex}`;
    card.style.background = tokens[bg];
    card.style.color = tokens[fg];

    const lbl = document.createElement('span');
    lbl.className = 'sp-token__label';
    lbl.textContent = label;

    const val = document.createElement('span');
    val.className = 'sp-token__hex';
    val.textContent = hex;

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

type ExportTab = 'css' | 'tailwind' | 'json';

function createExportSection(palette: FlagPalette, tokens: ThemeTokens): HTMLElement {
  const section = document.createElement('div');
  section.className = 'sp-export';

  const title = document.createElement('div');
  title.className = 'sp-section-title';
  title.textContent = msg('exportTitle');
  section.appendChild(title);

  const tabs = document.createElement('div');
  tabs.className = 'sp-export__tabs';

  const codeBlock = document.createElement('div');
  codeBlock.className = 'sp-export__code';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'sp-export__copy';
  copyBtn.title = msg('exportCopy');
  copyBtn.appendChild(svgIcon(ICON_COPY));

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

function createWcagSummary(tokens: ThemeTokens): HTMLElement {
  const table = document.createElement('table');
  table.className = 'wcag-summary';

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>${msg('wcagPair')}</th><th>${msg('wcagRatio')}</th><th>${msg('wcagReq')}</th><th></th></tr>`;
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
    tdStatus.textContent = passes ? msg('wcagPass') : msg('wcagFail');

    tr.appendChild(tdPair);
    tr.appendChild(tdRatio);
    tr.appendChild(tdRequired);
    tr.appendChild(tdStatus);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  return table;
}

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

function openSettingsDrawer(): void {
  document.querySelector('.drawer')?.remove();

  const drawer = document.createElement('aside');
  drawer.className = 'drawer';

  document.documentElement.style.overflow = 'hidden';
  const closeDrawer = () => {
    document.documentElement.style.overflow = '';
    drawer.remove();
  };

  const overlay = document.createElement('div');
  overlay.className = 'drawer__overlay';
  overlay.addEventListener('click', closeDrawer);
  drawer.appendChild(overlay);

  const panel = document.createElement('div');
  panel.className = 'drawer__panel';
  panel.style.alignSelf = 'flex-start';

  const header = document.createElement('header');
  header.className = 'drawer__header';
  const title = document.createElement('h2');
  title.className = 'drawer__header-title';
  title.textContent = msg('settingsTitle');
  const closeBtn = document.createElement('button');
  closeBtn.className = 'drawer__icon-btn';
  closeBtn.title = msg('close');
  closeBtn.appendChild(svgIcon(ICON_X));
  closeBtn.addEventListener('click', closeDrawer);
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const body = document.createElement('div');
  body.className = 'drawer__body';

  const strictSection = document.createElement('div');
  strictSection.className = 'drawer__section';
  const strictTitle = document.createElement('h3');
  strictTitle.className = 'drawer__section-title';
  strictTitle.textContent = msg('settingsColorStrictness');
  strictSection.appendChild(strictTitle);

  const strictDesc = document.createElement('p');
  strictDesc.className = 'settings__desc';
  strictDesc.textContent = msg('settingsColorStrictnessHint');
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
  relaxedLabel.textContent = msg('settingsRelaxed');
  const strictLabel = document.createElement('span');
  strictLabel.textContent = msg('settingsStrict');
  strictLabels.appendChild(relaxedLabel);
  strictLabels.appendChild(strictLabel);
  strictSection.appendChild(strictLabels);

  body.appendChild(strictSection);

  const autoSection = document.createElement('div');
  autoSection.className = 'drawer__section';
  const autoTitle = document.createElement('h3');
  autoTitle.className = 'drawer__section-title';
  autoTitle.textContent = msg('settingsAutoByLocaleTitle');
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
  promoLink.textContent = msg('promoOpen');
  promo.appendChild(promoText);
  promo.appendChild(promoLink);
  body.appendChild(promo);

  panel.appendChild(body);
  drawer.appendChild(panel);
  document.body.appendChild(drawer);
}

init();
