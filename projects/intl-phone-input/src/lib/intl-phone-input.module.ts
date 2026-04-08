import { NgModule } from '@angular/core';
import { CountrySelectorComponent } from './components/country-selector/country-selector.component';

@NgModule({
  imports: [CountrySelectorComponent],
  exports: [CountrySelectorComponent],
})
export class IntlPhoneInputModule {}
