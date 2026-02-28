import { getPaletteByCode } from '@shared/data/palettes';
import {
  addRecentPalette,
  autoByLocale,
  currentMode,
  currentPaletteCode,
  recentPalettes,
  strictness,
} from '@shared/services/storage';
import type { ThemeMode } from '@shared/types/theme';

const MODE_LABELS: Record<ThemeMode, string> = {
  AMOLED: 'modeAmoled',
  DARK: 'modeDark',
  LIGHT: 'modeLight',
  DOMINANT_ONLY: 'modeDominantOnly',
};

function msg(key: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return browser.i18n.getMessage(key as any) || key;
  } catch {
    return key;
  }
}

async function init(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = '';
  app.className = 'popup';

  let paletteCode: string | null = null;
  let mode: ThemeMode = 'DOMINANT_ONLY';
  let recent: string[] = [];

  try {
    [paletteCode, mode, recent] = await Promise.all([
      currentPaletteCode.getValue(),
      currentMode.getValue(),
      recentPalettes.getValue(),
    ]);
  } catch {
    /* storage unavailable */
  }

  const palette = paletteCode ? getPaletteByCode(paletteCode) : null;

  // Current palette display
  if (palette) {
    const current = document.createElement('div');
    current.className = 'popup__current';

    const swatches = document.createElement('div');
    swatches.className = 'popup__swatches';
    for (const color of palette.flagColors.slice(0, 4)) {
      const s = document.createElement('div');
      s.className = 'popup__swatch';
      s.style.backgroundColor = color;
      swatches.appendChild(s);
    }

    const info = document.createElement('div');
    info.className = 'popup__info';
    const name = document.createElement('div');
    name.className = 'popup__name';
    name.textContent = palette.name_en;
    const modeLabel = document.createElement('div');
    modeLabel.className = 'popup__mode';
    modeLabel.textContent = msg(MODE_LABELS[mode]);
    info.appendChild(name);
    info.appendChild(modeLabel);

    current.appendChild(swatches);
    current.appendChild(info);
    app.appendChild(current);
  } else {
    const empty = document.createElement('div');
    empty.className = 'popup__empty';
    empty.textContent = 'No theme applied';
    app.appendChild(empty);
  }

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'popup__actions';

  const applyBtn = document.createElement('button');
  applyBtn.className = 'btn btn--primary';
  applyBtn.textContent = msg('btnApply');
  applyBtn.disabled = !palette;
  applyBtn.addEventListener('click', async () => {
    if (!palette) return;
    try {
      await addRecentPalette(palette.countryCode);
      await browser.runtime.sendMessage({
        type: 'APPLY_THEME',
        paletteCode: palette.countryCode,
        mode,
        strictness: await strictness.getValue(),
      });
    } catch {
      /* background not ready */
    }
  });

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn--secondary';
  resetBtn.textContent = msg('btnReset');
  resetBtn.addEventListener('click', async () => {
    await currentPaletteCode.setValue(null);
    await currentMode.setValue('DOMINANT_ONLY');
    try {
      await browser.runtime.sendMessage({ type: 'RESET_THEME' });
    } catch {
      /* background not ready */
    }
    init();
  });

  actions.appendChild(applyBtn);
  actions.appendChild(resetBtn);
  app.appendChild(actions);

  // Auto-by-locale toggle
  const toggleRow = document.createElement('div');
  toggleRow.className = 'popup__toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'auto-locale';
  checkbox.addEventListener('change', () => {
    autoByLocale.setValue(checkbox.checked);
  });
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'popup__toggle-label';
  toggleLabel.htmlFor = 'auto-locale';
  toggleLabel.textContent = msg('autoByLocale');
  toggleRow.appendChild(checkbox);
  toggleRow.appendChild(toggleLabel);
  app.appendChild(toggleRow);

  // Load auto-locale saved state
  autoByLocale.getValue().then((v) => {
    checkbox.checked = v;
  });

  // Recent palettes
  if (recent.length > 0) {
    const label = document.createElement('div');
    label.className = 'popup__section-label';
    label.textContent = 'Recent';
    app.appendChild(label);

    const recentRow = document.createElement('div');
    recentRow.className = 'popup__recent';

    for (const code of recent) {
      const p = getPaletteByCode(code);
      if (!p) continue;

      const chip = document.createElement('button');
      chip.className = 'chip';

      const dot = document.createElement('span');
      dot.className = 'chip__dot';
      dot.style.backgroundColor = p.flagColors[0];

      chip.appendChild(dot);
      chip.append(p.name_en);

      chip.addEventListener('click', async () => {
        await currentPaletteCode.setValue(code);
        await addRecentPalette(code);
        init();
      });

      recentRow.appendChild(chip);
    }
    app.appendChild(recentRow);
  }

  // Footer — gallery link
  const footer = document.createElement('div');
  footer.className = 'popup__footer';
  const galleryLink = document.createElement('button');
  galleryLink.className = 'popup__footer-link';
  galleryLink.textContent = msg('btnOpenGallery');
  galleryLink.addEventListener('click', () => {
    browser.tabs.create({ url: browser.runtime.getURL('/gallery.html') });
    window.close();
  });
  footer.appendChild(galleryLink);
  app.appendChild(footer);
}

init();
