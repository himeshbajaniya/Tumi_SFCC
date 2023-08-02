Feature: Create an email signup
    As a shopper, I want to be able to create an email signup

@emailSigup
Scenario: Shopper is able to create an email signup from the homepage
    Given shopper goes to the Home Page
        Then shopper is able to click button to subscription
        And shopper is able fill out registration information
        And shopper is able to click the Sign me up for email button
        And shopper may see a message about subscribing