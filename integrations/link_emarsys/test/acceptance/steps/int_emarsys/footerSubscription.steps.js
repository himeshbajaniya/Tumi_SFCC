var { I, data, emarsys } = inject();

// When('shopper selects yes or no for tracking consent', () => {
//     I.amOnPage(data.home.homePage);
//     emarsys.accept();
// });

Then('shopper enters email in signup form', () => {
    I.amOnPage(data.home.homePage);
    I.scrollPageToBottom();
    emarsys.subscribeList(data.home.email);
});

Then('shopper subscribes to the email list', () => {
    I.click(emarsys.locators.subscribeButton);
    I.waitForElement(emarsys.locators.confirmMessage);
    I.seeElement('.show-confirmation-message');
    // I.see('You are already registered');
});