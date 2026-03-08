/**
 * Region hub page.
 */
import { SITE_URL, icon, esc, breadcrumbLd } from './helpers.js';
import { layout } from './layout.js';

export interface RegionPageData {
  name: string;
  slug: string;
  countries: { name: string; slug: string; flagColors: string[] }[];
  allRegions: { name: string; slug: string; count: number }[];
}

export function regionPage(d: RegionPageData): string {
  const crumbs = [
    { name: 'Home', url: SITE_URL + '/' },
    { name: d.name, url: `${SITE_URL}/regions/${d.slug}/` },
  ];

  const body = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> <span>/</span> <span>${esc(d.name)}</span>
    </nav>

    <section class="region-hero">
      <h1>${esc(d.name)} Browser Themes</h1>
      <p>${d.countries.length} flag-inspired browser themes from ${esc(d.name)}.</p>
    </section>

    <section>
      <div class="catalog-grid">
        ${d.countries.map(c =>
          `<a class="card" href="/countries/${c.slug}/"><span class="card__colors">${c.flagColors.slice(0, 5).map(col => `<i style="background:${col}"></i>`).join('')}</span><span class="card__name">${esc(c.name)}</span></a>`
        ).join('\n        ')}
      </div>
    </section>

    <section>
      <h2>Other Regions</h2>
      <div class="region-chips">
        ${d.allRegions.filter(r => r.slug !== d.slug).map(r =>
          `<a class="region-chip" href="/regions/${r.slug}/">${r.name} (${r.count})</a>`
        ).join('\n        ')}
      </div>
    </section>

    <nav class="page-nav">
      <a href="/">${icon('chevron-left', 16)} Home</a>
      <a href="/countries/">All Countries ${icon('chevron-right', 16)}</a>
    </nav>`;

  return layout({
    title: `${d.name} Browser Themes — Flag Theme`,
    description: `${d.countries.length} free browser themes inspired by flags of ${d.name}n countries. Chrome, Edge, Firefox, and Brave.`,
    canonical: `${SITE_URL}/regions/${d.slug}/`,
    head: `\n  <script type="application/ld+json">${breadcrumbLd(crumbs)}</script>`,
    body,
  });
}
