'use strict';

var Transaction = require('dw/system/Transaction');

function processSettlement(orderNo, currencyCode, paymentInstr, amount) {
    var statusObj = {
        status: true,
        msg: null
    };
    var reqBody = {
        final_capture: false,
        amount: {
            value: amount,
            currency_code: currencyCode
        }
    };
    var captureTransaction = require('*/cartridge/scripts/paypal/settlementTransaction').capture(paymentInstr.paymentTransaction.transactionID, reqBody);
    if (captureTransaction && captureTransaction.ok && captureTransaction.object && captureTransaction.object.id) Transaction.wrap(() => paymentInstr.paymentTransaction.custom.settlementTransaction = captureTransaction.object.id);
    if (!captureTransaction.ok || !captureTransaction.object || captureTransaction.object.status !== 'COMPLETED') {
        statusObj.status = false;
        statusObj.msg = {
            payload: reqBody,
            errorMsg: captureTransaction.msg
        };
    }
    return statusObj;
}

function processVoid(orderNo, currencyCode, paymentInstr) {
    var statusObj = {
        status: true,
        msg: null
    };
    var captureTransaction = require('*/cartridge/scripts/paypal/settlementTransaction').void(paymentInstr.paymentTransaction.transactionID);
    if (!captureTransaction.ok) {
        statusObj.status = false;
        statusObj.msg = captureTransaction.msg;
    }
    return statusObj;
}

function processRefund(orderNo, currencyCode, paymentInstr, amount) {
    var statusObj = {
        status: true,
        msg: null
    };
    var reqBody = {
        invoice_id: orderNo,
        amount: {
            value: amount,
            currency_code: currencyCode
        }
    };
    var refundTransaction = require('*/cartridge/scripts/paypal/settlementTransaction').refund(paymentInstr.paymentTransaction.custom.settlementTransaction, reqBody);
    if (!refundTransaction.ok || !refundTransaction.object || refundTransaction.object.status !== 'COMPLETED') {
        statusObj.status = false;
        statusObj.msg = {
            payload: reqBody,
            errorMsg: refundTransaction.msg
        };
    } else {
        Transaction.wrap(() => paymentInstr.paymentTransaction.custom.refundTransaction = refundTransaction.object.id);
    }
    return statusObj;
}

module.exports = {
    processSettlement: processSettlement,
    processVoid: processVoid,
    processRefund: processRefund
};