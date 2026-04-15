@api @assignment
Feature: Find transactions by amount API

  Scenario: Validate payment transaction by amount
    Given transaction search context exists from UI bill payment
    And the API client is initialized for transaction search
    When find transactions API is invoked by the bill payment amount
    Then response should include payment transactions matching that amount
