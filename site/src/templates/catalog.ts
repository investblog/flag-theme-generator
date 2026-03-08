/**
 * Countries catalog page.
 */
import { SITE_URL, icon, esc } from './helpers.js';
import { layout } from './layout.js';
import { type SiteStrings, t, getStrings } from '../i18n/strings.js';

export interface CatalogPageData {
  countries: { name: string; slug: string; flagColors: string[]; region: string }[];
  regions: { name: string; slug: string; count: number }[];
  lang?: string;
}

export function catalogPage(d: CatalogPageData): string {
  const lang = d.lang || 'en';
  const s = getStrings(lang);
  const prefix = lang === 'en' ? '' : `/${lang}`;

  const body = `
    <section>
      <h1>${s.catalogH1}</h1>
      <p style="color:var(--uc-muted-text);margin-bottom:1.5rem">${t(s.catalogDesc, { count: d.countries.length })}</p>
      <div class="region-chips" style="margin-bottom:2rem">
        ${d.regions.map(r =>
          `<a class="region-chip" href="${prefix}/regions/${r.slug}/">${r.name} (${r.count})</a>`
        ).join('\n        ')}
      </div>
      <div class="catalog-grid">
        ${d.countries.map(c =>
          `<a class="card" href="${prefix}/countries/${c.slug}/"><span class="card__colors">${c.flagColors.slice(0, 5).map(col => `<i style="background:${col}"></i>`).join('')}</span><span class="card__name">${esc(c.name)}</span></a>`
        ).join('\n        ')}
      </div>
    </section>`;

  return layout({
    lang,
    dir: s.dir,
    title: s.catalogH1,
    description: t(s.catalogDesc, { count: d.countries.length }),
    canonical: `${SITE_URL}${prefix}/countries/`,
    body,
    navCountriesLabel: s.countries,
    footerText: t(s.footerText, { year: String(new Date().getFullYear()) }),
  });
}
