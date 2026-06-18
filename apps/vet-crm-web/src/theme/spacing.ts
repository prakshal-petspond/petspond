/**
 * Spacing scale: multiplier × 4px (--spacing-unit).
 * Tailwind: p-4 = 16px, p-5.5 = 22px, m-6 = 24px, etc.
 */
export const SPACING_UNIT_PX = 4;

const UNIT = 'var(--spacing-unit)';

function spacingKey(multiplier: number): string {
  return Number.isInteger(multiplier) ? String(multiplier) : String(multiplier);
}

/** Build Tailwind spacing keys from a 4px base unit (includes 0.5 steps). */
export function buildSpacingScale(max = 64): Record<string, string> {
  const scale: Record<string, string> = {
    px: '1px',
    0: '0px',
  };

  // 0.5, 1, 1.5, … max (e.g. p-5.5 => 22px)
  for (let half = 1; half <= max * 2; half++) {
    const mult = half / 2;
    scale[spacingKey(mult)] = `calc(${UNIT} * ${mult})`;
  }

  for (const n of [72, 80, 96]) {
    if (n > max) {
      scale[String(n)] = `calc(${UNIT} * ${n})`;
    }
  }

  return scale;
}

/** spacing(5.5) => 22px */
export function spacing(multiplier: number): string {
  return `calc(${UNIT} * ${multiplier})`;
}
