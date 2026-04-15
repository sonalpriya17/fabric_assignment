# Prompt-Driven Code Generation Rules

## Required
- Use existing Playwright fixtures and page object methods only
- Keep generated tests deterministic and readable
- Use `@prompt-<ID>` in `test.describe` title
- Never hardcode business test data in spec body
- Use random or fixture-driven data where needed

## Forbidden
- Inventing missing page methods
- Direct raw selectors in generated tests
- External HTTP clients in tests

## Missing Method Convention
If a required method does not exist, output a single line:
`MISSING_METHOD:<ClassName.methodName>`
