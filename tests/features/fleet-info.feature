Feature: Fleet info
    In order to view my fleet information
    As an application user
    I should be able to retrieve a fleet by its ID

    Background:
        Given my fleet

    Scenario: Successfully get an existing fleet
        When I get my fleet
        Then I should receive my fleet information

    Scenario: Try to get a non-existent fleet
        When I try to get a fleet that doesn't exist
        Then I should be informed that the fleet was not found

    Scenario: Get a fleet with registered vehicles
        Given a vehicle
        And I have registered this vehicle into my fleet
        When I get my fleet
        Then I should receive my fleet information
        And the fleet should contain the registered vehicle

    Scenario: Get a fleet with localized vehicles
        Given a vehicle
        And I have registered this vehicle into my fleet
        And my vehicle has been parked into my fleet
        When I get my fleet
        Then I should receive my fleet information
        And the fleet should contain the registered vehicle
        And the vehicle should have a location
