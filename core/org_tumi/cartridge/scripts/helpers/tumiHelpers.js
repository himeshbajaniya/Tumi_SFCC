'use strict';
var Transaction = require('dw/system/Transaction');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
/**
 * Checks if the email value entered is correct format
 * @param {string} email - email string to check if valid
 * @returns {boolean} Whether email is valid
 */
function validateEmail(email) {
    var regex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return regex.test(email);
}

/**
 * if Address associated with a saved card is also a preferred address, need to set another address as preferred address.
 * @param {Object} customer - the customer for which preferred address needs to be changed
 */
function setPreferredAddress(customer) {
    var addressBook = customer.getProfile().getAddressBook();
    var prefreedAddress = customer.profile.addressBook.preferredAddress;
    if (prefreedAddress && addressBook.addresses.length > 1 && prefreedAddress.custom.isAddressAssociatedWithSavedCard ) {
        var address = addressBook.addresses[1];
        Transaction.wrap(function () {
            addressBook.setPreferredAddress(address);
        });
    }
}

/**
 * Remove Special charecter from store Name. This is required because storeName is sent to Cybersource as shipping address firstName. 
 * Cybersource rejects the order where special character exist in shipTo First name field.
 * @param {string} storeName - store name
 */
function removeSpecialCharacterFromStoreName(storeName) {
    var storeLocationName = storeName;
    storeLocationName = storeLocationName.replace(/[#]/g, '');
    return storeLocationName;
}

function postOrderProcessing(order) {
    hooksHelper('app.post.order.processing', 'updateOrder', order, require('*/cartridge/scripts/hooks/order/postOrderProcessing').updateOrder);
}

module.exports = {
    validateEmail: validateEmail,
    setPreferredAddress : setPreferredAddress,
    removeSpecialCharacterFromStoreName: removeSpecialCharacterFromStoreName,
    postOrderProcessing: postOrderProcessing
};
