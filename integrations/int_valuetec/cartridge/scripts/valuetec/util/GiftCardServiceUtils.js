'use strict';

/* globals session */ // eslint-disable-line no-unused-vars

/* Modules */
var GiftCardFactory = require('~/cartridge/scripts/valuetec/util/GiftCardFactory');

/**
 * map status object based on SVS return code
 * @param {string} returnCode - return code from SVS web service
 * @returns {Object} - status object based on return code
 */
function handleReturnCode(returnCode) {
    var Resource = require('dw/web/Resource');
    var result = {
        success: false,
        errorMessage: ''
    };

    switch (returnCode) {
        case '01':
            result.success = true;
            break;
        case '02':
        case '03':
        case '08':
        case '22':
            result.errorMessage = Resource.msg('svs.message.invalidnumber', 'giftcard', '');
            break;
        case '20':
            result.errorMessage = Resource.msg('svs.message.invalidpin', 'giftcard', '');
            break;
        case '04':
            result.errorMessage = Resource.msg('svs.message.invalidtransactioncode', 'giftcard', '');
            break;
        case '05':
        case '09':
            result.errorMessage = Resource.msg('svs.message.nobalance', 'giftcard', '');
            break;
        case '29':
            result.errorMessage = Resource.msg('svs.message.cardlocked', 'giftcard', '');
            break;
        case '23':
            result.errorMessage = Resource.msg('svs.message.cardalreadyused', 'giftcard', '');
            break;
        case '199':
            result.errorMessage = Resource.msg('svs.message.insufficientfunds', 'giftcard', '');
            break;
        case '299':
            result.errorMessage = Resource.msg('svs.message.down', 'giftcard', '');
            break;
        default:
            result.errorMessage = Resource.msg('svs.message.othererror', 'giftcard', '');
            break;
    }

    return result;
}

