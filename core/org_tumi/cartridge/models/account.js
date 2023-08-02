'use strict';

var AddressModel = require('*/cartridge/models/address');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var URLUtils = require('dw/web/URLUtils');
var Customer = require('dw/customer/Customer');
var CustomerMgr = require('dw/customer/CustomerMgr');
/**
 * Creates a plain object that contains profile information
 * @param {Object} profile - current customer's profile
 * @returns {Object} an object that contains information about the current customer's profile
 */
function getProfile(currentCustomer) {
    var result;
    if (currentCustomer.profile) {
        var defaultGender = { 'displayValue' : 'I Prefer not to say', 'value' : 3};
        result = {
            firstName: currentCustomer.profile.firstName,
            lastName: currentCustomer.profile.lastName,
            email: currentCustomer.profile.email,
            phone: Object.prototype.hasOwnProperty.call(currentCustomer.profile, 'phone') ? currentCustomer.profile.phone : currentCustomer.profile.phoneHome,
            password: '********',
            gender: Object.prototype.hasOwnProperty.call(currentCustomer.raw.profile, 'gender') ? currentCustomer.raw.profile.gender.value != 0 ? currentCustomer.raw.profile.gender : defaultGender : '',
            date: Object.prototype.hasOwnProperty.call(currentCustomer.raw.profile.custom, 'date') ? currentCustomer.raw.profile.custom.date : '',
            month: Object.prototype.hasOwnProperty.call(currentCustomer.raw.profile.custom, 'month') ? currentCustomer.raw.profile.custom.month : '',
            monogramdata: Object.prototype.hasOwnProperty.call(currentCustomer.raw.profile.custom, 'monogramText') ? currentCustomer.raw.profile.custom.monogramText : '',
            monogramCreationDate: Object.prototype.hasOwnProperty.call(currentCustomer.raw.profile.custom, 'monogramCreationDate') ? currentCustomer.raw.profile.custom.monogramCreationDate : ''
        };
    } else {
        result = null;
    }
    return result;
}

/**
 * Creates an array of plain object that contains address book addresses, if any exist
 * @param {Object} addressBook - target customer
 * @returns {Array<Object>} an array of customer addresses
 */
function getAddresses(addressBook) {
    var result = [];
    if (addressBook) {
        for (var i = 0, ii = addressBook.addresses.length; i < ii; i++) {
            result.push(new AddressModel(addressBook.addresses[i]).address);
        }
    }

    return result;
}

/**
 * Creates a plain object that contains the customer's preferred address
 * @param {Object} addressBook - target customer
 * @returns {Object} an object that contains information about current customer's preferred address
 */
function getPreferredAddress(addressBook) {
    var result = null;
    if (addressBook && addressBook.preferredAddress) {
        result = new AddressModel(addressBook.preferredAddress).address;
    }

    return result;
}

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} wallet - current customer's wallet
 * @returns {Object} object that contains info about the current customer's payment instrument
 */
