import { NgModule } from '@angular/core';
import { CountrySelectorComponent } from './components/country-selector/country-selector.component';
import { PhoneInputComponent } from './components/phone-input/phone-input.component';

@NgModule({
  imports: [CountrySelectorComponent, PhoneInputComponent],
  exports: [CountrySelectorComponent, PhoneInputComponent],
})
export class IntlPhoneInputModule {}
