import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PhoneService } from '../services/phone.service';
import { CountryCode } from '../types';

/**
 * Returns an Angular ValidatorFn that validates a phone number string
 * (E.164 format) against the currently selected country.
 *
 * The validator is designed to be re-created whenever the selected country
 * changes — the PhoneInputComponent handles this automatically.
 *
 * Valid state  : control value is a valid E.164 string → no errors
 * Invalid state: control value is empty/null/invalid   → { invalidPhone: true }
 *
 * Usage (manual):
 *   control.setValidators(phoneValidator('BR', phoneService));
 *   control.updateValueAndValidity();
 *
 * Usage (via PhoneInputComponent + ngModel): handled automatically.
 */
export function phoneValidator(
  getCountry: () => CountryCode,
  phoneService: PhoneService,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;

    // Empty values are not our concern — let Angular's Validators.required
    // handle that separately if the consumer needs it.
    if (!value?.trim()) return null;

    const { valid, e164 } = phoneService.parse(value, getCountry());

    return valid && e164 ? null : { invalidPhone: true };
  };
}
