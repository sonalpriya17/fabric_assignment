@ui
Feature: Navigation

  Scenario: User can open accounts overview
    Given the user is on the login page
    When the user logs in with generated credentials
    Then the accounts overview page should be visible
