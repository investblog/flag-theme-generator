import type { ThemeTokens } from '../types/theme';
import { contrast } from '../utils/contrast';

type SceneKey = 'page' | 'controls' | 'data' | 'alerts' | 'tokens';

const SCENE_LABELS: Record<SceneKey, string> = {
  page: 'Page',
  controls: 'Controls',
  data: 'Data',
  alerts: 'Alerts',
  tokens: 'Tokens',
};

/** Create a contrast badge: "4.5:1 ✓" or "2.1:1 ✗" */
function badge(fg: string, bg: string): HTMLElement {
  const ratio = contrast(fg, bg);
  const pass = ratio >= 4.5;
  const el = document.createElement('span');
  el.className = `contrast-badge ${pass ? 'contrast-badge--pass' : 'contrast-badge--fail'}`;
  el.textContent = `${ratio.toFixed(1)}:1`;
  return el;
}

/** Convenience: set multiple inline style properties. */
function css(el: HTMLElement, styles: Record<string, string>): HTMLElement {
  for (const [k, v] of Object.entries(styles)) {
    el.style.setProperty(k, v);
  }
  return el;
}

/** Build a complete mini-browser preview element for the given tokens. */
export function createMiniBrowser(tokens: ThemeTokens): HTMLElement {
  const root = document.createElement('div');
  root.className = 'mini-browser';
  css(root, { background: tokens.bg, color: tokens.text });

  // — Title bar
  const titlebar = document.createElement('div');
  titlebar.className = 'mini-browser__titlebar';
  css(titlebar, { background: tokens.surface });

  const dots = document.createElement('div');
  dots.className = 'mini-browser__dots';
  for (const cls of ['close', 'min', 'max']) {
    const d = document.createElement('div');
    d.className = `mini-browser__dot mini-browser__dot--${cls}`;
    dots.appendChild(d);
  }
  titlebar.appendChild(dots);
  root.appendChild(titlebar);

  // — Tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'mini-browser__tabs';
  css(tabBar, { background: tokens.bg });

  const tab1 = createTab('My Dashboard', tokens, true);
  const tab2 = createTab('Settings', tokens, false);
  tabBar.appendChild(tab1);
  tabBar.appendChild(tab2);
  root.appendChild(tabBar);

  // — Toolbar (address bar)
  const toolbar = document.createElement('div');
  toolbar.className = 'mini-browser__toolbar';
  css(toolbar, { background: tokens.surface });

  const navBtns = document.createElement('div');
  navBtns.className = 'mini-browser__nav-btns';
  for (const arrow of ['\u2190', '\u2192']) {
    const btn = document.createElement('div');
    btn.className = 'mini-browser__nav-btn';
    css(btn, { background: tokens.bg, color: tokens.mutedText });
    btn.textContent = arrow;
    navBtns.appendChild(btn);
  }
  toolbar.appendChild(navBtns);

  const addressBar = document.createElement('div');
  addressBar.className = 'mini-browser__address';
  css(addressBar, { background: tokens.bg, color: tokens.mutedText, borderColor: tokens.border });
  addressBar.textContent = 'example.com/dashboard';
  toolbar.appendChild(addressBar);
  root.appendChild(toolbar);

  // — Content area with scene tabs
  const content = document.createElement('div');
  content.className = 'mini-browser__content';
  css(content, { background: tokens.bg });

  // Scene tab strip
  const sceneTabs = document.createElement('div');
  sceneTabs.className = 'mini-browser__scene-tabs';
  content.appendChild(sceneTabs);

  // Scene container
  const sceneContainer = document.createElement('div');
  content.appendChild(sceneContainer);

  // Build scene tabs
  let activeScene: SceneKey = 'page';
  const sceneBuilders: Record<SceneKey, () => HTMLElement> = {
    page: () => buildPageScene(tokens),
    controls: () => buildControlsScene(tokens),
    data: () => buildDataScene(tokens),
    alerts: () => buildAlertsScene(tokens),
    tokens: () => buildTokensScene(tokens),
  };

  function renderScene(key: SceneKey): void {
    activeScene = key;
    sceneContainer.innerHTML = '';
    sceneContainer.appendChild(sceneBuilders[key]());

    for (const tab of sceneTabs.querySelectorAll('.mini-browser__scene-tab')) {
      const t = tab as HTMLElement;
      const isActive = t.dataset.scene === key;
      t.classList.toggle('mini-browser__scene-tab--active', isActive);
      css(t, {
        background: isActive ? tokens.accent : tokens.surface,
        color: isActive ? tokens.accentText : tokens.mutedText,
      });
    }
  }

  for (const key of Object.keys(SCENE_LABELS) as SceneKey[]) {
    const tab = document.createElement('button');
    tab.className = 'mini-browser__scene-tab';
    tab.dataset.scene = key;
    tab.textContent = SCENE_LABELS[key];
    tab.addEventListener('click', () => renderScene(key));
    sceneTabs.appendChild(tab);
  }

  renderScene(activeScene);
  root.appendChild(content);

  return root;
}