function getPayment(wallet) {
    if (wallet) {
        var paymentInstruments = wallet.paymentInstruments;
        if (paymentInstruments && paymentInstruments.length > 0) {
            var paymentInstrument = paymentInstruments[0];
            return {
                maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
                creditCardType: paymentInstrument.creditCardType,
                creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
                creditCardExpirationYear: paymentInstrument.creditCardExpirationYear
            };
        }
    }
    return null;
}

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} userPaymentInstruments - current customer's paymentInstruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
function getCustomerPaymentInstruments(userPaymentInstruments) {
    var paymentInstruments;
    paymentInstruments = userPaymentInstruments.map(function (paymentInstrument) {
        var result = {
            creditCardHolder: paymentInstrument.creditCardHolder,
            maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
            creditCardType: paymentInstrument.creditCardType,
            creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
            creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
            UUID: paymentInstrument.UUID
        };

        result.cardTypeImage = {
            src: URLUtils.staticURL('/images/' +
                paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, '') +
                '-dark.svg'),
            alt: paymentInstrument.creditCardType
        };

        return result;
    });

    return paymentInstruments;
}

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} userPaymentInstruments - current customer's paymentInstruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
function getCustomerPaymentInstrumentsWithAddress(userPaymentInstruments, customerNo) {
    var paymentInstruments = [];
    var addressBook = customer.getProfile().getAddressBook();
    userPaymentInstruments.map(function (paymentInstrument) {
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
        var addressId = paymentInstrument.raw.custom.cardAddressReference;
        if (addressId) {
            var addressObj = addressBook.getAddress(addressId);
            if (addressObj) {
                var result = {
                    creditCardHolder: paymentInstrument.creditCardHolder,
                    maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber.substr(paymentInstrument.maskedCreditCardNumber.lastIndexOf('*') + 1),
                    creditCardType: paymentInstrument.creditCardType,
                    creditCardDataType: paymentInstrument.creditCardType.toLowerCase().replace(' ',''),
                    creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
                    creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
                    UUID: paymentInstrument.UUID,
                    defaultPaymentCard: paymentInstrument.raw.custom.defaultPaymentCard,
                    firstName: addressObj.firstName,
                    lastName: addressObj.lastName, 
                    address1: addressObj.address1,
                    address2: addressObj.address2,
                    city: addressObj.city,
                    stateCode: addressObj.stateCode,
                    postalCode: addressObj.postalCode,
                    countryCode: addressObj.countryCode
                };

                result.cardTypeImage = {
                    src: URLUtils.staticURL('/images/' +
                        paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, '') +
                        '-dark.svg'),
                    alt: paymentInstrument.creditCardType
                };
                paymentInstruments.push(result);
            }
        }
    });

    var sortedPaymentInstruments = paymentInstruments.sort(function (a, b) {
        return b.defaultPaymentCard - a.defaultPaymentCard;
    });

    return sortedPaymentInstruments;
}

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} userPaymentInstruments - current customer's paymentInstruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
function getCustomerPaymentInstrumentsWithAddressForCurrentSite(userPaymentInstruments, customerNo) {
    var paymentInstruments = [];
    var addressBook = customer.getProfile().getAddressBook();
    userPaymentInstruments.map(function (paymentInstrument) {
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
        var addressId = paymentInstrument.raw.custom.cardAddressReference;
        if (addressId) {
        	var siteCountryCode = dw.system.Site.getCurrent().getCustomPreferenceValue("siteCountryCode");
            var addressObj = addressBook.getAddress(addressId);
            if (addressObj && siteCountryCode && (addressObj.countryCode.value === siteCountryCode)) {
                var result = {
                    creditCardHolder: paymentInstrument.creditCardHolder,
                    maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber.substr(paymentInstrument.maskedCreditCardNumber.lastIndexOf('*') + 1),
                    creditCardType: paymentInstrument.creditCardType,
                    creditCardDataType: paymentInstrument.creditCardType.toLowerCase().replace(' ',''),
                    creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
                    creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
                    UUID: paymentInstrument.UUID,
                    defaultPaymentCard: paymentInstrument.raw.custom.defaultPaymentCard,
                    firstName: addressObj.firstName,
                    lastName: addressObj.lastName, 
                    address1: addressObj.address1,
                    address2: addressObj.address2,
                    city: addressObj.city,
                    stateCode: addressObj.stateCode,
                    postalCode: addressObj.postalCode,
                    countryCode: addressObj.countryCode.value
                };

                result.cardTypeImage = {
                    src: URLUtils.staticURL('/images/' +
                        paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, '') +
                        '-dark.svg'),
                    alt: paymentInstrument.creditCardType
                };
                paymentInstruments.push(result);
            }
        }
    });

    var sortedPaymentInstruments = paymentInstruments.sort(function (a, b) {
        return b.defaultPaymentCard - a.defaultPaymentCard;
    });

    return sortedPaymentInstruments;
}
/**
 * Account class that represents the current customer's profile dashboard
 * @param {Object} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
function account(currentCustomer, addressModel, orderModel) {
    this.profile = getProfile(currentCustomer);
    this.addresses = COHelpers.getAllSavedAddressesFromCurrentSite(currentCustomer.addressBook);
    this.preferredAddress = addressModel || getPreferredAddress(currentCustomer.addressBook);
    this.orderHistory = orderModel;
    this.payment = getPayment(currentCustomer instanceof Customer ? currentCustomer.profile.wallet : currentCustomer.wallet);
    this.registeredUser = currentCustomer instanceof Customer ? (currentCustomer.authenticated && currentCustomer.registered) : (currentCustomer.raw.authenticated && currentCustomer.raw.registered);
    this.isExternallyAuthenticated = currentCustomer instanceof Customer ? currentCustomer.externallyAuthenticated : currentCustomer.raw.externallyAuthenticated;

    if (currentCustomer instanceof Customer) {
        this.customerPaymentInstruments = currentCustomer.profile.wallet
            && currentCustomer.profile.wallet.paymentInstruments
            ? getCustomerPaymentInstrumentsWithAddressForCurrentSite(currentCustomer.profile.wallet.paymentInstruments.toArray())
            : null;
    } else {
        this.customerPaymentInstruments = currentCustomer.wallet
            && currentCustomer.wallet.paymentInstruments
            ? getCustomerPaymentInstrumentsWithAddressForCurrentSite(currentCustomer.wallet.paymentInstruments, currentCustomer.profile.customerNo)
            : null;
    }
}

account.getCustomerPaymentInstruments = getCustomerPaymentInstruments;
account.getCustomerPaymentInstrumentsWithAddress = getCustomerPaymentInstrumentsWithAddress;

module.exports = account;
