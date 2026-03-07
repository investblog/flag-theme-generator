import type {
  CompatibilityReason,
  CompatibilityReport,
  FlagPalette,
  ModeAdjustments,
  ModeMetrics,
  Strictness,
  ThemeMode,
  ThemeTokens,
} from '../types/theme';
import { REQUIRED_PAIRS } from '../types/theme';
import { chroma as colorChroma, deltaE as colorDeltaE, hexToLch, lchToHex } from './color';
import { adjustToContrast, contrast } from './contrast';

const MIN_CHROMATIC = 12;
const MIN_DIVERSITY_DE = 8;
const SOFT_DIVERSITY_DE = 6;
const DIVERSITY_L_SHIFT = 12;

interface ModeConfig {
  contrastBuffer: number;
  borderChroma: number;
  borderContrast: number;
}

const MODE_TUNING: Record<ThemeMode, ModeConfig> = {
  AMOLED: { contrastBuffer: 0.5, borderChroma: 12, borderContrast: 2.5 },
  DARK: { contrastBuffer: 1.5, borderChroma: 20, borderContrast: 3.0 },
  LIGHT: { contrastBuffer: 0.75, borderChroma: 8, borderContrast: 2.0 },
  DOMINANT_ONLY: { contrastBuffer: 1.5, borderChroma: 20, borderContrast: 3.0 },
};

const MODE_PRESETS: Record<ThemeMode, Pick<ThemeTokens, 'bg' | 'surface' | 'text' | 'mutedText' | 'border'>> = {
  AMOLED: {
    bg: '#000000',
    surface: '#0a0a0a',
    text: '#e8e8e8',
    mutedText: '#a0a0a0',
    border: '#333333',
  },
  DARK: {
    bg: '#1a1a2e',
    surface: '#22223a',
    text: '#e8e8ed',
    mutedText: '#a0a0b0',
    border: '#404060',
  },
  LIGHT: {
    bg: '#ffffff',
    surface: '#f5f5f7',
    text: '#1a1a2e',
    mutedText: '#6c6c7e',
    border: '#c8c8d0',
  },
  DOMINANT_ONLY: {
    bg: '#1a1a2e',
    surface: '#22223a',
    text: '#e8e8ed',
    mutedText: '#a0a0b0',
    border: '#404060',
  },
};

interface CandidatePool {
  chromatic: string[];
  achromatic: string[];
  synthetic: Set<string>;
}

type InteractiveRole = 'accent' | 'accent2' | 'link' | 'focusRing';
type CandidateClass = 'interactive' | 'decorative' | 'reject';

interface CandidateProfile {
  source: string;
  class: CandidateClass;
  synthetic: boolean;
  contrastBg: number;
  contrastSurface: number;
  chroma: number;
  lightness: number;
  roleScores: Record<InteractiveRole | 'borderHueSource', number>;
}

interface RoleAssignment {
  accent: string;
  accent2: string;
  link: string;
  focusRing: string;
  borderHueSource: string | null;
}

function buildCandidatePool(flagColors: string[], bg: string): CandidatePool {
  const chromatic: string[] = [];
  const achromatic: string[] = [];
  const synthetic = new Set<string>();

  for (const c of flagColors) {
    if (colorChroma(c) >= MIN_CHROMATIC) chromatic.push(c);
    else achromatic.push(c);
  }

  if (chromatic.length === 1) {
    const [l, c, h] = hexToLch(chromatic[0]);
    const candidate = lchToHex(l, c, (h + 40) % 360);
    chromatic.push(candidate);
    synthetic.add(candidate);
  }

  if (chromatic.length === 0) {
    const [bgL, , bgH] = hexToLch(bg);
    const synthL = bgL < 50 ? 65 : 45;
    const first = lchToHex(synthL, 30, bgH);
    const second = lchToHex(synthL, 30, (bgH + 40) % 360);
    chromatic.push(first);
    chromatic.push(second);
    synthetic.add(first);
    synthetic.add(second);
  }

  return { chromatic, achromatic, synthetic };
}

