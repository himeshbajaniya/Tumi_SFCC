'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var ValuetecGiftCardService = LocalServiceRegistry.createService('valuetec', {
    initServiceClient: function () {
        this.valutecServices = webreferences2.valutecGiftCard; // eslint-disable-line no-undef
        var defaultService = this.valutecServices.getDefaultService();
        return defaultService;
    },

    createRequest: function (soapService) {
        soapService.setAuthentication('NONE');
        var objectFactory = new this.valutecServices.ObjectFactory();
        var transactionCardBalanceObj = objectFactory.createTransaction_CardBalance();

        transactionCardBalanceObj.setClientKey('45c4ddcc-feb1-4cb1-99f0-1ba71d6d8f69');
        transactionCardBalanceObj.setTerminalID('183169');
        transactionCardBalanceObj.setCardNumber('7018525449680000023=64332894');

        return transactionCardBalanceObj;
    },

    execute: function (soapService, requestObj) {
        return soapService.serviceClient.Transaction_CardBalance(requestObj);
    },

    parseResponse: function (service, response) {
        return response;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

exports.ValuetecGiftCardService = ValuetecGiftCardService;
