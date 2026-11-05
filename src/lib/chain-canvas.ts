export const STEP_SPACING = 200;

/** Convert a dropped step's canvas position to its bounded, one-based order. */
export function stepPosition(x: number, count: number): number {
  return Math.max(1, Math.min(count, Math.round(x / STEP_SPACING)));
}