function roleStrictness(role: InteractiveRole, strictness: Strictness, mode: ThemeMode): Strictness {
  if (mode === 'DOMINANT_ONLY') return strictness;
  if (role === 'link') return Math.min(strictness, mode === 'LIGHT' ? 0.4 : 0.5);
  if (role === 'focusRing') return Math.min(strictness, mode === 'LIGHT' ? 0.35 : 0.45);
  if (role === 'accent') return Math.min(strictness, mode === 'LIGHT' ? 0.45 : 0.55);
  return Math.min(strictness, mode === 'LIGHT' ? 0.5 : 0.6);
}

function scoreInteractiveRole(
  role: InteractiveRole,
  color: string,
  bg: string,
  surface: string,
  mode: ThemeMode,
  synthetic: boolean,
): number {
  const bgContrast = contrast(color, bg);
  const surfaceContrast = contrast(color, surface);
  const weakestContrast = Math.min(bgContrast, surfaceContrast);
  const minContrast = role === 'link' ? 4.5 : 3.0;
  const chroma = colorChroma(color);
  const [lightness] = hexToLch(color);
  const targetLightness = mode === 'LIGHT' ? 34 : 72;
  const contrastScore =
    weakestContrast >= minContrast
      ? weakestContrast * 2.8
      : weakestContrast * 0.9 - (minContrast - weakestContrast) * 9;
  const chromaBonus =
    role === 'focusRing'
      ? Math.min(chroma, 42) * 0.024
      : role === 'link'
        ? Math.min(chroma, 36) * 0.016
        : Math.min(chroma, 48) * 0.02;
  const lightnessPenalty = Math.abs(lightness - targetLightness) * (role === 'link' ? 0.02 : 0.03);
  const syntheticPenalty = synthetic ? 0.35 : 0;
  return contrastScore + chromaBonus - lightnessPenalty - syntheticPenalty;
}

function profileCandidates(pool: CandidatePool, mode: ThemeMode, bg: string, surface: string): CandidateProfile[] {
  return pool.chromatic.map((source) => {
    const contrastBg = contrast(source, bg);
    const contrastSurface = contrast(source, surface);
    const weakestContrast = Math.min(contrastBg, contrastSurface);
    const chroma = colorChroma(source);
    const [lightness] = hexToLch(source);
    const synthetic = pool.synthetic.has(source);

    let candidateClass: CandidateClass = 'interactive';
    if (weakestContrast < 1.3) candidateClass = 'reject';
    else if (weakestContrast < 2.5 || chroma < MIN_CHROMATIC) candidateClass = 'decorative';

    return {
      source,
      class: candidateClass,
      synthetic,
      contrastBg,
      contrastSurface,
      chroma,
      lightness,
      roleScores: {
        accent: scoreInteractiveRole('accent', source, bg, surface, mode, synthetic),
        accent2: scoreInteractiveRole('accent2', source, bg, surface, mode, synthetic) - 0.1,
        link: scoreInteractiveRole('link', source, bg, surface, mode, synthetic),
        focusRing: scoreInteractiveRole('focusRing', source, bg, surface, mode, synthetic) + 0.12,
        borderHueSource: chroma - Math.max(0, 4.5 - weakestContrast) * 8 - (synthetic ? 6 : 0),
      },
    };
  });
}

function getProfile(profiles: CandidateProfile[], source: string): CandidateProfile | undefined {
  return profiles.find((profile) => profile.source === source);
}

function pairPenalty(a: string, b: string, minDelta: number, weight: number): number {
  const de = colorDeltaE(a, b);
  return de >= minDelta ? 0 : (minDelta - de) * weight;
}

