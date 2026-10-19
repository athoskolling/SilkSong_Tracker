---
paths:
  - "tests/**"
  - "scripts/validate-data.js"
---

# Rules for tests and the validator

- Native `node:test` and `node:assert/strict`. No test framework, no network, no dependency.
- Run all tests with `node --test tests/`. Run the validator with `node scripts/validate-data.js [dir]`.
- Tests use `data/sample/` (invented data) or small objects written inside the test. They never read the real `data/` files, so a content change cannot break a test.
- Test the contract in `docs/CONTRACTS.md`, not the implementation. A test that fails because the code disagrees with the contract is a bug report for the code's owner, not a reason to change the test.
- For each validator rule, a test breaks a copy of the sample data on purpose and asserts that exactly that rule fires.
- Never edit the code under test. Never write a test that always passes. Never report a result you did not run.
