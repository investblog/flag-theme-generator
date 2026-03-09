/**
 * Privacy policy page.
 */
import { SITE_URL, icon } from './helpers.js';
import { layout } from './layout.js';
import { t, getStrings } from '../i18n/strings.js';

export interface PrivacyPageData {
  lang?: string;
}

export function privacyPage(d: PrivacyPageData): string {
  const lang = d.lang || 'en';
  const s = getStrings(lang);
  const prefix = lang === 'en' ? '' : `/${lang}`;

  const body = `
    <section>
      <h1>${s.privacyTitle}</h1>
      <p style="color:var(--uc-muted-text);margin-bottom:1.5rem">Last updated: March 2026</p>

      <div class="privacy-content">
        <h2>Overview</h2>
        <p>Flag Theme ("we", "us", "our") is a browser extension and website (flagtheme.com) that generates browser themes from country flag colors. We are committed to protecting your privacy.</p>

        <h2>Data Collection</h2>
        <p>We do not collect, store, transmit, or process any personal data. The extension runs entirely in your browser.</p>

        <h2>Browser Extension</h2>
        <ul>
          <li>Makes <strong>zero network requests</strong> — no analytics, no telemetry, no remote code</li>
          <li>Theme preferences are stored in <code>browser.storage.local</code> and never leave your device</li>
          <li>No accounts, no sign-in, no authentication required</li>
          <li>Does not access browsing history, bookmarks, or any page content</li>
        </ul>

        <h2>Website (flagtheme.com)</h2>
        <ul>
          <li>Static site hosted on Cloudflare Pages</li>
          <li>No cookies, no tracking scripts, no analytics</li>
          <li>No user accounts or data collection forms</li>
          <li>Cloudflare may collect standard web server logs (IP address, user agent) as part of their infrastructure — see <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">Cloudflare's Privacy Policy</a></li>
        </ul>

        <h2>Third-Party Services</h2>
        <p>The extension uses no third-party services. The website uses Cloudflare Pages for hosting. No other third-party services are integrated.</p>

        <h2>Children's Privacy</h2>
        <p>Our extension and website do not knowingly collect any data from anyone, including children under 13.</p>

        <h2>Changes</h2>
        <p>We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>

        <h2>Contact</h2>
        <p>If you have questions about this privacy policy, please <a href="https://github.com/investblog/flag-theme-generator/issues">open an issue on GitHub</a>.</p>
      </div>
    </section>
    <style>
      .privacy-content h2 { margin: 1.5rem 0 .5rem; }
      .privacy-content ul { padding-left: 1.5rem; }
      .privacy-content li { margin-bottom: .5rem; }
    </style>`;

  return layout({
    lang,
    dir: s.dir,
    title: s.privacyTitle,
    description: s.privacyDesc,
    canonical: `${SITE_URL}${prefix}/privacy/`,
    body,
    navCountriesLabel: s.countries,
    footerText: t(s.footerText, { year: String(new Date().getFullYear()) }),
  });
}
