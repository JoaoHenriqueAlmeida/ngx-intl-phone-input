import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CountryCode, PhoneInputComponent } from 'intl-phone-input';
import { CountryData, PhoneStatus } from 'intl-phone-input';

const STORAGE_KEY = 'ngx-intl-phone-input-demo';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, PhoneInputComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  phone: string | null = localStorage.getItem(STORAGE_KEY) || null;
  defaultCountry: CountryCode = 'US';
  selectedCountryIso: CountryCode = 'US';
  status: PhoneStatus | null = null;
  saved = false;

  onCountryChange(country: CountryData): void {
    this.selectedCountryIso = country.iso;
  }

  onPhoneStatus(status: PhoneStatus): void {
    this.status = status;
    this.saved = false;
  }

  saveToStorage(): void {
    if (this.phone) {
      localStorage.setItem(STORAGE_KEY, this.phone);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.saved = true;
  }

  clearStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.phone = null;
    this.status = null;
    this.saved = false;
  }
}