var GiftCardServiceUtils = {
    /**
     * add web service security config
     * @param {dw.svc.Service} service - the web service
     */
    addServiceSecurity: function (service) {
        var WSUtil = require('dw/ws/WSUtil');
        var HashMap = require('dw/util/HashMap');

        if (service) {
            var serviceCredential = null;
            try {
                serviceCredential = service.getConfiguration().getCredential();
            } catch (ex) {
                throw new Error('Cannot get Credential or Configuration object');
            }

            var userName = serviceCredential.getUser();
            var password = serviceCredential.getPassword();

            var secretsMap = new HashMap();
            secretsMap.put(userName, password);
            var requestCfg = new HashMap();
            requestCfg.put(WSUtil.WS_ACTION, WSUtil.WS_USERNAME_TOKEN);
            requestCfg.put(WSUtil.WS_USER, userName);
            requestCfg.put(WSUtil.WS_PASSWORD_TYPE, WSUtil.WS_PW_TEXT);
            requestCfg.put(WSUtil.WS_SECRETS_MAP, secretsMap);

            var responseCfg = new HashMap();
            responseCfg.put(WSUtil.WS_ACTION, WSUtil.WS_NO_SECURITY);

            WSUtil.setWSSecurityConfig(service.serviceClient, requestCfg, responseCfg);
        }
    },

    /**
     * parse get gift card balance service response
     * @param {Object} serviceResponse the object returned from the service
     * @returns {Object} plain javascript object
     */
    parseGetGiftCardBalanceResult: function (serviceResponse) {
        var responseObject = {};
        var balance = 0;

        balance = serviceResponse.getBalance();
        // responseObject.errorMessage = result.errorMessage;
        if (balance) {
            responseObject.success = true;
            responseObject.balance = Number(balance);
            responseObject.balanceMessage = 'you have $' + Number(balance) + ' balance in your gift card. Have some shopping';
        }

        return responseObject;
    },

    /**
     * parse preAuth response
     * @param {Object} transactionResponse the object returned from the service
     * @returns {Object} plain javascript object
     */
    parseAuthResult: function (transactionResponse) {
        var responseObject = {
            success: false,
            authorizationCode: null
        };
        var isAuthorized = transactionResponse.isAuthorized();
        if (isAuthorized) {
            responseObject.success = true;
            responseObject.authorizationCode = transactionResponse.getAuthorizationCode();
        }
        return responseObject;
    },

    /**
     * parse preAuth response
     * @param {Object} transactionResponse the object returned from the service
     * @returns {Object} plain javascript object
     */
    parseVoidResult: function (transactionResponse) {
        var responseObject = {};
        var approvedAmount = transactionResponse.getCardAmountUsed();
        var isAuthorized = transactionResponse.isAuthorized();

        if (isAuthorized) {
            responseObject.success = true;
            responseObject.approvedAmount = approvedAmount;
        }
        return responseObject;
    },

    /**
     * parse preAuth response
     * @param {Object} transactionResponse the object returned from the service
     * @returns {Object} plain javascript object
     */
    parseRevAuthResult: function (transactionResponse) {
        var responseObject = {};
        var approvedAmount = transactionResponse.getCardAmountUsed();
        var isAuthorized = transactionResponse.isAuthorized();

        if (isAuthorized) {
            responseObject.success = true;
            responseObject.approvedAmount = approvedAmount;
        }
        return responseObject;
    },

    getDate: function () {
        var Calendar = require('dw/util/Calendar');
        var StringUtils = require('dw/util/StringUtils');

        var cal = new Calendar();
        return StringUtils.formatCalendar(cal, 'yyyy-MM-dd') + 'T' + StringUtils.formatCalendar(cal, 'HH:mm:ss');
    },

    getInvoiceNumber: function () {
        return (Date.now() + '').substr(3, 10);
    },

    /**
     * transactionID – transaction identifying value used with SVS Dup-Check web services processing, must be
     * unique for a period of 90 days; the first 6 digits of the transactionID are composed of the SVS assigned
     * merchant number inversed in pairs of 2, for example merchant number 123456 becomes 563412; the
     * remaining 10 digits can consist of a counter which increments sequentially from 0000000000 to
     * FFFFFFFFFF before returning to 0000000000.
     *
     * @returns {string} - the transaction ID
     */
    getTransactionID: function () {
        var StringUtils = require('dw/util/StringUtils');

        var merchantNumber = GiftCardFactory.getMerchantNumber();

        var transactionID = '';
        for (var i = merchantNumber.length - 1; i >= 0; i -= 2) {
            transactionID += merchantNumber.charAt(i - 1) + merchantNumber.charAt(i);
        }

        // The remaining 10 digits consist of 2 digits for the month, 2 digits for the day, 2 digits for the
        // hour, 2 digits for the minutes and 2 digits for the seconds.
        var currentDate = new Date();
        transactionID += StringUtils.formatNumber(currentDate.getMonth() + 1, '00');
        transactionID += StringUtils.formatNumber(currentDate.getDate(), '00');
        transactionID += StringUtils.formatNumber(currentDate.getHours(), '00');
        transactionID += StringUtils.formatNumber(currentDate.getMinutes(), '00');
        transactionID += StringUtils.formatNumber(currentDate.getSeconds(), '00');

        return transactionID;
    },

    /**
     * For pre-auth transactions, follow the same rules as getTransactionID, except instead of
     * a timestamp, use a combination of the current time's millisecond value and the last 7 of the order number.
     *
     * @param {string} orderNo - The order number for the current transaction.
     * @returns {string} - the transaction ID
     */
    getPreAuthTransactionID: function (orderNo) {
        var Calendar = require('dw/util/Calendar');
        var StringUtils = require('dw/util/StringUtils');

        var merchantNumber = GiftCardFactory.getMerchantNumber();

        var transactionID = '';
        for (var i = merchantNumber.length - 1; i >= 0; i -= 2) {
            transactionID += merchantNumber.charAt(i - 1) + merchantNumber.charAt(i);
        }

        var calendar = new Calendar();
        transactionID += StringUtils.formatCalendar(calendar, 'SSS');

        transactionID += orderNo.substring(orderNo.length - 7);

        return transactionID;
    },

    /**
     * builds merchant xml node
     * @param {dw.rpc.WebReference} webReference - service web ref
     * @returns {Object} the request object
     */
    getMerchant: function (webReference) {
        var merchant = new webReference.Merchant();
        merchant.merchantName = GiftCardFactory.getMerchantName();
        merchant.merchantNumber = GiftCardFactory.getMerchantNumber();
        merchant.storeNumber = GiftCardFactory.getStoreNumber();
        merchant.division = GiftCardFactory.getDivision();
        return merchant;
    },

    /**
     * builds amount xml node
     * @param {dw.rpc.WebReference} webReference - service web ref
     * @param {Object} data - request data
     * @returns {Object} the request object
     */
    getAmount: function (webReference, data) {
        var amount = new webReference.Amount();
        amount.amount = data.amount.amount;
        amount.currency = data.amount.currency;
        return amount;
    },

    /**
     * builds card xml node
     * @param {dw.rpc.WebReference} webReference - service web ref
     * @param {Object} data - request data
     * @returns {Object} the request object
     */
    getCard: function (webReference, data) {
        var card = new webReference.Card();
        card.cardNumber = data.card.cardNumber;
        card.pinNumber = data.card.pinNumber;
        card.cardCurrency = data.card.cardCurrency;
        return card;
    },

    /**
     * builds gift card balance request
     * @param {dw.rpc.WebReference} webReference - service web ref
     * @param {Object} data - request data
     * @returns {Object} the request object
     */
    getBalanceRequest: function (webReference, data) {
        /* var card = GiftCardServiceUtils.getCard(webReference, data);
        var merchant = GiftCardServiceUtils.getMerchant(webReference);
        var amount = GiftCardServiceUtils.getAmount(webReference, data);

        var balanceRequest = new webReference.BalanceInquiryRequest();
        balanceRequest.card = card;
        balanceRequest.merchant = merchant;
        balanceRequest.amount = amount;
        balanceRequest.invoiceNumber = GiftCardServiceUtils.getInvoiceNumber();
        balanceRequest.routingID = GiftCardFactory.getRoutingID();
        balanceRequest.transactionID = GiftCardServiceUtils.getTransactionID();
        balanceRequest.checkForDuplicate = GiftCardFactory.getCheckForDuplicate();
        balanceRequest.date = GiftCardServiceUtils.getDate(); */

        // var objectFactory =  new webreferences2.valutecGiftCard.TransactionCardBalance();
        // eslint-disable-next-line no-undef
        var balanceRequest = new webReference.Transaction_CardBalance();

        balanceRequest.setClientKey(data.clientKey);
        balanceRequest.setTerminalID(data.terminalId);
        // balanceRequest.setCardNumber('7018525449680000023=64332894');
        balanceRequest.setCardNumber(data.card.cardNumber + '=' + data.card.pinNumber);
        return balanceRequest;
    },

    /**
     * builds gift card preauth request
     * @param {dw.rpc.WebReference} webReference - service web ref
     * @param {Object} data - request data
     * @returns {Object} the request object
     */
    getAuthRequest: function (webReference, data) {
        var objectFactory = webReference.ObjectFactory();
        var authRequest = objectFactory.createTransaction_Sale();
        authRequest.setClientKey(data.clientKey);
        authRequest.setTerminalID(data.terminalId);
        authRequest.setCardNumber(data.card.cardNumber + '=' + data.card.pinNumber);
        authRequest.setAmount(data.amount.amount);
        var programType = webReference.ProgramType.values()[0];
        authRequest.setProgramType(programType);
        return authRequest;
    },

    /**
     * builds gift card preauth request
     * @param {dw.rpc.WebReference} webReference - service web ref
     * @param {Object} data - request data
     * @returns {Object} the request object
     */
    getVoidRequest: function (webReference, data) {
        var objectFactory = webReference.ObjectFactory();
        var voidRequest = objectFactory.createTransaction_Void();
        voidRequest.setClientKey(data.clientKey);
        voidRequest.setTerminalID(data.terminalId);
        voidRequest.setCardNumber(data.card.cardNumber + '=' + data.card.pinNumber);
        voidRequest.setRequestAuthCode(data.authorizationCode);
        var programType = webReference.ProgramType.values()[0];
        voidRequest.setProgramType(programType);
        return voidRequest;
    },

    /**
     * builds gift card preauth request
     * @param {dw.rpc.WebReference} webReference - service web ref
     * @param {Object} data - request data
     * @returns {Object} the request object
     */
    getRevAuthRequest: function (webReference, data) {
        var objectFactory = webReference.ObjectFactory();
        var revAuthRequest = objectFactory.createTransaction_Reversal();
        revAuthRequest.setClientKey(data.clientKey);
        revAuthRequest.setTerminalID(data.terminalId);
        revAuthRequest.setCardNumber(data.card.cardNumber);
        revAuthRequest.setRequestIdentifier(data.requestIdentifier);
        return revAuthRequest;
    }
};

module.exports = {
    GiftCardServiceUtils: GiftCardServiceUtils,
    handleReturnCode: handleReturnCode
};
