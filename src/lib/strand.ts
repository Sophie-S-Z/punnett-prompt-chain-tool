export const GENE_SPACING = 280;

/** Convert a dropped gene's canvas position to its bounded, one-based order. */
export function strandPosition(x: number, count: number): number {
  return Math.max(1, Math.min(count, Math.round(x / GENE_SPACING)));
}
