import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
  forwardRef,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  ControlValueAccessor,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { IMaskDirective } from 'angular-imask';
import { CountryData, CountryCode } from '../../types';
import { CountryService } from '../../services/country.service';
import { PhoneService } from '../../services/phone.service';
import { CountrySelectorComponent } from '../country-selector/country-selector.component';

export interface PhoneStatus {
  isPossible: boolean;
  isValid: boolean;
  e164: string | null;
}

@Component({
  selector: 'ngx-intl-phone-input',
  standalone: true,
  templateUrl: './phone-input.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CountrySelectorComponent, IMaskDirective],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
  host: {
    '[class.ipi-focused]': 'isFocused',
    '[class.ipi-disabled]': 'isDisabled',
    '[class.ipi-invalid]': 'isInvalid',
  },
})
export class PhoneInputComponent
  implements ControlValueAccessor, Validator, OnInit, OnDestroy
{
  @Input() defaultCountry?: CountryCode;
  @Input() placeholder = '';
  @Output() countryChange = new EventEmitter<CountryData>();
  @Output() phoneStatus = new EventEmitter<PhoneStatus>();

  // --- Exposed state ---
  selectedCountry!: CountryData;
  maskOptions: { mask: string } | { mask: RegExp } = { mask: /^\d{1,15}$/ };
  isFocused = false;
  isDisabled = false;
  isInvalid = false;

  // Internal FormControl holds unmasked digits (IMask writes the raw digits here)
  readonly inputCtrl = new FormControl('', { nonNullable: true });

  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};
  private pendingValue: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly countryService = inject(CountryService);
  private readonly phoneService = inject(PhoneService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.selectedCountry = this.countryService.resolveDefault(this.defaultCountry);
    this.updateMask();

    // Apply any value that arrived via writeValue before ngOnInit ran
    if (this.pendingValue !== null) {
      this.writeValue(this.pendingValue);
      this.pendingValue = null;
    }

    // Subscribe to raw digit changes from the masked input
    this.inputCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((raw) => {
      this.emitParsedValue(raw);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------------------------------------------------------------------------
  // ControlValueAccessor
  // ---------------------------------------------------------------------------

  writeValue(value: string | null): void {
    // selectedCountry may not be set yet if writeValue is called before ngOnInit
    if (!this.selectedCountry) {
      this.pendingValue = value;
      return;
    }
    const national = this.toNationalNumber(value, this.selectedCountry);
    this.inputCtrl.setValue(national, { emitEvent: false });
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    isDisabled ? this.inputCtrl.disable({ emitEvent: false }) : this.inputCtrl.enable({ emitEvent: false });
    this.cdr.markForCheck();
  }

  // ---------------------------------------------------------------------------
  // Validator
  // ---------------------------------------------------------------------------

  validate(_control: AbstractControl): ValidationErrors | null {
    const raw = this.inputCtrl.value;
    if (!raw?.trim()) return null;
    const { valid } = this.phoneService.parse(raw, this.selectedCountry.iso);
    return valid ? null : { invalidPhone: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  onCountrySelected(country: CountryData): void {
    this.selectedCountry = country;
    this.updateMask();
    this.countryChange.emit(country);

    // Re-evaluate current raw value against the new country
    this.emitParsedValue(this.inputCtrl.value);
    this.onValidatorChange();
    this.cdr.markForCheck();
  }

  onFocus(): void {
    this.isFocused = true;
    this.cdr.markForCheck();
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
    this.cdr.markForCheck();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private emitParsedValue(raw: string): void {
    if (!raw?.trim()) {
      this.isInvalid = false;
      this.onChange(null);
      this.phoneStatus.emit({ isPossible: false, isValid: false, e164: null });
      return;
    }
    const { valid, isPossible, e164 } = this.phoneService.parse(raw, this.selectedCountry.iso);
    this.isInvalid = !valid;
    this.onChange(valid && e164 ? e164 : null);
    this.phoneStatus.emit({ isPossible, isValid: valid, e164: valid ? e164 : null });
  }

  private updateMask(): void {
    const mask = this.phoneService.getMask(this.selectedCountry.iso);
    this.maskOptions = mask ? { mask } : { mask: /^\d{1,15}$/ };
  }

  /**
   * Converts an incoming E.164 value to the national number digits for display.
   * e.g. '+5511987654321' with country BR (dialCode '55') → '11987654321'
   */
  private toNationalNumber(value: string | null, country: CountryData): string {
    if (!value) return '';
    const prefix = `+${country.dialCode}`;
    return value.startsWith(prefix) ? value.slice(prefix.length) : value.replace(/^\+/, '');
  }
}
