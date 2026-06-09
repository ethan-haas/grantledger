/**
 * Sanitize a value for safe CSV output.
 *
 * Leading `=`, `+`, `-`, `@` characters are interpreted as formula
 * prefixes by Excel and LibreOffice. Prefixing with a single-quote
 * neutralizes formula injection while preserving readability.
 */
const FORMULA_PREFIXES = new Set(["=", "+", "-", "@"]);

export function sanitizeCsvValue(value: unknown): string {
  const str = String(value ?? "");
  if (str.length > 0 && FORMULA_PREFIXES.has(str[0])) {
    return `'${str}`;
  }
  return str;
}
