# Locator Generation Rules

## Priority Order
1. Prefer `data-testid`
2. Prefer `aria-label`
3. Use stable `id` (non-generated)
4. Use `role` + accessible name
5. Use specific CSS selector
6. XPath only as last resort

## Never Generate
- Auto-generated numeric IDs
- Utility-only class selectors
- Position-based selectors (`nth-child`, `first-of-type`)

Return only one selector string.
