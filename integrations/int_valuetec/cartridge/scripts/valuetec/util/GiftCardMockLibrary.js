'use strict';

var DEFAULT_VALUES = {
    CARD: {
        cardNumber: '6364911004999918547',
        pinNumber: '6526'
    },
    CURRENCY_CODE: 'USD',
    RETURN_CODE: {
        returnCode: '01',
        returnDescription: 'Approval'
    }
};

var GiftCardMockLibrary = {
    getBalanceRequestMockResponse: function (webReference) {
        var objectFactory = webReference.ObjectFactory();
        var transactionResponse = webReference.TransactionResponse();
        transactionResponse.setBalance('150.00');

        var mockObject = objectFactory.createTransaction_CardBalanceResponse();
        mockObject.setTransaction_CardBalanceResult(transactionResponse);
        return mockObject;
    },
    getAuthMockResponse: function (webReference) {
        var objectFactory = webReference.ObjectFactory();
        var transactionResponse = webReference.TransactionResponse();
        transactionResponse.setAuthorized(true);
        transactionResponse.setAuthorizationCode('48824169');
        transactionResponse.setCardAmountUsed('5.00');

        var mockObject = objectFactory.createTransaction_SaleResponse();
        mockObject.setTransaction_SaleResult(transactionResponse);
        return mockObject;
    },
    getVoidMockResponse: function (webReference) {
        var objectFactory = webReference.ObjectFactory();
        var transactionResponse = webReference.TransactionResponse();
        transactionResponse.setAuthorized(true);
        transactionResponse.setAuthorizationCode('48824169');
        transactionResponse.setCardAmountUsed('5.00');

        var mockObject = objectFactory.createTransaction_VoidResponse();
        mockObject.setTransaction_VoidResult(transactionResponse);
        return mockObject;
    },
    getRevAuthMockResponse: function (webReference) {
        var objectFactory = webReference.ObjectFactory();
        var transactionResponse = webReference.TransactionResponse();
        transactionResponse.setAuthorized(true);
        transactionResponse.setAuthorizationCode('48824169');
        transactionResponse.setCardAmountUsed('5.00');

        var mockObject = objectFactory.createTransaction_ReversalResponse();
        mockObject.setTransaction_ReversalResult(transactionResponse);
        return mockObject;
    }
};

module.exports = {
    getDefaultValues: DEFAULT_VALUES,
    GiftCardMockLibrary: GiftCardMockLibrary
};
