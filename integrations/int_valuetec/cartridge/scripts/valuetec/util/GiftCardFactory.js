'use strict';

/* globals session */

/**
 *   Name: GiftCardFactory
 *   Description:
 *       This script creates a factory object that builds the requestDataContainer Objects for all Gift Card service calls
 */

/* API Modules */
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

var currentSite = Site.getCurrent();

/* ***************************************************
 * private functions
 * ***************************************************
 */
/**
 * get site preference value by name
 *
 * @private
 * @param {string} name - site preference name
 * @returns {string} the site preference
 */
function getPreference(name) {
    return Object.hasOwnProperty.call(currentSite.preferences.custom, name) ? currentSite.getCustomPreferenceValue(name) : null;
}

var GiftCardFactory = {
    ACTIONS: {
        GET_GIFTCARD_BALANCE: 'GET GIFTCARD BALANCE',
        AUTH_GIFTCARD: 'AUTH GIFTCARD',
        VOID_GIFTCARD: 'VOID GIFTCARD',
        REVAUTH_GIFTCARD: 'REVAUTH GIFTCARD'
    },
    SERVICES: {
        VALUETEC: 'valuetec.soap.generic'
    },

    /* ***************************************************
     * Preferences
     * **************************************************
     */
    isGiftCardServiceEnabled: function () {
        return getPreference('valuetecEnable');
    },

    getClientKey: function () {
        return getPreference('clientKey');
    },

    getTerminalId: function () {
        return getPreference('terminalID');
    },

    getAmount: function () {
        return getPreference('amount');
    },

    /* ***************************************************
     * Other Getters
     * ************************************************* */

    getLogger: function (method) {
        var categoryName = method !== null ? method : 'valuetec-general';
        var fileName = 'valuetec-service';

        return Logger.getLogger(fileName, categoryName);
    },

    /* ***************************************************
     * Build requestContainer helpers
     * ************************************************* */

    /**
     * builds gift card balance request container
     * @param {string} accountNumber - gift card number
     * @param {string} pinNumber - gift card pin number
     * @returns {Object} the request container
     */
    buildGiftCardBalanceRequestContainer: function (accountNumber, pinNumber) {
        var requestContainer = {
            action: GiftCardFactory.ACTIONS.GET_GIFTCARD_BALANCE,
            data: {
                card: {
                    cardCurrency: session.currency.currencyCode,
                    cardNumber: accountNumber,
                    pinNumber: pinNumber
                },
                amount: {
                    amount: 0.0,
                    currency: session.currency.currencyCode
                },
                clientKey: GiftCardFactory.getClientKey(),
                terminalId: GiftCardFactory.getTerminalId()
            }
        };

        return requestContainer;
    },

    /**
     * builds gift card preAuth request container
     * @param {dw.order.PaymentInstrument} paymentInstrument - the payment instrument to preAuth
     * @param {dw.order.Order} order - the current order
     * @returns {Object} the request container
     */
    buildPreAuthGiftCardRequestContainer: function (paymentInstrument, order) {
        var requestContainer = {
            action: GiftCardFactory.ACTIONS.AUTH_GIFTCARD,
            data: {
                card: {
                    cardCurrency: order.currencyCode,
                    cardNumber: paymentInstrument.giftCertificateCode,
                    pinNumber: paymentInstrument.custom.giftCardPin
                },
                invoiceNumber: order.orderNo,
                amount: {
                    amount: paymentInstrument.paymentTransaction.amount.value,
                    currency: order.currencyCode
                },
                clientKey: GiftCardFactory.getClientKey(),
                terminalId: GiftCardFactory.getTerminalId()
            }
        };

        return requestContainer;
    },

    /**
     * builds gift card preAuth request container
     * @param {dw.order.PaymentInstrument} paymentInstrument - the payment instrument to preAuth
     * @param {dw.order.Order} order - the current order
     * @returns {Object} the request container
     */
    buildPreAuthTestGiftCardRequestContainer: function () {
        var giftCardCode = Object.hasOwnProperty.call(paymentInstrument.custom, 'giftCardCode') ? paymentInstrument.custom.giftCardCode : null; /* eslint no-undef:0 */
        if (!giftCardCode) {
            giftCardCode = paymentInstrument.getGiftCertificateCode();
        }
        var giftCardPin = Object.hasOwnProperty.call(paymentInstrument.custom, 'giftCardPin') ? paymentInstrument.custom.giftCardPin : null;
        var requestContainer = {
            action: GiftCardFactory.ACTIONS.PREAUTH_GIFTCARD,
            data: {
                card: {
                    cardCurrency: order.currencyCode,
                    cardNumber: giftCardCode,
                    pinNumber: giftCardPin
                },
                invoiceNumber: order.orderNo,
                amount: {
                    amount: paymentInstrument.paymentTransaction.amount.value,
                    currency: order.currencyCode
                }
            }
        };

        return requestContainer;
    },
    /**
     * builds gift card preAuth complete request container (preAuthComplete is used to reverse PreAuths in case of order failures)
     * @param {dw.order.PaymentInstrument} paymentInstrument - the payment instrument to preAuth
     * @param {dw.order.Order} order - the current order
     * @returns {Object} the request container
     */
    buildPreAuthCompleteGiftCardRequestContainer: function (paymentInstrument, order) {
        var requestContainer = {
            action: GiftCardFactory.ACTIONS.PREAUTH_COMPLETE_GIFTCARD,
            data: {
                card: {
                    cardCurrency: order.currencyCode,
                    cardNumber: 'giftCardCode' in paymentInstrument.custom ? paymentInstrument.custom.giftCardCode : null,
                    pinNumber: 'giftCardPin' in paymentInstrument.custom ? paymentInstrument.custom.giftCardPin : null
                },
                invoiceNumber: order.orderNo,
                amount: {
                    amount: 0.0,
                    currency: order.currencyCode
                },
                transactionID: paymentInstrument.paymentTransaction.getTransactionID()
            }
        };

        return requestContainer;
    },

    buildVoidTestGiftCardRequestContainer: function () {
        var giftCardCode = Object.hasOwnProperty.call(paymentInstrument.custom, 'giftCardCode') ? paymentInstrument.custom.giftCardCode : null;
        if (!giftCardCode) {
            giftCardCode = paymentInstrument.getGiftCertificateCode();
        }
        var giftCardPin = Object.hasOwnProperty.call(paymentInstrument.custom, 'giftCardPin') ? paymentInstrument.custom.giftCardPin : null;
        var requestContainer = {
            action: GiftCardFactory.ACTIONS.VOID_GIFTCARD,
            data: {
                card: {
                    cardCurrency: order.currencyCode,
                    cardNumber: giftCardCode,
                    pinNumber: giftCardPin
                },
                invoiceNumber: order.orderNo,
                amount: {
                    amount: paymentInstrument.paymentTransaction.amount.value,
                    currency: order.currencyCode
                }
            }
        };

        return requestContainer;
    },
    buildRevPreAuthTestGiftCardRequestContainer: function () {
        var giftCardCode = Object.hasOwnProperty.call(paymentInstrument.custom, 'giftCardCode') ? paymentInstrument.custom.giftCardCode : null;
        if (!giftCardCode) {
            giftCardCode = paymentInstrument.getGiftCertificateCode();
        }
        var giftCardPin = Object.hasOwnProperty.call(paymentInstrument.custom, 'giftCardPin') ? paymentInstrument.custom.giftCardPin : null;
        var requestContainer = {
            action: GiftCardFactory.ACTIONS.REVAUTH_GIFTCARD,
            data: {
                card: {
                    cardCurrency: order.currencyCode,
                    cardNumber: giftCardCode,
                    pinNumber: giftCardPin
                },
                invoiceNumber: order.orderNo,
                amount: {
                    amount: paymentInstrument.paymentTransaction.amount.value,
                    currency: order.currencyCode
                }
            }
        };

        return requestContainer;
    }

};

module.exports = GiftCardFactory;
