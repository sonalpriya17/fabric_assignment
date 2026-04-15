@ui
Feature: Accounts

  Scenario: User opens a new savings account
    Given the user is authenticated
    When the user opens a new "SAVINGS" account
    Then account opening confirmation is shown
