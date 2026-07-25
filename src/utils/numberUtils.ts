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

/**
 * Rounds a container weight (tons) to 2 decimals by looking only at the 3rd
 * decimal digit: 5-9 rounds the 2nd decimal digit up, 0-4 truncates it.
 * Works off the decimal digits directly (not `toFixed`, which can misround
 * exact-.005 boundaries due to binary floating point, e.g. 1.005 -> "1.00").
 */
export const roundContainerWeight = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  const negative = num < 0;
  const fixed = Math.abs(num).toFixed(6);
  const [intPart, decPart] = fixed.split('.');
  const thirdDigit = Number(decPart[2] || '0');
  const hundredths = Number(intPart) * 100 + Number(decPart.slice(0, 2));
  const rounded = thirdDigit >= 5 ? hundredths + 1 : hundredths;
  const result = (rounded / 100).toFixed(2);
  return negative && rounded !== 0 ? `-${result}` : result;
};
