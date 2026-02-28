import { getPaletteByCode } from '@shared/data/palettes';
import { getRecommendedPalette } from '@shared/services/locale';
import { autoByLocale, currentMode, currentPaletteCode, strictness } from '@shared/services/storage';
import type { ExtensionMessage, MessageResponse } from '@shared/types/messages';
import type { ThemeTokens } from '@shared/types/theme';
import { generateTokens } from '@shared/utils/tokens';

/** Check whether the browser.theme API is available (Chrome/Edge yes, Firefox maybe not). */
function hasThemeApi(): boolean {
  try {
    return typeof browser.theme?.update === 'function';
  } catch {
    return false;
  }
}

/** Map our 10 design tokens to the browser.theme.update() manifest format. */
function tokensToThemeManifest(tokens: ThemeTokens): object {
  return {
    colors: {
      // Frame (title bar area)
      frame: tokens.bg,
      frame_inactive: tokens.bg,
      // Toolbar
      toolbar: tokens.surface,
      toolbar_text: tokens.text,
      toolbar_field: tokens.bg,
      toolbar_field_text: tokens.text,
      toolbar_field_border: tokens.border,
      toolbar_field_focus: tokens.focusRing,
      // Tabs
      tab_background_text: tokens.text,
      tab_selected: tokens.surface,
      tab_text: tokens.text,
      tab_line: tokens.accent,
      // Sidebar
      sidebar: tokens.surface,
      sidebar_text: tokens.text,
      sidebar_border: tokens.border,
      // Popups (URL bar suggestions etc.)
      popup: tokens.surface,
      popup_text: tokens.text,
      popup_border: tokens.border,
      popup_highlight: tokens.accent,
      popup_highlight_text: tokens.accentText,
      // Bookmark text
      bookmark_text: tokens.text,
      // Button / focus
      button_background_hover: tokens.accent2,
      icons_attention: tokens.accent,
      // New tab page
      ntp_background: tokens.bg,
      ntp_text: tokens.text,
    },
  };
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
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
    }
    // On install or update, try auto-apply if enabled
    autoApplyByLocale();
  });

  // Re-apply saved theme on browser startup
  reapplySavedTheme();

  browser.runtime.onMessage.addListener(async (raw: unknown): Promise<MessageResponse | undefined> => {
    const message = raw as ExtensionMessage;
    if (!message || typeof message !== 'object' || !('type' in message)) return undefined;

    switch (message.type) {
      case 'APPLY_THEME':
        return applyTheme(message.paletteCode, message.mode, message.strictness);
      case 'RESET_THEME':
        return resetTheme();
      default:
        return undefined;
    }
  });
});
