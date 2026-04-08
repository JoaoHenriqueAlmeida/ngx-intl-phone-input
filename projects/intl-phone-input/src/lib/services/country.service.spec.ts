import { TestBed } from '@angular/core/testing';
import { CountryService } from './country.service';

describe('CountryService', () => {
  let service: CountryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CountryService);
  });

  describe('all', () => {
    it('should contain a non-empty list of countries', () => {
      expect(service.all.length).toBeGreaterThan(0);
    });

    it('should contain Suriname (SR)', () => {
      expect(service.all.find((c) => c.iso === 'SR')).toBeDefined();
    });

    it('should contain both Russia (RU) and Kazakhstan (KZ) with dial code 7', () => {
      const ru = service.all.find((c) => c.iso === 'RU');
      const kz = service.all.find((c) => c.iso === 'KZ');
      expect(ru?.dialCode).toBe('7');
      expect(kz?.dialCode).toBe('7');
    });
  });

  describe('findByIso', () => {
    it('should return the correct country for a valid ISO code', () => {
      const brazil = service.findByIso('BR');
      expect(brazil).toBeDefined();
      expect(brazil?.name).toBe('Brazil');
      expect(brazil?.dialCode).toBe('55');
    });

    it('should return undefined for an unknown ISO code', () => {
      // Casting to test the defensive path
      expect(service.findByIso('XX' as any)).toBeUndefined();
    });
  });

  describe('search', () => {
    it('should return all countries for an empty query', () => {
      expect(service.search('').length).toBe(service.all.length);
    });

    it('should match by country name (case-insensitive)', () => {
      const results = service.search('bra');
      expect(results.some((c) => c.iso === 'BR')).toBe(true);
    });

    it('should match by ISO code (case-insensitive)', () => {
      const results = service.search('br');
      expect(results.some((c) => c.iso === 'BR')).toBe(true);
    });

    it('should match by dial code without + prefix', () => {
      const results = service.search('55');
      expect(results.some((c) => c.iso === 'BR')).toBe(true);
    });

    it('should match by dial code with + prefix stripped', () => {
      const results = service.search('+55');
      expect(results.some((c) => c.iso === 'BR')).toBe(true);
    });

    it('should return both Russia and Kazakhstan for dial code 7', () => {
      const results = service.search('7');
      expect(results.some((c) => c.iso === 'RU')).toBe(true);
      expect(results.some((c) => c.iso === 'KZ')).toBe(true);
    });

    it('should return Suriname for dial code 597', () => {
      const results = service.search('597');
      expect(results.some((c) => c.iso === 'SR')).toBe(true);
      expect(results.length).toBe(1);
    });

    it('should return an empty array when no match is found', () => {
      expect(service.search('zzzzz')).toEqual([]);
    });

    it('should trim whitespace from the query', () => {
      const results = service.search('  brazil  ');
      expect(results.some((c) => c.iso === 'BR')).toBe(true);
    });
  });

  describe('resolveDefault', () => {
    it('should return the country for a valid ISO code', () => {
      expect(service.resolveDefault('BR')?.iso).toBe('BR');
    });

    it('should fall back to US when no ISO code is provided', () => {
      expect(service.resolveDefault()?.iso).toBe('US');
    });

    it('should fall back to US for an unknown ISO code', () => {
      expect(service.resolveDefault('XX' as any)?.iso).toBe('US');
    });
  });
});
