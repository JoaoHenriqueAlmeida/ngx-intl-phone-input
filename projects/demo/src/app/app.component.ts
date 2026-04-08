import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CountryCode, PhoneInputComponent } from 'intl-phone-input';
import { CountryData } from 'intl-phone-input';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, PhoneInputComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  phone: string | null = null;
  defaultCountry: CountryCode = 'US';
  selectedCountryIso: CountryCode = 'US';

  onCountryChange(country: CountryData): void {
    this.selectedCountryIso = country.iso;
  }
}
