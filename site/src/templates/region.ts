/**
 * Region hub page.
 */
import { SITE_URL, icon, esc, breadcrumbLd } from './helpers.js';
import { layout } from './layout.js';
import { type SiteStrings, t, getStrings } from '../i18n/strings.js';

export interface RegionPageData {
  name: string;
  slug: string;
  countries: { name: string; slug: string; flagColors: string[] }[];
  allRegions: { name: string; slug: string; count: number }[];
  lang?: string;
}

export function regionPage(d: RegionPageData): string {
  const lang = d.lang || 'en';
  const s = getStrings(lang);
  const prefix = lang === 'en' ? '' : `/${lang}`;

  const crumbs = [
    { name: s.home, url: `${SITE_URL}${prefix}/` },
    { name: d.name, url: `${SITE_URL}${prefix}/regions/${d.slug}/` },
  ];

  const body = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${prefix}/">${esc(s.home)}</a> <span>/</span> <span>${esc(d.name)}</span>
    </nav>

    <section class="region-hero">
      <h1>${t(s.regionH1, { region: esc(d.name) })}</h1>
      <p>${t(s.regionDesc, { count: d.countries.length, region: esc(d.name) })}</p>
    </section>

    <section>
      <div class="catalog-grid">
        ${d.countries.map(c =>
          `<a class="card" href="${prefix}/countries/${c.slug}/"><span class="card__colors">${c.flagColors.slice(0, 5).map(col => `<i style="background:${col}"></i>`).join('')}</span><span class="card__name">${esc(c.name)}</span></a>`
        ).join('\n        ')}
      </div>
    </section>

    <section>
      <h2>${s.otherRegions}</h2>
      <div class="region-chips">
        ${d.allRegions.filter(r => r.slug !== d.slug).map(r =>
          `<a class="region-chip" href="${prefix}/regions/${r.slug}/">${r.name} (${r.count})</a>`
        ).join('\n        ')}
      </div>
    </section>

    <nav class="page-nav">
      <a href="${prefix}/">${icon('chevron-left', 16)} ${esc(s.home)}</a>
      <a href="${prefix}/countries/">${s.allCountries} ${icon('chevron-right', 16)}</a>
    </nav>`;

  return layout({
    lang,
    dir: s.dir,
    title: t(s.regionH1, { region: d.name }),
    description: t(s.regionDesc, { count: d.countries.length, region: d.name }),
    canonical: `${SITE_URL}${prefix}/regions/${d.slug}/`,
    head: `\n  <script type="application/ld+json">${breadcrumbLd(crumbs)}</script>`,
    body,
    navCountriesLabel: s.countries,
    footerText: t(s.footerText, { year: String(new Date().getFullYear()) }),
  });
}
