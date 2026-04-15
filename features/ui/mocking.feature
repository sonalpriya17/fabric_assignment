@ui @mock
Feature: Mocking

  Scenario: Accounts API controlled response
    Given a mocked accounts response is configured
    When the user opens accounts overview via mocked backend
    Then the mocked balance should appear