function assignmentScore(profiles: CandidateProfile[], assignment: Omit<RoleAssignment, 'borderHueSource'>): number {
  const accent = getProfile(profiles, assignment.accent);
  const accent2 = getProfile(profiles, assignment.accent2);
  const link = getProfile(profiles, assignment.link);
  const focusRing = getProfile(profiles, assignment.focusRing);
  if (!accent || !accent2 || !link || !focusRing) return Number.NEGATIVE_INFINITY;

  let score =
    accent.roleScores.accent * 1.15 +
    accent2.roleScores.accent2 * 0.9 +
    link.roleScores.link * 1.45 +
    focusRing.roleScores.focusRing * 1.15;

  const interactiveSet = new Set([assignment.accent, assignment.accent2, assignment.link, assignment.focusRing]);
  score += interactiveSet.size * 1.4;

  if (accent.synthetic) score -= 0.6;
  if (link.synthetic) score -= 1.2;
  if (focusRing.synthetic) score -= 0.8;
  if (accent2.synthetic) score -= 0.4;

  if (accent.class === 'reject' || accent2.class === 'reject' || link.class === 'reject' || focusRing.class === 'reject') {
    return Number.NEGATIVE_INFINITY;
  }

  if (link.class !== 'interactive') score -= 1.4;
  if (focusRing.class !== 'interactive') score -= 1.1;
  if (accent.class !== 'interactive') score -= 0.8;

  score -= pairPenalty(assignment.link, assignment.accent, MIN_DIVERSITY_DE, 1.8);
  score -= pairPenalty(assignment.focusRing, assignment.accent2, MIN_DIVERSITY_DE, 1.6);
  score -= pairPenalty(assignment.accent, assignment.accent2, SOFT_DIVERSITY_DE, 0.9);
  score -= pairPenalty(assignment.link, assignment.focusRing, SOFT_DIVERSITY_DE, 0.7);

  return score;
}

function sortCandidatesForRole(profiles: CandidateProfile[], role: InteractiveRole): CandidateProfile[] {
  return [...profiles]
    .filter((profile) => profile.class !== 'reject')
    .sort((a, b) => b.roleScores[role] - a.roleScores[role]);
}

function assignRoles(profiles: CandidateProfile[]): RoleAssignment {
  const fallback = profiles[0]?.source ?? '#4f46e5';
  const accentCandidates = sortCandidatesForRole(profiles, 'accent').slice(0, 5);
  const accent2Candidates = sortCandidatesForRole(profiles, 'accent2').slice(0, 5);
  const linkCandidates = sortCandidatesForRole(profiles, 'link').slice(0, 5);
  const focusCandidates = sortCandidatesForRole(profiles, 'focusRing').slice(0, 5);

  let best: Omit<RoleAssignment, 'borderHueSource'> | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const link of linkCandidates) {
    for (const accent of accentCandidates) {
      for (const focusRing of focusCandidates) {
        for (const accent2 of accent2Candidates) {
          const candidate = {
            accent: accent.source,
            accent2: accent2.source,
            link: link.source,
            focusRing: focusRing.source,
          };
          const score = assignmentScore(profiles, candidate);
          if (score > bestScore) {
            bestScore = score;
            best = candidate;
          }
        }
      }
    }
  }

  const resolved = best ?? {
    accent: accentCandidates[0]?.source ?? fallback,
    accent2: accent2Candidates[0]?.source ?? accentCandidates[0]?.source ?? fallback,
    link: linkCandidates[0]?.source ?? accentCandidates[0]?.source ?? fallback,
    focusRing: focusCandidates[0]?.source ?? accent2Candidates[0]?.source ?? fallback,
  };

  const borderHueSource =
    [...profiles]
      .filter((profile) => profile.class !== 'reject')
      .sort((a, b) => b.roleScores.borderHueSource - a.roleScores.borderHueSource)[0]?.source ?? null;

  return {
    ...resolved,
    borderHueSource,
  };
}

function adjustAgainstSurfaces(
  color: string,
  surfaces: string[],
  minContrast: number,
  strictness: Strictness,
  mode: ThemeMode,
): string {
  let adjusted = color;
  for (let pass = 0; pass < 3; pass++) {
    const orderedSurfaces = [...surfaces].sort((a, b) => contrast(adjusted, a) - contrast(adjusted, b));
    let changed = false;
    for (const surface of orderedSurfaces) {
      if (contrast(adjusted, surface) >= minContrast) continue;
      const result = adjustToContrast(adjusted, surface, minContrast, strictness, mode);
      if (result.color !== adjusted) changed = true;
      adjusted = result.color;
    }
    if (!changed) break;
  }
  return adjusted;
}

function isViableDiverse(candidate: string, peer: string, bg: string, surface: string, minContrast: number): boolean {
  return (
    colorDeltaE(candidate, peer) >= MIN_DIVERSITY_DE &&
    contrast(candidate, bg) >= minContrast &&
    contrast(candidate, surface) >= minContrast
  );
}

