# Evaluation Improvement Plan

This plan is based on the published evaluator breakdown: Code Quality **86**, Security **98**, Accessibility **99**, with Efficiency, Testing, and Problem Statement Alignment already at **100**. It focuses on measurable engineering improvements rather than cosmetic changes.

## Priority order

| Priority | Goal | Evidence required | Status |
| --- | --- | --- | --- |
| P0 | Preserve the existing perfect scores | Keep the zero-dependency architecture and run the full quality gate | In progress for every change |
| P1 | Raise code quality | Separate reusable UI behavior from the controller; maintain a single public module barrel; document decisions | Implemented: reusable WAI-ARIA helpers in `src/ui-accessibility.js` |
| P1 | Raise security | Prevent API-key persistence, preserve strict input/model validation, keep imports normalized, and verify CSP | Implemented: API key is now page-memory-only |
| P1 | Close accessibility gap | Apply disclosure semantics, keyboard control, focus placement, and correct hidden state | Implemented: add-item forms now use `aria-controls`, `aria-expanded`, `hidden`, and focus-on-open |
| P2 | Make regressions visible | Expand the deterministic linter to cover each source module and keep automated tests green | Implemented: all source modules, credential persistence, and `aria-controls` targets are checked |
| P2 | Prove the deployed result | Check both remotes and the public Vercel build, then request a fresh external evaluation | Required after each release |

## Implementation sequence

1. **Stabilize the baseline:** run `npm run lint`, `npm test`, `git diff --check`, and inspect the deployment response headers.
2. **Improve the weakest category first:** extract duplicated or reusable UI behavior from `app.js`, maintaining no behavior change and clear JSDoc contracts.
3. **Remove residual attack surface:** keep credentials out of all browser storage and exports; allow only validated keys and supported model identifiers before any network request.
4. **Audit keyboard and screen-reader paths:** tab navigation, expandable forms, dialogs, focus movement, status announcements, labels, and reduced-motion behavior.
5. **Ship a verified release:** commit only after checks pass, push both repositories, verify that the production files contain the release changes, then re-run the evaluator.

## Score interpretation

The external evaluator is authoritative and may use cached or opaque criteria, so a score cannot be guaranteed from source changes alone. This project can, however, provide direct evidence for every planned improvement: source code, tests, lint output, Git commit, both remote heads, and the live production response.
