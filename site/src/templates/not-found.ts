/**
 * 404 page template.
 */
import { SITE_URL, icon } from './helpers.js';
import { layout } from './layout.js';
import { t, getStrings } from '../i18n/strings.js';

export function notFoundPage(): string {
  const s = getStrings('en');

  const body = `
    <section class="not-found">
      <h1>404</h1>
      <p>This page doesn't exist or has moved.</p>
      <a href="/" class="btn btn--primary">${icon('chevron-left', 16)} Back to Home</a>
    </section>
    <style>
      .not-found { text-align: center; padding: 6rem 1rem; }
      .not-found h1 { font-size: 5rem; margin: 0 0 .5rem; color: var(--uc-accent, #6b8afd); }
      .not-found p { color: var(--uc-muted-text, #888); font-size: 1.125rem; margin-bottom: 2rem; }
    </style>`;

  return layout({
    title: '404 — Page Not Found | Flag Theme',
    description: 'The page you are looking for does not exist.',
    canonical: `${SITE_URL}/`,
    body,
    navCountriesLabel: s.countries,
    footerText: t(s.footerText, { year: String(new Date().getFullYear()) }),
  });
}
