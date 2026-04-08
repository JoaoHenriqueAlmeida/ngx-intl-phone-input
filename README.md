# intl-phone-input

> Accessible, headless Angular 17 international phone input with CDK-powered country selector.

Built as a drop-in replacement for `ngx-intl-tel-input`, with fixes for known validation bugs with Suriname (+597) and Russia/Kazakhstan (+7) numbers.

## Installation

```bash
npm install intl-phone-input
```

You also need the peer dependencies if not already installed:

```bash
npm install @angular/cdk angular-imask imask
```

Add the CDK prebuilt overlay styles to your `angular.json` (or `styles.scss`):

```json
"styles": ["node_modules/@angular/cdk/overlay-prebuilt.css", "src/styles.scss"]
```

## Usage

Import `PhoneInputComponent` into your standalone component (or `NgModule`):

```typescript
import { PhoneInputComponent } from 'intl-phone-input';

@Component({
  standalone: true,
  imports: [FormsModule, PhoneInputComponent],
  ...
})
```

Use it in your template:

```html
<ngx-intl-phone-input
  [(ngModel)]="phone"
  [defaultCountry]="'BR'"
  placeholder="Phone number"
  (countryChange)="onCountryChange($event)"
  (phoneStatus)="onPhoneStatus($event)"
/>
```

The `phone` value is always an **E.164 string** (e.g. `"+5511987654321"`) when valid, or `null` when empty or invalid.

### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `defaultCountry` | `CountryCode` | `'US'` | ISO 3166-1 alpha-2 code for the initially selected country |
| `placeholder` | `string` | `''` | Placeholder text for the phone number input |

### Outputs

| Output | Payload | Description |
|---|---|---|
| `countryChange` | `CountryData` | Fires when the user selects a different country |
| `phoneStatus` | `PhoneStatus` | Fires on every keystroke with `{ isPossible, isValid, e164 }` |

### Validation

The component registers itself as an Angular validator. Use `ngModel` or reactive forms — invalid numbers produce an `invalidPhone` error:

```typescript
// Reactive forms
const ctrl = new FormControl('');
// ctrl.errors → { invalidPhone: true }
```

## Styling

The library is **fully headless** — it ships zero styles. You own all CSS. The component emits these classes for you to style:

**Host element (`ngx-intl-phone-input`):**

| Class | When applied |
|---|---|
| `ipi-focused` | Phone input has focus |
| `ipi-disabled` | Component is disabled |
| `ipi-invalid` | Input has a value but it is invalid |

**Internal elements:**

| Selector | Element |
|---|---|
| `.ipi-country-trigger` | Dropdown trigger button |
| `.ipi-flag` | Flag image inside the trigger |
| `.ipi-dial-code` | Dial code span inside the trigger |
| `.ipi-dropdown-panel` | CDK overlay panel |
| `.ipi-search-input` | Search field inside the dropdown |
| `.ipi-country-list` | `<ul>` of country options |
| `.ipi-country-option` | Individual `<li>` |
| `.ipi-country-option--active` | Keyboard-focused option |
| `.ipi-country-option--selected` | Currently selected option |
| `.ipi-country-option__flag` | Flag image in the list |
| `.ipi-country-option__name` | Country name in the list |
| `.ipi-country-option__dial-code` | Dial code in the list |
| `.ipi-phone-input` | The number `<input>` field |

> The dropdown panel renders via CDK in `document.body`, so all `ipi-*` styles must be in your **global** stylesheet, not a component-scoped one.

### Minimal style example

```scss
// styles.scss
@import '@angular/cdk/overlay-prebuilt.css';

ngx-intl-phone-input {
  display: flex;
  align-items: center;
  height: 40px;
  border: 1px solid #ccc;
  border-radius: 6px;
  overflow: hidden;

  &.ipi-focused { border-color: #3b82f6; }
  &.ipi-invalid { border-color: #ef4444; }
}

.ipi-country-trigger {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0 0.6rem;
  height: 100%;
  border: none;
  border-right: 1px solid #ccc;
  background: #f8f8f8;
  cursor: pointer;
}

.ipi-phone-input {
  flex: 1;
  height: 100%;
  border: none;
  padding: 0 0.75rem;
  background: transparent;
  &:focus { outline: none; }
}

.ipi-dropdown-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
  width: 280px;
  max-height: 320px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ipi-search-input {
  padding: 0.6rem 0.75rem;
  border: none;
  border-bottom: 1px solid #e2e8f0;
  &:focus { outline: none; }
}

.ipi-country-list {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  overflow-y: auto;
}

.ipi-country-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  &:hover, &.ipi-country-option--active { background: #eff6ff; }
  &.ipi-country-option--selected { font-weight: 600; }
}
```

## Why not `ngx-intl-tel-input`?

Two specific bugs motivated this library:

- **Russia (+7 926 920 9992):** The library auto-switched the selected country to Kazakhstan (both share dial code `+7`), making the number impossible to validate as Russian.
- **Suriname (+597 850 9292):** Numbers were never marked valid and the dial code was corrupted.

**Our fix:** the user's dropdown selection is always the source of truth. The country never auto-switches based on the number. `libphonenumber-js` validates strictly within the chosen country's context.

## License

MIT © [JoaoHenriqueAlmeida](https://github.com/JoaoHenriqueAlmeida)
