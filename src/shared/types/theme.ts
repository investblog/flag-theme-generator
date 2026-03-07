/** ISO 3166-1 alpha-2 country code */
export type CountryCode = string;

/** A flag-inspired color palette */
export interface FlagPalette {
  countryCode: CountryCode;
  name_en: string;
  name_ru: string;
  /** 2-6 hex colors from the flag */
  flagColors: [string, string, ...string[]];
  /** BCP 47 locale tags this palette maps to */
  recommendedLocales: string[];
  region?: string;
  tags?: string[];
}

/** Available theme generation modes */
export type ThemeMode = 'AMOLED' | 'DARK' | 'LIGHT' | 'DOMINANT_ONLY';

/**
 * Controls max allowed color drift (deltaE).
 * - ~0.9 strict -> 10-12 deltaE cap
 * - ~0.3 relaxed -> 18-24 deltaE cap
 */
export type Strictness = number;

/** The 10 design tokens generated from a palette + mode */
export interface ThemeTokens {
  bg: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  accent2: string;
  accentText: string;
  link: string;
  focusRing: string;
}

/** Result of adjusting a single color to meet contrast */
export interface AdjustmentResult {
  /** Final adjusted hex color */
  color: string;
  /** CIE deltaE distance from original */
  deltaE: number;
  /** Whether the adjusted color meets the required contrast */
  passes: boolean;
}

/** Reason a mode was disabled or degraded */
export interface CompatibilityReason {
  mode: ThemeMode;
  code: ReasonCode;
  details?: string;
}

export type ReasonCode =
  | 'LOW_CONTRAST_LINK'
  | 'LOW_CONTRAST_ACCENT_TEXT'
  | 'EXCESSIVE_COLOR_SHIFT_REQUIRED'
  | 'NEUTRAL_ONLY_FLAG';

export type QualityWarningCode =
  | 'USES_SYNTHETIC_SOURCE'
  | 'LOW_ROLE_DIVERSITY'
  | 'THIN_CONTRAST_MARGIN'
  | 'HEAVY_COLOR_ADJUSTMENT'
  | 'NEUTRAL_SOURCE_PALETTE';

/** Per-mode metrics: maps each contrast pair label to its ratio */
export type ModeMetrics = Record<string, Record<string, number>>;

/** Per-mode adjustments: maps each token to its shift info */
export type ModeAdjustments = Record<string, Record<string, { from: string; to: string; deltaE: number }>>;

/** Per-mode quality summary for ranking and UI */
export interface ModeQuality {
  score: number;
  fidelity: number;
  contrastHeadroom: number;
  distinctness: number;
  warnings: QualityWarningCode[];
}

/** Full compatibility report for a palette at a given strictness */
export interface CompatibilityReport {
  supports: Record<'AMOLED' | 'DARK' | 'LIGHT', boolean>;
  dominantOnlyRequired: boolean;
  reasons: CompatibilityReason[];
  metrics: ModeMetrics;
  adjustments: ModeAdjustments;
  quality: Record<'AMOLED' | 'DARK' | 'LIGHT', ModeQuality>;
}

/** WCAG contrast thresholds */
export const CONTRAST_THRESHOLDS = {
  normalText: 4.5,
  smallText: 7.0,
  largeText: 3.0,
  border: 1.5,
} as const;

/** A required contrast pair definition */
export interface ContrastPair {
  /** Token key for foreground */
  a: keyof ThemeTokens;
  /** Token key for background */
  b: keyof ThemeTokens;
  /** Minimum required contrast ratio */
  threshold: number;
  /** Human-readable label */
  label: string;
}

/** All required contrast pairs per spec section 6.2 */
export const REQUIRED_PAIRS: ContrastPair[] = [
  { a: 'text', b: 'bg', threshold: 4.5, label: 'text / bg' },
  { a: 'text', b: 'surface', threshold: 4.5, label: 'text / surface' },
  { a: 'mutedText', b: 'bg', threshold: 4.5, label: 'mutedText / bg' },
  { a: 'mutedText', b: 'surface', threshold: 4.5, label: 'mutedText / surface' },
  { a: 'link', b: 'bg', threshold: 4.5, label: 'link / bg' },
  { a: 'link', b: 'surface', threshold: 4.5, label: 'link / surface' },
  { a: 'accent', b: 'bg', threshold: 3.0, label: 'accent / bg' },
  { a: 'accentText', b: 'accent', threshold: 4.5, label: 'accentText / accent' },
  { a: 'focusRing', b: 'bg', threshold: 3.0, label: 'focusRing / bg' },
  { a: 'focusRing', b: 'surface', threshold: 3.0, label: 'focusRing / surface' },
  { a: 'border', b: 'bg', threshold: 1.5, label: 'border / bg' },
  { a: 'border', b: 'surface', threshold: 1.5, label: 'border / surface' },
];
