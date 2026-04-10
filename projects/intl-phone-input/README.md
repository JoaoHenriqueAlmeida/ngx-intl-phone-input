# ngx-intl-phone-input

> Accessible, headless Angular 17 international phone input with CDK-powered country selector.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/~/github.com/JoaoHenriqueAlmeida/ngx-intl-phone-input)

Built as a drop-in replacement for `ngx-intl-tel-input`, with fixes for known validation bugs with Suriname (+597) and Russia/Kazakhstan (+7) numbers.

## Installation

```bash
npm install ngx-intl-phone-input
```

Install peer dependencies if not already present:

```bash
npm install @angular/cdk angular-imask imask
```

Add the CDK prebuilt overlay styles to your `angular.json`:

```json
"styles": ["node_modules/@angular/cdk/overlay-prebuilt.css", "src/styles.scss"]
```

Or import directly in your global stylesheet:

```scss
@import '@angular/cdk/overlay-prebuilt.css';
```

## Usage

Import `PhoneInputComponent` into your standalone component (or `NgModule`):

```typescript
import { PhoneInputComponent } from 'ngx-intl-phone-input';

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
  [locale]="'pt-BR'"
  placeholder="Telefone"
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
| `locale` | `SupportedLocale` | `'en-US'` | Locale for country names and UI strings (see [Localization](#localization)) |

### Outputs

| Output | Payload | Description |
|---|---|---|
| `countryChange` | `CountryData` | Fires when the user selects a different country |
| `phoneStatus` | `PhoneStatus` | Fires on every keystroke with parse details |

#### `PhoneStatus`

```typescript
interface PhoneStatus {
  isPossible: boolean; // number length is plausible for the selected country
  isValid: boolean;    // fully valid E.164 number
  e164: string | null; // E.164 value when valid, otherwise null
}
```

### Validation

The component registers itself as an Angular validator. Invalid numbers set an `invalidPhone` error on the control:

```typescript
// Template-driven
<ngx-intl-phone-input [(ngModel)]="phone" #phoneCtrl="ngModel" />
<span *ngIf="phoneCtrl.errors?.['invalidPhone']">Invalid phone number</span>

// Reactive forms
const ctrl = new FormControl('');
// ctrl.errors → { invalidPhone: true }
```

Empty values are **not** flagged as invalid — combine with `Validators.required` if needed.

## Localization

The `locale` input translates country names in the dropdown and the search field placeholder.

| Locale | Language | Search placeholder |
|---|---|---|
| `en-US` | English (default) | Search countries… |
| `pt-BR` | Portuguese (Brazil) | Buscar países… |

```html
<ngx-intl-phone-input [locale]="'pt-BR'" ... />
```

Country search works in the active locale — typing "bras" in `pt-BR` matches "Brasil".

## Keyboard navigation

The country dropdown is fully keyboard accessible:

| Key | Action |
|---|---|
| `Space` / `Enter` / `↓` | Open dropdown |
| `↑` / `↓` | Navigate options |
| `Enter` | Select focused option (focus moves to phone input) |
| `Escape` | Close without changing selection (focus returns to trigger) |
| Any letter/digit | Type-ahead search within the list |

## Styling

The library is **fully headless** — it ships zero styles. You own all CSS via a stable set of BEM class names.

### Host state classes

Applied directly to `<ngx-intl-phone-input>`:

| Class | When applied |
|---|---|
| `ipi-focused` | Phone number input has focus |
| `ipi-disabled` | Component is disabled |
| `ipi-invalid` | Input has a value but it is not valid |

### Internal element classes

| Selector | Element |
|---|---|
| `.ipi-country-trigger` | Dropdown trigger button |
| `.ipi-flag` | Flag `<img>` inside the trigger (20×15 px) |
| `.ipi-dial-code` | Dial code span inside the trigger (e.g. `+55`) |
| `.ipi-dropdown-panel` | CDK overlay panel |
| `.ipi-search-input` | Search `<input>` inside the dropdown |
| `.ipi-country-list` | `<ul>` of country options |
| `.ipi-country-option` | Individual `<li>` |
| `.ipi-country-option--active` | Keyboard-focused option |
| `.ipi-country-option--selected` | Currently selected option |
| `.ipi-country-option__flag` | Flag `<img>` in the list (20×15 px) |
| `.ipi-country-option__name` | Country name in the list |
| `.ipi-country-option__dial-code` | Dial code in the list |
| `.ipi-phone-input` | The number `<input>` field |

> **Important:** the dropdown panel renders via CDK into `document.body`, outside the Angular component tree. All `ipi-*` styles must be in your **global** stylesheet, not a component-scoped one.

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
  transition: border-color 0.15s, box-shadow 0.15s;

  &.ipi-focused { border-color: #3b82f6; box-shadow: 0 0 0 3px rgb(59 130 246 / 20%); }
  &.ipi-invalid { border-color: #ef4444; box-shadow: 0 0 0 3px rgb(239 68 68 / 15%); }
  &.ipi-disabled { background: #f7f7f7; }
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
  white-space: nowrap;
  &:focus { outline: none; }

  .ipi-flag { object-fit: cover; border-radius: 2px; }
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
  background: #f8fafc;
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

  &:hover,
  &.ipi-country-option--active { background: #eff6ff; }
  &.ipi-country-option--selected { font-weight: 600; }

  &__flag { object-fit: cover; border-radius: 2px; }
}
```

## Why not `ngx-intl-tel-input`?

Two specific bugs motivated this library:

- **Russia (+7 926 920 9992):** The library auto-switched the selected country to Kazakhstan (both share dial code `+7`), making the number impossible to validate as Russian.
- **Suriname (+597 850 9292):** Numbers were never marked valid and the dial code was corrupted.

**Our fix:** the user's dropdown selection is always the source of truth. The country never auto-switches based on the typed number. `libphonenumber-js` validates strictly within the chosen country's context.

## License

MIT © [JoaoHenriqueAlmeida](https://github.com/JoaoHenriqueAlmeida)
