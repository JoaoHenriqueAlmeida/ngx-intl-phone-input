# intl-phone-input

> Accessible, headless Angular 17 international phone input with country selector.

Built as a drop-in replacement for `ngx-intl-tel-input`, with fixes for known
validation issues with Suriname (+597) and Russia/Kazakhstan (+7) numbers.

## Status

🚧 Under active development — not yet published to npm.

## Features

- 🌍 Country selector with flag emoji, searchable by name, ISO code, or dial code
- 📞 Phone validation via `libphonenumber-js` (latest metadata)
- 🎭 Input masking via `angular-imask`, dynamically generated per country
- 🎨 Fully headless — zero default styles, 100% customizable
- ♿ Keyboard navigable dropdown via Angular CDK
- 📋 `ngModel` support via `ControlValueAccessor`
- ✅ Built-in Angular validator (`invalidPhone` error key)

## Peer Dependencies

- `@angular/common`, `@angular/core`, `@angular/forms` `^17.0.0`
- `@angular/cdk ^17.0.0`
- `angular-imask ^7.0.0`
- `imask ^7.0.0`

## Development

```bash
# Install dependencies
npm install

# Run demo app
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build library
npm run build:lib
```

## License

MIT