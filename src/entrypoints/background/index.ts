import { getPaletteByCode } from '@shared/data/palettes';
import { getRecommendedPalette } from '@shared/services/locale';
import { autoByLocale, currentMode, currentPaletteCode, strictness } from '@shared/services/storage';
import type { ExtensionMessage, MessageResponse } from '@shared/types/messages';
import type { ThemeTokens } from '@shared/types/theme';
import { generateTokens } from '@shared/utils/tokens';

/**
 * browser.theme.update() is Firefox-only (MV2, requires "theme" permission).
 * Chrome/Edge MV3 do not have this API — Apply is disabled, Export only.
 */
function hasThemeApi(): boolean {
  try {
    return typeof browser.theme?.update === 'function';
  } catch {
    return false;
  }
}

/**
 * Firefox browser.theme color schema — maps each key to a ThemeToken role.
 * Grouped by visual layer for contrast auditing at a glance.
 */
const FIREFOX_THEME_SCHEMA: Record<string, keyof ThemeTokens> = {
  /* ── bg layer (frame, recessed fields) ── */
  frame: 'bg',
  frame_inactive: 'bg',
  toolbar_field: 'bg',
  ntp_background: 'bg',

  /* ── surface layer (panels, focused fields) ── */
  toolbar_field_focus: 'surface',
  popup: 'surface',
  sidebar: 'surface',
  ntp_card_background: 'surface',

  /* ── text layer (on bg / surface) ── */
  tab_background_text: 'text',
  toolbar_field_text: 'text',
  toolbar_field_text_focus: 'text',
  popup_text: 'text',
  sidebar_text: 'text',
  ntp_text: 'text',

  /* ── accent layer (toolbar, active tab — flag color) ── */
  toolbar: 'accent',
  tab_selected: 'accent',
  popup_highlight: 'accent',
  sidebar_highlight: 'accent',

  /* ── accentText layer (on accent) ── */
  toolbar_text: 'accentText',
  tab_text: 'accentText',
  icons: 'accentText',
  popup_highlight_text: 'accentText',
  sidebar_highlight_text: 'accentText',

  /* ── accent2 layer (secondary flag detail) ── */
  tab_line: 'accent2',
  icons_attention: 'accent2',

  /* ── border layer ── */
  toolbar_top_separator: 'border',
  toolbar_bottom_separator: 'border',
  toolbar_field_border: 'border',
  popup_border: 'border',
  sidebar_border: 'border',

  /* ── focusRing layer ── */
  toolbar_field_border_focus: 'focusRing',
};

/** Build a browser.theme.update() manifest from design tokens. */
function tokensToThemeManifest(tokens: ThemeTokens): object {
  const colors: Record<string, string> = {};
  for (const [key, role] of Object.entries(FIREFOX_THEME_SCHEMA)) {
    colors[key] = tokens[role];
  }
  return { colors };
}

async function applyTheme(paletteCode: string, mode: string, strictness: number): Promise<MessageResponse> {
  const palette = getPaletteByCode(paletteCode);
  if (!palette) {
    return { ok: false, error: `Unknown palette: ${paletteCode}` };
  }

  if (!hasThemeApi()) {
    return { ok: false, error: 'Theme API unavailable — export only' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokens = generateTokens(palette, mode as any, strictness);
  const manifest = tokensToThemeManifest(tokens);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (browser.theme as any).update(manifest);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function resetTheme(): Promise<MessageResponse> {
  if (!hasThemeApi()) {
    return { ok: false, error: 'Theme API unavailable' };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (browser.theme as any).reset();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/** Re-apply saved theme on browser startup (if a palette is set). */
async function reapplySavedTheme(): Promise<void> {
  if (!hasThemeApi()) return;

  try {
    const code = await currentPaletteCode.getValue();
    if (!code) return;

    const palette = getPaletteByCode(code);
    if (!palette) return;

    const mode = await currentMode.getValue();
    const s = await strictness.getValue();
    await applyTheme(code, mode, s);
  } catch {
    /* storage or theme API error — silently skip */
  }
}

/** Auto-select and apply palette based on browser locale (when enabled). */
async function autoApplyByLocale(): Promise<void> {
  if (!hasThemeApi()) return;

  try {
    const enabled = await autoByLocale.getValue();
    if (!enabled) return;

    // Only auto-apply if no palette is currently set
    const existingCode = await currentPaletteCode.getValue();
    if (existingCode) return;

    const locale = browser.i18n.getUILanguage();
    const recommended = getRecommendedPalette(locale);
    if (!recommended) return;

    const s = await strictness.getValue();
    await currentPaletteCode.setValue(recommended.countryCode);
    await applyTheme(recommended.countryCode, 'DOMINANT_ONLY', s);
  } catch {
    /* locale detection or storage error — silently skip */
  }
}

export default defineBackground(() => {
  // Chrome Side Panel: open on action click instead of popup
  if (globalThis.chrome?.sidePanel) {
    globalThis.chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }

  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
    }
    // On install or update, try auto-apply if enabled
    autoApplyByLocale();
  });

  // Re-apply saved theme on browser startup
  reapplySavedTheme();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  browser.runtime.onMessage.addListener(async (raw: unknown, sender: any): Promise<MessageResponse | undefined> => {
    const message = raw as ExtensionMessage;
    if (!message || typeof message !== 'object' || !('type' in message)) return undefined;

    switch (message.type) {
      case 'APPLY_THEME':
        return applyTheme(message.paletteCode, message.mode, message.strictness);
      case 'RESET_THEME':
        return resetTheme();
      case 'HAS_THEME_API':
        return { ok: hasThemeApi() };
      default:
        return undefined;
    }
  });
});
