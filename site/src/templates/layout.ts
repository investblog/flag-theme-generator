/**
 * Shared HTML layout wrapper.
 */
import { logoSvg } from './helpers.js';

export interface LayoutOpts {
  title: string;
  description: string;
  canonical: string;
  cssVars?: string;
  head?: string;
  body: string;
  scripts?: string;
  bodyAttrs?: string;
}

export function layout(o: LayoutOpts): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${o.title}</title>
  <meta name="description" content="${o.description}">
  <link rel="canonical" href="${o.canonical}">
  <link rel="stylesheet" href="/assets/site.css">${o.cssVars ? `
  <style>:root{${o.cssVars}}</style>` : ''}${o.head ?? ''}
</head>
<body${o.bodyAttrs ? ' ' + o.bodyAttrs : ''}>
  <nav class="nav">
    <a href="/" class="nav__logo">${logoSvg(24)}<span>Flag Theme</span></a>
    <div class="nav__links">
      <a href="/countries/">Countries</a>
    </div>
  </nav>
  <main>
${o.body}
  </main>
  <footer class="footer">
    <p>Flag Theme &mdash; Free browser themes inspired by country flags.</p>
  </footer>${o.scripts ? `
  <script>${o.scripts}</script>` : ''}
</body>
</html>`;
}
