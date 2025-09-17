Feature: Vehicle Location
    In order to know where my vehicles are
    As an application user
    I should be able to retrieve the location of a vehicle in my fleet

    Background:
        Given my fleet
        And a vehicle
        And I have registered this vehicle into my fleet

    Scenario: Successfully get location of a localized vehicle
        Given my vehicle has been parked into my fleet
        When I get the location of my vehicle
        Then I should receive the vehicle location

    Scenario: Try to get location of a vehicle that is not localized
        When I get the location of my vehicle
        Then I should receive no location information

    Scenario: Try to get location of a vehicle from a non-existent fleet
        When I try to get the location of a vehicle from a fleet that doesn't exist
        Then I should be informed that the fleet was not found

    Scenario: Try to get location of a vehicle that is not in the fleet
        Given another vehicle
        When I try to get the location of the other vehicle
        Then I should receive no location information

    Scenario: Get location with altitude information
        Given my vehicle has been parked into my fleet with altitude
        When I get the location of my vehicle
        Then I should receive the vehicle location
        And the location should include altitude information
