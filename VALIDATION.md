# Validation record

## Completed checks

- 11 Node.js domain, transaction, persistence, and data-format tests passed on Node.js 25.6.1.
- The reference dataset (1,000 concepts, 2,000 instances, 5,000 assertions) passed JSON validation and round-trip comparison in approximately 37 ms on the development machine.
- Chrome 154.0.8037.95 passed the browser workflow suite: concept/instance/type/assertion creation, editing, alias search, multi-parent hierarchy, cycle rejection, last-membership deletion protection, undo/redo, graph controls, reload persistence, rejected imports, exact export/import round trip, cross-tab conflict detection, and safe rendering of imported text.
- No JavaScript errors were observed during that Chrome workflow run.
- At 360px and 390px viewport widths, the document had no horizontal overflow.
- JavaScript syntax checks passed for the application modules.

## Remaining verification

The user requested publishing before the remaining browser review was finished. Automated accessibility checks and Edge verification were prepared but their results were not confirmed. Firefox and Safari have not been tested. Automated accessibility checks do not constitute a complete WCAG audit.

The final layout refinements (bounded desktop panels and hidden skip-link styling) were made after the recorded Chrome workflow run. Browser search performance on the reference dataset has not been measured. The JSON-validation timing is not a measurement of rendering or search performance.

## Reproduce

Run `npm ci`, start the app with `npm start`, then use:

- `npm test`
- `npm run test:browser` (installed Chrome)
- `BROWSER_CHANNEL=msedge npm run test:browser` (installed Edge)
- `node tests/accessibility.mjs`

Browser test artifacts are stored in ignored `test-results/`. The application itself requires no build or runtime packages.