function diversifyFromPeer(
  token: string,
  peer: string,
  bg: string,
  surface: string,
  minContrast: number,
  isDark: boolean,
): string {
  if (colorDeltaE(token, peer) >= MIN_DIVERSITY_DE) return token;

  const [origL, origC, origH] = hexToLch(token);

  if (isDark) {
    for (let step = 1; step <= 4; step++) {
      const candidate = lchToHex(Math.min(100, origL + DIVERSITY_L_SHIFT * step), origC, origH);
      if (isViableDiverse(candidate, peer, bg, surface, minContrast)) return candidate;
    }
    for (const dir of [-1, 1]) {
      for (let deg = 10; deg <= 30; deg += 10) {
        const candidate = lchToHex(origL, origC, (origH + dir * deg + 360) % 360);
        if (isViableDiverse(candidate, peer, bg, surface, minContrast)) return candidate;
      }
    }
  } else {
    for (const dir of [-1, 1]) {
      for (let deg = 15; deg <= 40; deg += 5) {
        const candidate = lchToHex(origL, origC, (origH + dir * deg + 360) % 360);
        if (isViableDiverse(candidate, peer, bg, surface, minContrast)) return candidate;
      }
    }
    for (let step = 1; step <= 3; step++) {
      const candidate = lchToHex(Math.min(100, origL + DIVERSITY_L_SHIFT * step), origC, origH);
      if (isViableDiverse(candidate, peer, bg, surface, minContrast)) return candidate;
    }
    for (let step = 1; step <= 3; step++) {
      const candidate = lchToHex(Math.max(0, origL - DIVERSITY_L_SHIFT * step), origC, origH);
      if (isViableDiverse(candidate, peer, bg, surface, minContrast)) return candidate;
    }
  }

  return token;
}

function tintBorder(presetBorder: string, flagColors: string[], bg: string, surface: string, cfg: ModeConfig): string {
  let bestHue = -1;
  let bestChroma = Number.POSITIVE_INFINITY;
  for (const c of flagColors) {
    const chr = colorChroma(c);
    if (chr >= MIN_CHROMATIC && chr < bestChroma) {
      bestChroma = chr;
      bestHue = hexToLch(c)[2];
    }
  }
  if (bestHue < 0) {
    let maxChr = 0;
    for (const c of flagColors) {
      const chr = colorChroma(c);
      if (chr > maxChr) {
        maxChr = chr;
        bestHue = hexToLch(c)[2];
      }
    }
  }
  if (bestHue < 0) return presetBorder;

  const [borderL] = hexToLch(presetBorder);
  for (const dL of [0, 3, 6, 9, 12, 16, 20, -3, -6]) {
    const candidateL = Math.max(0, Math.min(100, borderL + dL));
    const candidate = lchToHex(candidateL, cfg.borderChroma, bestHue);
    if (contrast(candidate, bg) >= cfg.borderContrast && contrast(candidate, surface) >= cfg.borderContrast) {
      return candidate;
    }
  }
  return presetBorder;
}

interface TokensWithSources {
  tokens: ThemeTokens;
  sources: Record<string, string>;
}

