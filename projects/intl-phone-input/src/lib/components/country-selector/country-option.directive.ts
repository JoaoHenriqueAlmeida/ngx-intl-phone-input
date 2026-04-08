import {
  Directive,
  Input,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';
import { CountryData } from '../../types';
import { CountrySelectorComponent } from './country-selector.component';

let nextId = 0;

/**
 * Directive applied to each `<li>` in the country dropdown.
 * Implements CDK's `Highlightable` interface so that
 * `ActiveDescendantKeyManager` can drive keyboard navigation.
 *
 * Each instance self-registers with the parent `CountrySelectorComponent`
 * because `@ViewChildren` cannot cross CDK portal boundaries.
 */
@Directive({
  selector: '[ipiCountryOption]',
  standalone: true,
  host: {
    role: 'option',
    '[id]': 'id',
    '[class.ipi-country-option--active]': 'isActive',
    '[attr.aria-selected]': 'isSelected',
  },
})
export class CountryOptionDirective implements Highlightable, OnInit, OnDestroy {
  @Input({ required: true }) country!: CountryData;
  @Input() isSelected = false;

  readonly id = `ipi-option-${nextId++}`;
  isActive = false;
  readonly disabled = false;

  private readonly parent = inject(CountrySelectorComponent, { optional: true });

  ngOnInit(): void {
    this.parent?.registerOption(this);
  }

  ngOnDestroy(): void {
    this.parent?.deregisterOption(this);
  }

  /** Called by ActiveDescendantKeyManager when this item gains focus. */
  setActiveStyles(): void {
    this.isActive = true;
  }

  /** Called by ActiveDescendantKeyManager when this item loses focus. */
  setInactiveStyles(): void {
    this.isActive = false;
  }

  /** Used by ActiveDescendantKeyManager's typeahead feature. */
  getLabel(): string {
    return this.country.name;
  }
}
