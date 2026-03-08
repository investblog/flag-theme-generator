/**
 * UI string translations for the site.
 *
 * Each locale has the same keys. English is the base/fallback.
 * Template placeholders: {country}, {count}, {region}
 */

export interface SiteStrings {
  lang: string;
  dir: 'ltr' | 'rtl';

  // Country page
  countryTitle: string;        // "{country} Browser Theme — Free Chrome & Firefox Theme | Flag Theme"
  countryDescription: string;  // "Download a free {country} flag-inspired..."
  countryH1: string;           // "{country} Browser Theme"
  countryHeroSub: string;      // "A browser theme inspired by the flag of {country}..."
  flagColors: string;
  designTokens: string;
  browserCompat: string;
  similarThemes: string;

  // Modes
  modeDark: string;
  modeLight: string;
  modeAmoled: string;
  modeQuestion: string;        // FAQ: "What are the different modes?"
  modeAnswer: string;

  // CTA
  downloadChrome: string;
  getFirefox: string;
  copyCss: string;
  copied: string;

  // FAQ
  faqTitle: string;
  faqChromeQ: string;
  faqChromeA: string;
  faqEdgeQ: string;
  faqEdgeA: string;
  faqFirefoxQ: string;
  faqFirefoxA: string;

  // Navigation
  home: string;
  countries: string;
  allCountries: string;
  viewAll: string;

  // Homepage
  homeH1: string;
  homeSub: string;              // "{count}+ countries..."
  searchPlaceholder: string;
  popularThemes: string;
  browseByRegion: string;
  howItWorks: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;

  // Region
  regionH1: string;             // "{region} Browser Themes"
  regionDesc: string;           // "{count} flag-inspired browser themes from {region}."
  otherRegions: string;

  // Catalog
  catalogH1: string;
  catalogDesc: string;

  // Breadcrumbs
  breadcrumbHome: string;

  // Footer
  footerText: string;

  // Meta
  wcagAccessible: string;
  free: string;
}

function t(s: string, vars: Record<string, string | number>): string {
  let result = s;
  for (const [k, v] of Object.entries(vars)) {
    result = result.replaceAll(`{${k}}`, String(v));
  }
  return result;
}

export { t };

