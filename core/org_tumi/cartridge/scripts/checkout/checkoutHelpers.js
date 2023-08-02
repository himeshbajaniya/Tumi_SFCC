'use strict';

var server = require('server');
var base = module.superModule;

var Transaction = require('dw/system/Transaction');
var StoreMgr = require('dw/catalog/StoreMgr');
var CustomerMgr = require('dw/customer/CustomerMgr');
var OrderMgr = require('dw/order/OrderMgr');
var formErrors = require('*/cartridge/scripts/formErrors');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var tumiHelpers = require('*/cartridge/scripts/helpers/tumiHelpers');
var siteCountryCode = dw.system.Site.getCurrent().getCustomPreferenceValue("siteCountryCode");

const SHIPPING_ADDRESS_REGEX = /^[a-zA-Z0-9\s]+$/;

/**
 * Validate billing form
 * @param {Object} form - the form object with pre-validated form fields
 * @returns {Object} the names of the invalid form fields
 */
function validateFields(form) {
    return formErrors.getFormErrors(form);
}
/**
 * Validate customer form
 * @param {Object} form - the form to be validated
 * @returns {Object} the result of form field validation or null if the input form is null or undefined
 *  * viewData {Object}
 *  *  * customer {Object}
 *  *  * * email - customer email address
 *  * customerForm - the input form
 *  * formFieldErrors - An array names of the invalid form fields
 */
function validateCustomerForm(form) {
    return validateFields(form);
}

function validateContactInfoForm(form) {
    return validateFields(form);
}
/**
 * Basket is having only store pickup items. it may be for one store or multiple stores (multi-shipment) as well. Copy store address in respective shipment.
 */
function copyStoreAddressToShipment(basketShipments) {
    var allShipments = basketShipments;
    var store;
    var storeId;
    var shipment;
    Transaction.wrap(function () {
        for (var i = 0; i <= allShipments.length - 1; i++) {
            shipment = allShipments[i];
            storeId = shipment.custom.fromStoreId;
            if (storeId) {
                store = StoreMgr.getStore(storeId);
                if (store) {
                    var shippingAddress = shipment.getShippingAddress();
                    if (!shippingAddress) {
                        shippingAddress = shipment.createShippingAddress();
                    }
                    var storeName = tumiHelpers.removeSpecialCharacterFromStoreName(store.name);
                    shippingAddress.setFirstName(storeName);
                    shippingAddress.setLastName('');
                    shippingAddress.setAddress1(store.address1);
                    shippingAddress.setAddress2(store.address2);
                    shippingAddress.setCity(store.city);
                    shippingAddress.setPostalCode(store.postalCode);
                    shippingAddress.setStateCode(store.stateCode);
                    shippingAddress.setCountryCode(store.countryCode.value);
                    shippingAddress.setPhone(store.phone);
                }
            }
        }
    });
}
/**
 * Basket is having mixed shipments. i.e one Ship To Home and one/multiple store pickup shipments. Copy shipping address in STH shipment and store address in respective store shipment.
 */