function generateTokensInternal(palette: FlagPalette, mode: ThemeMode, strictness: Strictness): TokensWithSources {
  const preset = MODE_PRESETS[mode];
  const cfg = MODE_TUNING[mode];
  const { bg, surface, text, mutedText, border: presetBorder } = preset;
  const isDark = mode !== 'LIGHT';
  const buf = cfg.contrastBuffer;

  const pool = buildCandidatePool(palette.flagColors, bg);
  const profiles = profileCandidates(pool, mode, bg, surface);
  const assignment = assignRoles(profiles);

  const accent = adjustAgainstSurfaces(
    assignment.accent,
    [bg],
    3.0 + buf,
    roleStrictness('accent', strictness, mode),
    mode,
  );
  const accent2 = adjustAgainstSurfaces(
    assignment.accent2,
    [bg],
    3.0 + buf,
    roleStrictness('accent2', strictness, mode),
    mode,
  );
  let link = adjustAgainstSurfaces(
    assignment.link,
    [bg, surface],
    4.5 + buf,
    roleStrictness('link', strictness, mode),
    mode,
  );
  let focusRing = adjustAgainstSurfaces(
    assignment.focusRing,
    [bg, surface],
    3.0 + buf,
    roleStrictness('focusRing', strictness, mode),
    mode,
  );

  const whiteOnAccent = contrast('#ffffff', accent);
  const blackOnAccent = contrast('#000000', accent);
  const accentTextBase = whiteOnAccent >= blackOnAccent ? '#ffffff' : '#000000';
  const accentTextAdj = adjustToContrast(accentTextBase, accent, 4.5 + buf, strictness, mode);
  const accentText = accentTextAdj.color;

  link = diversifyFromPeer(link, accent, bg, surface, 4.5 + buf, isDark);
  focusRing = diversifyFromPeer(focusRing, accent2, bg, surface, 3.0 + buf, isDark);

  const borderSources = assignment.borderHueSource
    ? [assignment.borderHueSource, ...palette.flagColors]
    : palette.flagColors;
  const border = tintBorder(presetBorder, borderSources, bg, surface, cfg);

  return {
    tokens: { bg, surface, text, mutedText, border, accent, accent2, accentText, link, focusRing },
    sources: {
      accent: assignment.accent,
      accent2: assignment.accent2,
      link: assignment.link,
      focusRing: assignment.focusRing,
      accentText: accentTextBase,
    },
  };
}

export function generateTokens(palette: FlagPalette, mode: ThemeMode, strictness: Strictness): ThemeTokens {
  return generateTokensInternal(palette, mode, strictness).tokens;
}

export function evaluateCompatibility(palette: FlagPalette, strictness: Strictness): CompatibilityReport {
  const modes: (ThemeMode & ('AMOLED' | 'DARK' | 'LIGHT'))[] = ['AMOLED', 'DARK', 'LIGHT'];
  const supports: Record<'AMOLED' | 'DARK' | 'LIGHT', boolean> = { AMOLED: true, DARK: true, LIGHT: true };
  const reasons: CompatibilityReason[] = [];
  const metrics: ModeMetrics = {};
  const adjustments: ModeAdjustments = {};

  const isNeutral = palette.flagColors.every((c) => colorChroma(c) < 10);

  for (const mode of modes) {
    const { tokens, sources } = generateTokensInternal(palette, mode, strictness);
    const modeMetrics: Record<string, number> = {};
    const modeAdjustments: Record<string, { from: string; to: string; deltaE: number }> = {};
    let modePass = true;

    for (const pair of REQUIRED_PAIRS) {
      const ratio = contrast(tokens[pair.a], tokens[pair.b]);
      modeMetrics[pair.label] = ratio;
      if (ratio < pair.threshold) {
        modePass = false;
        if (pair.a === 'link') {
          reasons.push({ mode, code: 'LOW_CONTRAST_LINK', details: `${pair.label}: ${ratio.toFixed(2)}` });
        } else if (pair.a === 'accentText') {
          reasons.push({
            mode,
            code: 'LOW_CONTRAST_ACCENT_TEXT',
            details: `${pair.label}: ${ratio.toFixed(2)}`,
          });
        }
      }
    }

    for (const key of Object.keys(sources) as (keyof typeof sources)[]) {
      const from = sources[key];
      const to = tokens[key as keyof ThemeTokens];
      const de = colorDeltaE(from, to);
      modeAdjustments[key] = { from, to, deltaE: de };

      const strictCap = mode === 'LIGHT' ? 12 : 10;
      const relaxedCap = mode === 'LIGHT' ? 24 : 18;
      const cap = strictCap + (relaxedCap - strictCap) * (1 - strictness);
      if (de > cap) {
        reasons.push({
          mode,
          code: 'EXCESSIVE_COLOR_SHIFT_REQUIRED',
          details: `${key}: deltaE ${de.toFixed(1)} > cap ${cap.toFixed(1)}`,
        });
      }
    }

    if (isNeutral) {
      reasons.push({ mode, code: 'NEUTRAL_ONLY_FLAG' });
    }

    supports[mode] = modePass;
    metrics[mode] = modeMetrics;
    adjustments[mode] = modeAdjustments;
  }

  const dominantOnlyRequired = !supports.AMOLED && !supports.DARK && !supports.LIGHT;
  return { supports, dominantOnlyRequired, reasons, metrics, adjustments };
}
