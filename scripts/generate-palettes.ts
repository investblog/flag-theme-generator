/**
 * Generate palettes-generated.ts with ~196 countries + Antarctica.
 *
 * Usage: npx tsx scripts/generate-palettes.ts
 *
 * Data sources: flag hex colors from vexillology references.
 * The color pipeline (generateTokens, evaluateCompatibility) handles
 * WCAG contrast adjustment automatically — we only provide raw flag data.
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface RawPalette {
  countryCode: string;
  name_en: string;
  name_ru: string;
  flagColors: string[];
  recommendedLocales: string[];
  region: 'Africa' | 'Americas' | 'Antarctica' | 'Asia' | 'Europe' | 'Oceania';
  tags?: string[];
}

const RAW: RawPalette[] = [
  // ── Wave 1 (20 countries — colors preserved exactly) ──────────────
  { countryCode: 'IN', name_en: 'India', name_ru: 'Индия', flagColors: ['#FF9933', '#FFFFFF', '#138808', '#000080'], recommendedLocales: ['en-IN', 'hi'], region: 'Asia', tags: ['tricolor'] },
  { countryCode: 'CN', name_en: 'China', name_ru: 'Китай', flagColors: ['#DE2910', '#FFDE00'], recommendedLocales: ['zh', 'zh-CN'], region: 'Asia' },
  { countryCode: 'US', name_en: 'United States', name_ru: 'США', flagColors: ['#B31942', '#FFFFFF', '#0A3161'], recommendedLocales: ['en-US', 'en'], region: 'Americas' },
  { countryCode: 'ID', name_en: 'Indonesia', name_ru: 'Индонезия', flagColors: ['#FF0000', '#FFFFFF'], recommendedLocales: ['id'], region: 'Asia' },
  { countryCode: 'PK', name_en: 'Pakistan', name_ru: 'Пакистан', flagColors: ['#01411C', '#FFFFFF'], recommendedLocales: ['ur'], region: 'Asia' },
  { countryCode: 'NG', name_en: 'Nigeria', name_ru: 'Нигерия', flagColors: ['#008751', '#FFFFFF'], recommendedLocales: ['en-NG'], region: 'Africa' },
  { countryCode: 'BR', name_en: 'Brazil', name_ru: 'Бразилия', flagColors: ['#009C3B', '#FFDF00', '#002776', '#FFFFFF'], recommendedLocales: ['pt-BR', 'pt'], region: 'Americas' },
  { countryCode: 'BD', name_en: 'Bangladesh', name_ru: 'Бангладеш', flagColors: ['#006A4E', '#F42A41'], recommendedLocales: ['bn'], region: 'Asia' },
  { countryCode: 'RU', name_en: 'Russia', name_ru: 'Россия', flagColors: ['#FFFFFF', '#0039A6', '#D52B1E'], recommendedLocales: ['ru'], region: 'Europe', tags: ['tricolor'] },
  { countryCode: 'ET', name_en: 'Ethiopia', name_ru: 'Эфиопия', flagColors: ['#009A49', '#FCDD09', '#0F47AF', '#EF2118'], recommendedLocales: ['am'], region: 'Africa' },
  { countryCode: 'MX', name_en: 'Mexico', name_ru: 'Мексика', flagColors: ['#006341', '#FFFFFF', '#CE1126'], recommendedLocales: ['es-MX', 'es-419'], region: 'Americas', tags: ['tricolor'] },
  { countryCode: 'JP', name_en: 'Japan', name_ru: 'Япония', flagColors: ['#FFFFFF', '#BC002D'], recommendedLocales: ['ja'], region: 'Asia' },
  { countryCode: 'EG', name_en: 'Egypt', name_ru: 'Египет', flagColors: ['#CE1126', '#FFFFFF', '#000000'], recommendedLocales: ['ar-EG', 'ar'], region: 'Africa' },
  { countryCode: 'PH', name_en: 'Philippines', name_ru: 'Филиппины', flagColors: ['#0038A8', '#CE1126', '#FFFFFF', '#FCD116'], recommendedLocales: ['fil', 'tl'], region: 'Asia' },
  { countryCode: 'CD', name_en: 'DR Congo', name_ru: 'ДР Конго', flagColors: ['#007FFF', '#F7D618', '#CE1021'], recommendedLocales: ['fr-CD', 'fr'], region: 'Africa' },
  { countryCode: 'VN', name_en: 'Vietnam', name_ru: 'Вьетнам', flagColors: ['#DA251D', '#FFFF00'], recommendedLocales: ['vi'], region: 'Asia' },
  { countryCode: 'IR', name_en: 'Iran', name_ru: 'Иран', flagColors: ['#239F40', '#FFFFFF', '#DA0000'], recommendedLocales: ['fa'], region: 'Asia', tags: ['tricolor'] },
  { countryCode: 'TR', name_en: 'Turkey', name_ru: 'Турция', flagColors: ['#E30A17', '#FFFFFF'], recommendedLocales: ['tr'], region: 'Europe' },
  { countryCode: 'DE', name_en: 'Germany', name_ru: 'Германия', flagColors: ['#000000', '#DD0000', '#FFCC00'], recommendedLocales: ['de'], region: 'Europe', tags: ['tricolor'] },
  { countryCode: 'TH', name_en: 'Thailand', name_ru: 'Таиланд', flagColors: ['#ED1C24', '#FFFFFF', '#241D4F'], recommendedLocales: ['th'], region: 'Asia', tags: ['tricolor'] },

  // ── Africa ─────────────────────────────────────────────────────────
  { countryCode: 'DZ', name_en: 'Algeria', name_ru: 'Алжир', flagColors: ['#006233', '#FFFFFF', '#D21034'], recommendedLocales: ['ar-DZ'], region: 'Africa' },
  { countryCode: 'AO', name_en: 'Angola', name_ru: 'Ангола', flagColors: ['#CC0000', '#000000', '#FFCC00'], recommendedLocales: ['pt-AO'], region: 'Africa' },
  { countryCode: 'BJ', name_en: 'Benin', name_ru: 'Бенин', flagColors: ['#008751', '#FCD116', '#E8112D'], recommendedLocales: ['fr-BJ'], region: 'Africa' },
  { countryCode: 'BW', name_en: 'Botswana', name_ru: 'Ботсвана', flagColors: ['#75AADB', '#FFFFFF', '#000000'], recommendedLocales: ['en-BW'], region: 'Africa' },
  { countryCode: 'BF', name_en: 'Burkina Faso', name_ru: 'Буркина-Фасо', flagColors: ['#EF2B2D', '#009E49', '#FCD116'], recommendedLocales: ['fr-BF'], region: 'Africa' },
  { countryCode: 'BI', name_en: 'Burundi', name_ru: 'Бурунди', flagColors: ['#CE1126', '#FFFFFF', '#1EB53A'], recommendedLocales: ['fr-BI'], region: 'Africa' },
  { countryCode: 'CV', name_en: 'Cape Verde', name_ru: 'Кабо-Верде', flagColors: ['#003893', '#CF2027', '#F7D116', '#FFFFFF'], recommendedLocales: ['pt-CV'], region: 'Africa' },
  { countryCode: 'CM', name_en: 'Cameroon', name_ru: 'Камерун', flagColors: ['#007A5E', '#CE1126', '#FCD116'], recommendedLocales: ['fr-CM', 'en-CM'], region: 'Africa' },
  { countryCode: 'CF', name_en: 'Central African Republic', name_ru: 'ЦАР', flagColors: ['#003082', '#FFFFFF', '#289728', '#FFCB00', '#CE1126'], recommendedLocales: ['fr-CF'], region: 'Africa' },
  { countryCode: 'TD', name_en: 'Chad', name_ru: 'Чад', flagColors: ['#002664', '#FECB00', '#C60C30'], recommendedLocales: ['fr-TD', 'ar-TD'], region: 'Africa' },
  { countryCode: 'KM', name_en: 'Comoros', name_ru: 'Коморы', flagColors: ['#3A7728', '#FFC72C', '#003DA5', '#CE1126', '#FFFFFF'], recommendedLocales: ['ar-KM', 'fr-KM'], region: 'Africa' },
  { countryCode: 'CG', name_en: 'Congo', name_ru: 'Конго', flagColors: ['#009543', '#FBDE4A', '#DC241F'], recommendedLocales: ['fr-CG'], region: 'Africa' },
  { countryCode: 'CI', name_en: "Côte d'Ivoire", name_ru: "Кот-д\u2019Ивуар", flagColors: ['#F77F00', '#FFFFFF', '#009E60'], recommendedLocales: ['fr-CI'], region: 'Africa' },
  { countryCode: 'DJ', name_en: 'Djibouti', name_ru: 'Джибути', flagColors: ['#6AB2E7', '#12AD2B', '#FFFFFF', '#D7141A'], recommendedLocales: ['fr-DJ', 'ar-DJ'], region: 'Africa' },
  { countryCode: 'GQ', name_en: 'Equatorial Guinea', name_ru: 'Экваториальная Гвинея', flagColors: ['#3E9A00', '#FFFFFF', '#E32118', '#0073CE'], recommendedLocales: ['es-GQ', 'fr-GQ'], region: 'Africa' },
  { countryCode: 'ER', name_en: 'Eritrea', name_ru: 'Эритрея', flagColors: ['#4189DD', '#12AD2B', '#EA0437', '#FFC726'], recommendedLocales: ['ti'], region: 'Africa' },
  { countryCode: 'SZ', name_en: 'Eswatini', name_ru: 'Эсватини', flagColors: ['#3E5EB9', '#FFD900', '#B10C0C', '#FFFFFF', '#000000'], recommendedLocales: ['en-SZ', 'ss'], region: 'Africa' },
  { countryCode: 'GA', name_en: 'Gabon', name_ru: 'Габон', flagColors: ['#009E49', '#FCD116', '#3A75C4'], recommendedLocales: ['fr-GA'], region: 'Africa' },
  { countryCode: 'GM', name_en: 'Gambia', name_ru: 'Гамбия', flagColors: ['#CE1126', '#0C1C8C', '#3A7728', '#FFFFFF'], recommendedLocales: ['en-GM'], region: 'Africa' },
  { countryCode: 'GH', name_en: 'Ghana', name_ru: 'Гана', flagColors: ['#CE1126', '#FCD116', '#006B3F', '#000000'], recommendedLocales: ['en-GH'], region: 'Africa' },
  { countryCode: 'GN', name_en: 'Guinea', name_ru: 'Гвинея', flagColors: ['#CE1126', '#FCD116', '#009460'], recommendedLocales: ['fr-GN'], region: 'Africa' },
  { countryCode: 'GW', name_en: 'Guinea-Bissau', name_ru: 'Гвинея-Бисау', flagColors: ['#CE1126', '#FCD116', '#009739', '#000000'], recommendedLocales: ['pt-GW'], region: 'Africa' },
  { countryCode: 'KE', name_en: 'Kenya', name_ru: 'Кения', flagColors: ['#000000', '#BB0000', '#006600', '#FFFFFF'], recommendedLocales: ['sw', 'en-KE'], region: 'Africa' },
  { countryCode: 'LS', name_en: 'Lesotho', name_ru: 'Лесото', flagColors: ['#00209F', '#FFFFFF', '#009543', '#000000'], recommendedLocales: ['en-LS', 'st'], region: 'Africa' },
  { countryCode: 'LR', name_en: 'Liberia', name_ru: 'Либерия', flagColors: ['#BF0A30', '#FFFFFF', '#002868'], recommendedLocales: ['en-LR'], region: 'Africa' },
  { countryCode: 'LY', name_en: 'Libya', name_ru: 'Ливия', flagColors: ['#E70013', '#000000', '#FFFFFF', '#239E46'], recommendedLocales: ['ar-LY'], region: 'Africa' },
  { countryCode: 'MG', name_en: 'Madagascar', name_ru: 'Мадагаскар', flagColors: ['#FFFFFF', '#FC3D32', '#007E3A'], recommendedLocales: ['mg', 'fr-MG'], region: 'Africa' },
  { countryCode: 'MW', name_en: 'Malawi', name_ru: 'Малави', flagColors: ['#000000', '#CE1126', '#339E35'], recommendedLocales: ['en-MW'], region: 'Africa' },
  { countryCode: 'ML', name_en: 'Mali', name_ru: 'Мали', flagColors: ['#14B53A', '#FCD116', '#CE1126'], recommendedLocales: ['fr-ML'], region: 'Africa' },
  { countryCode: 'MR', name_en: 'Mauritania', name_ru: 'Мавритания', flagColors: ['#006233', '#FFC400', '#CE1126'], recommendedLocales: ['ar-MR'], region: 'Africa' },
  { countryCode: 'MU', name_en: 'Mauritius', name_ru: 'Маврикий', flagColors: ['#CE1126', '#00319C', '#FFD500', '#00A651'], recommendedLocales: ['en-MU', 'fr-MU'], region: 'Africa' },
  { countryCode: 'MA', name_en: 'Morocco', name_ru: 'Марокко', flagColors: ['#C1272D', '#006233'], recommendedLocales: ['ar-MA', 'fr-MA'], region: 'Africa' },
  { countryCode: 'MZ', name_en: 'Mozambique', name_ru: 'Мозамбик', flagColors: ['#009A44', '#FFFFFF', '#000000', '#FCE100', '#D21034'], recommendedLocales: ['pt-MZ'], region: 'Africa' },
  { countryCode: 'NA', name_en: 'Namibia', name_ru: 'Намибия', flagColors: ['#003580', '#009543', '#FFFFFF', '#D21034', '#FFD900'], recommendedLocales: ['en-NA'], region: 'Africa' },
  { countryCode: 'NE', name_en: 'Niger', name_ru: 'Нигер', flagColors: ['#E05206', '#FFFFFF', '#0DB02B'], recommendedLocales: ['fr-NE'], region: 'Africa' },
  { countryCode: 'RW', name_en: 'Rwanda', name_ru: 'Руанда', flagColors: ['#00A1DE', '#FAD201', '#20603D'], recommendedLocales: ['rw', 'fr-RW', 'en-RW'], region: 'Africa' },
  { countryCode: 'ST', name_en: 'São Tomé and Príncipe', name_ru: 'Сан-Томе и Принсипи', flagColors: ['#12AD2B', '#FFCE00', '#D21034', '#000000'], recommendedLocales: ['pt-ST'], region: 'Africa' },
  { countryCode: 'SN', name_en: 'Senegal', name_ru: 'Сенегал', flagColors: ['#00853F', '#FDEF42', '#E31B23'], recommendedLocales: ['fr-SN'], region: 'Africa' },
  { countryCode: 'SC', name_en: 'Seychelles', name_ru: 'Сейшелы', flagColors: ['#003F87', '#FCD856', '#D62828', '#FFFFFF', '#007A3D'], recommendedLocales: ['fr-SC', 'en-SC'], region: 'Africa' },
  { countryCode: 'SL', name_en: 'Sierra Leone', name_ru: 'Сьерра-Леоне', flagColors: ['#1EB53A', '#FFFFFF', '#0072C6'], recommendedLocales: ['en-SL'], region: 'Africa' },
  { countryCode: 'SO', name_en: 'Somalia', name_ru: 'Сомали', flagColors: ['#4189DD', '#FFFFFF'], recommendedLocales: ['so'], region: 'Africa' },
  { countryCode: 'ZA', name_en: 'South Africa', name_ru: 'ЮАР', flagColors: ['#007A4D', '#FFB612', '#000000', '#DE3831', '#002395', '#FFFFFF'], recommendedLocales: ['en-ZA', 'af', 'zu'], region: 'Africa' },
  { countryCode: 'SS', name_en: 'South Sudan', name_ru: 'Южный Судан', flagColors: ['#000000', '#CE1126', '#078930', '#FFFFFF', '#0F47AF', '#FCDD09'], recommendedLocales: ['en-SS'], region: 'Africa' },
  { countryCode: 'SD', name_en: 'Sudan', name_ru: 'Судан', flagColors: ['#CE1126', '#FFFFFF', '#000000', '#007229'], recommendedLocales: ['ar-SD'], region: 'Africa' },
  { countryCode: 'TZ', name_en: 'Tanzania', name_ru: 'Танзания', flagColors: ['#1EB53A', '#FCD116', '#00A3DD', '#000000'], recommendedLocales: ['sw-TZ', 'en-TZ'], region: 'Africa' },
  { countryCode: 'TG', name_en: 'Togo', name_ru: 'Того', flagColors: ['#006A4E', '#FFC72C', '#D21034', '#FFFFFF'], recommendedLocales: ['fr-TG'], region: 'Africa' },
  { countryCode: 'TN', name_en: 'Tunisia', name_ru: 'Тунис', flagColors: ['#E70013', '#FFFFFF'], recommendedLocales: ['ar-TN', 'fr-TN'], region: 'Africa' },
  { countryCode: 'UG', name_en: 'Uganda', name_ru: 'Уганда', flagColors: ['#000000', '#FCDC04', '#D90000', '#FFFFFF'], recommendedLocales: ['en-UG', 'sw-UG'], region: 'Africa' },
  { countryCode: 'ZM', name_en: 'Zambia', name_ru: 'Замбия', flagColors: ['#198A00', '#DE2010', '#000000', '#EF7D00'], recommendedLocales: ['en-ZM'], region: 'Africa' },
  { countryCode: 'ZW', name_en: 'Zimbabwe', name_ru: 'Зимбабве', flagColors: ['#006400', '#FFD200', '#D40000', '#000000', '#FFFFFF'], recommendedLocales: ['en-ZW', 'sn'], region: 'Africa' },

  // ── Americas ───────────────────────────────────────────────────────
  { countryCode: 'AG', name_en: 'Antigua and Barbuda', name_ru: 'Антигуа и Барбуда', flagColors: ['#CE1126', '#000000', '#0072C6', '#FCD116', '#FFFFFF'], recommendedLocales: ['en-AG'], region: 'Americas' },
  { countryCode: 'AR', name_en: 'Argentina', name_ru: 'Аргентина', flagColors: ['#74ACDF', '#FFFFFF', '#F6B40E'], recommendedLocales: ['es-AR'], region: 'Americas' },
  { countryCode: 'BS', name_en: 'Bahamas', name_ru: 'Багамы', flagColors: ['#00778B', '#FFD100', '#000000'], recommendedLocales: ['en-BS'], region: 'Americas' },
  { countryCode: 'BB', name_en: 'Barbados', name_ru: 'Барбадос', flagColors: ['#00267F', '#FFC726', '#000000'], recommendedLocales: ['en-BB'], region: 'Americas' },
  { countryCode: 'BZ', name_en: 'Belize', name_ru: 'Белиз', flagColors: ['#003DA5', '#CE1126', '#FFFFFF'], recommendedLocales: ['en-BZ'], region: 'Americas' },
  { countryCode: 'BO', name_en: 'Bolivia', name_ru: 'Боливия', flagColors: ['#D52B1E', '#F9E300', '#007934'], recommendedLocales: ['es-BO'], region: 'Americas' },
  { countryCode: 'CA', name_en: 'Canada', name_ru: 'Канада', flagColors: ['#FF0000', '#FFFFFF'], recommendedLocales: ['en-CA', 'fr-CA'], region: 'Americas' },
  { countryCode: 'CL', name_en: 'Chile', name_ru: 'Чили', flagColors: ['#D52B1E', '#FFFFFF', '#0039A6'], recommendedLocales: ['es-CL'], region: 'Americas' },
  { countryCode: 'CO', name_en: 'Colombia', name_ru: 'Колумбия', flagColors: ['#FCD116', '#003893', '#CE1126'], recommendedLocales: ['es-CO'], region: 'Americas' },
  { countryCode: 'CR', name_en: 'Costa Rica', name_ru: 'Коста-Рика', flagColors: ['#002B7F', '#FFFFFF', '#CE1126'], recommendedLocales: ['es-CR'], region: 'Americas' },
  { countryCode: 'CU', name_en: 'Cuba', name_ru: 'Куба', flagColors: ['#002A8F', '#FFFFFF', '#CB1515'], recommendedLocales: ['es-CU'], region: 'Americas' },
  { countryCode: 'DM', name_en: 'Dominica', name_ru: 'Доминика', flagColors: ['#006B3F', '#FCD116', '#000000', '#FFFFFF', '#D41C30', '#6F2DA8'], recommendedLocales: ['en-DM'], region: 'Americas' },
  { countryCode: 'DO', name_en: 'Dominican Republic', name_ru: 'Доминиканская Республика', flagColors: ['#002D62', '#CE1126', '#FFFFFF'], recommendedLocales: ['es-DO'], region: 'Americas' },
  { countryCode: 'EC', name_en: 'Ecuador', name_ru: 'Эквадор', flagColors: ['#FFD100', '#003DA5', '#CE1126'], recommendedLocales: ['es-EC'], region: 'Americas' },
  { countryCode: 'SV', name_en: 'El Salvador', name_ru: 'Сальвадор', flagColors: ['#0F47AF', '#FFFFFF', '#FFC726'], recommendedLocales: ['es-SV'], region: 'Americas' },
  { countryCode: 'GD', name_en: 'Grenada', name_ru: 'Гренада', flagColors: ['#CE1126', '#FCD116', '#007A5E'], recommendedLocales: ['en-GD'], region: 'Americas' },
  { countryCode: 'GT', name_en: 'Guatemala', name_ru: 'Гватемала', flagColors: ['#4997D0', '#FFFFFF'], recommendedLocales: ['es-GT'], region: 'Americas' },
  { countryCode: 'GY', name_en: 'Guyana', name_ru: 'Гайана', flagColors: ['#009E49', '#FFFFFF', '#FCD116', '#000000', '#CE1126'], recommendedLocales: ['en-GY'], region: 'Americas' },
  { countryCode: 'HT', name_en: 'Haiti', name_ru: 'Гаити', flagColors: ['#00209F', '#D21034'], recommendedLocales: ['fr-HT', 'ht'], region: 'Americas' },
  { countryCode: 'HN', name_en: 'Honduras', name_ru: 'Гондурас', flagColors: ['#0073CF', '#FFFFFF'], recommendedLocales: ['es-HN'], region: 'Americas' },
  { countryCode: 'JM', name_en: 'Jamaica', name_ru: 'Ямайка', flagColors: ['#009B3A', '#000000', '#FED100'], recommendedLocales: ['en-JM'], region: 'Americas' },
  { countryCode: 'KN', name_en: 'Saint Kitts and Nevis', name_ru: 'Сент-Китс и Невис', flagColors: ['#009E49', '#CE1126', '#000000', '#FCD116', '#FFFFFF'], recommendedLocales: ['en-KN'], region: 'Americas' },
  { countryCode: 'LC', name_en: 'Saint Lucia', name_ru: 'Сент-Люсия', flagColors: ['#65CFFF', '#FCD116', '#000000', '#FFFFFF'], recommendedLocales: ['en-LC'], region: 'Americas' },
  { countryCode: 'VC', name_en: 'Saint Vincent and the Grenadines', name_ru: 'Сент-Винсент и Гренадины', flagColors: ['#0072C6', '#FCD116', '#009E60'], recommendedLocales: ['en-VC'], region: 'Americas' },
  { countryCode: 'NI', name_en: 'Nicaragua', name_ru: 'Никарагуа', flagColors: ['#0067C6', '#FFFFFF'], recommendedLocales: ['es-NI'], region: 'Americas' },
  { countryCode: 'PA', name_en: 'Panama', name_ru: 'Панама', flagColors: ['#FFFFFF', '#DA121A', '#003DA5'], recommendedLocales: ['es-PA'], region: 'Americas' },
  { countryCode: 'PY', name_en: 'Paraguay', name_ru: 'Парагвай', flagColors: ['#D52B1E', '#FFFFFF', '#0038A8'], recommendedLocales: ['es-PY', 'gn'], region: 'Americas' },
  { countryCode: 'PE', name_en: 'Peru', name_ru: 'Перу', flagColors: ['#D91023', '#FFFFFF'], recommendedLocales: ['es-PE'], region: 'Americas' },
  { countryCode: 'SR', name_en: 'Suriname', name_ru: 'Суринам', flagColors: ['#377E3F', '#FFFFFF', '#B40A2D', '#ECC81D'], recommendedLocales: ['nl-SR'], region: 'Americas' },
  { countryCode: 'TT', name_en: 'Trinidad and Tobago', name_ru: 'Тринидад и Тобаго', flagColors: ['#CE1126', '#FFFFFF', '#000000'], recommendedLocales: ['en-TT'], region: 'Americas' },
  { countryCode: 'UY', name_en: 'Uruguay', name_ru: 'Уругвай', flagColors: ['#FFFFFF', '#0038A8', '#FCD116'], recommendedLocales: ['es-UY'], region: 'Americas' },
  { countryCode: 'VE', name_en: 'Venezuela', name_ru: 'Венесуэла', flagColors: ['#FFCC00', '#00247D', '#CF142B'], recommendedLocales: ['es-VE'], region: 'Americas' },

  // ── Asia ────────────────────────────────────────────────────────────
  { countryCode: 'AF', name_en: 'Afghanistan', name_ru: 'Афганистан', flagColors: ['#000000', '#CE1126', '#007A36'], recommendedLocales: ['ps', 'fa-AF'], region: 'Asia' },
  { countryCode: 'AM', name_en: 'Armenia', name_ru: 'Армения', flagColors: ['#D90012', '#0033A0', '#F2A800'], recommendedLocales: ['hy'], region: 'Asia' },
  { countryCode: 'AZ', name_en: 'Azerbaijan', name_ru: 'Азербайджан', flagColors: ['#00B5E2', '#CE1126', '#3F9C35'], recommendedLocales: ['az'], region: 'Asia' },
  { countryCode: 'BH', name_en: 'Bahrain', name_ru: 'Бахрейн', flagColors: ['#CE1126', '#FFFFFF'], recommendedLocales: ['ar-BH'], region: 'Asia' },
  { countryCode: 'BT', name_en: 'Bhutan', name_ru: 'Бутан', flagColors: ['#FF4E12', '#FFD520', '#FFFFFF'], recommendedLocales: ['dz'], region: 'Asia' },
  { countryCode: 'BN', name_en: 'Brunei', name_ru: 'Бруней', flagColors: ['#F7E017', '#FFFFFF', '#000000', '#CE1126'], recommendedLocales: ['ms-BN'], region: 'Asia' },
  { countryCode: 'KH', name_en: 'Cambodia', name_ru: 'Камбоджа', flagColors: ['#032EA1', '#E00025', '#FFFFFF'], recommendedLocales: ['km'], region: 'Asia' },
  { countryCode: 'GE', name_en: 'Georgia', name_ru: 'Грузия', flagColors: ['#FFFFFF', '#FF0000'], recommendedLocales: ['ka'], region: 'Asia' },
  { countryCode: 'IQ', name_en: 'Iraq', name_ru: 'Ирак', flagColors: ['#CE1126', '#FFFFFF', '#000000', '#007A3D'], recommendedLocales: ['ar-IQ', 'ku'], region: 'Asia' },
  { countryCode: 'IL', name_en: 'Israel', name_ru: 'Израиль', flagColors: ['#FFFFFF', '#0038B8'], recommendedLocales: ['he'], region: 'Asia' },
  { countryCode: 'JO', name_en: 'Jordan', name_ru: 'Иордания', flagColors: ['#000000', '#FFFFFF', '#007A3D', '#CE1126'], recommendedLocales: ['ar-JO'], region: 'Asia' },
  { countryCode: 'KZ', name_en: 'Kazakhstan', name_ru: 'Казахстан', flagColors: ['#00AFCA', '#FEC50C'], recommendedLocales: ['kk', 'ru-KZ'], region: 'Asia' },
  { countryCode: 'KW', name_en: 'Kuwait', name_ru: 'Кувейт', flagColors: ['#007A3D', '#FFFFFF', '#CE1126', '#000000'], recommendedLocales: ['ar-KW'], region: 'Asia' },
  { countryCode: 'KG', name_en: 'Kyrgyzstan', name_ru: 'Киргизия', flagColors: ['#E8112D', '#FFEF00'], recommendedLocales: ['ky', 'ru-KG'], region: 'Asia' },
  { countryCode: 'LA', name_en: 'Laos', name_ru: 'Лаос', flagColors: ['#CE1126', '#002868', '#FFFFFF'], recommendedLocales: ['lo'], region: 'Asia' },
  { countryCode: 'LB', name_en: 'Lebanon', name_ru: 'Ливан', flagColors: ['#ED1C24', '#FFFFFF', '#00A651'], recommendedLocales: ['ar-LB'], region: 'Asia' },
  { countryCode: 'MY', name_en: 'Malaysia', name_ru: 'Малайзия', flagColors: ['#CC0001', '#FFFFFF', '#010066', '#FFCC00'], recommendedLocales: ['ms'], region: 'Asia' },
  { countryCode: 'MV', name_en: 'Maldives', name_ru: 'Мальдивы', flagColors: ['#D21034', '#007E3A', '#FFFFFF'], recommendedLocales: ['dv'], region: 'Asia' },
  { countryCode: 'MN', name_en: 'Mongolia', name_ru: 'Монголия', flagColors: ['#C4272F', '#015197', '#F9CF02'], recommendedLocales: ['mn'], region: 'Asia' },
  { countryCode: 'MM', name_en: 'Myanmar', name_ru: 'Мьянма', flagColors: ['#FECB00', '#34B233', '#EA2839', '#FFFFFF'], recommendedLocales: ['my'], region: 'Asia' },
  { countryCode: 'NP', name_en: 'Nepal', name_ru: 'Непал', flagColors: ['#DC143C', '#003893', '#FFFFFF'], recommendedLocales: ['ne'], region: 'Asia' },
  { countryCode: 'KP', name_en: 'North Korea', name_ru: 'КНДР', flagColors: ['#024FA2', '#FFFFFF', '#ED1C27'], recommendedLocales: ['ko-KP'], region: 'Asia' },
  { countryCode: 'OM', name_en: 'Oman', name_ru: 'Оман', flagColors: ['#CE1126', '#FFFFFF', '#008000'], recommendedLocales: ['ar-OM'], region: 'Asia' },
  { countryCode: 'PS', name_en: 'Palestine', name_ru: 'Палестина', flagColors: ['#000000', '#FFFFFF', '#007A3D', '#CE1126'], recommendedLocales: ['ar-PS'], region: 'Asia' },
  { countryCode: 'QA', name_en: 'Qatar', name_ru: 'Катар', flagColors: ['#8A1538', '#FFFFFF'], recommendedLocales: ['ar-QA'], region: 'Asia' },
  { countryCode: 'SA', name_en: 'Saudi Arabia', name_ru: 'Саудовская Аравия', flagColors: ['#006C35', '#FFFFFF'], recommendedLocales: ['ar-SA'], region: 'Asia' },
  { countryCode: 'SG', name_en: 'Singapore', name_ru: 'Сингапур', flagColors: ['#EE2536', '#FFFFFF'], recommendedLocales: ['en-SG', 'zh-SG', 'ms-SG'], region: 'Asia' },
  { countryCode: 'KR', name_en: 'South Korea', name_ru: 'Южная Корея', flagColors: ['#FFFFFF', '#CD2E3A', '#0047A0', '#000000'], recommendedLocales: ['ko'], region: 'Asia' },
  { countryCode: 'LK', name_en: 'Sri Lanka', name_ru: 'Шри-Ланка', flagColors: ['#8D153A', '#FFBE29', '#005641', '#FF6600'], recommendedLocales: ['si', 'ta-LK'], region: 'Asia' },
  { countryCode: 'SY', name_en: 'Syria', name_ru: 'Сирия', flagColors: ['#CE1126', '#FFFFFF', '#000000', '#007A3D'], recommendedLocales: ['ar-SY'], region: 'Asia' },
  { countryCode: 'TW', name_en: 'Taiwan', name_ru: 'Тайвань', flagColors: ['#FE0000', '#000095', '#FFFFFF'], recommendedLocales: ['zh-TW'], region: 'Asia' },
  { countryCode: 'TJ', name_en: 'Tajikistan', name_ru: 'Таджикистан', flagColors: ['#CC0000', '#FFFFFF', '#006600', '#F8C300'], recommendedLocales: ['tg'], region: 'Asia' },
  { countryCode: 'TL', name_en: 'Timor-Leste', name_ru: 'Восточный Тимор', flagColors: ['#DC241F', '#FFC726', '#000000', '#FFFFFF'], recommendedLocales: ['pt-TL', 'tet'], region: 'Asia' },
  { countryCode: 'TM', name_en: 'Turkmenistan', name_ru: 'Туркменистан', flagColors: ['#28AE66', '#FFFFFF', '#CC0033'], recommendedLocales: ['tk'], region: 'Asia' },
  { countryCode: 'AE', name_en: 'United Arab Emirates', name_ru: 'ОАЭ', flagColors: ['#00732F', '#FFFFFF', '#000000', '#FF0000'], recommendedLocales: ['ar-AE'], region: 'Asia' },
  { countryCode: 'UZ', name_en: 'Uzbekistan', name_ru: 'Узбекистан', flagColors: ['#0099B5', '#CE1126', '#1EB53A', '#FFFFFF'], recommendedLocales: ['uz'], region: 'Asia' },
  { countryCode: 'YE', name_en: 'Yemen', name_ru: 'Йемен', flagColors: ['#CE1126', '#FFFFFF', '#000000'], recommendedLocales: ['ar-YE'], region: 'Asia' },

  // ── Europe ─────────────────────────────────────────────────────────
  { countryCode: 'AL', name_en: 'Albania', name_ru: 'Албания', flagColors: ['#E41E20', '#000000', '#FFFFFF'], recommendedLocales: ['sq'], region: 'Europe' },
  { countryCode: 'AD', name_en: 'Andorra', name_ru: 'Андорра', flagColors: ['#0032A0', '#FEDF00', '#D1001F'], recommendedLocales: ['ca'], region: 'Europe' },
  { countryCode: 'AT', name_en: 'Austria', name_ru: 'Австрия', flagColors: ['#ED2939', '#FFFFFF'], recommendedLocales: ['de-AT'], region: 'Europe' },
  { countryCode: 'BY', name_en: 'Belarus', name_ru: 'Беларусь', flagColors: ['#CE1126', '#009739', '#FFFFFF'], recommendedLocales: ['be', 'ru-BY'], region: 'Europe' },
  { countryCode: 'BE', name_en: 'Belgium', name_ru: 'Бельгия', flagColors: ['#000000', '#FFD90F', '#CE1126'], recommendedLocales: ['nl-BE', 'fr-BE', 'de-BE'], region: 'Europe' },
  { countryCode: 'BA', name_en: 'Bosnia and Herzegovina', name_ru: 'Босния и Герцеговина', flagColors: ['#002395', '#FECB00', '#FFFFFF'], recommendedLocales: ['bs', 'hr-BA', 'sr-BA'], region: 'Europe' },
  { countryCode: 'BG', name_en: 'Bulgaria', name_ru: 'Болгария', flagColors: ['#FFFFFF', '#00966E', '#D62612'], recommendedLocales: ['bg'], region: 'Europe' },
  { countryCode: 'HR', name_en: 'Croatia', name_ru: 'Хорватия', flagColors: ['#FF0000', '#FFFFFF', '#171796'], recommendedLocales: ['hr'], region: 'Europe' },
  { countryCode: 'CY', name_en: 'Cyprus', name_ru: 'Кипр', flagColors: ['#FFFFFF', '#D57800', '#4E7248'], recommendedLocales: ['el-CY', 'tr-CY'], region: 'Europe' },
  { countryCode: 'CZ', name_en: 'Czechia', name_ru: 'Чехия', flagColors: ['#FFFFFF', '#D7141A', '#11457E'], recommendedLocales: ['cs'], region: 'Europe' },
  { countryCode: 'DK', name_en: 'Denmark', name_ru: 'Дания', flagColors: ['#C8102E', '#FFFFFF'], recommendedLocales: ['da'], region: 'Europe' },
  { countryCode: 'EE', name_en: 'Estonia', name_ru: 'Эстония', flagColors: ['#0072CE', '#000000', '#FFFFFF'], recommendedLocales: ['et'], region: 'Europe' },
  { countryCode: 'FI', name_en: 'Finland', name_ru: 'Финляндия', flagColors: ['#FFFFFF', '#003580'], recommendedLocales: ['fi'], region: 'Europe' },
  { countryCode: 'FR', name_en: 'France', name_ru: 'Франция', flagColors: ['#002395', '#FFFFFF', '#ED2939'], recommendedLocales: ['fr'], region: 'Europe', tags: ['tricolor'] },
  { countryCode: 'GR', name_en: 'Greece', name_ru: 'Греция', flagColors: ['#004C98', '#FFFFFF'], recommendedLocales: ['el'], region: 'Europe' },
  { countryCode: 'HU', name_en: 'Hungary', name_ru: 'Венгрия', flagColors: ['#CE2939', '#FFFFFF', '#477050'], recommendedLocales: ['hu'], region: 'Europe', tags: ['tricolor'] },
  { countryCode: 'IS', name_en: 'Iceland', name_ru: 'Исландия', flagColors: ['#003897', '#FFFFFF', '#D72828'], recommendedLocales: ['is'], region: 'Europe' },
  { countryCode: 'IE', name_en: 'Ireland', name_ru: 'Ирландия', flagColors: ['#169B62', '#FFFFFF', '#FF883E'], recommendedLocales: ['en-IE', 'ga'], region: 'Europe', tags: ['tricolor'] },
  { countryCode: 'IT', name_en: 'Italy', name_ru: 'Италия', flagColors: ['#008C45', '#FFFFFF', '#CD212A'], recommendedLocales: ['it'], region: 'Europe', tags: ['tricolor'] },
  { countryCode: 'XK', name_en: 'Kosovo', name_ru: 'Косово', flagColors: ['#244AA5', '#D0A650', '#FFFFFF'], recommendedLocales: ['sq-XK', 'sr-XK'], region: 'Europe' },
  { countryCode: 'LV', name_en: 'Latvia', name_ru: 'Латвия', flagColors: ['#9E3039', '#FFFFFF'], recommendedLocales: ['lv'], region: 'Europe' },
  { countryCode: 'LI', name_en: 'Liechtenstein', name_ru: 'Лихтенштейн', flagColors: ['#002B7F', '#CE1126', '#FFD83D'], recommendedLocales: ['de-LI'], region: 'Europe' },
  { countryCode: 'LT', name_en: 'Lithuania', name_ru: 'Литва', flagColors: ['#FDB913', '#006A44', '#C1272D'], recommendedLocales: ['lt'], region: 'Europe' },
  { countryCode: 'LU', name_en: 'Luxembourg', name_ru: 'Люксембург', flagColors: ['#EF3340', '#FFFFFF', '#00A3E0'], recommendedLocales: ['lb', 'fr-LU', 'de-LU'], region: 'Europe' },
  { countryCode: 'MT', name_en: 'Malta', name_ru: 'Мальта', flagColors: ['#FFFFFF', '#CF142B'], recommendedLocales: ['mt', 'en-MT'], region: 'Europe' },
  { countryCode: 'MD', name_en: 'Moldova', name_ru: 'Молдова', flagColors: ['#003DA5', '#FFD200', '#CC092F'], recommendedLocales: ['ro-MD', 'ru-MD'], region: 'Europe' },
  { countryCode: 'MC', name_en: 'Monaco', name_ru: 'Монако', flagColors: ['#CE1126', '#FFFFFF'], recommendedLocales: ['fr-MC'], region: 'Europe' },
  { countryCode: 'ME', name_en: 'Montenegro', name_ru: 'Черногория', flagColors: ['#D4AF37', '#C8102E'], recommendedLocales: ['sr-ME'], region: 'Europe' },
  { countryCode: 'NL', name_en: 'Netherlands', name_ru: 'Нидерланды', flagColors: ['#AE1C28', '#FFFFFF', '#21468B'], recommendedLocales: ['nl'], region: 'Europe' },
  { countryCode: 'MK', name_en: 'North Macedonia', name_ru: 'Северная Македония', flagColors: ['#CE2028', '#F9D616'], recommendedLocales: ['mk'], region: 'Europe' },
  { countryCode: 'NO', name_en: 'Norway', name_ru: 'Норвегия', flagColors: ['#EF2B2D', '#FFFFFF', '#002868'], recommendedLocales: ['no', 'nb', 'nn'], region: 'Europe' },
  { countryCode: 'PL', name_en: 'Poland', name_ru: 'Польша', flagColors: ['#FFFFFF', '#DC143C'], recommendedLocales: ['pl'], region: 'Europe' },
  { countryCode: 'PT', name_en: 'Portugal', name_ru: 'Португалия', flagColors: ['#006600', '#FF0000', '#FFE200', '#003399'], recommendedLocales: ['pt-PT'], region: 'Europe' },
  { countryCode: 'RO', name_en: 'Romania', name_ru: 'Румыния', flagColors: ['#002B7F', '#FCD116', '#CE1126'], recommendedLocales: ['ro'], region: 'Europe', tags: ['tricolor'] },
  { countryCode: 'SM', name_en: 'San Marino', name_ru: 'Сан-Марино', flagColors: ['#FFFFFF', '#5EB6E4'], recommendedLocales: ['it-SM'], region: 'Europe' },
  { countryCode: 'RS', name_en: 'Serbia', name_ru: 'Сербия', flagColors: ['#C7363D', '#FFFFFF', '#0C4076'], recommendedLocales: ['sr'], region: 'Europe', tags: ['tricolor'] },
  { countryCode: 'SK', name_en: 'Slovakia', name_ru: 'Словакия', flagColors: ['#FFFFFF', '#0B4EA2', '#EE1C25'], recommendedLocales: ['sk'], region: 'Europe' },
  { countryCode: 'SI', name_en: 'Slovenia', name_ru: 'Словения', flagColors: ['#FFFFFF', '#003DA5', '#ED1C24'], recommendedLocales: ['sl'], region: 'Europe' },
  { countryCode: 'ES', name_en: 'Spain', name_ru: 'Испания', flagColors: ['#AA151B', '#F1BF00'], recommendedLocales: ['es', 'es-ES'], region: 'Europe' },
  { countryCode: 'SE', name_en: 'Sweden', name_ru: 'Швеция', flagColors: ['#006AA7', '#FECC02'], recommendedLocales: ['sv'], region: 'Europe' },
  { countryCode: 'CH', name_en: 'Switzerland', name_ru: 'Швейцария', flagColors: ['#DA291C', '#FFFFFF'], recommendedLocales: ['de-CH', 'fr-CH', 'it-CH'], region: 'Europe' },
  { countryCode: 'UA', name_en: 'Ukraine', name_ru: 'Украина', flagColors: ['#0057B7', '#FFD700'], recommendedLocales: ['uk'], region: 'Europe' },
  { countryCode: 'GB', name_en: 'United Kingdom', name_ru: 'Великобритания', flagColors: ['#C8102E', '#FFFFFF', '#012169'], recommendedLocales: ['en-GB'], region: 'Europe' },
  { countryCode: 'VA', name_en: 'Vatican City', name_ru: 'Ватикан', flagColors: ['#FFE000', '#FFFFFF'], recommendedLocales: ['it-VA', 'la'], region: 'Europe' },

  // ── Oceania ────────────────────────────────────────────────────────
  { countryCode: 'AU', name_en: 'Australia', name_ru: 'Австралия', flagColors: ['#00008B', '#FFFFFF', '#FF0000'], recommendedLocales: ['en-AU'], region: 'Oceania' },
  { countryCode: 'FJ', name_en: 'Fiji', name_ru: 'Фиджи', flagColors: ['#68BFE5', '#FFFFFF', '#CE1126', '#002868'], recommendedLocales: ['en-FJ', 'fj'], region: 'Oceania' },
  { countryCode: 'KI', name_en: 'Kiribati', name_ru: 'Кирибати', flagColors: ['#CE1126', '#FFD100', '#003F87', '#FFFFFF'], recommendedLocales: ['en-KI'], region: 'Oceania' },
  { countryCode: 'MH', name_en: 'Marshall Islands', name_ru: 'Маршалловы Острова', flagColors: ['#003893', '#FFFFFF', '#DD7500'], recommendedLocales: ['en-MH', 'mh'], region: 'Oceania' },
  { countryCode: 'FM', name_en: 'Micronesia', name_ru: 'Микронезия', flagColors: ['#75B2DD', '#FFFFFF'], recommendedLocales: ['en-FM'], region: 'Oceania' },
  { countryCode: 'NR', name_en: 'Nauru', name_ru: 'Науру', flagColors: ['#002B7F', '#FFC61E', '#FFFFFF'], recommendedLocales: ['en-NR', 'na'], region: 'Oceania' },
  { countryCode: 'NZ', name_en: 'New Zealand', name_ru: 'Новая Зеландия', flagColors: ['#00247D', '#FFFFFF', '#CC142B'], recommendedLocales: ['en-NZ', 'mi'], region: 'Oceania' },
  { countryCode: 'PW', name_en: 'Palau', name_ru: 'Палау', flagColors: ['#4AADD6', '#FFDE00'], recommendedLocales: ['en-PW', 'pau'], region: 'Oceania' },
  { countryCode: 'PG', name_en: 'Papua New Guinea', name_ru: 'Папуа — Новая Гвинея', flagColors: ['#000000', '#CE1126', '#FFFFFF', '#FFD100'], recommendedLocales: ['en-PG'], region: 'Oceania' },
  { countryCode: 'WS', name_en: 'Samoa', name_ru: 'Самоа', flagColors: ['#CE1126', '#002B7F', '#FFFFFF'], recommendedLocales: ['sm', 'en-WS'], region: 'Oceania' },
  { countryCode: 'SB', name_en: 'Solomon Islands', name_ru: 'Соломоновы Острова', flagColors: ['#0051A5', '#008000', '#FCD116', '#FFFFFF'], recommendedLocales: ['en-SB'], region: 'Oceania' },
  { countryCode: 'TO', name_en: 'Tonga', name_ru: 'Тонга', flagColors: ['#C10000', '#FFFFFF'], recommendedLocales: ['to', 'en-TO'], region: 'Oceania' },
  { countryCode: 'TV', name_en: 'Tuvalu', name_ru: 'Тувалу', flagColors: ['#00247D', '#FFC72C', '#FFFFFF', '#012169'], recommendedLocales: ['en-TV'], region: 'Oceania' },
  { countryCode: 'VU', name_en: 'Vanuatu', name_ru: 'Вануату', flagColors: ['#000000', '#D21034', '#009543', '#FDCE12'], recommendedLocales: ['en-VU', 'fr-VU', 'bi'], region: 'Oceania' },

  // ── Antarctica ─────────────────────────────────────────────────────
  { countryCode: 'AQ', name_en: 'Antarctica', name_ru: 'Антарктида', flagColors: ['#3A7DCE', '#FFFFFF'], recommendedLocales: [], region: 'Antarctica' },
];

// ── Validation ───────────────────────────────────────────────────────
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const VALID_REGIONS = new Set(['Africa', 'Americas', 'Antarctica', 'Asia', 'Europe', 'Oceania']);
const errors: string[] = [];
const seenCodes = new Set<string>();

for (const p of RAW) {
  if (seenCodes.has(p.countryCode)) {
    errors.push(`Duplicate country code: ${p.countryCode}`);
  }
  seenCodes.add(p.countryCode);

  if (p.flagColors.length < 2 || p.flagColors.length > 6) {
    errors.push(`${p.countryCode}: need 2–6 colors, got ${p.flagColors.length}`);
  }
  for (const c of p.flagColors) {
    if (!HEX_RE.test(c)) {
      errors.push(`${p.countryCode}: invalid hex color "${c}"`);
    }
  }
  if (!p.name_en || !p.name_ru) {
    errors.push(`${p.countryCode}: missing name`);
  }
  if (!VALID_REGIONS.has(p.region)) {
    errors.push(`${p.countryCode}: invalid region "${p.region}"`);
  }
}

if (errors.length > 0) {
  console.error('Validation errors:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

// ── Generate output ──────────────────────────────────────────────────
const lines: string[] = [
  '// AUTO-GENERATED — DO NOT EDIT MANUALLY',
  '// Run `npm run generate:palettes` to regenerate.',
  '// Source: scripts/generate-palettes.ts',
  '',
  "import type { FlagPalette } from '../types/theme';",
  '',
  'export type Region = ' + [...VALID_REGIONS].map((r) => `'${r}'`).join(' | ') + ';',
  '',
  'export interface GeneratedPalette extends FlagPalette {',
  '  region: Region;',
  '}',
  '',
  `export const GENERATED_PALETTES: GeneratedPalette[] = ${JSON.stringify(
    RAW.map((p) => ({
      countryCode: p.countryCode,
      name_en: p.name_en,
      name_ru: p.name_ru,
      flagColors: p.flagColors,
      recommendedLocales: p.recommendedLocales,
      region: p.region,
      ...(p.tags ? { tags: p.tags } : {}),
    })),
    null,
    2,
  )};`,
];

const outPath = resolve(import.meta.dirname, '..', 'src', 'shared', 'data', 'palettes-generated.ts');
writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf-8');
console.log(`✓ Generated ${RAW.length} palettes → ${outPath}`);
