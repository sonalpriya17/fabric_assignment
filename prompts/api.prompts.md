---
## PROMPT-API-001

Status: ACTIVE
Module: Find Transactions
Test Type: API_ASSIGNMENT
Description: Search transactions by amount for the bill payment made in UI flow

Pre-conditions:
- UI scenario has created state file with account number and payment amount
- API client initialized with base URL

User Journey:
1. Read account number and bill payment amount from state file
2. Call Find Transactions API by amount using account number
3. Validate JSON response entries match searched amount

Acceptance Criteria:
- API response is valid JSON
- Response contains at least one transaction entry for searched amount
- Transaction entries include amount and transaction metadata fields

Test Data Hints:
- Amount and account number must come from runtime UI state file

Depends On: PROMPT-UI-001
Cleanup: NONE
Tags: @api
Priority: P1
