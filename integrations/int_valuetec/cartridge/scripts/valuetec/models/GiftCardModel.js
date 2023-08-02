'use strict';

/**
 * Model for Gift Card functionality.
 * @module models/GiftCardModel
 */

/* API Includes */

/* Modules */
var GiftCardFactory = require('~/cartridge/scripts/valuetec/util/GiftCardFactory');
var service = require('~/cartridge/scripts/valuetec/service/GiftCardService').VALUETEC;

var GiftCardModel = ({
    giftCardBalance: function (accountNumber, pinNumber, paymentInstrumentAmount) {
        var Resource = require('dw/web/Resource');
        var logger = GiftCardFactory.getLogger('valuetec-get-balance');
        var result = null;
        try {
            if (GiftCardFactory.isGiftCardServiceEnabled()) {
                var giftCardBalanceRequestContainer = GiftCardFactory.buildGiftCardBalanceRequestContainer(accountNumber, pinNumber);
                result = service.call(giftCardBalanceRequestContainer);

                if (result && result.isOk() && result.object && result.object.success !== null && result.object.success === true) {
                    if (paymentInstrumentAmount) {
                        // make sure the balance amount == the amount in the payment instrument
                        var balance = Object.hasOwnProperty.call(result.object, 'balance') ? result.object.balance : 0;
                        if (!balance || (balance && paymentInstrumentAmount && balance < paymentInstrumentAmount)) {
                            return {
                                success: false,
                                errorMessage: Resource.msg('svs.message.insufficientfunds', 'giftcard', '')
                            };
                        }
                    }
                    return {
                        success: true,
                        balance: result.object.balance,
                        balanceMessage: Resource.msgf('label.check.balance', 'giftcard', null, session.currency.symbol, result.object.balance)
                    };
                }

                var errorMessage = Resource.msg('error.message.checkbalance.form', 'giftcard', null);
                if (result && result.getStatus() === 'SERVICE_UNAVAILABLE') {
                    errorMessage = Resource.msg('svs.message.down', 'giftcard', null);
                } else if (result && result.object && result.object.errorMessage) {
                    errorMessage = result.object.errorMessage;
                }

                return {
                    success: false,
                    error: [errorMessage]
                };
            }
        } catch (ex) {
            logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
        }
        return result;
    },
    authorizeGiftCard: function (paymentInstrument, order) {
        var Resource = require('dw/web/Resource');
        var logger = GiftCardFactory.getLogger('svs-preauth');

        var responseObject = {
            transactionID: null,
            giftCardBalance: null,
            authAmount: null,
            approvalStatus: null
        };

        var authResult = {
            authorized: false,
            success: true,
            errorMessage: '',
            responseObject: responseObject
        };
        var errorMessage = '';
        try {
            if (GiftCardFactory.isGiftCardServiceEnabled()) {
                var requestContainer = GiftCardFactory.buildPreAuthGiftCardRequestContainer(paymentInstrument, order);
                var result = service.call(requestContainer);
                var serviceObject = result && result.object ? result.object : {};

                // always update this info from response transactionID
                responseObject.transactionID = Object.hasOwnProperty.call(serviceObject, 'authorizationCode') ? serviceObject.authorizationCode : null;
                responseObject.giftCardBalance = Object.hasOwnProperty.call(serviceObject, 'balance') ? serviceObject.balance : null;
                responseObject.approvalStatus = Object.hasOwnProperty.call(serviceObject, 'returnCode') ? serviceObject.returnCode : null;

                if (result && result.isOk() && result.object && result.object.success !== null && result.object.success === true) {
                    // make sure the approved amount == the amount in the payment instrument
                    var authorizationCode = Object.hasOwnProperty.call(serviceObject, 'authorizationCode') ? serviceObject.authorizationCode : null;
                    if (!authorizationCode) {
                        return {
                            success: false,
                            errorMessage: Resource.msg('svs.message.insufficientfunds', 'giftcard', '')
                        };
                    }
                    responseObject.authorizationCode = authorizationCode;
                    authResult.authorized = true;
                } else {
                    if (result && result.getStatus() === 'SERVICE_UNAVAILABLE') {
                        errorMessage = Resource.msg('svs.message.down', 'giftcard', null);
                    } else if (result && result.object && result.object.errorMessage) {
                        errorMessage = result.object.errorMessage;
                    }
                    return {
                        success: false,
                        errorMessage: errorMessage
                    };
                }
            }
        } catch (ex) {
            logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
            return { success: false, errorMessage: ex.message };
        }
        return authResult;
    },
    authorizeTestGiftCard: function () {
        var Resource = require('dw/web/Resource');

        var responseObject = {
            transactionID: null,
            giftCardBalance: null,
            authAmount: null,
            approvalStatus: null
        };

        var authResult = {
            authorized: false,
            success: true,
            errorMessage: '',
            responseObject: responseObject
        };
        var errorMessage = '';

        if (GiftCardFactory.isGiftCardServiceEnabled()) {
            var requestContainer = {
                action: GiftCardFactory.ACTIONS.AUTH_GIFTCARD,
                data: {
                    card: {
                        cardNumber: '7018525449680000023',
                        pinNumber: '=64332894'
                    },
                    invoiceNumber: '0000001',
                    amount: 5,
                    clientKey: GiftCardFactory.getClientKey(),
                    terminalId: GiftCardFactory.getTerminalId()
                }
            };

            var result = service.call(requestContainer);
            var serviceObject = result && result.object ? result.object : {};

            // always update this info from response transactionID
            // responseObject.transactionID = Object.hasOwnProperty.call(serviceObject, 'transactionID') ? serviceObject.transactionID : null;
            // responseObject.giftCardBalance = Object.hasOwnProperty.call(serviceObject, 'balance') ? serviceObject.balance : null;
            // responseObject.approvalStatus = Object.hasOwnProperty.call(serviceObject, 'returnCode') ? serviceObject.returnCode : null;

            if (result && result.isOk() && result.object && result.object.success !== null && result.object.success === true) {
                // make sure the approved amount == the amount in the payment instrument
                var approvedAmount = Object.hasOwnProperty.call(serviceObject, 'approvedAmount') ? serviceObject.approvedAmount : null;
                if (!approvedAmount) {
                    return {
                        success: false,
                        errorMessage: Resource.msg('svs.message.insufficientfunds', 'giftcard', '')
                    };
                }
                /* var paymentInstrumentAmount = paymentInstrument.paymentTransaction.amount.value;
                if (approvedAmount && paymentInstrumentAmount && approvedAmount !== paymentInstrumentAmount) {
                    errorMessage = Resource.msg('svs.message.insufficientfunds', 'giftcard', '');
                    var giftCardCode = paymentInstrument.getMaskedGiftCertificateCode();
                    if (giftCardCode) {
                        errorMessage = Resource.msgf('svs.message.insufficientfunds.card', 'giftcard', '', giftCardCode);
                    }
                    return {
                        success: false,
                        errorMessage: errorMessage
                    };
                } */

                responseObject.authAmount = approvedAmount;
                authResult.authorized = true;
            } else {
                if (result && result.getStatus() === 'SERVICE_UNAVAILABLE') {
                    errorMessage = Resource.msg('svs.message.down', 'giftcard', null);
                } else if (result && result.object && result.object.errorMessage) {
                    errorMessage = result.object.errorMessage;
                }
                return {
                    success: false,
                    errorMessage: errorMessage
                };
            }
        }

        return authResult;
    },

    voidTestGiftCard: function () {
        var Resource = require('dw/web/Resource');

        var responseObject = {
            transactionID: null,
            giftCardBalance: null,
            authAmount: null,
            approvalStatus: null
        };

        var voidResult = {
            authorized: false,
            success: true,
            errorMessage: '',
            responseObject: responseObject
        };
        var errorMessage = '';

        if (GiftCardFactory.isGiftCardServiceEnabled()) {
            var requestContainer = {
                action: GiftCardFactory.ACTIONS.VOID_GIFTCARD,
                data: {
                    card: {
                        cardNumber: '7018525449680000023',
                        pinNumber: '=64332894'
                    },
                    invoiceNumber: '0000001',
                    amount: 5,
                    clientKey: GiftCardFactory.getClientKey(),
                    terminalId: GiftCardFactory.getTerminalId()

                }
            };

            var result = service.call(requestContainer);
            var serviceObject = result && result.object ? result.object : {};

            if (result && result.isOk() && result.object && result.object.success !== null && result.object.success === true) {
                // make sure the approved amount == the amount in the payment instrument
                var approvedAmount = Object.hasOwnProperty.call(serviceObject, 'approvedAmount') ? serviceObject.approvedAmount : null;
                if (!approvedAmount) {
                    return {
                        success: false,
                        errorMessage: Resource.msg('svs.message.insufficientfunds', 'giftcard', '')
                    };
                }
                voidResult.authAmount = approvedAmount;
                voidResult.authorized = true;
            } else {
                if (result && result.getStatus() === 'SERVICE_UNAVAILABLE') {
                    errorMessage = Resource.msg('svs.message.down', 'giftcard', null);
                } else if (result && result.object && result.object.errorMessage) {
                    errorMessage = result.object.errorMessage;
                }
                return {
                    success: false,
                    errorMessage: errorMessage
                };
            }
        }

        return voidResult;
    },

    revauthorizeTestGiftCard: function () {
        var Resource = require('dw/web/Resource');

        var responseObject = {
            transactionID: null,
            giftCardBalance: null,
            authAmount: null,
            approvalStatus: null
        };

        var revauthResult = {
            authorized: false,
            success: true,
            errorMessage: '',
            responseObject: responseObject
        };
        var errorMessage = '';

        if (GiftCardFactory.isGiftCardServiceEnabled()) {
            var requestContainer = {
                action: GiftCardFactory.REVAUTH_GIFTCARD,
                data: {
                    card: {
                        cardNumber: '7018525449680000023',
                        pinNumber: '=64332894'
                    },
                    invoiceNumber: '0000001',
                    // amount: 5,
                    clientKey: GiftCardFactory.getClientKey(),
                    terminalId: GiftCardFactory.getTerminalId(),
                    amount: GiftCardFactory.getAmount()

                }
            };

            var result = service.call(requestContainer);
            var serviceObject = result && result.object ? result.object : {};

            if (result && result.isOk() && result.object && result.object.success !== null && result.object.success === true) {
                // make sure the approved amount == the amount in the payment instrument
                var approvedAmount = Object.hasOwnProperty.call(serviceObject, 'approvedAmount') ? serviceObject.approvedAmount : null;
                if (!approvedAmount) {
                    return {
                        success: false,
                        errorMessage: Resource.msg('svs.message.insufficientfunds', 'giftcard', '')
                    };
                }
                responseObject.authAmount = approvedAmount;
                revauthResult.authorized = true;
            } else {
                if (result && result.getStatus() === 'SERVICE_UNAVAILABLE') {
                    errorMessage = Resource.msg('svs.message.down', 'giftcard', null);
                } else if (result && result.object && result.object.errorMessage) {
                    errorMessage = result.object.errorMessage;
                }
                return {
                    success: false,
                    errorMessage: errorMessage
                };
            }
        }

        return revauthResult;
    }
});

module.exports = GiftCardModel;
