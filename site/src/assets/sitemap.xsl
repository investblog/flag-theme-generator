<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Sitemap — Flag Theme</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;background:#0f0f13;color:#c8ccd0;line-height:1.6;padding:2rem 1rem}
    .container{max-width:960px;margin:0 auto}
    h1{font-size:1.5rem;font-weight:600;color:#e8e8ec;margin-bottom:.25rem}
    .meta{color:#9898a8;font-size:.875rem;margin-bottom:1.5rem}
    table{width:100%;border-collapse:collapse;font-size:.875rem}
    thead th{text-align:left;padding:.6rem .75rem;color:#9898a8;font-weight:500;border-bottom:1px solid #2a2a38;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em}
    tbody tr{border-bottom:1px solid #1a1a24;transition:background .15s}
    tbody tr:hover{background:#1a1a24}
    td{padding:.5rem .75rem;vertical-align:top}
    td:first-child{font-weight:500}
    a{color:#818cf8;text-decoration:none;word-break:break-all}
    a:hover{text-decoration:underline;color:#a5b4fc}
    .langs{display:flex;flex-wrap:wrap;gap:.25rem .4rem}
    .lang{display:inline-block;background:#1a1a24;color:#9898a8;padding:.1rem .4rem;border-radius:3px;font-size:.75rem;font-family:ui-monospace,monospace}
    .lang.current{background:#2a2a5c;color:#818cf8;font-weight:600}
    .num{color:#555;font-variant-numeric:tabular-nums;text-align:right;width:2rem}
    @media(max-width:600px){
      table,thead,tbody,tr,td,th{display:block}
      thead{display:none}
      tr{margin-bottom:.75rem;border:1px solid #2a2a38;border-radius:6px;padding:.5rem}
      td{padding:.2rem 0;border:none}
      td:first-child{display:none}
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sitemap</h1>
    <p class="meta"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs</p>
    <table>
      <thead>
        <tr>
          <th class="num">#</th>
          <th>URL</th>
          <th>Languages</th>
          <th>Last modified</th>
        </tr>
      </thead>
      <tbody>
        <xsl:for-each select="sitemap:urlset/sitemap:url">
          <tr>
            <td class="num"><xsl:value-of select="position()"/></td>
            <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
            <td>
              <div class="langs">
                <xsl:variable name="current-loc" select="sitemap:loc"/>
                <xsl:for-each select="xhtml:link[@rel='alternate' and @hreflang != 'x-default']">
                  <xsl:choose>
                    <xsl:when test="@href = $current-loc or @href = concat($current-loc, '/')">
                      <span class="lang current"><xsl:value-of select="@hreflang"/></span>
                    </xsl:when>
                    <xsl:otherwise>
                      <span class="lang"><xsl:value-of select="@hreflang"/></span>
                    </xsl:otherwise>
                  </xsl:choose>
                </xsl:for-each>
              </div>
            </td>
            <td><xsl:value-of select="sitemap:lastmod"/></td>
          </tr>
        </xsl:for-each>
      </tbody>
    </table>
  </div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
