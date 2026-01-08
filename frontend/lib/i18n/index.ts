/**
 * i18n UTILITIES
 * 
 * Simple i18n implementation for frontend
 * Default language: es-LATAM
 */

import esLATAM from './es-LATAM.json';

type TranslationKey = string;
type Translations = Record<string, string>;

let currentLanguage = 'es-LATAM';
const translations: Record<string, Translations> = {
  'es-LATAM': esLATAM as Translations,
};

/**
 * Gets translation for a key
 * Supports nested keys with dot notation (e.g., "ldl.optimal.risk")
 */
export function t(key: TranslationKey, params?: Record<string, string>): string {
  const translation = getNestedValue(translations[currentLanguage], key) || key;
  
  if (params) {
    return Object.entries(params).reduce(
      (str, [param, value]) => str.replace(`{${param}}`, value),
      translation
    );
  }
  
  return translation;
}

/**
 * Gets nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Sets the current language
 */
export function setLanguage(lang: string): void {
  if (translations[lang]) {
    currentLanguage = lang;
  }
}

/**
 * Gets the current language
 */
export function getLanguage(): string {
  return currentLanguage;
}

export default { t, setLanguage, getLanguage };

