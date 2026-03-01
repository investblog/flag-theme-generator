import type { ThemeMode } from './theme';

/** Messages sent from UI pages to the background service worker */
export type ExtensionMessage = ApplyThemeMessage | ResetThemeMessage | HasThemeApiMessage;

export interface ApplyThemeMessage {
  type: 'APPLY_THEME';
  paletteCode: string;
  mode: ThemeMode;
  strictness: number;
}

export interface ResetThemeMessage {
  type: 'RESET_THEME';
}

export interface HasThemeApiMessage {
  type: 'HAS_THEME_API';
}

/** Possible response from the background worker */
export interface MessageResponse {
  ok: boolean;
  error?: string;
}
