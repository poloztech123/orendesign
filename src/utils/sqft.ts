/**
 * Utility functions for parsing and formatting square footage (SQFT).
 */

/**
 * Parses square footage into a number.
 * Supports numbers, simple numeric strings, and dimensional strings like "50x100" or "50 x 100".
 */
export const parseSqft = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  
  const str = String(val).trim();
  if (str === '') return 0;

  // Check for dimensional format (e.g. "50x100" or "50 x 100")
  if (str.toLowerCase().includes('x')) {
    const parts = str.toLowerCase().split('x');
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (!isNaN(w) && !isNaN(h)) {
      return w * h;
    }
  }

  const parsed = parseFloat(str.replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats square footage for clean UI rendering.
 * E.g. 3400 -> "3,400", "50x100" -> "50x100".
 */
export const formatSqft = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') {
    return val.toLocaleString();
  }

  const str = String(val).trim();
  const parsed = Number(str);
  
  // If it's a simple number inside a string
  if (!isNaN(parsed) && str !== '') {
    return parsed.toLocaleString();
  }

  // Return raw string (e.g. "50x100")
  return str;
};
