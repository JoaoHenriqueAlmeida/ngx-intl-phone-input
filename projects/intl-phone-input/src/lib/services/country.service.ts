import { Injectable } from '@angular/core';
import { COUNTRIES } from '../data/countries';
import { CountryCode, CountryData } from '../types';

@Injectable({ providedIn: 'root' })
export class CountryService {
  /** Full sorted country list — never mutated. */
  readonly all: readonly CountryData[] = COUNTRIES;

  /**
   * Find a country by its ISO code.
   * Returns undefined if not found.
   */
  findByIso(iso: CountryCode): CountryData | undefined {
    return this.all.find((c) => c.iso === iso);
  }

  /**
   * Search countries by name, ISO code, or dial code.
   * - Matching is case-insensitive.
   * - Dial code query can be entered with or without the '+' prefix.
   * - Returns all countries when query is empty.
   *
   * Examples:
   *   search('bra')   → [Brazil]
   *   search('BR')    → [Brazil]
   *   search('+55')   → [Brazil]
   *   search('55')    → [Brazil]
   *   search('7')     → [Kazakhstan, Russia]  ← both listed, user chooses
   */
  search(query: string): CountryData[] {
    const q = query.trim().replace(/^\+/, '').toLowerCase();

    if (!q) return [...this.all];

    return this.all.filter(
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
  resolveDefault(iso?: CountryCode): CountryData {
    return (iso ? this.findByIso(iso) : undefined) ?? this.findByIso('US')!;
  }
}
