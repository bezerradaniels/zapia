/**
 * Normalizes free-text labels (product names, variation options) so a value
 * typed in ALL CAPS by the lojista renders as regular title case on the
 * storefront, instead of relying on CSS `text-transform` (which can't
 * lowercase characters that are already uppercase).
 */
export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}
