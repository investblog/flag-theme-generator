/**
 * Countries catalog page.
 */
import { SITE_URL, icon, esc } from './helpers.js';
import { layout } from './layout.js';

export interface CatalogPageData {
  countries: { name: string; slug: string; flagColors: string[]; region: string }[];
  regions: { name: string; slug: string; count: number }[];
}

export function catalogPage(d: CatalogPageData): string {
  const body = `
    <section>
      <h1>All Country Themes</h1>
      <p style="color:var(--uc-muted-text);margin-bottom:1.5rem">${d.countries.length} browser themes inspired by country flags.</p>
      <div class="region-chips" style="margin-bottom:2rem">
        ${d.regions.map(r =>
          `<a class="region-chip" href="/regions/${r.slug}/">${r.name} (${r.count})</a>`
        ).join('\n        ')}
      </div>
      <div class="catalog-grid">
        ${d.countries.map(c =>
          `<a class="card" href="/countries/${c.slug}/"><span class="card__colors">${c.flagColors.slice(0, 5).map(col => `<i style="background:${col}"></i>`).join('')}</span><span class="card__name">${esc(c.name)}</span></a>`
        ).join('\n        ')}
      </div>
    </section>`;

  return layout({
    title: 'All Country Browser Themes — Flag Theme',
    description: `Browse ${d.countries.length}+ free browser themes inspired by country flags. Chrome, Edge, Firefox, and Brave.`,
    canonical: SITE_URL + '/countries/',
    body,
  });
}