function copyShippingAndStoreAddressToShipment(shippingData, basketShipments) {
    var allShipments = basketShipments;
    var store;
    var storeId;
    var shipment;
    Transaction.wrap(function () {
        for (var i = 0; i <= allShipments.length - 1; i++) {
            shipment = allShipments[i];
            storeId = shipment.custom.fromStoreId;
            if (storeId) {
                store = StoreMgr.getStore(storeId);
                if (store) {
                    var shippingAddress = shipment.getShippingAddress();
                    if (!shippingAddress) {
                        shippingAddress = shipment.createShippingAddress();
                    }
                    var storeName = tumiHelpers.removeSpecialCharacterFromStoreName(store.name);
                    shippingAddress.setFirstName(storeName);
                    shippingAddress.setLastName('');
                    shippingAddress.setAddress1(store.address1);
                    shippingAddress.setAddress2(store.address2);
                    shippingAddress.setCity(store.city);
                    shippingAddress.setPostalCode(store.postalCode);
                    shippingAddress.setStateCode(store.stateCode);
                    shippingAddress.setCountryCode(store.countryCode.value);
                    shippingAddress.setPhone(store.phone);
                }
            } else {
                var shippingAddress = shipment.shippingAddress;
                Transaction.wrap(function () {
                    if (shippingAddress === null) {
                        shippingAddress = shipment.createShippingAddress();
                    }

                    shippingAddress.setFirstName(shippingData.address.firstName);
                    shippingAddress.setLastName(shippingData.address.lastName);
                    shippingAddress.setAddress1(shippingData.address.address1);
                    shippingAddress.setAddress2(shippingData.address.address2);
                    shippingAddress.setCity(shippingData.address.city);
                    shippingAddress.setPostalCode(shippingData.address.postalCode);
                    shippingAddress.setStateCode(shippingData.address.stateCode);
                    var countryCode = shippingData.address.countryCode.value ? shippingData.address.countryCode.value : shippingData.address.countryCode;
                    shippingAddress.setCountryCode(countryCode);
                    shippingAddress.setPhone(shippingData.address.phone);

                    ShippingHelper.selectShippingMethod(shipment, shippingData.shippingMethod);
                });
            }
        }
    });
}
/**
 * Returns preferred address if it belongs to site being visited currently, otherwise returns the first one from the list of addresses of site being visited currently. 
 */
function getPreferredAddressForCurrentSite(currentCustomer) {
    var siteCountryCode = dw.system.Site.getCurrent().getCustomPreferenceValue("siteCountryCode");
    var preferredAddress = currentCustomer.addressBook.preferredAddress;
    if (preferredAddress) {
        var preferredAddressCountry = preferredAddress.countryCode.value;
        if (siteCountryCode === preferredAddressCountry) {
            return preferredAddress;
        } else {
            var allAddressesFromCurrentSite = getAllSavedAddressesFromCurrentSite(currentCustomer.addressBook);
            if (allAddressesFromCurrentSite.length) {
                preferredAddress = allAddressesFromCurrentSite[0];
                return preferredAddress;
            }
        }
    } else {
        var allAddressesFromCurrentSite = getAllSavedAddressesFromCurrentSite(currentCustomer.addressBook);
        if (allAddressesFromCurrentSite.length) {
            preferredAddress = allAddressesFromCurrentSite[0];
            return preferredAddress;
        }
    }	
}
/**
 * Returns all saved addresses which belongs to site being visited currently.
 */
function getAllSavedAddressesFromCurrentSite(addressBook) {
    var allAddressesFromCurrentSite = [];
    if (addressBook) {
        var siteCountryCode = dw.system.Site.getCurrent().getCustomPreferenceValue("siteCountryCode");
        var allAddresses = addressBook.addresses;
        var address;
        for (var i=0; i<= allAddresses.length - 1; i++) {
            address = allAddresses[i];
            if (address.countryCode.value === siteCountryCode) {
                allAddressesFromCurrentSite.push(address);
            }
        }
    }

    return allAddressesFromCurrentSite;
}
/**
 * Returns all saved payment instruments which address is associated to site being visited currently. 
 */
function getPaymentInstrumentsForCurrentSite(currentCustomer, allPaymentInstruments) {
    var allPaymentInstrumentForCurrentSite = [];
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        currentCustomer.raw.profile.customerNo
    );
    var addressBook = customer.addressBook;
    if (addressBook) {
        for (var i=0; i<= allPaymentInstruments.length - 1; i++) {
            var paymentInstrument = allPaymentInstruments[i];
            if (paymentInstrument.custom.cardAddressReference) {
                var addressId = paymentInstrument.custom.cardAddressReference;
                var cardAddressObj = addressBook.getAddress(addressId);
                if (cardAddressObj) {
                    var cardAddressCountry = cardAddressObj.countryCode.value;
                    if (cardAddressCountry && cardAddressCountry.equalsIgnoreCase(siteCountryCode)) {
                        allPaymentInstrumentForCurrentSite.push(paymentInstrument);
                    }
                }
            }
        }
    }
    return allPaymentInstrumentForCurrentSite;
}
/**
 * Prepares the Contact info form
 * @returns {Object} processed Contact info form object
 */
