/** Small, dependency-light helpers for cleaning scraped values. */

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
  '&pound;': '£',
};

export function decodeEntities(input: string): string {
  return input.replace(/&[a-zA-Z#0-9x]+;/g, (m) => ENTITIES[m] ?? m);
}

/** Convert an HTML description blob into readable plain text. */
export function stripHtml(input: string | null | undefined): string | null {
  if (!input) return null;
  const text = decodeEntities(
    input
      .replace(/<\s*br\s*\/?\s*>/gi, '\n')
      .replace(/<\/\s*p\s*>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  return text.length ? text : null;
}

/**
 * Parse a UK asking price into whole pounds.
 * Handles "550,000", "£550,000", "£550k", "550000", "Offers over £1.2m".
 * Returns null for "POA" / unparseable values.
 */
export function parsePrice(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === 'number') return Number.isFinite(input) && input > 0 ? Math.round(input) : null;

  const cleaned = input.replace(/,/g, '').toLowerCase();
  const match = cleaned.match(/£?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?/);
  if (!match) return null;
  let value = parseFloat(match[1]);
  if (match[2] === 'k') value *= 1_000;
  if (match[2] === 'm') value *= 1_000_000;
  return value > 0 ? Math.round(value) : null;
}

/** Derive the UK outcode (first half of the postcode) e.g. "SW18 1FQ" -> "SW18". */
export function deriveOutcode(postcode: string | null | undefined): string | null {
  if (!postcode) return null;
  const trimmed = postcode.trim().toUpperCase();
  const space = trimmed.indexOf(' ');
  const outcode = space > 0 ? trimmed.slice(0, space) : trimmed;
  return /^[A-Z]{1,2}[0-9][A-Z0-9]?$/.test(outcode) ? outcode : null;
}

/** Extract and parse the `__NEXT_DATA__` JSON blob from a Next.js page. */
export function extractNextData(html: string): any | null {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}
