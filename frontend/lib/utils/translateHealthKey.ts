/**
 * TRANSLATE HEALTH KEY HELPER
 * 
 * Safely translates technical keys to human-readable Spanish text.
 * Returns null if key is not found (never shows raw key to user).
 */

import { HEALTH_COPY } from '../constants/healthCopy';

/**
 * Translates a health key to human-readable Spanish text.
 * 
 * @param key - Technical key (e.g., "ldl.out_of_range.risk", "ldl.reduce_saturated_fat")
 * @returns Translated text or null if key not found
 * 
 * @example
 * translateHealthKey("ldl.reduce_saturated_fat") // "Reduce grasas saturadas y fritos."
 * translateHealthKey("invalid.key") // null
 */
export function translateHealthKey(key?: string | null): string | null {
  if (!key) return null;
  
  // Direct lookup
  if (HEALTH_COPY[key]) {
    return HEALTH_COPY[key];
  }
  
  // Try with .title suffix removed (for action titles)
  const keyWithoutTitle = key.replace(/\.title$/, '');
  if (keyWithoutTitle !== key && HEALTH_COPY[keyWithoutTitle]) {
    return HEALTH_COPY[keyWithoutTitle];
  }
  
  // Try with .title suffix added (for action IDs)
  const keyWithTitle = `${key}.title`;
  if (HEALTH_COPY[keyWithTitle]) {
    return HEALTH_COPY[keyWithTitle];
  }
  
  // No translation found - return null (never show raw key)
  return null;
}

/**
 * Checks if a key has a translation available.
 */
export function hasTranslation(key?: string | null): boolean {
  return translateHealthKey(key) !== null;
}

