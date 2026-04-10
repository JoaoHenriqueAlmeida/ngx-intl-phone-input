import { Injectable } from '@angular/core';
import { COUNTRIES } from '../data/countries';
import { COUNTRY_NAMES } from '../data/country-names';
import { CountryCode, CountryData, SupportedLocale } from '../types';

@Injectable({ providedIn: 'root' })
export class CountryService {
  /** Raw country list in English — source of truth, never mutated. */
  readonly all: readonly CountryData[] = COUNTRIES;

  /**
   * Returns the full country list with names translated to the given locale.
   * Falls back to the English name when a translation is missing.
   */
  getAll(locale: SupportedLocale = 'en-US'): CountryData[] {
    if (locale === 'en-US') return [...this.all];
    return this.all.map((c) => this.localize(c, locale));
  }

  /**
   * Find a country by its ISO code, with name translated to the given locale.
   * Returns undefined if not found.
   */
  findByIso(iso: CountryCode, locale: SupportedLocale = 'en-US'): CountryData | undefined {
    const country = this.all.find((c) => c.iso === iso);
    return country ? this.localize(country, locale) : undefined;
  }

  /**
   * Search countries by (translated) name, ISO code, or dial code.
   * - Matching is case-insensitive.
   * - Dial code query can be entered with or without the '+' prefix.
   * - Returns all countries when query is empty.
   *
   * Examples (en-US):
   *   search('bra')   → [Brazil]
   *   search('BR')    → [Brazil]
   *   search('+55')   → [Brazil]
   *   search('55')    → [Brazil]
   *   search('7')     → [Kazakhstan, Russia]  ← both listed, user chooses
   */
  search(query: string, locale: SupportedLocale = 'en-US'): CountryData[] {
    const q = query.trim().replace(/^\+/, '').toLowerCase();
    if (!q) return this.getAll(locale);

    return this.getAll(locale).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.dialCode.includes(q),
    );
  }

  /**
   * Returns the default country, falling back to 'US' if the
   * provided ISO code is not found in the list.
   */
  resolveDefault(iso?: CountryCode, locale: SupportedLocale = 'en-US'): CountryData {
    return (iso ? this.findByIso(iso, locale) : undefined) ?? this.findByIso('US', locale)!;
  }

  private localize(country: CountryData, locale: SupportedLocale): CountryData {
    const translated = COUNTRY_NAMES[locale]?.[country.iso];
    return translated ? { ...country, name: translated } : country;
  }
}
