import { Injectable } from '@angular/core';
import {
  parsePhoneNumberWithError,
  isValidPhoneNumber,
  getExampleNumber,
  getCountryCallingCode,
  AsYouType,
  type PhoneNumber,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';
import { CountryCode } from '../types';

/**
 * Result of a parse attempt. Always check `valid` before using `e164`.
 */
export interface ParseResult {
  valid: boolean;
  /** E.164 string (e.g. '+5578509292') — only present when valid is true */
  e164: string | null;
  /** The parsed PhoneNumber object — only present when valid is true */
  phoneNumber: PhoneNumber | null;
}

@Injectable({ providedIn: 'root' })
export class PhoneService {
  /**
   * Validates and parses a raw number string in the context of a given
   * country. The country ISO is always the source of truth — we never
   * auto-detect or switch the country from the number alone.
   * This is what fixes the RU/KZ (+7) and SR (+597) issues.
   *
   * @param raw   The digits the user typed (no dial code prefix)
   * @param iso   The country the user selected in the dropdown
   */
  parse(raw: string, iso: CountryCode): ParseResult {
    if (!raw?.trim()) {
      return { valid: false, e164: null, phoneNumber: null };
    }

    try {
      const phoneNumber = parsePhoneNumberWithError(raw, iso);

      // When multiple countries share a dial code (e.g. RU/KZ → +7,
      // GB/GG/JE/IM → +44, US/CA → +1), libphonenumber-js may resolve to a
      // different country than the one the user selected. We accept the result
      // as long as the resolved country's calling code matches the selected
      // country's calling code — the user's dropdown selection is still the
      // source of truth for which dial code is prepended.
      // We reject only when the calling codes differ outright (e.g. selecting
      // KZ but getting back a number that belongs to an unrelated country).
      const selectedCallingCode = getCountryCallingCode(iso);
      const callingCodeMatches =
        phoneNumber.countryCallingCode === selectedCallingCode;

      const valid =
        callingCodeMatches &&
        phoneNumber.isValid() &&
        isValidPhoneNumber(raw, iso);

      return {
        valid,
        e164: valid ? phoneNumber.format('E.164') : null,
        phoneNumber: valid ? phoneNumber : null,
      };
    } catch {
      return { valid: false, e164: null, phoneNumber: null };
    }
  }

  /**
   * Generates an IMask pattern string for the given country by using
   * libphonenumber-js's example number and the AsYouType formatter.
   *
   * The pattern replaces every digit in the formatted example with '0'
   * (IMask's digit placeholder) while preserving spaces, dashes,
   * parentheses, and other formatting characters as literals.
   *
   * Example for BR: '(00) 00000-0000'
   * Example for US: '(000) 000-0000'
   * Example for SR: '000-0000'
   *
   * @returns An IMask-compatible mask string, or null if no example
   *          number is available for the country.
   */
  getMask(iso: CountryCode): string | null {
    try {
      const example = getExampleNumber(iso, examples);
      if (!example) return null;

      const nationalNumber = example.nationalNumber;
      const formatter = new AsYouType(iso);
      const formatted = formatter.input(nationalNumber);

      // Replace every digit with IMask's '0' placeholder
      return formatted.replace(/\d/g, '0');
    } catch {
      return null;
    }
  }

  /**
   * Returns the dial code for a given country ISO using the example
   * number metadata (e.g. 'BR' → '55', 'RU' → '7').
   * Kept here as a utility — CountryService is the primary source for
   * dial codes, but this provides a libphonenumber-based fallback.
   */
  getDialCode(iso: CountryCode): string | null {
    try {
      const example = getExampleNumber(iso, examples);
      return example?.countryCallingCode ?? null;
    } catch {
      return null;
    }
  }
}
