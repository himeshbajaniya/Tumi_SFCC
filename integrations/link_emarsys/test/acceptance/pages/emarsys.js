var I = actor();

module.exports = {
    locators: { 
        consentTrackModal: '.modal-content',
        consentTrackAffirm: '.affirm.btn.btn-primary',
        saveBtn: 'button.button',
        subscribeEmail: 'input.form-control',
        subscribeButton: '.subscribe-email',
        confirmMessage: '.show-confirmation-message',
        emailAdr: '#emailAddress.form-control',
        gender: '#gender.form-control',
        firstName: '#firstName.form-control',
        lastName: '#lastName.form-control',
        address1: '#address1.form-control',
        country: '#countryCode.form-control',
        state: '#stateCode.form-control',
        city: '#city.form-control',
        zip: '#postalCode.form-control',
        phoneNum: '#phone.form-control'
    },

    accept() {
        I.waitForElement(this.locators.consentTrackModal);
        within(this.locators.consentTrackModal, () => {
            I.click(this.locators.consentTrackAffirm);
        });
    },

    subscribeList(email) {
        I.fillField('hpEmailSignUp', email);
    },

    // data is information about a person that will be passed to Emarsys
    emarsysSignup(data) {
        I.fillField(this.locators.emailAdr, data.email);
        I.waitForElement(this.locators.gender);
        I.selectOption(this.locators.gender, data.gender);
        I.fillField(this.locators.firstName, data.fName);
        I.fillField(this.locators.lastName, data.lName);
        I.fillField(this.locators.address1, data.address1);
        I.waitForElement(this.locators.country);
        I.selectOption(this.locators.country, data.country);
        I.waitForElement(this.locators.state);
        I.selectOption(this.locators.state, data.state);
        I.fillField(this.locators.city, data.city);
        I.fillField(this.locators.zip, data.zipcode);
        I.fillField(this.locators.phoneNum, data.phone);
    }
}
