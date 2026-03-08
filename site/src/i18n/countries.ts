/**
 * Localized country names via i18n-iso-countries.
 */
import countries from 'i18n-iso-countries';

const loadedLocales = new Set<string>();

/**
 * Dynamically register a locale for country name lookups.
 * Must be called before getCountryName() for that lang.
 */
export async function registerLang(lang: string): Promise<void> {
  if (loadedLocales.has(lang)) return;
  try {
    const mod = await import(`i18n-iso-countries/langs/${lang}.json`, { with: { type: 'json' } });
    countries.registerLocale(mod.default);
    loadedLocales.add(lang);
  } catch {
    // Language not available in the package — skip silently
  }
}

/**
 * Get localized country name. Falls back to English name if unavailable.
 */
export function getCountryName(code: string, lang: string, fallback: string): string {
  if (lang === 'en') return fallback;
  const name = countries.getName(code, lang);
  return name || fallback;
}
