import { TestBed } from '@angular/core/testing';

import { IntlPhoneInputService } from './intl-phone-input.service';

describe('IntlPhoneInputService', () => {
  let service: IntlPhoneInputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IntlPhoneInputService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
