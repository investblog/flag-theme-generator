/**
 * Homepage template.
 */
import { SITE_URL, icon, slugify } from './helpers.js';
import { layout } from './layout.js';

export interface HomePageData {
  popularCountries: { name: string; slug: string; flagColors: string[] }[];
  regions: { name: string; slug: string; count: number }[];
  allCountries: { name: string; slug: string; code: string }[];
  totalCount: number;
}

export function homePage(d: HomePageData): string {
  const searchJson = JSON.stringify(d.allCountries);

  const body = `
    <section class="home-hero">
      <h1>Browser Themes Inspired by Country Flags</h1>
      <p>${d.totalCount}+ countries &bull; Dark, Light &amp; AMOLED modes &bull; WCAG accessible &bull; Free</p>
      <div class="home-search">
        ${icon('magnify', 20)}
        <input id="search" type="text" placeholder="Search countries..." autocomplete="off">
        <div id="search-results" class="search-results"></div>
      </div>
    </section>

    <section>
      <div class="section-header">
        <h2>Popular Themes</h2>
        <a href="/countries/">View all ${icon('arrow-right', 16)}</a>
      </div>
      <div class="card-grid">
        ${d.popularCountries.map(c =>
          `<a class="card" href="/countries/${c.slug}/"><span class="card__colors">${c.flagColors.slice(0, 5).map(col => `<i style="background:${col}"></i>`).join('')}</span><span class="card__name">${c.name}</span></a>`
        ).join('\n        ')}
      </div>
    </section>

    <section>
      <h2>Browse by Region</h2>
      <div class="region-chips">
        ${d.regions.map(r =>
          `<a class="region-chip" href="/regions/${r.slug}/">${icon('globe', 16)} ${r.name} (${r.count})</a>`
        ).join('\n        ')}
      </div>
    </section>

    <section>
      <h2>How It Works</h2>
      <div class="card-grid">
        <div class="card">${icon('palette', 28)}<span class="card__name">Pick a country</span></div>
        <div class="card">${icon('theme-toggle', 28)}<span class="card__name">Choose a mode</span></div>
        <div class="card">${icon('download', 28)}<span class="card__name">Download &amp; install</span></div>
      </div>
    </section>`;

  const scripts = `(function(){
var C=${searchJson};
var inp=document.getElementById('search'),res=document.getElementById('search-results');
inp.addEventListener('input',function(){
var q=inp.value.toLowerCase();
if(q.length<2){res.innerHTML='';return}
var m=C.filter(function(c){return c.name.toLowerCase().indexOf(q)>=0}).slice(0,8);
res.innerHTML=m.map(function(c){return '<a href="/countries/'+c.slug+'/">'+c.name+'</a>'}).join('');
});
document.addEventListener('click',function(e){if(!inp.contains(e.target)&&!res.contains(e.target))res.innerHTML=''});
})();`;

  return layout({
    title: 'Flag Theme — Browser Themes Inspired by Country Flags',
    description: `Free browser themes for Chrome, Edge, Firefox & Brave inspired by flags of ${d.totalCount}+ countries. Download or apply instantly.`,
    canonical: SITE_URL + '/',
    body,
    scripts,
  });
}
