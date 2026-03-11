/**
 * Country page template — main SEO surface.
 * Supports localization via optional SiteStrings parameter.
 */
import {
  SITE_URL, TOKEN_KEYS, TOKEN_CSS,
  icon, brandIcon, cssVarsBlock, jsTokenMap, esc, breadcrumbLd,
} from './helpers.js';
import { layout, type HreflangEntry } from './layout.js';
import { type SiteStrings, t, getStrings } from '../i18n/strings.js';

export interface CountryPageData {
  countryCode: string;
  name: string;
  slug: string;
  flagColors: string[];
  region: string;
  regionSlug: string;
  tokens: Record<string, Record<string, string>>;   // { dark: ThemeTokens, light: ..., amoled: ... }
  defaultMode: string;
  similarCountries: { name: string; slug: string; flagColors: string[] }[];
  /** Inline SVG string of the country flag (3:2 ratio). */
  flagSvg?: string;
  /** Localized country name (e.g., "Japón" for ES). Defaults to name. */
  localizedName?: string;
  /** Locale code for this page. Defaults to 'en'. */
  lang?: string;
  /** hreflang entries for alternate language versions. */
  hreflang?: HreflangEntry[];
}

export function countryPage(d: CountryPageData): string {
  const lang = d.lang || 'en';
  const s = getStrings(lang);
  const countryName = d.localizedName || d.name;
  const code = d.countryCode.toLowerCase();
  const modes = Object.keys(d.tokens);
  const defaultTokens = d.tokens[d.defaultMode];
  const prefix = lang === 'en' ? '' : `/${lang}`;

  const MODE_LABELS: Record<string, string> = {
    dark: s.modeDark, light: s.modeLight, amoled: s.modeAmoled,
  };

  const FAQ = [
    { q: s.faqChromeQ, a: s.faqChromeA },
    { q: s.faqEdgeQ, a: s.faqEdgeA },
    { q: s.faqFirefoxQ, a: s.faqFirefoxA },
    { q: s.modeQuestion, a: s.modeAnswer },
  ];

  // --- Breadcrumbs ---
  const canonical = `${SITE_URL}${prefix}/countries/${d.slug}/`;
  const crumbs = [
    { name: s.home, url: `${SITE_URL}${prefix}/` },
    { name: s.countries, url: `${SITE_URL}${prefix}/countries/` },
    { name: countryName, url: canonical },
  ];

  // --- JSON-LD ---
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: t(s.countryH1, { country: countryName }),
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Chrome, Edge, Firefox, Brave',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  });
  const faqLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
    })),
  });

  // --- Inline script ---
  const modesObj = modes.map(m => `${m}:${jsTokenMap(d.tokens[m])}`).join(',');
  const copiedText = s.copied.replace(/'/g, "\\'");
  const scripts = `(function(){
var T={${modesObj}};
var root=document.documentElement.style,dl=document.getElementById('dl-chrome'),code='${code}',cur='${d.defaultMode}';
document.querySelectorAll('.mode-btn').forEach(function(b){b.addEventListener('click',function(){
var m=b.dataset.mode;cur=m;
document.querySelectorAll('.mode-btn').forEach(function(x){x.classList.remove('active')});
b.classList.add('active');
var t=T[m];for(var k in t)root.setProperty('--uc-'+k,t[k]);
if(dl)dl.href='/downloads/'+code+'-'+m+'.zip';
})});
var cb=document.getElementById('copy-css');
if(cb)cb.addEventListener('click',function(){
var t=T[cur],css=':root {\\n';for(var k in t)css+='  --uc-'+k+': '+t[k]+';\\n';css+='}';
navigator.clipboard.writeText(css).then(function(){var o=cb.innerHTML;cb.textContent='${copiedText}';setTimeout(function(){cb.innerHTML=o},2000)});
});
})();`;

  // --- Body ---
  const body = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${prefix}/">${esc(s.home)}</a> <span>/</span> <a href="${prefix}/countries/">${esc(s.countries)}</a> <span>/</span> <span>${esc(countryName)}</span>
    </nav>

    <section class="hero">
      <h1>${d.flagSvg ? `<span class="hero__flag">${d.flagSvg}</span> ` : ''}${t(s.countryH1, { country: esc(countryName) })}</h1>
      <p class="hero__sub">${t(s.countryHeroSub, { country: esc(countryName) })}</p>

      <div class="preview">
        <div class="preview__bar">
          <span class="preview__dots"><i></i><i></i><i></i></span>
          <span class="preview__tab--active">${esc(countryName)}</span>
          <span class="preview__tab--inactive">New Tab</span>
        </div>
        <div class="preview__toolbar">
          <span class="preview__url">flagtheme.com</span>
        </div>
        <div class="preview__ntp">
          <div class="preview__flag">${d.flagColors.map(c => `<span style="background:${c}"></span>`).join('')}</div>
          <span class="preview__ntp-label">${esc(countryName)}</span>
        </div>
      </div>

      <div class="modes">
        ${modes.map(m =>
          `<button class="mode-btn${m === d.defaultMode ? ' active' : ''}" data-mode="${m}">${MODE_LABELS[m] ?? m}</button>`
        ).join('\n        ')}
      </div>
    </section>

    <section class="cta">
      <a id="dl-chrome" href="/downloads/${code}-${d.defaultMode}.zip" class="btn btn--primary" download>
        ${brandIcon('chrome')} ${s.downloadChrome}
      </a>
      <a href="#" class="btn btn--secondary">
        ${brandIcon('firefox')} ${s.getFirefox}
      </a>
      <button id="copy-css" class="btn btn--outline" type="button">
        ${icon('copy')} ${s.copyCss}
      </button>
    </section>

    <section class="palette-section">
      <h2>${s.flagColors}</h2>
      <div class="swatches">
        ${d.flagColors.map(c => `<span class="swatch" style="background:${c}" title="${c}"></span>`).join('')}
      </div>
      <h2>${s.designTokens}</h2>
      <div class="token-grid">
        ${TOKEN_KEYS.map(k =>
          `<div class="token-card"><span class="token-card__swatch" style="background:var(--uc-${TOKEN_CSS[k]})"></span><span class="token-card__label">${TOKEN_CSS[k]}</span></div>`
        ).join('\n        ')}
      </div>
    </section>

    <section class="compat">
      <h2>${s.browserCompat}</h2>
      <div class="compat-grid">
        ${[['chrome', 'Chrome'], ['edge', 'Edge'], ['firefox', 'Firefox'], ['brave', 'Brave']].map(([id, label]) =>
          `<div class="compat-item">${brandIcon(id, 24)}<span>${label}</span>${icon('check-circle', 16)}</div>`
        ).join('\n        ')}
      </div>
    </section>

${d.similarCountries.length > 0 ? `    <section class="similar">
      <h2>${s.similarThemes}</h2>
      <div class="card-grid">
        ${d.similarCountries.map(c =>
          `<a class="card" href="${prefix}/countries/${c.slug}/"><span class="card__colors">${c.flagColors.slice(0, 5).map(col => `<i style="background:${col}"></i>`).join('')}</span><span class="card__name">${esc(c.name)}</span></a>`
        ).join('\n        ')}
      </div>
    </section>
` : ''}
    <section class="ext-promo">
      <div class="ext-promo__card">
        <div class="ext-promo__text">
          <h2>${icon('palette', 20)} ${s.extensionTitle}</h2>
          <p>${s.extensionDesc}</p>
          <ul>
            <li>${icon('check', 16)} ${s.extensionFeature1}</li>
            <li>${icon('check', 16)} ${s.extensionFeature2}</li>
            <li>${icon('check', 16)} ${s.extensionFeature3}</li>
            <li>${icon('check', 16)} ${s.extensionFeature4}</li>
          </ul>
        </div>
        <div class="ext-promo__actions">
          <a href="https://chromewebstore.google.com/detail/flag-theme-generator/gkjdcopdcbkhbnppkglananilngnfcbm" class="btn btn--secondary" target="_blank" rel="noopener">${brandIcon('chrome', 18)} Chrome</a>
          <span class="btn btn--secondary btn--soon">${brandIcon('edge', 18)} Edge &mdash; ${s.extensionComingSoon}</span>
          <span class="btn btn--secondary btn--soon">${brandIcon('firefox', 18)} Firefox &mdash; ${s.extensionComingSoon}</span>
        </div>
      </div>
    </section>

    <section class="faq">
      <h2>${s.faqTitle}</h2>
      ${FAQ.map(f => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n      ')}
    </section>

    <nav class="page-nav">
      <a href="${prefix}/regions/${d.regionSlug}/">${icon('chevron-left', 16)} ${esc(d.region)}</a>
      <a href="${prefix}/countries/">${s.allCountries} ${icon('chevron-right', 16)}</a>
    </nav>`;

  return layout({
    lang,
    dir: s.dir,
    title: t(s.countryTitle, { country: countryName }),
    description: t(s.countryDescription, { country: countryName }),
    canonical,
    cssVars: cssVarsBlock(defaultTokens),
    head: `\n  <script type="application/ld+json">${jsonLd}</script>\n  <script type="application/ld+json">${faqLd}</script>\n  <script type="application/ld+json">${breadcrumbLd(crumbs)}</script>`,
    hreflang: d.hreflang,
    body,
    scripts,
    bodyAttrs: `data-code="${code}" data-mode="${d.defaultMode}"`,
    navCountriesLabel: s.countries,
    footerText: t(s.footerText, { year: String(new Date().getFullYear()) }),
  });
}
