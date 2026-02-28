import type { FlagPalette } from '../types/theme';

/** Wave 1: 20 most populated countries. Static data — no network requests. */
export const PALETTES: FlagPalette[] = [
  {
    countryCode: 'IN',
    name_en: 'India',
    name_ru: 'Индия',
    flagColors: ['#FF9933', '#FFFFFF', '#138808', '#000080'],
    recommendedLocales: ['en-IN', 'hi'],
    region: 'Asia',
    tags: ['tricolor'],
  },
  {
    countryCode: 'CN',
    name_en: 'China',
    name_ru: 'Китай',
    flagColors: ['#DE2910', '#FFDE00'],
    recommendedLocales: ['zh', 'zh-CN'],
    region: 'Asia',
  },
  {
    countryCode: 'US',
    name_en: 'United States',
    name_ru: 'США',
    flagColors: ['#B31942', '#FFFFFF', '#0A3161'],
    recommendedLocales: ['en-US', 'en'],
    region: 'Americas',
  },
  {
    countryCode: 'ID',
    name_en: 'Indonesia',
    name_ru: 'Индонезия',
    flagColors: ['#FF0000', '#FFFFFF'],
    recommendedLocales: ['id'],
    region: 'Asia',
  },
  {
    countryCode: 'PK',
    name_en: 'Pakistan',
    name_ru: 'Пакистан',
    flagColors: ['#01411C', '#FFFFFF'],
    recommendedLocales: ['ur'],
    region: 'Asia',
  },
  {
    countryCode: 'NG',
    name_en: 'Nigeria',
    name_ru: 'Нигерия',
    flagColors: ['#008751', '#FFFFFF'],
    recommendedLocales: ['en-NG'],
    region: 'Africa',
  },
  {
    countryCode: 'BR',
    name_en: 'Brazil',
    name_ru: 'Бразилия',
    flagColors: ['#009C3B', '#FFDF00', '#002776', '#FFFFFF'],
    recommendedLocales: ['pt-BR', 'pt'],
    region: 'Americas',
  },
  {
    countryCode: 'BD',
    name_en: 'Bangladesh',
    name_ru: 'Бангладеш',
    flagColors: ['#006A4E', '#F42A41'],
    recommendedLocales: ['bn'],
    region: 'Asia',
  },
  {
    countryCode: 'RU',
    name_en: 'Russia',
    name_ru: 'Россия',
    flagColors: ['#FFFFFF', '#0039A6', '#D52B1E'],
    recommendedLocales: ['ru'],
    region: 'Europe',
    tags: ['tricolor'],
  },
  {
    countryCode: 'ET',
    name_en: 'Ethiopia',
    name_ru: 'Эфиопия',
    flagColors: ['#009A49', '#FCDD09', '#0F47AF', '#EF2118'],
    recommendedLocales: ['am'],
    region: 'Africa',
  },
  {
    countryCode: 'MX',
    name_en: 'Mexico',
    name_ru: 'Мексика',
    flagColors: ['#006341', '#FFFFFF', '#CE1126'],
    recommendedLocales: ['es-MX', 'es-419'],
    region: 'Americas',
    tags: ['tricolor'],
  },
  {
    countryCode: 'JP',
    name_en: 'Japan',
    name_ru: 'Япония',
    flagColors: ['#FFFFFF', '#BC002D'],
    recommendedLocales: ['ja'],
    region: 'Asia',
  },
  {
    countryCode: 'EG',
    name_en: 'Egypt',
    name_ru: 'Египет',
    flagColors: ['#CE1126', '#FFFFFF', '#000000'],
    recommendedLocales: ['ar-EG', 'ar'],
    region: 'Africa',
  },
  {
    countryCode: 'PH',
    name_en: 'Philippines',
    name_ru: 'Филиппины',
    flagColors: ['#0038A8', '#CE1126', '#FFFFFF', '#FCD116'],
    recommendedLocales: ['fil', 'tl'],
    region: 'Asia',
  },
  {
    countryCode: 'CD',
    name_en: 'DR Congo',
    name_ru: 'ДР Конго',
    flagColors: ['#007FFF', '#F7D618', '#CE1021'],
    recommendedLocales: ['fr-CD', 'fr'],
    region: 'Africa',
  },
  {
    countryCode: 'VN',
    name_en: 'Vietnam',
    name_ru: 'Вьетнам',
    flagColors: ['#DA251D', '#FFFF00'],
    recommendedLocales: ['vi'],
    region: 'Asia',
  },
  {
    countryCode: 'IR',
    name_en: 'Iran',
    name_ru: 'Иран',
    flagColors: ['#239F40', '#FFFFFF', '#DA0000'],
    recommendedLocales: ['fa'],
    region: 'Asia',
    tags: ['tricolor'],
  },
  {
    countryCode: 'TR',
    name_en: 'Turkey',
    name_ru: 'Турция',
    flagColors: ['#E30A17', '#FFFFFF'],
    recommendedLocales: ['tr'],
    region: 'Europe',
  },
  {
    countryCode: 'DE',
    name_en: 'Germany',
    name_ru: 'Германия',
    flagColors: ['#000000', '#DD0000', '#FFCC00'],
    recommendedLocales: ['de'],
    region: 'Europe',
    tags: ['tricolor'],
  },
  {
    countryCode: 'TH',
    name_en: 'Thailand',
    name_ru: 'Таиланд',
    flagColors: ['#ED1C24', '#FFFFFF', '#241D4F'],
    recommendedLocales: ['th'],
    region: 'Asia',
    tags: ['tricolor'],
  },
];

/** Lookup a palette by ISO country code. */
export function getPaletteByCode(code: string): FlagPalette | undefined {
  return PALETTES.find((p) => p.countryCode === code);
}

/** Find palettes matching a BCP 47 locale tag (prefix match). */
export function getPalettesByLocale(locale: string): FlagPalette[] {
  const lower = locale.toLowerCase();
  return PALETTES.filter((p) => p.recommendedLocales.some((l) => lower.startsWith(l.toLowerCase())));
}
