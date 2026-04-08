import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { PhoneService } from '../services/phone.service';
import { phoneValidator } from './phone.validator';
import { CountryCode } from '../types';

describe('phoneValidator', () => {
  let phoneService: PhoneService;

  // Helper: creates a FormControl with the validator bound to a given country
  const makeControl = (value: string | null, iso: CountryCode) => {
    let country = iso;
    const control = new FormControl(
      value,
      phoneValidator(() => country, phoneService),
    );
    // Expose a way to change the country and re-validate
    return {
      control,
      setCountry: (c: CountryCode) => {
        country = c;
      },
    };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    phoneService = TestBed.inject(PhoneService);
  });

  // ---------------------------------------------------------------------------
  // Empty / null values — validator must stay silent (not its job)
  // ---------------------------------------------------------------------------
  describe('empty values', () => {
    it('should return null for an empty string', () => {
      const { control } = makeControl('', 'US');
      expect(control.errors).toBeNull();
    });

    it('should return null for null', () => {
      const { control } = makeControl(null, 'US');
      expect(control.errors).toBeNull();
    });

    it('should return null for whitespace only', () => {
      const { control } = makeControl('   ', 'US');
      expect(control.errors).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Valid numbers
  // ---------------------------------------------------------------------------
  describe('valid numbers', () => {
    it('should return null for a valid US number', () => {
      const { control } = makeControl('2025550142', 'US');
      expect(control.errors).toBeNull();
    });

    it('should return null for the Suriname number that previously failed', () => {
      const { control } = makeControl('8509292', 'SR');
      expect(control.errors).toBeNull();
    });

    it('should return null for the Russian number that previously failed', () => {
      const { control } = makeControl('9269209992', 'RU');
      expect(control.errors).toBeNull();
    });

    it('should return null for a valid Brazilian number', () => {
      const { control } = makeControl('11987654321', 'BR');
      expect(control.errors).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid numbers
  // ---------------------------------------------------------------------------
  describe('invalid numbers', () => {
    it('should return { invalidPhone: true } for a too-short number', () => {
      const { control } = makeControl('123', 'US');
      expect(control.errors).toEqual({ invalidPhone: true });
    });

    it('should return { invalidPhone: true } for a non-numeric string', () => {
      const { control } = makeControl('abcdefg', 'US');
      expect(control.errors).toEqual({ invalidPhone: true });
    });

    it('should return { invalidPhone: true } for a number invalid in the selected country', () => {
      const { control } = makeControl('11987654321', 'RU');
      expect(control.errors).toEqual({ invalidPhone: true });
    });
  });

  // ---------------------------------------------------------------------------
  // Country switching — validator must reflect the latest country
  // ---------------------------------------------------------------------------
  describe('country switching', () => {
    it('should revalidate correctly after the country changes', () => {
      // Moscow area code 495 — valid in RU, invalid in DE (+49 is a different
      // calling code entirely, so the calling code check rejects it cleanly)
      let country: CountryCode = 'RU';
      const control = new FormControl(
        '4951234567',
        phoneValidator(() => country, phoneService),
      );

      // Valid as RU
      control.updateValueAndValidity();
      expect(control.errors).toBeNull();

      // Switch to US — different calling code, must be rejected
      country = 'US';
      control.updateValueAndValidity();
      expect(control.errors).toEqual({ invalidPhone: true });

      // Switch back to RU — valid again
      country = 'RU';
      control.updateValueAndValidity();
      expect(control.errors).toBeNull();
    });
  });
});
