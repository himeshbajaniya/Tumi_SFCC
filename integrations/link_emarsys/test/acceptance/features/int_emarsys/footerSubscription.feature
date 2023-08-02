Feature: Footer subscription
    As a shopper, I want to subscribe from the footer

@emarsys
    Scenario: Shopper is able to subscribe from the footer
        # When shopper selects yes or no for tracking consent
        Then shopper enters email in signup form
        And shopper subscribes to the email list