export const strings: Record<string, SiteStrings> = {
  en: {
    lang: 'en',
    dir: 'ltr',
    countryTitle: '{country} Browser Theme — Free Chrome & Firefox Theme | Flag Theme',
    countryDescription: 'Download a free {country} flag-inspired browser theme for Chrome, Edge, Firefox, and Brave. WCAG-accessible dark, light, and AMOLED modes.',
    countryH1: '{country} Browser Theme',
    countryHeroSub: 'A browser theme inspired by the flag of {country}. Free, WCAG-accessible.',
    flagColors: 'Flag Colors',
    designTokens: 'Design Tokens',
    browserCompat: 'Browser Compatibility',
    similarThemes: 'Similar Themes',
    modeDark: 'Dark',
    modeLight: 'Light',
    modeAmoled: 'AMOLED',
    modeQuestion: 'What are the different modes?',
    modeAnswer: '<strong>Dark</strong> \u2014 balanced dark theme. <strong>Light</strong> \u2014 bright, easy on the eyes. <strong>AMOLED</strong> \u2014 pure black, saves battery on OLED screens.',
    downloadChrome: 'Download for Chrome',
    getFirefox: 'Get for Firefox',
    copyCss: 'Copy CSS Variables',
    copied: 'Copied!',
    faqTitle: 'Frequently Asked Questions',
    faqChromeQ: 'How do I install a Chrome theme?',
    faqChromeA: 'Download the .zip file. The easiest way is to drag it directly onto <code>chrome://extensions</code> &mdash; Chrome will install the theme automatically. Alternatively, unzip the file, enable &ldquo;Developer mode&rdquo; (top-right toggle), and click &ldquo;Load unpacked&rdquo; to select the folder.',
    faqEdgeQ: 'Does this work on Microsoft Edge?',
    faqEdgeA: 'Yes! Edge supports Chrome themes natively. Drag the .zip file onto <code>edge://extensions</code> to install instantly. You can also unzip it, enable &ldquo;Developer mode&rdquo; (bottom-left toggle), and click &ldquo;Load unpacked&rdquo;.',
    faqFirefoxQ: 'What about Firefox?',
    faqFirefoxA: 'Firefox uses a different theme format. We&rsquo;re working on a Firefox add-on &mdash; stay tuned!',
    home: 'Home',
    countries: 'Countries',
    allCountries: 'All Countries',
    viewAll: 'View all',
    homeH1: 'Browser Themes Inspired by Country Flags',
    homeSub: '{count}+ countries \u2022 Dark, Light & AMOLED modes \u2022 WCAG accessible \u2022 Free',
    searchPlaceholder: 'Search countries...',
    popularThemes: 'Popular Themes',
    browseByRegion: 'Browse by Region',
    howItWorks: 'How It Works',
    step1Title: 'Pick a country',
    step1Desc: 'Browse {count}+ themes inspired by flags from around the world',
    step2Title: 'Choose a mode',
    step2Desc: 'Dark, Light, or AMOLED \u2014 preview instantly and switch anytime',
    step3Title: 'Download & install',
    step3Desc: 'Get a .zip for Chrome/Edge, or grab the Firefox add-on',
    regionH1: '{region} Browser Themes',
    regionDesc: '{count} flag-inspired browser themes from {region}.',
    otherRegions: 'Other Regions',
    catalogH1: 'All Country Browser Themes',
    catalogDesc: 'Browse {count}+ free browser themes inspired by country flags. Chrome, Edge, Firefox, and Brave.',
    breadcrumbHome: 'Home',
    footerText: '\u00a9 {year} Flag Theme. Free browser themes inspired by country flags.',
    wcagAccessible: 'WCAG accessible',
    free: 'Free',
  },

  es: {
    lang: 'es',
    dir: 'ltr',
    countryTitle: 'Tema de Navegador de {country} — Tema Gratis para Chrome y Firefox | Flag Theme',
    countryDescription: 'Descarga gratis un tema de navegador inspirado en la bandera de {country} para Chrome, Edge, Firefox y Brave. Modos oscuro, claro y AMOLED accesibles seg\u00fan WCAG.',
    countryH1: 'Tema de Navegador de {country}',
    countryHeroSub: 'Un tema de navegador inspirado en la bandera de {country}. Gratis y accesible seg\u00fan WCAG.',
    flagColors: 'Colores de la Bandera',
    designTokens: 'Tokens de Dise\u00f1o',
    browserCompat: 'Compatibilidad de Navegadores',
    similarThemes: 'Temas Similares',
    modeDark: 'Oscuro',
    modeLight: 'Claro',
    modeAmoled: 'AMOLED',
    modeQuestion: '\u00bfCu\u00e1les son los diferentes modos?',
    modeAnswer: '<strong>Oscuro</strong> \u2014 tema oscuro equilibrado. <strong>Claro</strong> \u2014 brillante, f\u00e1cil para la vista. <strong>AMOLED</strong> \u2014 negro puro, ahorra bater\u00eda en pantallas OLED.',
    downloadChrome: 'Descargar para Chrome',
    getFirefox: 'Obtener para Firefox',
    copyCss: 'Copiar Variables CSS',
    copied: '\u00a1Copiado!',
    faqTitle: 'Preguntas Frecuentes',
    faqChromeQ: '\u00bfC\u00f3mo instalo un tema de Chrome?',
    faqChromeA: 'Descarga el archivo .zip. La forma m\u00e1s f\u00e1cil es arrastrarlo directamente a <code>chrome://extensions</code> &mdash; Chrome instalar\u00e1 el tema autom\u00e1ticamente. Tambi\u00e9n puedes descomprimirlo, activar el &ldquo;Modo de desarrollador&rdquo; (interruptor arriba a la derecha) y hacer clic en &ldquo;Cargar descomprimida&rdquo;.',
    faqEdgeQ: '\u00bfFunciona en Microsoft Edge?',
    faqEdgeA: '\u00a1S\u00ed! Edge soporta temas de Chrome de forma nativa. Arrastra el .zip a <code>edge://extensions</code> para instalar al instante. Tambi\u00e9n puedes descomprimirlo, activar el &ldquo;Modo de desarrollador&rdquo; (interruptor abajo a la izquierda) y hacer clic en &ldquo;Cargar descomprimida&rdquo;.',
    faqFirefoxQ: '\u00bfY Firefox?',
    faqFirefoxA: 'Firefox usa un formato de tema diferente. Estamos trabajando en un complemento para Firefox \u2014 \u00a1mantente atento!',
    home: 'Inicio',
    countries: 'Pa\u00edses',
    allCountries: 'Todos los Pa\u00edses',
    viewAll: 'Ver todos',
    homeH1: 'Temas de Navegador Inspirados en Banderas de Pa\u00edses',
    homeSub: '{count}+ pa\u00edses \u2022 Modos Oscuro, Claro y AMOLED \u2022 Accesible WCAG \u2022 Gratis',
    searchPlaceholder: 'Buscar pa\u00edses...',
    popularThemes: 'Temas Populares',
    browseByRegion: 'Explorar por Regi\u00f3n',
    howItWorks: 'C\u00f3mo Funciona',
    step1Title: 'Elige un pa\u00eds',
    step1Desc: 'Explora {count}+ temas inspirados en banderas de todo el mundo',
    step2Title: 'Elige un modo',
    step2Desc: 'Oscuro, Claro o AMOLED \u2014 vista previa instant\u00e1nea y cambia cuando quieras',
    step3Title: 'Descarga e instala',
    step3Desc: 'Obt\u00e9n un .zip para Chrome/Edge, o el complemento de Firefox',
    regionH1: 'Temas de Navegador de {region}',
    regionDesc: '{count} temas de navegador inspirados en banderas de {region}.',
    otherRegions: 'Otras Regiones',
    catalogH1: 'Todos los Temas de Navegador por Pa\u00eds',
    catalogDesc: 'Explora {count}+ temas de navegador gratuitos inspirados en banderas de pa\u00edses. Chrome, Edge, Firefox y Brave.',
    breadcrumbHome: 'Inicio',
    footerText: '\u00a9 {year} Flag Theme. Temas de navegador gratuitos inspirados en banderas de pa\u00edses.',
    wcagAccessible: 'Accesible WCAG',
    free: 'Gratis',
  },

  fr: {
    lang: 'fr',
    dir: 'ltr',
    countryTitle: 'Th\u00e8me Navigateur {country} — Th\u00e8me Gratuit Chrome et Firefox | Flag Theme',
    countryDescription: 'T\u00e9l\u00e9chargez gratuitement un th\u00e8me de navigateur inspir\u00e9 du drapeau de {country} pour Chrome, Edge, Firefox et Brave. Modes sombre, clair et AMOLED accessibles WCAG.',
    countryH1: 'Th\u00e8me Navigateur {country}',
    countryHeroSub: 'Un th\u00e8me de navigateur inspir\u00e9 du drapeau de {country}. Gratuit et accessible WCAG.',
    flagColors: 'Couleurs du Drapeau',
    designTokens: 'Jetons de Design',
    browserCompat: 'Compatibilit\u00e9 Navigateurs',
    similarThemes: 'Th\u00e8mes Similaires',
    modeDark: 'Sombre',
    modeLight: 'Clair',
    modeAmoled: 'AMOLED',
    modeQuestion: 'Quels sont les diff\u00e9rents modes\u00a0?',
    modeAnswer: '<strong>Sombre</strong> \u2014 th\u00e8me sombre \u00e9quilibr\u00e9. <strong>Clair</strong> \u2014 lumineux, agr\u00e9able pour les yeux. <strong>AMOLED</strong> \u2014 noir pur, \u00e9conomise la batterie sur \u00e9crans OLED.',
    downloadChrome: 'T\u00e9l\u00e9charger pour Chrome',
    getFirefox: 'Obtenir pour Firefox',
    copyCss: 'Copier les Variables CSS',
    copied: 'Copi\u00e9\u00a0!',
    faqTitle: 'Questions Fr\u00e9quentes',
    faqChromeQ: 'Comment installer un th\u00e8me Chrome\u00a0?',
    faqChromeA: 'T\u00e9l\u00e9chargez le fichier .zip. Le plus simple est de le glisser directement sur <code>chrome://extensions</code> &mdash; Chrome installera le th\u00e8me automatiquement. Vous pouvez aussi le d\u00e9compresser, activer le &ldquo;Mode d\u00e9veloppeur&rdquo; (bouton en haut \u00e0 droite) et cliquer sur &ldquo;Charger l\u2019extension non empaquetee&rdquo;.',
    faqEdgeQ: '\u00c7a fonctionne sur Microsoft Edge\u00a0?',
    faqEdgeA: 'Oui\u00a0! Edge supporte les th\u00e8mes Chrome nativement. Glissez le .zip sur <code>edge://extensions</code> pour installer instantan\u00e9ment. Vous pouvez aussi d\u00e9compresser, activer le &ldquo;Mode d\u00e9veloppeur&rdquo; (bouton en bas \u00e0 gauche) et cliquer sur &ldquo;Charger l\u2019extension non empaquetee&rdquo;.',
    faqFirefoxQ: 'Et Firefox\u00a0?',
    faqFirefoxA: 'Firefox utilise un format de th\u00e8me diff\u00e9rent. Nous travaillons sur un module Firefox \u2014 restez \u00e0 l\u2019\u00e9coute\u00a0!',
    home: 'Accueil',
    countries: 'Pays',
    allCountries: 'Tous les Pays',
    viewAll: 'Voir tout',
    homeH1: 'Th\u00e8mes Navigateur Inspir\u00e9s par les Drapeaux',
    homeSub: '{count}+ pays \u2022 Modes Sombre, Clair et AMOLED \u2022 Accessible WCAG \u2022 Gratuit',
    searchPlaceholder: 'Rechercher un pays...',
    popularThemes: 'Th\u00e8mes Populaires',
    browseByRegion: 'Parcourir par R\u00e9gion',
    howItWorks: 'Comment \u00c7a Marche',
    step1Title: 'Choisissez un pays',
    step1Desc: 'Parcourez {count}+ th\u00e8mes inspir\u00e9s par les drapeaux du monde entier',
    step2Title: 'Choisissez un mode',
    step2Desc: 'Sombre, Clair ou AMOLED \u2014 aper\u00e7u instantan\u00e9 et changez quand vous voulez',
    step3Title: 'T\u00e9l\u00e9chargez et installez',
    step3Desc: 'Obtenez un .zip pour Chrome/Edge, ou le module Firefox',
    regionH1: 'Th\u00e8mes Navigateur {region}',
    regionDesc: '{count} th\u00e8mes de navigateur inspir\u00e9s par les drapeaux de {region}.',
    otherRegions: 'Autres R\u00e9gions',
    catalogH1: 'Tous les Th\u00e8mes Navigateur par Pays',
    catalogDesc: 'Parcourez {count}+ th\u00e8mes de navigateur gratuits inspir\u00e9s par les drapeaux. Chrome, Edge, Firefox et Brave.',
    breadcrumbHome: 'Accueil',
    footerText: '\u00a9 {year} Flag Theme. Th\u00e8mes de navigateur gratuits inspir\u00e9s par les drapeaux.',
    wcagAccessible: 'Accessible WCAG',
    free: 'Gratuit',
  },

  ar: {
    lang: 'ar',
    dir: 'rtl',
    countryTitle: '\u0633\u0645\u0629 \u0645\u062a\u0635\u0641\u062d {country} — \u0633\u0645\u0629 \u0645\u062c\u0627\u0646\u064a\u0629 \u0644\u0643\u0631\u0648\u0645 \u0648\u0641\u0627\u064a\u0631\u0641\u0648\u0643\u0633 | Flag Theme',
    countryDescription: '\u062d\u0645\u0651\u0644 \u0645\u062c\u0627\u0646\u0627\u064b \u0633\u0645\u0629 \u0645\u062a\u0635\u0641\u062d \u0645\u0633\u062a\u0648\u062d\u0627\u0629 \u0645\u0646 \u0639\u0644\u0645 {country} \u0644\u0643\u0631\u0648\u0645 \u0648\u0625\u064a\u062f\u062c \u0648\u0641\u0627\u064a\u0631\u0641\u0648\u0643\u0633 \u0648\u0628\u0631\u064a\u0641. \u0623\u0648\u0636\u0627\u0639 \u062f\u0627\u0643\u0646\u0629 \u0648\u0641\u0627\u062a\u062d\u0629 \u0648AMOLED \u0645\u062a\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 WCAG.',
    countryH1: '\u0633\u0645\u0629 \u0645\u062a\u0635\u0641\u062d {country}',
    countryHeroSub: '\u0633\u0645\u0629 \u0645\u062a\u0635\u0641\u062d \u0645\u0633\u062a\u0648\u062d\u0627\u0629 \u0645\u0646 \u0639\u0644\u0645 {country}. \u0645\u062c\u0627\u0646\u064a\u0629 \u0648\u0645\u062a\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 WCAG.',
    flagColors: '\u0623\u0644\u0648\u0627\u0646 \u0627\u0644\u0639\u0644\u0645',
    designTokens: '\u0631\u0645\u0648\u0632 \u0627\u0644\u062a\u0635\u0645\u064a\u0645',
    browserCompat: '\u062a\u0648\u0627\u0641\u0642 \u0627\u0644\u0645\u062a\u0635\u0641\u062d\u0627\u062a',
    similarThemes: '\u0633\u0645\u0627\u062a \u0645\u0634\u0627\u0628\u0647\u0629',
    modeDark: '\u062f\u0627\u0643\u0646',
    modeLight: '\u0641\u0627\u062a\u062d',
    modeAmoled: 'AMOLED',
    modeQuestion: '\u0645\u0627 \u0647\u064a \u0627\u0644\u0623\u0648\u0636\u0627\u0639 \u0627\u0644\u0645\u062e\u062a\u0644\u0641\u0629\u061f',
    modeAnswer: '<strong>\u062f\u0627\u0643\u0646</strong> \u2014 \u0633\u0645\u0629 \u062f\u0627\u0643\u0646\u0629 \u0645\u062a\u0648\u0627\u0632\u0646\u0629. <strong>\u0641\u0627\u062a\u062d</strong> \u2014 \u0645\u0634\u0631\u0642 \u0648\u0645\u0631\u064a\u062d \u0644\u0644\u0639\u064a\u0646. <strong>AMOLED</strong> \u2014 \u0623\u0633\u0648\u062f \u0646\u0642\u064a\u060c \u064a\u0648\u0641\u0631 \u0627\u0644\u0628\u0637\u0627\u0631\u064a\u0629 \u0639\u0644\u0649 \u0634\u0627\u0634\u0627\u062a OLED.',
    downloadChrome: '\u062a\u062d\u0645\u064a\u0644 \u0644\u0643\u0631\u0648\u0645',
    getFirefox: '\u0627\u062d\u0635\u0644 \u0639\u0644\u064a\u0647 \u0644\u0641\u0627\u064a\u0631\u0641\u0648\u0643\u0633',
    copyCss: '\u0646\u0633\u062e \u0645\u062a\u063a\u064a\u0631\u0627\u062a CSS',
    copied: '\u062a\u0645 \u0627\u0644\u0646\u0633\u062e!',
    faqTitle: '\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629',
    faqChromeQ: '\u0643\u064a\u0641 \u0623\u062b\u0628\u0651\u062a \u0633\u0645\u0629 \u0643\u0631\u0648\u0645\u061f',
    faqChromeA: '\u062d\u0645\u0651\u0644 \u0645\u0644\u0641 .zip. \u0623\u0633\u0647\u0644 \u0637\u0631\u064a\u0642\u0629 \u0647\u064a \u0633\u062d\u0628\u0647 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 <code>chrome://extensions</code> &mdash; \u0633\u064a\u062b\u0628\u0651\u062a \u0643\u0631\u0648\u0645 \u0627\u0644\u0633\u0645\u0629 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b. \u064a\u0645\u0643\u0646\u0643 \u0623\u064a\u0636\u0627\u064b \u0641\u0643 \u0627\u0644\u0636\u063a\u0637\u060c \u062a\u0641\u0639\u064a\u0644 &ldquo;\u0648\u0636\u0639 \u0627\u0644\u0645\u0637\u0648\u0631&rdquo; (\u0627\u0644\u0632\u0631 \u0623\u0639\u0644\u0649 \u0627\u0644\u064a\u0645\u064a\u0646) \u0648\u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 &ldquo;\u062a\u062d\u0645\u064a\u0644 \u063a\u064a\u0631 \u0645\u062d\u0632\u0648\u0645\u0629&rdquo;.',
    faqEdgeQ: '\u0647\u0644 \u064a\u0639\u0645\u0644 \u0639\u0644\u0649 Microsoft Edge\u061f',
    faqEdgeA: '\u0646\u0639\u0645! Edge \u064a\u062f\u0639\u0645 \u0633\u0645\u0627\u062a \u0643\u0631\u0648\u0645 \u0623\u0635\u0644\u0627\u064b. \u0627\u0633\u062d\u0628 \u0645\u0644\u0641 .zip \u0625\u0644\u0649 <code>edge://extensions</code> \u0644\u0644\u062a\u062b\u0628\u064a\u062a \u0641\u0648\u0631\u0627\u064b. \u064a\u0645\u0643\u0646\u0643 \u0623\u064a\u0636\u0627\u064b \u0641\u0643 \u0627\u0644\u0636\u063a\u0637\u060c \u062a\u0641\u0639\u064a\u0644 &ldquo;\u0648\u0636\u0639 \u0627\u0644\u0645\u0637\u0648\u0631&rdquo; (\u0627\u0644\u0632\u0631 \u0623\u0633\u0641\u0644 \u0627\u0644\u064a\u0633\u0627\u0631) \u0648\u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 &ldquo;\u062a\u062d\u0645\u064a\u0644 \u063a\u064a\u0631 \u0645\u062d\u0632\u0648\u0645\u0629&rdquo;.',
    faqFirefoxQ: '\u0645\u0627\u0630\u0627 \u0639\u0646 Firefox\u061f',
    faqFirefoxA: 'Firefox \u064a\u0633\u062a\u062e\u062f\u0645 \u062a\u0646\u0633\u064a\u0642 \u0633\u0645\u0627\u062a \u0645\u062e\u062a\u0644\u0641. \u0646\u0639\u0645\u0644 \u0639\u0644\u0649 \u0625\u0636\u0627\u0641\u0629 Firefox \u2014 \u062a\u0631\u0642\u0628\u0648\u0627!',
    home: '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629',
    countries: '\u0627\u0644\u062f\u0648\u0644',
    allCountries: '\u062c\u0645\u064a\u0639 \u0627\u0644\u062f\u0648\u0644',
    viewAll: '\u0639\u0631\u0636 \u0627\u0644\u0643\u0644',
    homeH1: '\u0633\u0645\u0627\u062a \u0645\u062a\u0635\u0641\u062d \u0645\u0633\u062a\u0648\u062d\u0627\u0629 \u0645\u0646 \u0623\u0639\u0644\u0627\u0645 \u0627\u0644\u062f\u0648\u0644',
    homeSub: '{count}+ \u062f\u0648\u0644\u0629 \u2022 \u0623\u0648\u0636\u0627\u0639 \u062f\u0627\u0643\u0646\u0629 \u0648\u0641\u0627\u062a\u062d\u0629 \u0648AMOLED \u2022 \u0645\u062a\u0648\u0627\u0641\u0642 \u0645\u0639 WCAG \u2022 \u0645\u062c\u0627\u0646\u064a',
    searchPlaceholder: '\u0627\u0628\u062d\u062b \u0639\u0646 \u062f\u0648\u0644\u0629...',
    popularThemes: '\u0633\u0645\u0627\u062a \u0634\u0627\u0626\u0639\u0629',
    browseByRegion: '\u062a\u0635\u0641\u062d \u062d\u0633\u0628 \u0627\u0644\u0645\u0646\u0637\u0642\u0629',
    howItWorks: '\u0643\u064a\u0641 \u064a\u0639\u0645\u0644',
    step1Title: '\u0627\u062e\u062a\u0631 \u062f\u0648\u0644\u0629',
    step1Desc: '\u062a\u0635\u0641\u062d {count}+ \u0633\u0645\u0629 \u0645\u0633\u062a\u0648\u062d\u0627\u0629 \u0645\u0646 \u0623\u0639\u0644\u0627\u0645 \u062d\u0648\u0644 \u0627\u0644\u0639\u0627\u0644\u0645',
    step2Title: '\u0627\u062e\u062a\u0631 \u0648\u0636\u0639\u0627\u064b',
    step2Desc: '\u062f\u0627\u0643\u0646 \u0623\u0648 \u0641\u0627\u062a\u062d \u0623\u0648 AMOLED \u2014 \u0645\u0639\u0627\u064a\u0646\u0629 \u0641\u0648\u0631\u064a\u0629 \u0648\u062a\u0628\u062f\u064a\u0644 \u0641\u064a \u0623\u064a \u0648\u0642\u062a',
    step3Title: '\u062d\u0645\u0651\u0644 \u0648\u062b\u0628\u0651\u062a',
    step3Desc: '\u0627\u062d\u0635\u0644 \u0639\u0644\u0649 .zip \u0644\u0643\u0631\u0648\u0645/\u0625\u064a\u062f\u062c\u060c \u0623\u0648 \u0625\u0636\u0627\u0641\u0629 Firefox',
    regionH1: '\u0633\u0645\u0627\u062a \u0645\u062a\u0635\u0641\u062d {region}',
    regionDesc: '{count} \u0633\u0645\u0629 \u0645\u062a\u0635\u0641\u062d \u0645\u0633\u062a\u0648\u062d\u0627\u0629 \u0645\u0646 \u0623\u0639\u0644\u0627\u0645 {region}.',
    otherRegions: '\u0645\u0646\u0627\u0637\u0642 \u0623\u062e\u0631\u0649',
    catalogH1: '\u062c\u0645\u064a\u0639 \u0633\u0645\u0627\u062a \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u062d\u0633\u0628 \u0627\u0644\u062f\u0648\u0644\u0629',
    catalogDesc: '\u062a\u0635\u0641\u062d {count}+ \u0633\u0645\u0629 \u0645\u062a\u0635\u0641\u062d \u0645\u062c\u0627\u0646\u064a\u0629 \u0645\u0633\u062a\u0648\u062d\u0627\u0629 \u0645\u0646 \u0623\u0639\u0644\u0627\u0645 \u0627\u0644\u062f\u0648\u0644. Chrome \u0648Edge \u0648Firefox \u0648Brave.',
    breadcrumbHome: '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629',
    footerText: '\u00a9 {year} Flag Theme. \u0633\u0645\u0627\u062a \u0645\u062a\u0635\u0641\u062d \u0645\u062c\u0627\u0646\u064a\u0629 \u0645\u0633\u062a\u0648\u062d\u0627\u0629 \u0645\u0646 \u0623\u0639\u0644\u0627\u0645 \u0627\u0644\u062f\u0648\u0644.',
    wcagAccessible: '\u0645\u062a\u0648\u0627\u0641\u0642 \u0645\u0639 WCAG',
    free: '\u0645\u062c\u0627\u0646\u064a',
  },

  pt: {
    lang: 'pt',
    dir: 'ltr',
    countryTitle: 'Tema de Navegador {country} — Tema Gr\u00e1tis para Chrome e Firefox | Flag Theme',
    countryDescription: 'Baixe gr\u00e1tis um tema de navegador inspirado na bandeira de {country} para Chrome, Edge, Firefox e Brave. Modos escuro, claro e AMOLED acess\u00edveis WCAG.',
    countryH1: 'Tema de Navegador {country}',
    countryHeroSub: 'Um tema de navegador inspirado na bandeira de {country}. Gr\u00e1tis e acess\u00edvel WCAG.',
    flagColors: 'Cores da Bandeira',
    designTokens: 'Tokens de Design',
    browserCompat: 'Compatibilidade de Navegadores',
    similarThemes: 'Temas Similares',
    modeDark: 'Escuro',
    modeLight: 'Claro',
    modeAmoled: 'AMOLED',
    modeQuestion: 'Quais s\u00e3o os diferentes modos?',
    modeAnswer: '<strong>Escuro</strong> \u2014 tema escuro equilibrado. <strong>Claro</strong> \u2014 brilhante, confort\u00e1vel para os olhos. <strong>AMOLED</strong> \u2014 preto puro, economiza bateria em telas OLED.',
    downloadChrome: 'Baixar para Chrome',
    getFirefox: 'Obter para Firefox',
    copyCss: 'Copiar Vari\u00e1veis CSS',
    copied: 'Copiado!',
    faqTitle: 'Perguntas Frequentes',
    faqChromeQ: 'Como instalo um tema do Chrome?',
    faqChromeA: 'Baixe o arquivo .zip. A forma mais f\u00e1cil \u00e9 arrast\u00e1-lo diretamente para <code>chrome://extensions</code> &mdash; o Chrome instalar\u00e1 o tema automaticamente. Voc\u00ea tamb\u00e9m pode descompactar, ativar o &ldquo;Modo de desenvolvedor&rdquo; (bot\u00e3o no canto superior direito) e clicar em &ldquo;Carregar sem compacta\u00e7\u00e3o&rdquo;.',
    faqEdgeQ: 'Funciona no Microsoft Edge?',
    faqEdgeA: 'Sim! O Edge suporta temas do Chrome nativamente. Arraste o .zip para <code>edge://extensions</code> para instalar instantaneamente. Voc\u00ea tamb\u00e9m pode descompactar, ativar o &ldquo;Modo de desenvolvedor&rdquo; (bot\u00e3o no canto inferior esquerdo) e clicar em &ldquo;Carregar sem compacta\u00e7\u00e3o&rdquo;.',
    faqFirefoxQ: 'E o Firefox?',
    faqFirefoxA: 'O Firefox usa um formato de tema diferente. Estamos trabalhando em um complemento para Firefox \u2014 fique atento!',
    home: 'In\u00edcio',
    countries: 'Pa\u00edses',
    allCountries: 'Todos os Pa\u00edses',
    viewAll: 'Ver todos',
    homeH1: 'Temas de Navegador Inspirados em Bandeiras',
    homeSub: '{count}+ pa\u00edses \u2022 Modos Escuro, Claro e AMOLED \u2022 Acess\u00edvel WCAG \u2022 Gr\u00e1tis',
    searchPlaceholder: 'Buscar pa\u00edses...',
    popularThemes: 'Temas Populares',
    browseByRegion: 'Explorar por Regi\u00e3o',
    howItWorks: 'Como Funciona',
    step1Title: 'Escolha um pa\u00eds',
    step1Desc: 'Explore {count}+ temas inspirados em bandeiras de todo o mundo',
    step2Title: 'Escolha um modo',
    step2Desc: 'Escuro, Claro ou AMOLED \u2014 visualize instantaneamente e troque quando quiser',
    step3Title: 'Baixe e instale',
    step3Desc: 'Obtenha um .zip para Chrome/Edge, ou o complemento Firefox',
    regionH1: 'Temas de Navegador {region}',
    regionDesc: '{count} temas de navegador inspirados em bandeiras de {region}.',
    otherRegions: 'Outras Regi\u00f5es',
    catalogH1: 'Todos os Temas de Navegador por Pa\u00eds',
    catalogDesc: 'Explore {count}+ temas de navegador gratuitos inspirados em bandeiras. Chrome, Edge, Firefox e Brave.',
    breadcrumbHome: 'In\u00edcio',
    footerText: '\u00a9 {year} Flag Theme. Temas de navegador gratuitos inspirados em bandeiras.',
    wcagAccessible: 'Acess\u00edvel WCAG',
    free: 'Gr\u00e1tis',
  },

  de: {
    lang: 'de',
    dir: 'ltr',
    countryTitle: '{country} Browser-Theme — Kostenloses Chrome & Firefox Theme | Flag Theme',
    countryDescription: 'Laden Sie kostenlos ein von der Flagge {country}s inspiriertes Browser-Theme f\u00fcr Chrome, Edge, Firefox und Brave herunter. WCAG-konforme Dunkel-, Hell- und AMOLED-Modi.',
    countryH1: '{country} Browser-Theme',
    countryHeroSub: 'Ein Browser-Theme inspiriert von der Flagge {country}s. Kostenlos und WCAG-konform.',
    flagColors: 'Flaggenfarben',
    designTokens: 'Design-Tokens',
    browserCompat: 'Browser-Kompatibilit\u00e4t',
    similarThemes: '\u00c4hnliche Themes',
    modeDark: 'Dunkel',
    modeLight: 'Hell',
    modeAmoled: 'AMOLED',
    modeQuestion: 'Was sind die verschiedenen Modi?',
    modeAnswer: '<strong>Dunkel</strong> \u2014 ausgewogenes dunkles Theme. <strong>Hell</strong> \u2014 hell, augenfreundlich. <strong>AMOLED</strong> \u2014 reines Schwarz, spart Akku bei OLED-Bildschirmen.',
    downloadChrome: 'F\u00fcr Chrome herunterladen',
    getFirefox: 'F\u00fcr Firefox holen',
    copyCss: 'CSS-Variablen kopieren',
    copied: 'Kopiert!',
    faqTitle: 'H\u00e4ufig gestellte Fragen',
    faqChromeQ: 'Wie installiere ich ein Chrome-Theme?',
    faqChromeA: 'Laden Sie die .zip-Datei herunter. Am einfachsten ziehen Sie sie direkt auf <code>chrome://extensions</code> &mdash; Chrome installiert das Theme automatisch. Alternativ entpacken Sie die Datei, aktivieren den &ldquo;Entwicklermodus&rdquo; (Schalter oben rechts) und klicken auf &ldquo;Entpackte Erweiterung laden&rdquo;.',
    faqEdgeQ: 'Funktioniert es mit Microsoft Edge?',
    faqEdgeA: 'Ja! Edge unterst\u00fctzt Chrome-Themes nativ. Ziehen Sie die .zip-Datei auf <code>edge://extensions</code> f\u00fcr sofortige Installation. Alternativ entpacken, &ldquo;Entwicklermodus&rdquo; aktivieren (Schalter unten links) und &ldquo;Entpackte Erweiterung laden&rdquo; klicken.',
    faqFirefoxQ: 'Und Firefox?',
    faqFirefoxA: 'Firefox verwendet ein anderes Theme-Format. Wir arbeiten an einem Firefox-Add-on \u2014 bleiben Sie dran!',
    home: 'Startseite',
    countries: 'L\u00e4nder',
    allCountries: 'Alle L\u00e4nder',
    viewAll: 'Alle anzeigen',
    homeH1: 'Browser-Themes inspiriert von L\u00e4nderflaggen',
    homeSub: '{count}+ L\u00e4nder \u2022 Dunkel-, Hell- & AMOLED-Modi \u2022 WCAG-konform \u2022 Kostenlos',
    searchPlaceholder: 'L\u00e4nder suchen...',
    popularThemes: 'Beliebte Themes',
    browseByRegion: 'Nach Region durchsuchen',
    howItWorks: 'So funktioniert es',
    step1Title: 'Land w\u00e4hlen',
    step1Desc: 'Durchst\u00f6bern Sie {count}+ Themes inspiriert von Flaggen aus aller Welt',
    step2Title: 'Modus w\u00e4hlen',
    step2Desc: 'Dunkel, Hell oder AMOLED \u2014 sofortige Vorschau und jederzeit wechseln',
    step3Title: 'Herunterladen & installieren',
    step3Desc: 'Holen Sie sich eine .zip f\u00fcr Chrome/Edge oder das Firefox-Add-on',
    regionH1: '{region} Browser-Themes',
    regionDesc: '{count} von Flaggen inspirierte Browser-Themes aus {region}.',
    otherRegions: 'Andere Regionen',
    catalogH1: 'Alle Browser-Themes nach Land',
    catalogDesc: 'Durchst\u00f6bern Sie {count}+ kostenlose Browser-Themes inspiriert von L\u00e4nderflaggen. Chrome, Edge, Firefox und Brave.',
    breadcrumbHome: 'Startseite',
    footerText: '\u00a9 {year} Flag Theme. Kostenlose Browser-Themes inspiriert von L\u00e4nderflaggen.',
    wcagAccessible: 'WCAG-konform',
    free: 'Kostenlos',
  },
};

/** Get strings for a locale, falling back to English. */
export function getStrings(lang: string): SiteStrings {
  return strings[lang] || strings.en;
}
