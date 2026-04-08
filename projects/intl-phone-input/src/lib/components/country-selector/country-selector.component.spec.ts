import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CountrySelectorComponent } from './country-selector.component';
import { CountryOptionDirective } from './country-option.directive';
import { COUNTRIES } from '../../data/countries';
import { CountryData } from '../../types';

const brazil = COUNTRIES.find((c) => c.iso === 'BR')!;
const usa = COUNTRIES.find((c) => c.iso === 'US')!;

describe('CountrySelectorComponent', () => {
  let fixture: ComponentFixture<CountrySelectorComponent>;
  let component: CountrySelectorComponent;
  let overlayContainer: OverlayContainer;
  let overlayEl: HTMLElement;

  function getTrigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.ipi-country-trigger');
  }

  function getPanel(): HTMLElement | null {
    return overlayEl.querySelector('.ipi-dropdown-panel');
  }

  function getOptions(): NodeListOf<HTMLElement> {
    return overlayEl.querySelectorAll<HTMLElement>('.ipi-country-option');
  }

  function openDropdown(): void {
    getTrigger().click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountrySelectorComponent],
    }).compileComponents();

    overlayContainer = TestBed.inject(OverlayContainer);
    overlayEl = overlayContainer.getContainerElement();

    fixture = TestBed.createComponent(CountrySelectorComponent);
    component = fixture.componentInstance;
    component.selectedCountry = brazil;
    fixture.detectChanges();
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  // ---------------------------------------------------------------------------
  // Trigger rendering
  // ---------------------------------------------------------------------------

  describe('trigger', () => {
    it('renders the selected country flag', () => {
      expect(getTrigger().querySelector('.ipi-flag')?.textContent).toBe(brazil.flag);
    });

    it('renders the selected country dial code', () => {
      expect(getTrigger().querySelector('.ipi-dial-code')?.textContent).toBe(
        `+${brazil.dialCode}`,
      );
    });

    it('has role="combobox"', () => {
      expect(getTrigger().getAttribute('role')).toBe('combobox');
    });

    it('has aria-expanded="false" when closed', () => {
      expect(getTrigger().getAttribute('aria-expanded')).toBe('false');
    });

    it('has aria-haspopup="listbox"', () => {
      expect(getTrigger().getAttribute('aria-haspopup')).toBe('listbox');
    });
  });

  // ---------------------------------------------------------------------------
  // Open / close
  // ---------------------------------------------------------------------------

  describe('open / close', () => {
    it('panel is absent before first open', () => {
      expect(getPanel()).toBeNull();
    });

    it('opens the dropdown panel on trigger click', () => {
      openDropdown();
      expect(getPanel()).not.toBeNull();
    });

    it('sets aria-expanded="true" when open', () => {
      openDropdown();
      expect(getTrigger().getAttribute('aria-expanded')).toBe('true');
    });

    it('closes the panel when close() is called', () => {
      openDropdown();
      component.close();
      fixture.detectChanges();
      expect(getPanel()).toBeNull();
    });

    it('does not open a second overlay if already open', () => {
      openDropdown();
      openDropdown();
      expect(overlayEl.querySelectorAll('.ipi-dropdown-panel').length).toBe(1);
    });

    it('resets aria-expanded to "false" after close', () => {
      openDropdown();
      component.close();
      fixture.detectChanges();
      expect(getTrigger().getAttribute('aria-expanded')).toBe('false');
    });
  });

  // ---------------------------------------------------------------------------
  // Country list
  // ---------------------------------------------------------------------------

  describe('country list', () => {
    beforeEach(() => openDropdown());

    it('renders all countries on open', () => {
      expect(getOptions().length).toBe(component['countryService'].all.length);
    });

    it('marks the selected country option with ipi-country-option--selected', () => {
      const selected = overlayEl.querySelector<HTMLElement>('.ipi-country-option--selected');
      expect(selected?.querySelector('.ipi-country-option__name')?.textContent).toBe(brazil.name);
    });

    it('each option contains flag, name, and dial code spans', () => {
      const firstOption = getOptions()[0];
      expect(firstOption.querySelector('.ipi-country-option__flag')).not.toBeNull();
      expect(firstOption.querySelector('.ipi-country-option__name')).not.toBeNull();
      expect(firstOption.querySelector('.ipi-country-option__dial-code')).not.toBeNull();
    });

    it('list has role="listbox"', () => {
      const list = overlayEl.querySelector('.ipi-country-list');
      expect(list?.getAttribute('role')).toBe('listbox');
    });

    it('each option has role="option"', () => {
      const roles = Array.from(getOptions()).map((el) => el.getAttribute('role'));
      expect(roles.every((r) => r === 'option')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  describe('selection', () => {
    let countryChangeSpy: jest.Mock;

    beforeEach(() => {
      countryChangeSpy = jest.fn();
      component.countryChange.subscribe(countryChangeSpy);
      openDropdown();
    });

    it('emits countryChange when a country option is clicked', () => {
      const usaOption = Array.from(getOptions()).find(
        (el) => el.querySelector('.ipi-country-option__name')?.textContent === usa.name,
      )!;
      usaOption.click();
      expect(countryChangeSpy).toHaveBeenCalledWith(usa);
    });

    it('closes the panel after selecting a country', () => {
      const usaOption = Array.from(getOptions()).find(
        (el) => el.querySelector('.ipi-country-option__name')?.textContent === usa.name,
      )!;
      usaOption.click();
      fixture.detectChanges();
      expect(getPanel()).toBeNull();
    });

    it('emits countryChange on Enter key with active item', () => {
      const panel = getPanel()!;
      // Move to the first item (in case none is active)
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(countryChangeSpy).toHaveBeenCalledTimes(1);
      const emitted = countryChangeSpy.mock.calls[0][0] as CountryData;
      expect(emitted).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Search (uses FormControl directly to avoid DOM event timing issues)
  // ---------------------------------------------------------------------------

  describe('search', () => {
    beforeEach(() => openDropdown());

    it('filters countries when a query is set', fakeAsync(() => {
      component.searchCtrl.setValue('braz');
      tick(150);
      fixture.detectChanges();

      expect(component.filteredCountries.length).toBe(1);
      expect(component.filteredCountries[0].iso).toBe('BR');
    }));

    it('shows both Russia and Kazakhstan for dial code query "7"', fakeAsync(() => {
      component.searchCtrl.setValue('7');
      tick(150);
      fixture.detectChanges();

      const isos = component.filteredCountries.map((c) => c.iso);
      expect(isos).toContain('RU');
      expect(isos).toContain('KZ');
    }));

    it('shows all countries when search is cleared', fakeAsync(() => {
      component.searchCtrl.setValue('braz');
      tick(150);
      fixture.detectChanges();

      component.searchCtrl.setValue('');
      tick(150);
      fixture.detectChanges();

      expect(component.filteredCountries.length).toBe(component['countryService'].all.length);
    }));
  });

  // ---------------------------------------------------------------------------
  // State reset on close
  // ---------------------------------------------------------------------------

  describe('state reset on close', () => {
    it('resets search and restores full list when reopened', fakeAsync(() => {
      openDropdown();
      component.searchCtrl.setValue('braz');
      tick(150);
      fixture.detectChanges();
      expect(component.filteredCountries.length).toBe(1);

      component.close();
      fixture.detectChanges();

      openDropdown();
      expect(component.searchCtrl.value).toBe('');
      expect(component.filteredCountries.length).toBe(component['countryService'].all.length);
    }));
  });

  // ---------------------------------------------------------------------------
  // Keyboard navigation — trigger
  // ---------------------------------------------------------------------------

  describe('trigger keyboard', () => {
    it('opens on ArrowDown', () => {
      getTrigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      expect(getPanel()).not.toBeNull();
    });

    it('opens on Enter', () => {
      getTrigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();
      expect(getPanel()).not.toBeNull();
    });

    it('opens on Space', () => {
      getTrigger().dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();
      expect(getPanel()).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard navigation — panel
  // ---------------------------------------------------------------------------

  describe('panel keyboard', () => {
    beforeEach(() => openDropdown());

    it('closes on Escape', () => {
      const panel = getPanel()!;
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(getPanel()).toBeNull();
    });

    it('marks an item active after ArrowDown', () => {
      const panel = getPanel()!;
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      expect(component.keyManager.activeItem).not.toBeNull();
    });

    it('active option gains ipi-country-option--active class', () => {
      const panel = getPanel()!;
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      const activeId = component.keyManager.activeItem?.id;
      const activeEl = activeId ? document.getElementById(activeId) : null;
      expect(activeEl?.classList.contains('ipi-country-option--active')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  describe('accessibility', () => {
    it('aria-activedescendant is absent when closed', () => {
      expect(getTrigger().getAttribute('aria-activedescendant')).toBeNull();
    });

    it('aria-activedescendant matches active option id after keyboard navigation', () => {
      openDropdown();
      const panel = getPanel()!;
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      const activeId = component.keyManager.activeItem?.id;
      expect(getTrigger().getAttribute('aria-activedescendant')).toBe(activeId ?? null);
    });

    it('selected option has aria-selected="true"', () => {
      openDropdown();
      const selected = overlayEl.querySelector('[aria-selected="true"]');
      expect(selected).not.toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// CountryOptionDirective unit tests (via component TestBed setup)
// ---------------------------------------------------------------------------

describe('CountryOptionDirective', () => {
  let fixture: ComponentFixture<CountrySelectorComponent>;
  let component: CountrySelectorComponent;
  let overlayContainer: OverlayContainer;
  let directive: CountryOptionDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountrySelectorComponent],
    }).compileComponents();

    overlayContainer = TestBed.inject(OverlayContainer);
    fixture = TestBed.createComponent(CountrySelectorComponent);
    component = fixture.componentInstance;
    component.selectedCountry = brazil;
    fixture.detectChanges();

    // Open the dropdown so directives are instantiated and registered
    fixture.nativeElement.querySelector('.ipi-country-trigger').click();
    fixture.detectChanges();

    directive = (component as any).options[0] as CountryOptionDirective;
  });

  afterEach(() => overlayContainer.ngOnDestroy());

  it('setActiveStyles sets isActive to true', () => {
    directive.setActiveStyles();
    expect(directive.isActive).toBe(true);
  });

  it('setInactiveStyles sets isActive to false', () => {
    directive.setActiveStyles();
    directive.setInactiveStyles();
    expect(directive.isActive).toBe(false);
  });

  it('getLabel returns the country name', () => {
    expect(directive.getLabel()).toBe(directive.country.name);
  });

  it('disabled is always false', () => {
    expect(directive.disabled).toBe(false);
  });

  it('id is unique per directive instance', () => {
    const options = (component as any).options as CountryOptionDirective[];
    const ids = options.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('self-registers with parent on init (options array is non-empty)', () => {
    expect((component as any).options.length).toBeGreaterThan(0);
  });
});
