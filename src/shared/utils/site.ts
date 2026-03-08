/**
 * flagtheme.com URL helpers.
 * Used by the extension to link Chrome/Edge users to theme downloads.
 */

export const SITE_URL = 'https://flagtheme.com';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Returns the full URL to a country's theme page on flagtheme.com. */
export function countryPageUrl(nameEn: string): string {
  return `${SITE_URL}/countries/${slugify(nameEn)}/`;
}
