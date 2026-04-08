import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OverlayContainer } from '@angular/cdk/overlay';
import { By } from '@angular/platform-browser';
import { PhoneInputComponent } from './phone-input.component';
import { COUNTRIES } from '../../data/countries';

const brazil = COUNTRIES.find((c) => c.iso === 'BR')!;
const usa = COUNTRIES.find((c) => c.iso === 'US')!;
const russia = COUNTRIES.find((c) => c.iso === 'RU')!;

// ---------------------------------------------------------------------------
// Standalone component tests (no ngModel wrapper)
// ---------------------------------------------------------------------------

describe('PhoneInputComponent (standalone)', () => {
  let fixture: ComponentFixture<PhoneInputComponent>;
  let component: PhoneInputComponent;
  let overlayContainer: OverlayContainer;

  function getInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.ipi-phone-input');
  }

  function getCountryTrigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.ipi-country-trigger');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoneInputComponent],
    }).compileComponents();

    overlayContainer = TestBed.inject(OverlayContainer);
    fixture = TestBed.createComponent(PhoneInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => overlayContainer.ngOnDestroy());

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders the country trigger', () => {
      expect(getCountryTrigger()).not.toBeNull();
    });

    it('renders the phone input', () => {
      expect(getInput()).not.toBeNull();
    });

    it('defaults to US when no defaultCountry is set', () => {
      expect(component.selectedCountry.iso).toBe('US');
    });

    it('uses defaultCountry when provided', () => {
      component.defaultCountry = 'BR';
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.selectedCountry.iso).toBe('BR');
    });

    it('applies ipi-focused class when input is focused', () => {
      component.onFocus();
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('ipi-focused')).toBe(true);
    });

    it('removes ipi-focused class on blur', () => {
      component.onFocus();
      component.onBlur();
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('ipi-focused')).toBe(false);
    });

    it('applies ipi-disabled class when disabled', () => {
      component.setDisabledState(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('ipi-disabled')).toBe(true);
    });

    it('sets placeholder on the input', () => {
      fixture.componentRef.setInput('placeholder', 'Phone number');
      fixture.detectChanges();
      expect(getInput().placeholder).toBe('Phone number');
    });
  });

  // -------------------------------------------------------------------------
  // Masking
  // -------------------------------------------------------------------------

  describe('masking', () => {
    it('sets a mask for US on init', () => {
      expect(component.maskOptions).toEqual({ mask: '(000) 000-0000' });
    });

    it('updates the mask when country changes to BR', () => {
      component.onCountrySelected(brazil);
      fixture.detectChanges();
      expect(component.maskOptions).toEqual({ mask: '(00) 00000-0000' });
    });
  });

  // -------------------------------------------------------------------------
  // ControlValueAccessor — writeValue
  // -------------------------------------------------------------------------

  describe('writeValue', () => {
    it('sets empty string for null', () => {
      component.writeValue(null);
      expect(component.inputCtrl.value).toBe('');
    });

    it('strips dial code from E.164 value', () => {
      component.selectedCountry = brazil;
      component.writeValue('+5511987654321');
      expect(component.inputCtrl.value).toBe('11987654321');
    });

    it('strips US dial code (+1)', () => {
      component.selectedCountry = usa;
      component.writeValue('+12125551234');
      expect(component.inputCtrl.value).toBe('2125551234');
    });
  });

  // -------------------------------------------------------------------------
  // ControlValueAccessor — onChange
  // -------------------------------------------------------------------------

  describe('onChange via inputCtrl', () => {
    it('calls onChange with null when input is empty', () => {
      const spy = jest.fn();
      component.registerOnChange(spy);
      component.inputCtrl.setValue('');
      expect(spy).toHaveBeenCalledWith(null);
    });

    it('calls onChange with E.164 for a valid BR number', fakeAsync(() => {
      component.selectedCountry = brazil;
      component['updateMask']();
      const spy = jest.fn();
      component.registerOnChange(spy);

      component.inputCtrl.setValue('11987654321');
      tick();

      const calls = spy.mock.calls;
      const validCall = calls.find(([v]) => v !== null);
      expect(validCall).toBeDefined();
      expect(validCall![0]).toMatch(/^\+55/);
    }));

    it('calls onChange with null for an incomplete number', () => {
      component.selectedCountry = brazil;
      const spy = jest.fn();
      component.registerOnChange(spy);
      component.inputCtrl.setValue('1198');
      expect(spy).toHaveBeenCalledWith(null);
    });
  });

  // -------------------------------------------------------------------------
  // Validator
  // -------------------------------------------------------------------------

  describe('validate', () => {
    it('returns null for empty inputCtrl value', () => {
      component.selectedCountry = usa;
      component.inputCtrl.setValue('', { emitEvent: false });
      expect(component.validate(component.inputCtrl)).toBeNull();
    });

    it('returns { invalidPhone: true } for an invalid number', () => {
      component.selectedCountry = usa;
      component.inputCtrl.setValue('123', { emitEvent: false });
      expect(component.validate(component.inputCtrl)).toEqual({ invalidPhone: true });
    });

    it('returns null for a valid US number', () => {
      component.selectedCountry = usa;
      component.inputCtrl.setValue('2125551234', { emitEvent: false });
      expect(component.validate(component.inputCtrl)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Country change
  // -------------------------------------------------------------------------

  describe('country change', () => {
    it('emits countryChange when a new country is selected', () => {
      const spy = jest.fn();
      component.countryChange.subscribe(spy);
      component.onCountrySelected(brazil);
      expect(spy).toHaveBeenCalledWith(brazil);
    });

    it('updates selectedCountry', () => {
      component.onCountrySelected(russia);
      expect(component.selectedCountry.iso).toBe('RU');
    });

    it('calls onValidatorChange when country changes', () => {
      const spy = jest.fn();
      component.registerOnValidatorChange(spy);
      component.onCountrySelected(brazil);
      expect(spy).toHaveBeenCalled();
    });

    it('re-evaluates the current value after country change', () => {
      const spy = jest.fn();
      component.registerOnChange(spy);

      // Set an obviously incomplete number
      component.selectedCountry = usa;
      component.inputCtrl.setValue('555', { emitEvent: false });

      // Switch to Brazil — 3-digit raw value is not a valid number for any country
      component.onCountrySelected(brazil);
      const lastCall = spy.mock.calls[spy.mock.calls.length - 1][0];
      expect(lastCall).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // setDisabledState
  // -------------------------------------------------------------------------

  describe('disabled state', () => {
    it('disables the inputCtrl', () => {
      component.setDisabledState(true);
      expect(component.inputCtrl.disabled).toBe(true);
    });

    it('re-enables the inputCtrl', () => {
      component.setDisabledState(true);
      component.setDisabledState(false);
      expect(component.inputCtrl.enabled).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Touched / blur
  // -------------------------------------------------------------------------

  describe('touched', () => {
    it('calls onTouched on blur', () => {
      const spy = jest.fn();
      component.registerOnTouched(spy);
      component.onBlur();
      expect(spy).toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// ngModel integration tests
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [PhoneInputComponent, FormsModule],
  template: `
    <ngx-intl-phone-input
      [(ngModel)]="phone"
      [defaultCountry]="defaultCountry"
      (countryChange)="onCountryChange($event)" />
  `,
})
class TestHostComponent {
  phone: string | null = null;
  defaultCountry: 'BR' | 'US' = 'BR';
  lastCountry = '';
  onCountryChange(c: { iso: string }): void {
    this.lastCountry = c.iso;
  }
}

describe('PhoneInputComponent (ngModel integration)', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let overlayContainer: OverlayContainer;
  let phoneComp: PhoneInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    overlayContainer = TestBed.inject(OverlayContainer);
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();

    const debugEl: DebugElement = fixture.debugElement.query(
      By.directive(PhoneInputComponent),
    );
    phoneComp = debugEl.componentInstance as PhoneInputComponent;
  });

  afterEach(() => overlayContainer.ngOnDestroy());

  it('binds defaultCountry to selectedCountry', () => {
    expect(phoneComp.selectedCountry.iso).toBe('BR');
  });

  it('writeValue propagates from host to inputCtrl', () => {
    // Call writeValue directly — this is what ngModel invokes under the hood
    phoneComp.writeValue('+5511987654321');
    expect(phoneComp.inputCtrl.value).toBe('11987654321');
  });

  it('valid number updates host.phone to E.164', fakeAsync(() => {
    phoneComp.selectedCountry = brazil;
    phoneComp.inputCtrl.setValue('11987654321');
    tick();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(host.phone).toMatch(/^\+55/);
  }));

  it('invalid number sets host.phone to null', fakeAsync(() => {
    host.phone = '+5511987654321';
    fixture.detectChanges();
    tick();

    phoneComp.selectedCountry = brazil;
    phoneComp.inputCtrl.setValue('123');
    tick();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(host.phone).toBeNull();
  }));

  it('countryChange output fires on the host', () => {
    phoneComp.onCountrySelected(usa);
    fixture.detectChanges();
    expect(host.lastCountry).toBe('US');
  });
});
