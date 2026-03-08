/**
 * Country page template — main SEO surface.
 */
import {
  SITE_URL, TOKEN_KEYS, TOKEN_CSS,
  icon, brandIcon, cssVarsBlock, jsTokenMap, esc,
} from './helpers.js';
import { layout } from './layout.js';

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
}

const MODE_LABELS: Record<string, string> = { dark: 'Dark', light: 'Light', amoled: 'AMOLED' };

const FAQ = [
  {
    q: 'How do I install a Chrome theme?',
    a: 'Download the .zip file and unzip it. Open <code>chrome://extensions</code>, enable &ldquo;Developer mode&rdquo;, click &ldquo;Load unpacked&rdquo;, and select the unzipped folder.',
  },
  {
    q: 'Does this work on Microsoft Edge?',
    a: 'Yes! Edge is Chromium-based and supports Chrome themes. Install the same way as Chrome.',
  },
  {
    q: 'What about Firefox?',
    a: 'Firefox uses a different theme format. We&rsquo;re working on a Firefox add-on &mdash; stay tuned!',
  },
  {
    q: 'What are the different modes?',
    a: '<strong>Dark</strong> &mdash; balanced dark theme. <strong>Light</strong> &mdash; bright, easy on the eyes. <strong>AMOLED</strong> &mdash; pure black, saves battery on OLED screens.',
  },
];

export function countryPage(d: CountryPageData): string {
  const code = d.countryCode.toLowerCase();
  const modes = Object.keys(d.tokens);
  const defaultTokens = d.tokens[d.defaultMode];

  // --- JSON-LD ---
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${d.name} Browser Theme`,
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
  const copyIconHtml = icon('copy').replace(/'/g, "\\'");
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
navigator.clipboard.writeText(css).then(function(){var o=cb.innerHTML;cb.textContent='Copied!';setTimeout(function(){cb.innerHTML=o},2000)});
});
})();`;

  // --- Body ---
  const body = `
    <section class="hero">
      <h1>${esc(d.name)} Browser Theme</h1>
      <p class="hero__sub">A browser theme inspired by the flag of ${esc(d.name)}. Free, WCAG-accessible.</p>

      <div class="preview">
        <div class="preview__bar">
          <span class="preview__dots"><i></i><i></i><i></i></span>
          <span class="preview__tab--active">${esc(d.name)}</span>
          <span class="preview__tab--inactive">New Tab</span>
        </div>
        <div class="preview__toolbar">
          <span class="preview__url">flagtheme.com</span>
        </div>
        <div class="preview__ntp">
          <div class="preview__flag">${d.flagColors.map(c => `<span style="background:${c}"></span>`).join('')}</div>
          <span class="preview__ntp-label">${esc(d.name)} Theme</span>
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
        ${brandIcon('chrome')} Download for Chrome
      </a>
      <a href="#" class="btn btn--secondary">
        ${brandIcon('firefox')} Get for Firefox
      </a>
      <button id="copy-css" class="btn btn--outline" type="button">
        ${icon('copy')} Copy CSS Variables
      </button>
    </section>

    <section class="palette-section">
      <h2>Flag Colors</h2>
      <div class="swatches">
        ${d.flagColors.map(c => `<span class="swatch" style="background:${c}" title="${c}"></span>`).join('')}
      </div>
      <h2>Design Tokens</h2>
      <div class="token-grid">
        ${TOKEN_KEYS.map(k =>
          `<div class="token-card"><span class="token-card__swatch" style="background:var(--uc-${TOKEN_CSS[k]})"></span><span class="token-card__label">${TOKEN_CSS[k]}</span></div>`
        ).join('\n        ')}
      </div>
    </section>

    <section class="compat">
      <h2>Browser Compatibility</h2>
      <div class="compat-grid">
        ${[['chrome', 'Chrome'], ['edge', 'Edge'], ['firefox', 'Firefox'], ['brave', 'Brave']].map(([id, label]) =>
          `<div class="compat-item">${brandIcon(id, 24)}<span>${label}</span>${icon('check-circle', 16)}</div>`
        ).join('\n        ')}
      </div>
    </section>

${d.similarCountries.length > 0 ? `    <section class="similar">
      <h2>Similar Themes</h2>
      <div class="card-grid">
        ${d.similarCountries.map(c =>
          `<a class="card" href="/countries/${c.slug}/"><span class="card__colors">${c.flagColors.slice(0, 5).map(col => `<i style="background:${col}"></i>`).join('')}</span><span class="card__name">${esc(c.name)}</span></a>`
        ).join('\n        ')}
      </div>
    </section>
` : ''}
    <section class="faq">
      <h2>Frequently Asked Questions</h2>
      ${FAQ.map(f => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n      ')}
    </section>

    <nav class="page-nav">
      <a href="/regions/${d.regionSlug}/">${icon('chevron-left', 16)} ${esc(d.region)} Themes</a>
      <a href="/countries/">All Countries ${icon('chevron-right', 16)}</a>
    </nav>`;

  return layout({
    title: `${d.name} Browser Theme — Free Chrome & Firefox Theme | Flag Theme`,
    description: `Download a free ${d.name} flag-inspired browser theme for Chrome, Edge, Firefox, and Brave. WCAG-accessible dark, light, and AMOLED modes.`,
    canonical: `${SITE_URL}/countries/${d.slug}/`,
    cssVars: cssVarsBlock(defaultTokens),
    head: `\n  <script type="application/ld+json">${jsonLd}</script>\n  <script type="application/ld+json">${faqLd}</script>`,
    body,
    scripts,
    bodyAttrs: `data-code="${code}" data-mode="${d.defaultMode}"`,
  });
}
