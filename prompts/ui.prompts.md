---
## PROMPT-UI-001

Status: ACTIVE
Module: Banking Core Flow
Test Type: E2E_ASSIGNMENT
Description: Full ParaBank journey from registration through bill payment with reusable runtime state

Pre-conditions:
- Application is accessible via base URL

User Journey:
1. Navigate to ParaBank application homepage
2. Register a new user with random unique username and persist credentials in scenario state
3. Log out and log in using newly created credentials
4. Validate global navigation menu links are visible and actionable
5. Open a new SAVINGS account and capture created account number
6. Validate Accounts Overview shows balance details for the created account
7. Transfer funds from created account to a different account
8. Pay bill using created account and capture payment amount
9. Persist account number and amount to state file for API validation

Acceptance Criteria:
- Registration succeeds and no validation errors are displayed
- Re-login with generated credentials is successful
- Global navigation links are visible
- Savings account creation confirmation is visible and account number captured
- Account overview displays balance row for captured account number
- Transfer funds confirmation is visible
- Bill payment confirmation is visible and amount is shown in confirmation
- Runtime state file is written for downstream API test

Test Data Hints:
- Username must be unique every execution
- Transfer amount should be generated dynamically per run
- Bill payment fields should be generated dynamically per run

Depends On: NONE
Cleanup: NONE
Tags: @smoke @regression
Priority: P1
---

## PROMPT-UI-002

Status: ACTIVE
Module: Navigation
Test Type: COMPONENT_FLOW
Description: Verify global menu navigation routes work after login

Pre-conditions:
- User is authenticated with valid account

User Journey:
1. Open Accounts Overview
2. Click Open New Account menu link and verify route
3. Click Transfer Funds menu link and verify route
4. Click Bill Pay menu link and verify route
5. Return to Accounts Overview and verify route

Acceptance Criteria:
- All global navigation routes are reachable and render expected URL fragment

Test Data Hints:
- Use authenticated session from fixture/world

Depends On: NONE
Cleanup: NONE
Tags: @regression @navigation
Priority: P2
