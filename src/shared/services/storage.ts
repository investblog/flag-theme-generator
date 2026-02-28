import { storage } from 'wxt/storage';
import type { Strictness, ThemeMode } from '../types/theme';

/** Persisted extension state — all items use `local:` area for cross-session persistence. */

export const currentPaletteCode = storage.defineItem<string | null>('local:currentPaletteCode');

export const currentMode = storage.defineItem<ThemeMode>('local:currentMode', {
  fallback: 'DOMINANT_ONLY',
});

export const strictness = storage.defineItem<Strictness>('local:strictness', {
  fallback: 0.7,
});

export const autoByLocale = storage.defineItem<boolean>('local:autoByLocale', {
  fallback: false,
});

export const recentPalettes = storage.defineItem<string[]>('local:recentPalettes', {
  fallback: [],
});

const MAX_RECENT = 5;

/** Push a country code to the front of recent list (deduped, capped at 5). */
export async function addRecentPalette(code: string): Promise<void> {
  const current = await recentPalettes.getValue();
  const updated = [code, ...current.filter((c) => c !== code)].slice(0, MAX_RECENT);
  await recentPalettes.setValue(updated);
}
