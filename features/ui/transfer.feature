@ui @regression
Feature: Transfer Funds

  Scenario: User transfers amount between accounts
    Given the user is authenticated
    When the user transfers a generated amount
    Then transfer confirmation is shown