function prepareContactInfoForm() {
    var contactInfoForm = server.forms.getForm('contactInfo');

    contactInfoForm.clear();

    return contactInfoForm;
}

/**
* Removes all non gift card payment instruments from basket
* @param {Object} basket - basket
*/
function removeAllNonGiftCardPaymentInstruments (basket) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var paymentInstruments = basket.getPaymentInstruments();
    var iterator = paymentInstruments.iterator();
    var paymentInstr = null;
    Transaction.wrap(function () {
        while (iterator.hasNext()) {
            paymentInstr = iterator.next();
            if (paymentInstr.getPaymentMethod() !== PaymentInstrument.METHOD_GIFT_CERTIFICATE) {
                basket.removePaymentInstrument(paymentInstr);
            }
        }
    });
}

/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket) {
    var order;
    // This session variable is used to identify that call to createOrderNo hooks in avataxhooks.js is going through Place Order flow.
    // This helps to reduce unnecessary call to Avatax significantly, because createOrderNo hooks get unnecessarily lot many times.
    // As Soon as, Tax calculation is done, this session variable is set to null in avataxhooks.js
    session.privacy.placeOrderFlow = true;

    try {
        order = Transaction.wrap(function () {
            return OrderMgr.createOrder(currentBasket);
        });
    } catch (error) {
        return null;
    }
    return order;
}

function isShippingAddressValid(shippingAddress) {
    if (!shippingAddress || !shippingAddress.address1 || !shippingAddress.city || !shippingAddress.postalCode) return false;
    return (shippingAddress.firstName.match(SHIPPING_ADDRESS_REGEX) &&
        shippingAddress.lastName.match(SHIPPING_ADDRESS_REGEX) &&
        shippingAddress.address1.match(SHIPPING_ADDRESS_REGEX) &&
        (shippingAddress.address2 ? shippingAddress.address2.match(SHIPPING_ADDRESS_REGEX) : true) &&
        shippingAddress.city.match(SHIPPING_ADDRESS_REGEX));
}

function validateShippingForm(form) {
    var errorMsg = require('dw/web/Resource').msg('error.format.shipping.address', 'checkout', null);
    var errorFields = base.validateFields(form);
    if (form.firstName.value && !errorFields[form.firstName.htmlName] && !form.firstName.value.match(SHIPPING_ADDRESS_REGEX)) errorFields[form.firstName.htmlName] = errorMsg;
    if (form.lastName.value && !errorFields[form.lastName.htmlName] && !form.lastName.value.match(SHIPPING_ADDRESS_REGEX)) errorFields[form.lastName.htmlName] = errorMsg;
    if (form.address1.value && !errorFields[form.address1.htmlName] && !form.address1.value.match(SHIPPING_ADDRESS_REGEX)) errorFields[form.address1.htmlName] = errorMsg;
    if (form.address2.value && !errorFields[form.address2.htmlName] && !form.address2.value.match(SHIPPING_ADDRESS_REGEX)) errorFields[form.address2.htmlName] = errorMsg;
    if (form.city.value && !errorFields[form.city.htmlName] && !form.city.value.match(SHIPPING_ADDRESS_REGEX)) errorFields[form.city.htmlName] = errorMsg;
    return errorFields;
}

module.exports = {
    validateCustomerForm: validateCustomerForm,
    validateContactInfoForm: validateContactInfoForm,
    copyStoreAddressToShipment: copyStoreAddressToShipment,
    copyShippingAndStoreAddressToShipment: copyShippingAndStoreAddressToShipment,
    prepareContactInfoForm: prepareContactInfoForm,
    getPreferredAddressForCurrentSite: getPreferredAddressForCurrentSite,
    getAllSavedAddressesFromCurrentSite: getAllSavedAddressesFromCurrentSite,
    getPaymentInstrumentsForCurrentSite: getPaymentInstrumentsForCurrentSite,
    removeAllNonGiftCardPaymentInstruments: removeAllNonGiftCardPaymentInstruments,
    createOrder: createOrder,
    isShippingAddressValid: isShippingAddressValid,
    validateShippingForm: validateShippingForm
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});