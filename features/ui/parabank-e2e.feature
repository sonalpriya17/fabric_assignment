@ui @smoke @regression @assignment
Feature: ParaBank end-to-end user banking flow

  Scenario: User completes core banking journey
    Given the user navigates to ParaBank home page
    When the user registers a unique profile
    And the user logs in with the registered credentials
    Then the global navigation menu should be functional
    When the user opens a new savings account and stores account number
    Then account overview should show balance details for that account
    When the user transfers funds from the created account
    Then transfer should be successful
    When the user pays a bill using the created account
    Then bill payment should be successful and state is stored for API validation
