/** Replaces any newline sequence with a single space (never lets a free-text field carry a line break). */
export function stripNewlines(value: string): string {
  return value.replace(/[\r\n]+/g, ' ');
}

/** Strips newlines and trims leading/trailing whitespace. Use before persisting/exporting free-text fields. */
export function sanitizeFreeText(value: string): string {
  return stripNewlines(value).trim();
}
