@api
Feature: Transactions API

  Scenario: Transfer funds API responds
    Given the API client is initialized
    When a transfer request is sent with generated values
    Then the transfer response should be valid
