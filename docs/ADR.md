# Architecture Decision Records

This project follows the ParaBank AI framework ADRs from the working design document:

- AI as augmentation, not replacement
- `playwright-bdd` for BDD runner
- `AIService` as TypeScript type + factory functions
- Playwright fixtures for native dependency injection
- File-based locator cache + append-only AI audit log
- Confidence-scored AI outputs with threshold fallbacks
- Prompt-driven generation validated by `tsc --noEmit`
- Classes only for Page Objects, API client, and world context

For the full canonical ADR narrative, use the source ADR document used in project planning.
