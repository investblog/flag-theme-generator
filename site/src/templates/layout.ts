/**
 * Shared HTML layout wrapper.
 */
import { logoSvg, brandIcon, icon } from './helpers.js';

export interface HreflangEntry {
  lang: string;
  href: string;
}

export interface LayoutOpts {
  title: string;
  description: string;
  canonical: string;
  lang?: string;
  dir?: 'ltr' | 'rtl';
  cssVars?: string;
  head?: string;
  hreflang?: HreflangEntry[];
  body: string;
  scripts?: string;
  bodyAttrs?: string;
  navCountriesLabel?: string;
  footerText?: string;
}

/** Human-readable labels for language codes. */
const LANG_LABELS: Record<string, string> = {
  en: 'EN', es: 'ES', fr: 'FR', ar: 'AR', pt: 'PT', de: 'DE',
  it: 'IT', nl: 'NL', zh: '中文', ja: '日本語', ko: '한국어', tr: 'TR',
};

function langSwitcher(currentLang: string, entries: HreflangEntry[]): string {
  // Filter to real language alternates (skip x-default, keep distinct langs)
  const alts = entries.filter(h => h.lang !== 'x-default');
  if (alts.length < 2) return '';

  const items = alts.map(h =>
    `<a class="lang-dd__item${h.lang === currentLang ? ' is-active' : ''}" href="${h.href}" hreflang="${h.lang}">${LANG_LABELS[h.lang] || h.lang.toUpperCase()}</a>`
  ).join('');

  return `<div class="lang-dd" id="lang-dd">
        <button class="lang-dd__btn" type="button" aria-expanded="false">${icon('translate', 16)}<span>${LANG_LABELS[currentLang] || currentLang.toUpperCase()}</span>${icon('chevron-right', 14)}</button>
        <div class="lang-dd__menu">${items}</div>
      </div>`;
}

export function layout(o: LayoutOpts): string {
  const lang = o.lang || 'en';
  const dir = o.dir || 'ltr';
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const hreflangTags = (o.hreflang || [])
    .map(h => `\n  <link rel="alternate" hreflang="${h.lang}" href="${h.href}">`)
    .join('');
  const langDd = o.hreflang ? langSwitcher(lang, o.hreflang) : '';
  const langScript = langDd ? `
(function(){var d=document.getElementById('lang-dd');if(!d)return;var b=d.querySelector('.lang-dd__btn'),m=d.querySelector('.lang-dd__menu');b.addEventListener('click',function(){var o=m.classList.toggle('is-open');b.setAttribute('aria-expanded',String(o))});document.addEventListener('click',function(e){if(!d.contains(e.target)){m.classList.remove('is-open');b.setAttribute('aria-expanded','false')}})})();` : '';
  const allScripts = [o.scripts, langScript].filter(Boolean).join('\n');

  return `<!doctype html>
<html lang="${lang}"${dir === 'rtl' ? ' dir="rtl"' : ''}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${o.title}</title>
  <meta name="description" content="${o.description}">
  <link rel="canonical" href="${o.canonical}">${hreflangTags}
  <link rel="stylesheet" href="/assets/site.css">${o.cssVars ? `
  <style>:root{${o.cssVars}}</style>` : ''}${o.head ?? ''}
</head>
<body${o.bodyAttrs ? ' ' + o.bodyAttrs : ''}>
  <nav class="nav">
    <a href="${prefix}/" class="nav__logo">${logoSvg(24)}<span>Flag Theme</span></a>
    <div class="nav__links">
      <a href="${prefix}/countries/">${o.navCountriesLabel || 'Countries'}</a>
      ${langDd}
    </div>
  </nav>
  <main>
${o.body}
  </main>
  <footer class="footer">
    <p>${o.footerText || 'Flag Theme &mdash; Free browser themes inspired by country flags.'}</p>
    <p class="footer__sponsor">Sponsored by <a href="https://301.st" target="_blank" rel="noopener">${brandIcon('301st', 16)} 301.st</a></p>
    <p class="footer__links"><a href="${prefix}/privacy/">Privacy Policy</a> &middot; <a href="https://github.com/investblog/flag-theme-generator" target="_blank" rel="noopener">GitHub</a></p>
  </footer>${allScripts ? `
  <script>${allScripts}</script>` : ''}
</body>
</html>`;
}