function createTab(label: string, tokens: ThemeTokens, active: boolean): HTMLElement {
  const tab = document.createElement('div');
  tab.className = `mini-browser__tab${active ? ' mini-browser__tab--active' : ''}`;
  css(tab, {
    background: active ? tokens.surface : tokens.bg,
    color: active ? tokens.text : tokens.mutedText,
  });
  tab.textContent = label;

  if (active) {
    // Active tab indicator line
    const line = document.createElement('div');
    css(line, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      height: '2px',
      background: tokens.accent,
    });
    tab.style.position = 'relative';
    tab.appendChild(line);
  }
  return tab;
}

/* ============================================
   Scene: Page
   ============================================ */

function buildPageScene(t: ThemeTokens): HTMLElement {
  const el = document.createElement('div');

  const heading = document.createElement('div');
  heading.className = 'scene-page__heading';
  css(heading, { color: t.text });
  heading.textContent = 'Welcome back';
  heading.appendChild(badge(t.text, t.bg));
  el.appendChild(heading);

  const text = document.createElement('p');
  text.className = 'scene-page__text';
  css(text, { color: t.mutedText });
  text.innerHTML = ''; // clear
  text.textContent = 'Your dashboard is up to date. ';
  const link = document.createElement('span');
  link.className = 'scene-page__link';
  css(link, { color: t.link });
  link.textContent = 'View reports';
  link.appendChild(badge(t.link, t.bg));
  text.appendChild(link);
  el.appendChild(text);

  // Two cards
  const cards = document.createElement('div');
  cards.className = 'scene-page__cards';

  for (const [title, desc, accentColor] of [
    ['Analytics', '1,234 visits today', t.accent],
    ['Revenue', '$5.6k this week', t.accent2],
  ] as [string, string, string][]) {
    const card = document.createElement('div');
    card.className = 'scene-page__card';
    css(card, { background: t.surface, borderLeft: `3px solid ${accentColor}` });

    const h = document.createElement('div');
    h.className = 'scene-page__card-title';
    css(h, { color: t.text });
    h.textContent = title;

    const d = document.createElement('div');
    d.className = 'scene-page__card-desc';
    css(d, { color: t.mutedText });
    d.textContent = desc;

    card.appendChild(h);
    card.appendChild(d);
    cards.appendChild(card);
  }
  el.appendChild(cards);

  return el;
}

/* ============================================
   Scene: Controls
   ============================================ */

function buildControlsScene(t: ThemeTokens): HTMLElement {
  const el = document.createElement('div');

  // Buttons row
  const btnRow = document.createElement('div');
  btnRow.className = 'scene-controls__row';

  const primaryBtn = document.createElement('div');
  primaryBtn.className = 'scene-controls__btn';
  css(primaryBtn, { background: t.accent, color: t.accentText });
  primaryBtn.textContent = 'Save';
  primaryBtn.appendChild(badge(t.accentText, t.accent));
  btnRow.appendChild(primaryBtn);

  const secondaryBtn = document.createElement('div');
  secondaryBtn.className = 'scene-controls__btn scene-controls__btn--outline';
  css(secondaryBtn, { color: t.text, border: `1px solid ${t.border}` });
  secondaryBtn.textContent = 'Cancel';
  btnRow.appendChild(secondaryBtn);

  const accent2Btn = document.createElement('div');
  accent2Btn.className = 'scene-controls__btn';
  css(accent2Btn, { background: t.accent2, color: t.accentText });
  accent2Btn.textContent = 'Export';
  btnRow.appendChild(accent2Btn);

  el.appendChild(btnRow);

  // Input group
  const group = document.createElement('div');
  group.className = 'scene-controls__group';

  const label = document.createElement('div');
  label.className = 'scene-controls__label';
  css(label, { color: t.mutedText });
  label.textContent = 'Email address';
  group.appendChild(label);

  const input = document.createElement('div');
  input.className = 'scene-controls__input';
  css(input, { background: t.bg, color: t.text, borderColor: t.border });
  input.textContent = 'user@example.com';
  group.appendChild(input);
  el.appendChild(group);

  // Focused input
  const group2 = document.createElement('div');
  group2.className = 'scene-controls__group';

  const label2 = document.createElement('div');
  label2.className = 'scene-controls__label';
  css(label2, { color: t.mutedText });
  label2.textContent = 'Search (focused)';
  group2.appendChild(label2);

  const input2 = document.createElement('div');
  input2.className = 'scene-controls__input scene-controls__input--focused';
  css(input2, {
    background: t.bg,
    color: t.text,
    borderColor: t.focusRing,
    boxShadow: `0 0 0 2px ${t.focusRing}40`,
  });
  input2.textContent = 'Search...';
  input2.appendChild(badge(t.focusRing, t.bg));
  group2.appendChild(input2);
  el.appendChild(group2);

  return el;
}

