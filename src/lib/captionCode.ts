/** Stable caption reference, independent of display order. */
export function captionCode(id: string | number): string {
  let hash = 2166136261;
  for (const char of String(id)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return "CAP-" + (hash >>> 0).toString(36).toUpperCase().padStart(7, "0");
}
