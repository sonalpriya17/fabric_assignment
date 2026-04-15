@ui
Feature: Bill Payment

  Scenario: User pays a bill successfully
    Given the user is authenticated
    When the user submits a generated bill payment
    Then bill payment confirmation is shown