/* ============================================
   Scene: Data (Table)
   ============================================ */

function buildDataScene(t: ThemeTokens): HTMLElement {
  const el = document.createElement('div');

  const table = document.createElement('table');
  table.className = 'scene-data__table';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const text of ['Name', 'Status', 'Role']) {
    const th = document.createElement('th');
    th.className = 'scene-data__th';
    css(th, { color: t.mutedText, borderBottomColor: t.border });
    th.textContent = text;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Rows
  const tbody = document.createElement('tbody');
  const rows: [string, string, string, string][] = [
    ['Alice Chen', 'Active', t.accent, 'Admin'],
    ['Bob Smith', 'Pending', t.accent2, 'Editor'],
    ['Carol Wu', 'Active', t.accent, 'Viewer'],
  ];

  for (const [name, status, statusColor, role] of rows) {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.className = 'scene-data__td';
    css(tdName, { color: t.text, borderBottomColor: t.border });
    tdName.textContent = name;

    const tdStatus = document.createElement('td');
    tdStatus.className = 'scene-data__td';
    css(tdStatus, { borderBottomColor: t.border });
    const statusBadge = document.createElement('span');
    statusBadge.className = 'scene-data__badge';
    css(statusBadge, { background: `${statusColor}20`, color: statusColor });
    statusBadge.textContent = status;
    tdStatus.appendChild(statusBadge);

    const tdRole = document.createElement('td');
    tdRole.className = 'scene-data__td';
    css(tdRole, { color: t.mutedText, borderBottomColor: t.border });
    tdRole.textContent = role;

    tr.appendChild(tdName);
    tr.appendChild(tdStatus);
    tr.appendChild(tdRole);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  el.appendChild(table);

  return el;
}

/* ============================================
   Scene: Alerts
   ============================================ */

function buildAlertsScene(t: ThemeTokens): HTMLElement {
  const el = document.createElement('div');

  const alerts: [string, string, string][] = [
    ['\u2713', 'Theme applied successfully', t.accent],
    ['\u2139', 'Color strictness set to 70%', t.link],
    ['\u26a0', '2 contrast pairs adjusted', t.accent2],
    ['\u2716', 'Light mode unavailable for this palette', t.border],
  ];

  for (const [icon, text, color] of alerts) {
    const item = document.createElement('div');
    item.className = 'scene-alerts__item';
    css(item, { background: t.surface, border: `1px solid ${t.border}` });

    const iconEl = document.createElement('span');
    iconEl.className = 'scene-alerts__icon';
    css(iconEl, { color });
    iconEl.textContent = icon;

    const textEl = document.createElement('span');
    css(textEl, { color: t.text });
    textEl.textContent = text;

    item.appendChild(iconEl);
    item.appendChild(textEl);
    el.appendChild(item);
  }

  // Accent bar at bottom
  const bar = document.createElement('div');
  css(bar, {
    marginTop: '10px',
    height: '4px',
    borderRadius: '2px',
    background: `linear-gradient(90deg, ${t.accent}, ${t.accent2}, ${t.link}, ${t.focusRing})`,
  });
  el.appendChild(bar);

  return el;
}

/* ============================================
   Scene: Tokens (color swatches)
   ============================================ */

function buildTokensScene(t: ThemeTokens): HTMLElement {
  const el = document.createElement('div');

  const grid = document.createElement('div');
  grid.className = 'scene-cards__grid';

  const items: [string, string, keyof ThemeTokens][] = [
    ['BG', t.bg, 'bg'],
    ['Surface', t.surface, 'surface'],
    ['Text', t.text, 'text'],
    ['Muted', t.mutedText, 'mutedText'],
    ['Border', t.border, 'border'],
    ['Accent', t.accent, 'accent'],
    ['Accent 2', t.accent2, 'accent2'],
    ['Link', t.link, 'link'],
    ['Focus', t.focusRing, 'focusRing'],
  ];

  for (const [label, hex] of items) {
    const card = document.createElement('div');
    card.className = 'scene-cards__item';
    css(card, { background: t.surface });

    const swatch = document.createElement('div');
    swatch.className = 'scene-cards__swatch';
    css(swatch, { background: hex, border: `1px solid ${t.border}` });

    const labelEl = document.createElement('div');
    labelEl.className = 'scene-cards__label';
    css(labelEl, { color: t.text });
    labelEl.textContent = label;

    const hexEl = document.createElement('div');
    hexEl.className = 'scene-cards__hex';
    css(hexEl, { color: t.mutedText });
    hexEl.textContent = hex;

    card.appendChild(swatch);
    card.appendChild(labelEl);
    card.appendChild(hexEl);
    grid.appendChild(card);
  }

  el.appendChild(grid);
  return el;
}
