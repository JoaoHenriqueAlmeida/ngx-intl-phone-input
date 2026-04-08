import { CountryCode } from 'libphonenumber-js';

export type { CountryCode };

/**
 * Represents a single country entry in the selector.
 */
export interface CountryData {
  /** ISO 3166-1 alpha-2 code, e.g. 'BR', 'US', 'RU' */
  iso: CountryCode;
  /** Full country name in English, e.g. 'Brazil' */
  name: string;
  /** Dial code without '+', e.g. '55', '1', '7' */
  dialCode: string;
  /** CDN URL of the country flag SVG, e.g. 'https://cdn.kcak11.com/CountryFlags/countries/br.svg' */
  flag: string;
}

/**
 * Configuration inputs for the PhoneInputComponent.
 */
export interface PhoneInputConfig {
  /** ISO code of the country pre-selected on init. Defaults to 'US'. */
  defaultCountry?: CountryCode;
  /** Placeholder for the number input field. */
  placeholder?: string;
}
