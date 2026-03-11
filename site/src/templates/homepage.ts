/**
 * Homepage template.
 */
import { SITE_URL, icon, brandIcon } from './helpers.js';
import { layout } from './layout.js';
import type { HreflangEntry } from './layout.js';
import { t, getStrings } from '../i18n/strings.js';

export interface HomePageData {
  popularCountries: { name: string; slug: string; flagColors: string[] }[];
  regions: { name: string; slug: string; count: number }[];
  allCountries: { name: string; slug: string; code: string }[];
  totalCount: number;
  lang?: string;
  hreflang?: HreflangEntry[];
}

export function homePage(d: HomePageData): string {
  const lang = d.lang || 'en';
  const s = getStrings(lang);
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const searchJson = JSON.stringify(d.allCountries);

  const body = `
    <section class="home-hero">
      <h1>${s.homeH1}</h1>
      <p>${t(s.homeSub, { count: String(d.totalCount), wcag: s.wcagAccessible, free: s.free })}</p>
      <div class="home-search">
        ${icon('magnify', 20)}
        <input id="search" type="text" placeholder="${s.searchPlaceholder}" autocomplete="off">
        <div id="search-results" class="search-results"></div>
      </div>
    </section>

    <section>
      <div class="section-header">
        <h2>${s.popularThemes}</h2>
        <a href="${prefix}/countries/">${s.viewAll} ${icon('arrow-right', 16)}</a>
      </div>
      <div class="card-grid">
        ${d.popularCountries.map(c =>
          `<a class="card" href="${prefix}/countries/${c.slug}/"><span class="card__colors">${c.flagColors.slice(0, 5).map(col => `<i style="background:${col}"></i>`).join('')}</span><span class="card__name">${c.name}</span></a>`
        ).join('\n        ')}
      </div>
    </section>

    <section>
      <h2>${s.browseByRegion}</h2>
      <div class="region-chips">
        ${d.regions.map(r =>
          `<a class="region-chip" href="${prefix}/regions/${r.slug}/">${icon('globe', 16)} ${r.name} (${r.count})</a>`
        ).join('\n        ')}
      </div>
    </section>

    <section>
      <h2>${s.howItWorks}</h2>
      <div class="steps">
        <div class="step">
          <span class="step__num"><span>1</span>${icon('globe', 20)}</span>
          <h3>${s.step1Title}</h3>
          <p>${t(s.step1Desc, { count: String(d.totalCount) })}</p>
        </div>
        <div class="step">
          <span class="step__num"><span>2</span>${icon('theme-toggle', 20)}</span>
          <h3>${s.step2Title}</h3>
          <p>${s.step2Desc}</p>
        </div>
        <div class="step">
          <span class="step__num"><span>3</span>${icon('download', 20)}</span>
          <h3>${s.step3Title}</h3>
          <p>${s.step3Desc}</p>
        </div>
      </div>
    </section>

    <section class="ext-install">
      <div class="ext-install__card">
        <div class="ext-install__text">
          <h2>${icon('download', 20)} ${s.installExtTitle}</h2>
          <p>${s.installExtDesc}</p>
        </div>
        <div class="ext-install__actions">
          <a href="https://chromewebstore.google.com/detail/flag-theme-generator/gkjdcopdcbkhbnppkglananilngnfcbm" class="btn btn--primary" target="_blank" rel="noopener">${brandIcon('chrome', 18)} ${s.installExtChrome}</a>
          <a href="#" class="btn btn--secondary btn--soon">${brandIcon('edge', 18)} ${s.installExtEdge}</a>
          <a href="#" class="btn btn--secondary btn--soon">${brandIcon('firefox', 18)} ${s.installExtFirefox}</a>
          <a href="https://github.com/investblog/flag-theme-generator/releases" class="btn btn--outline" target="_blank" rel="noopener">${brandIcon('github', 16)} GitHub</a>
        </div>
      </div>
    </section>

    <section class="about-seo">
      <details>
        <summary>${s.aboutTitle}</summary>
        <div class="about-seo__body">
          <p>${s.aboutSummary}</p>
          <p>${s.aboutDetails}</p>
          <p>${s.aboutExports}</p>
        </div>
      </details>
    </section>`;

  const scripts = `(function(){
var C=${searchJson};
var inp=document.getElementById('search'),res=document.getElementById('search-results');
inp.addEventListener('input',function(){
var q=inp.value.toLowerCase();
if(q.length<2){res.innerHTML='';return}
var m=C.filter(function(c){return c.name.toLowerCase().indexOf(q)>=0}).slice(0,8);
res.innerHTML=m.map(function(c){return '<a href="${prefix}/countries/'+c.slug+'/">'+c.name+'</a>'}).join('');
});
document.addEventListener('click',function(e){if(!inp.contains(e.target)&&!res.contains(e.target))res.innerHTML=''});
})();`;

  return layout({
    lang,
    dir: s.dir,
    title: s.homeTitle,
    description: t(s.homeDescription, { count: String(d.totalCount) }),
    canonical: SITE_URL + `${prefix}/`,
    hreflang: d.hreflang,
    body,
    scripts,
    navCountriesLabel: s.countries,
    footerText: t(s.footerText, { year: String(new Date().getFullYear()) }),
  });
}
