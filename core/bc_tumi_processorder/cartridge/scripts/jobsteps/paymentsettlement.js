'use strict';
var Log = require('~/cartridge/scripts/logger/log');
var log = new Log('PaymentSettlement');
var Order = require('dw/order/Order');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Site = require('dw/system/Site');
var siteID = Site.getCurrent().getID();
var ordersIterator;
var creditCardProcessor = 'CYBERSOURCE_CREDIT';

function read() {
    if (ordersIterator) {
        while (ordersIterator.hasNext()) {
            return ordersIterator.next();
        }
    }
    return null;
}

function process(order) {
    var paymentInstrumentsItr = order.paymentInstruments.iterator();
    var HookMgr = require('dw/system/HookMgr');
    while (paymentInstrumentsItr.hasNext()) {
        var paymentInstr = paymentInstrumentsItr.next();
        if (!paymentInstr || !paymentInstr.paymentTransaction || !paymentInstr.paymentTransaction.paymentProcessor || !paymentInstr.paymentTransaction.paymentProcessor.ID) continue;
        var paymentProcessorID = paymentInstr.paymentTransaction.paymentProcessor.ID.toLowerCase();
        if (paymentInstr.paymentTransaction.paymentProcessor.ID == 'KLARNA_PAYMENTS') {
            paymentProcessorID = creditCardProcessor.toLowerCase();
        }
        var result = null;
        // var avaTaxResult = null;
        var amount = ('settlementamount' in paymentInstr.custom && !empty(paymentInstr.custom.settlementamount)) ?
            paymentInstr.custom.settlementamount :
            0;
        if (!amount) {
            log.error('Settlement Amount is not valid for order {0} and {1}', order.orderNo, amount);
            continue;
        }
        if (order.status.value === Order.ORDER_STATUS_CANCELLED && HookMgr.hasHook('app.payment.settlement.void.' + paymentProcessorID)) {
            log.debug('Void service called for {0}', paymentProcessorID);
            result = HookMgr.callHook('app.payment.settlement.void.' + paymentProcessorID, 'processVoid', order.orderNo, order.currencyCode, paymentInstr, amount);
        } else if (order.shippingStatus.value === Order.SHIPPING_STATUS_SHIPPED && HookMgr.hasHook('app.payment.settlement.capture.' + paymentProcessorID)) {
            log.debug('Settlement service called for {0}', paymentProcessorID);
            result = HookMgr.callHook('app.payment.settlement.capture.' + paymentProcessorID, 'processSettlement', order.orderNo, order.currencyCode, paymentInstr, amount);
        }
        if (!result) {
            log.error('Settlement Error: Order No {0} and processorID {1}', order.orderNo, paymentProcessorID);
            continue;
        }
        /* if (!avaTaxResult) {
            log.error('AvaTax Settlement Error: Order No {0}', order.orderNo);
            continue;
        } */
        return {
            order: order,
            settlementResponse: result
        };
    }
}

function write(args) {
    var iter = args.iterator();
    var signifydTransactionEntryObj;
    while (iter.hasNext()) {
        var processedResult = iter.next();
        log.debug('Settlement Status for order {0} \n {1}', processedResult.order.orderNo, JSON.stringify(processedResult.settlementResponse));
        if (processedResult.settlementResponse.status) {
            processedResult.order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            if(siteID === 'tumi-us' && !CustomObjectMgr.getCustomObject('SignifydTransactionEntriesForUS', processedResult.order.orderNo)) {
                signifydTransactionEntryObj = CustomObjectMgr.createCustomObject('SignifydTransactionEntriesForUS', processedResult.order.orderNo);
            } else if (siteID === 'tumi-ca' && !CustomObjectMgr.getCustomObject('SignifydTransactionEntriesForCA', processedResult.order.orderNo)) {
                signifydTransactionEntryObj = CustomObjectMgr.createCustomObject('SignifydTransactionEntriesForCA', processedResult.order.orderNo);
            }
        }
    }
}

function beforeStep() {
    var OrderMgr = require('dw/order/OrderMgr');
    var query = '(shippingStatus = {0} OR status = {1}) AND paymentStatus = {2}';
    ordersIterator = OrderMgr.queryOrders(query, null, Order.SHIPPING_STATUS_SHIPPED, Order.ORDER_STATUS_CANCELLED, Order.PAYMENT_STATUS_NOTPAID);
}

module.exports = {
    read: read,
    process: process,
    write: write,
    beforeStep: beforeStep
};