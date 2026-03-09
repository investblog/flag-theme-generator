// D65 white reference
const D65_X = 0.95047;
const D65_Y = 1.0;
const D65_Z = 1.08883;

const LAB_E = 216 / 24389; // 0.008856
const LAB_K = 24389 / 27; // 903.3

/** Parse '#rrggbb' to [r, g, b] (0-255). */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Clamp, round, and format [r, g, b] (0-255) to '#rrggbb'. */
export function rgbToHex(rgb: [number, number, number]): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${rgb.map((c) => clamp(c).toString(16).padStart(2, '0')).join('')}`;
}

/** sRGB channel (0-255) → linear (0-1). */
function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Linear (0-1) → sRGB channel (0-255). */
function delinearize(l: number): number {
  const s = l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055;
  return s * 255;
}

/** WCAG 2.1 relative luminance of a hex color. Range [0, 1]. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function linearRgbToXyz(lr: number, lg: number, lb: number): [number, number, number] {
  return [
    0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb,
    0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb,
    0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb,
  ];
}

function xyzToLinearRgb(x: number, y: number, z: number): [number, number, number] {
  return [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ];
}

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const f = (t: number) => (t > LAB_E ? t ** (1 / 3) : (LAB_K * t + 16) / 116);
  const fx = f(x / D65_X);
  const fy = f(y / D65_Y);
  const fz = f(z / D65_Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labToXyz(l: number, a: number, b: number): [number, number, number] {
  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const inv = (t: number) => (t ** 3 > LAB_E ? t ** 3 : (116 * t - 16) / LAB_K);
  return [inv(fx) * D65_X, inv(fy) * D65_Y, inv(fz) * D65_Z];
}

function labToLch(l: number, a: number, b: number): [number, number, number] {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [l, c, h];
}

function lchToLab(l: number, c: number, h: number): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  return [l, c * Math.cos(hr), c * Math.sin(hr)];
}

/** Hex → CIE LCH [L (0-100), C (0-~150), H (0-360)]. */
export function hexToLch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);
  const [x, y, z] = linearRgbToXyz(lr, lg, lb);
  const [ll, la, lbb] = xyzToLab(x, y, z);
  return labToLch(ll, la, lbb);
}

/** CIE LCH → hex string, with gamut clamping (clips RGB to [0, 1]). */
export function lchToHex(l: number, c: number, h: number): string {
  const [ll, la, lb] = lchToLab(l, c, h);
  const [x, y, z] = labToXyz(ll, la, lb);
  const [lr, lg, lbb] = xyzToLinearRgb(x, y, z);
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  return rgbToHex([delinearize(clamp01(lr)), delinearize(clamp01(lg)), delinearize(clamp01(lbb))]);
}

/** CIE76 ΔE — Euclidean distance in Lab space. */
export function deltaE(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [x1, y1, z1] = linearRgbToXyz(linearize(r1), linearize(g1), linearize(b1));
  const [l1, a1, bb1] = xyzToLab(x1, y1, z1);

  const [r2, g2, b2] = hexToRgb(hex2);
  const [x2, y2, z2] = linearRgbToXyz(linearize(r2), linearize(g2), linearize(b2));
  const [l2, a2, bb2] = xyzToLab(x2, y2, z2);

  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (bb1 - bb2) ** 2);
}

/** Parse hex to HSL [H (0-360), S (0-100), L (0-100)]. */
export function hexToHsl(hex: string): [number, number, number] {
  const [rr, gg, bb] = hexToRgb(hex);
  const r = rr / 255;
  const g = gg / 255;
  const b = bb / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

/** LCH chroma component of a hex color. */
export function chroma(hex: string): number {
  return hexToLch(hex)[1];
}
