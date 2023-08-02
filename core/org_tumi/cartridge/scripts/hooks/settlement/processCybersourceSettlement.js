'use strict';

var CardFacade = require('*/cartridge/scripts/facade/CardFacade');

var Transaction = require('dw/system/Transaction');

function processSettlement(orderNo, currencyCode, paymentInstr, amount) {
    var statusObj = {
        status: true,
        msg: null
    };
    var serviceResponse = CardFacade.CCCaptureRequest(paymentInstr.paymentTransaction.custom.requestId, orderNo, 'CC', amount, currencyCode);
    if (serviceResponse && serviceResponse.decision === 'ACCEPT' && serviceResponse.requestID) Transaction.wrap(() => paymentInstr.paymentTransaction.custom.settlementTransaction = serviceResponse.requestID);
    if (serviceResponse && serviceResponse.decision !== 'ACCEPT') {
        statusObj.status = false;
        statusObj.msg = serviceResponse.reasonCode;
    }
    return statusObj;
}

function processVoid(orderNo, currencyCode, paymentInstr, amount) {
    var statusObj = {
        status: true,
        msg: null
    };
    var serviceResponse = CardFacade.CCAuthReversalService(paymentInstr.paymentTransaction.custom.settlementTransaction, orderNo, 'CC', currencyCode, amount);
    if (serviceResponse.decision !== 'ACCEPT') {
        statusObj.status = false;
        statusObj.msg = serviceResponse.reasonCode;
    }
    return statusObj;
}

function processRefund(orderNo, currencyCode, paymentInstr, amount) {
    var statusObj = {
        status: true,
        msg: null
    };
    var serviceResponse = CardFacade.CCCreditRequest(paymentInstr.paymentTransaction.custom.settlementTransaction, orderNo, 'CC', amount, currencyCode);
    // if (serviceResponse && serviceResponse.decision === 'ACCEPT' && serviceResponse.requestID) require('dw/system/Transaction').wrap(() => paymentInstr.paymentTransaction.custom.settlementTransaction = serviceResponse.requestID);
    if (serviceResponse && serviceResponse.decision !== 'ACCEPT') {
        statusObj.status = false;
        statusObj.msg = serviceResponse.reasonCode;
    } else {
        paymentInstr.paymentTransaction.custom.refundTransaction = serviceResponse.requestID;
    }
    return statusObj;
}

module.exports = {
    processSettlement: processSettlement,
    processVoid: processVoid,
    processRefund: processRefund
};