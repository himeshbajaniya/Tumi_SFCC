var { I, data, emarsys } = inject();

// For going to the home landing page
Given('shopper goes to the Home Page', () => {
    I.amOnPage(data.home.homePage);
   // emarsys.accept();
});

Then('shopper is able to click button to subscription', () => {
    I.scrollPageToBottom();
    I.click(emarsys.locators.subscribeButton);
});

Then('shopper is able fill out registration information', () => {
    emarsys.emarsysSignup(data.emarsysData);
});

Then('shopper is able to click the Sign me up for email button', () => {
    I.waitForElement(emarsys.locators.saveBtn);
    I.click(emarsys.locators.saveBtn);
});

Then('shopper may see a message about subscribing', () => {
    I.seeElement('.show-confirmation-message');
    // I.see('You are already registered');
    // I.see('Thank you for subscribing');
});
