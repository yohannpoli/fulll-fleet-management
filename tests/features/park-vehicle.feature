Feature: Park a vehicle
    In order to not forget where I've parked my vehicle
    As an application user
    I should be able to indicate my vehicle location

    Background:
        Given my fleet
        And a vehicle
        And I have registered this vehicle into my fleet

    Scenario: Successfully park a vehicle
        When I park my vehicle at a given location
        Then the known location of my vehicle should verify this location

    Scenario: Can't park an unregistered vehicle
        Given another vehicle
        When I try to park this vehicle at a given location
        Then I should be informed that this vehicle is not part of my fleet
