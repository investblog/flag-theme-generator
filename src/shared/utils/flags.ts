import BD from 'country-flag-icons/string/3x2/BD';
import BR from 'country-flag-icons/string/3x2/BR';
import CD from 'country-flag-icons/string/3x2/CD';
import CN from 'country-flag-icons/string/3x2/CN';
import DE from 'country-flag-icons/string/3x2/DE';
import EG from 'country-flag-icons/string/3x2/EG';
import ET from 'country-flag-icons/string/3x2/ET';
import ID from 'country-flag-icons/string/3x2/ID';
import IN from 'country-flag-icons/string/3x2/IN';
import IR from 'country-flag-icons/string/3x2/IR';
import JP from 'country-flag-icons/string/3x2/JP';
import MX from 'country-flag-icons/string/3x2/MX';
import NG from 'country-flag-icons/string/3x2/NG';
import PH from 'country-flag-icons/string/3x2/PH';
import PK from 'country-flag-icons/string/3x2/PK';
import RU from 'country-flag-icons/string/3x2/RU';
import TH from 'country-flag-icons/string/3x2/TH';
import TR from 'country-flag-icons/string/3x2/TR';
import US from 'country-flag-icons/string/3x2/US';
import VN from 'country-flag-icons/string/3x2/VN';

const FLAG_SVG: Record<string, string> = {
  BD,
  BR,
  CD,
  CN,
  DE,
  EG,
  ET,
  ID,
  IN,
  IR,
  JP,
  MX,
  NG,
  PH,
  PK,
  RU,
  TH,
  TR,
  US,
  VN,
};

export function getFlagSvg(countryCode: string): string | undefined {
  return FLAG_SVG[countryCode.toUpperCase()];
}
