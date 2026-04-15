@ui @smoke
Feature: Registration

  Scenario Outline: New user registration completes successfully
    Given the user opens the registration page
    When the user submits registration details using "<username_hint>"
    Then the user should land on accounts overview

    Examples:
      | username_hint  |
      | <AI_GENERATED> |
