/**
 * Jest manual mock for angular-imask.
 *
 * Replaces the real IMaskDirective with a minimal Angular directive stub that:
 *  - implements ControlValueAccessor (so [formControl] wiring works)
 *  - does NOT try to initialise the real IMask library (which fails in jsdom)
 *  - passes through typed values to the connected FormControl unchanged
 */
import {
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  Input,
  OnChanges,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[imask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IMaskDirective),
      multi: true,
    },
  ],
})
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class IMaskDirective implements ControlValueAccessor, OnChanges {
  @Input() imask: unknown;
  @Input() unmask: boolean | 'typed' = false;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly el: ElementRef<HTMLInputElement>) {}

  ngOnChanges(): void {}

  writeValue(value: string | null): void {
    this.el.nativeElement.value = value ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    this.onChange(value);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }
}

export const IMaskModule = {
  ngModule: class IMaskModule {},
};
