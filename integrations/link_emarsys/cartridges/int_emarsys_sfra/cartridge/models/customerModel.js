'use strict';

/**
 * @description validate Address
 * @param {Object} SubscribeObj - Object profile
 * @param {customer.profile.addressBook.preferredAddress} preferredAddress - user's address
 * @return {void}
 */
function updateSubscriptionAddress(SubscribeObj, preferredAddress) {
    var subscribe = SubscribeObj;
    subscribe.address1 = preferredAddress.address1 || '';
    subscribe.city = preferredAddress.city || '';
    subscribe.stateCode = preferredAddress.stateCode || '';
    subscribe.countryCode = preferredAddress.countryCode.value || '';
    subscribe.postalCode = preferredAddress.postalCode || '';
    subscribe.firstName = preferredAddress.firstName || '';
    subscribe.lastName = preferredAddress.lastName || '';
    subscribe.phone = preferredAddress.phone || '';
}

/**
 * @description Update account form
 * @param {Object} signupForm - initial data form
 * @return {Object} updated form
 */
function updateAccountFormWithCustomerData(signupForm) {
    var SubscribeObj = {};
    SubscribeObj.gender = '';
    SubscribeObj.address1 = '';
    SubscribeObj.city = '';
    SubscribeObj.countryCode = '';
    SubscribeObj.stateCode = '';
    SubscribeObj.postalCode = '';
    SubscribeObj.firstName = '';
    SubscribeObj.lastName = '';
    SubscribeObj.phone = '';
    SubscribeObj.emailAddress = '';

    if (customer.profile.email !== null) {
        SubscribeObj.emailAddress = customer.profile.email;
    }

    var preferredAddress = customer.profile.addressBook.preferredAddress;
    if (preferredAddress !== null) {
        updateSubscriptionAddress(SubscribeObj, preferredAddress);
    }

    if (customer.profile.gender !== null && customer.profile.gender.value > 0) {
        var genderConfig = {};
        genderConfig['1'] = 'male';
        genderConfig['2'] = 'female';

        SubscribeObj.gender = genderConfig[customer.profile.gender] || '';
    }
    // update the form
    signupForm.copyFrom(SubscribeObj);
    // export the updated args
    return signupForm;
}

module.exports.updateAccountFormWithCustomerData = updateAccountFormWithCustomerData;
