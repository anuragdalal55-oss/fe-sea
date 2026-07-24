/**
 * Formats a weight value by rounding to at most `maxDecimals` places while
 * stripping insignificant trailing zeros (9900.000 -> "9900", 9900.500 -> "9900.5").
 */
export const formatWeight = (
  value: string | number | null | undefined,
  maxDecimals = 3
): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  return parseFloat(num.toFixed(maxDecimals)).toString();
};
