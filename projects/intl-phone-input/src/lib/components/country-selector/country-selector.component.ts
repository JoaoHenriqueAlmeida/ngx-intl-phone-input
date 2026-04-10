import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CountryData, SupportedLocale } from '../../types';
import { CountryService } from '../../services/country.service';
import { CountryOptionDirective } from './country-option.directive';

@Component({
  selector: 'ipi-country-selector',
  standalone: true,
  templateUrl: './country-selector.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CountryOptionDirective],
})
export class CountrySelectorComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) selectedCountry!: CountryData;
  @Input() locale: SupportedLocale = 'en-US';
  @Output() countryChange = new EventEmitter<CountryData>();

  @ViewChild('trigger', { read: ElementRef })
  triggerRef!: ElementRef<HTMLButtonElement>;

  @ViewChild('dropdownTpl')
  dropdownTpl!: TemplateRef<void>;

  // --- Internal state ---
  isOpen = false;
  searchCtrl = new FormControl('', { nonNullable: true });
  filteredCountries: CountryData[] = [];

  // CDK
  private overlayRef!: OverlayRef;
  private portal!: TemplatePortal<void>;
  keyManager: ActiveDescendantKeyManager<CountryOptionDirective> | undefined;

  // Registration array — populated by CountryOptionDirective self-registration.
  // @ViewChildren cannot cross CDK portal boundaries, so directives inject
  // CountrySelectorComponent and call registerOption/deregisterOption themselves.
  private readonly options: CountryOptionDirective[] = [];

  private readonly destroy$ = new Subject<void>();

  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly countryService = inject(CountryService);

  ngAfterViewInit(): void {
    this.filteredCountries = this.countryService.getAll(this.locale);

    // Build the overlay once — reused across open/close cycles.
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.triggerRef)
        .withPositions([
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
          },
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
          },
        ])
        .withFlexibleDimensions(false)
        .withViewportMargin(8),
    });

    // Portal created once — OverlayRef.attach/detach reuses it safely.
    this.portal = new TemplatePortal(this.dropdownTpl, this.vcr);

    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.close();
      });

    this.overlayRef
      .detachments()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onDetach());

    this.searchCtrl.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => this.updateFilter(query));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayRef?.dispose();
  }

  openDropdown(): void {
    if (this.isOpen) return;

    this.overlayRef.attach(this.portal);
    this.isOpen = true;
    this.cdr.detectChanges();

    this.initKeyManager();
    this.scrollToSelected();

    const searchEl = this.overlayRef.overlayElement.querySelector(
      '.ipi-search-input',
    ) as HTMLInputElement | null;
    searchEl?.focus();
  }

  close(): void {
    this.overlayRef.detach();
  }

  selectCountry(country: CountryData): void {
    this.countryChange.emit(country);
    this.close();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (
      event.key === ' ' ||
      event.key === 'Enter' ||
      event.key === 'ArrowDown'
    ) {
      event.preventDefault();
      this.openDropdown();
    }
  }

  onDropdownKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.triggerRef.nativeElement.focus();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const active = this.keyManager?.activeItem;
      if (active) this.selectCountry(active.country);
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }

    this.keyManager?.onKeydown(event);
    this.cdr.markForCheck();
    this.scrollActiveItemIntoView();
  }

  registerOption(opt: CountryOptionDirective): void {
    this.options.push(opt);
  }

  deregisterOption(opt: CountryOptionDirective): void {
    const i = this.options.indexOf(opt);
    if (i > -1) this.options.splice(i, 1);
  }

  private onDetach(): void {
    this.isOpen = false;
    this.searchCtrl.setValue('', { emitEvent: false });
    this.filteredCountries = this.countryService.getAll(this.locale);
    this.cdr.markForCheck();
  }

  private updateFilter(query: string): void {
    this.filteredCountries = this.countryService.search(query, this.locale);
    this.cdr.markForCheck();
  }

  private initKeyManager(): void {
    this.keyManager = new ActiveDescendantKeyManager<CountryOptionDirective>(
      this.options,
    )
      .withWrap()
      .withTypeAhead();

    const selectedIndex = this.filteredCountries.findIndex(
      (c) => c.iso === this.selectedCountry.iso,
    );
    if (selectedIndex >= 0) {
      this.keyManager.setActiveItem(selectedIndex);
    }
  }

  private scrollToSelected(): void {
    // Give the DOM a tick to render before scrolling.
    Promise.resolve().then(() => this.scrollActiveItemIntoView());
  }

  private scrollActiveItemIntoView(): void {
    const id = this.keyManager?.activeItem?.id;
    if (id) {
      // scrollIntoView is not available in jsdom — guard with optional chaining
      document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' });
    }
  }
}
