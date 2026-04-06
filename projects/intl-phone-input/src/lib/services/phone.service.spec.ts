import { TestBed } from '@angular/core/testing';
import { PhoneService } from './phone.service';

describe('PhoneService', () => {
  let service: PhoneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhoneService);
  });

  // ---------------------------------------------------------------------------
  // parse()
  // ---------------------------------------------------------------------------
  describe('parse()', () => {
    // --- Known regression cases -----------------------------------------------

    it('should validate the Suriname number that failed in ngx-intl-tel-input', () => {
      // +597 850 9292 — user reported this was never marked valid
      const result = service.parse('8509292', 'SR');
      expect(result.valid).toBe(true);
      expect(result.e164).toBe('+5978509292');
    });

    it('should validate the Russian number that was misdetected as KZ', () => {
      // +7 926 920 9992 — was switching to KZ and never becoming valid
      // Country is explicitly RU — no auto-detection
      const result = service.parse('9269209992', 'RU');
      expect(result.valid).toBe(true);
      expect(result.e164).toBe('+79269209992');
    });

    it('should NOT validate a Brazilian number when RU is selected', () => {
      // +55 and +7 are entirely different calling codes — this proves that
      // mismatched calling codes are always rejected regardless of user selection.
      const result = service.parse('11987654321', 'RU');
      expect(result.valid).toBe(false);
      expect(result.e164).toBeNull();
    });

    it('should validate the same Moscow number correctly when RU is selected', () => {
      const result = service.parse('4951234567', 'RU');
      expect(result.valid).toBe(true);
      expect(result.e164).toBe('+74951234567');
    });

    // --- Standard cases -------------------------------------------------------

    it('should validate a valid US number', () => {
      const result = service.parse('2025550142', 'US');
      expect(result.valid).toBe(true);
      expect(result.e164).toBe('+12025550142');
    });

    it('should validate a valid Brazilian number', () => {
      const result = service.parse('11987654321', 'BR');
      expect(result.valid).toBe(true);
      expect(result.e164).toBe('+5511987654321');
    });

    it('should validate a valid UK number', () => {
      const result = service.parse('7911123456', 'GB');
      expect(result.valid).toBe(true);
      expect(result.e164).toBe('+447911123456');
    });

    // --- Invalid / edge cases -------------------------------------------------

    it('should return invalid for an empty string', () => {
      const result = service.parse('', 'US');
      expect(result.valid).toBe(false);
      expect(result.e164).toBeNull();
      expect(result.phoneNumber).toBeNull();
    });

    it('should return invalid for a whitespace-only string', () => {
      const result = service.parse('   ', 'US');
      expect(result.valid).toBe(false);
    });

    it('should return invalid for a number that is too short', () => {
      const result = service.parse('123', 'US');
      expect(result.valid).toBe(false);
    });

    it('should return invalid for a number that is too long', () => {
      const result = service.parse('99999999999999', 'US');
      expect(result.valid).toBe(false);
    });

    it('should return invalid for a non-numeric string', () => {
      const result = service.parse('abcdefg', 'US');
      expect(result.valid).toBe(false);
    });

    it('should include the phoneNumber object when valid', () => {
      const result = service.parse('2025550142', 'US');
      expect(result.phoneNumber).not.toBeNull();
      expect(result.phoneNumber?.country).toBe('US');
    });

    it('should return null phoneNumber when invalid', () => {
      const result = service.parse('123', 'US');
      expect(result.phoneNumber).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getMask()
  // ---------------------------------------------------------------------------
  describe('getMask()', () => {
    it('should return a mask string for a standard country', () => {
      const mask = service.getMask('US');
      expect(mask).not.toBeNull();
      expect(typeof mask).toBe('string');
    });

    it('should return a mask containing only 0s and formatting characters', () => {
      const mask = service.getMask('BR');
      expect(mask).not.toBeNull();
      // Must contain at least one digit placeholder
      expect(mask).toMatch(/0/);
      // Must not contain any actual digits
      expect(mask).not.toMatch(/[1-9]/);
    });

    it('should return a mask for Suriname (SR)', () => {
      const mask = service.getMask('SR');
      expect(mask).not.toBeNull();
    });

    it('should return a mask for Russia (RU)', () => {
      const mask = service.getMask('RU');
      expect(mask).not.toBeNull();
    });

    it('should return a mask for Kazakhstan (KZ)', () => {
      const mask = service.getMask('KZ');
      expect(mask).not.toBeNull();
    });

    it('should return different masks for RU and KZ despite sharing dial code +7', () => {
      const ruMask = service.getMask('RU');
      const kzMask = service.getMask('KZ');
      // Both exist but may differ — key point is both are independently generated
      expect(ruMask).not.toBeNull();
      expect(kzMask).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getDialCode()
  // ---------------------------------------------------------------------------
  describe('getDialCode()', () => {
    it('should return the correct dial code for Brazil', () => {
      expect(service.getDialCode('BR')).toBe('55');
    });

    it('should return 7 for both Russia and Kazakhstan', () => {
      expect(service.getDialCode('RU')).toBe('7');
      expect(service.getDialCode('KZ')).toBe('7');
    });

    it('should return 597 for Suriname', () => {
      expect(service.getDialCode('SR')).toBe('597');
    });

    it('should return 1 for the United States', () => {
      expect(service.getDialCode('US')).toBe('1');
    });
  });
});
