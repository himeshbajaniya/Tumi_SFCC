'use strict';

var returnsItr;
var returnHelpers = require('~/cartridge/scripts/helpers/returnHelpers');
var HookMgr = require('dw/system/HookMgr');
var Transaction = require('dw/system/Transaction');
var Log = require('~/cartridge/scripts/logger/log');
var log = new Log('ProcessReturns');

function read() {
    if (returnsItr) {
        while (returnsItr.hasNext()) return returnsItr.next();
    }
    return null;
}

function process(co, args) {
    if (!co || !('entryCode' in co.custom) || !co.custom.entryCode || !('orderCode' in co.custom) || !co.custom.orderCode) return null;
    var order = require('dw/order/OrderMgr').getOrder(co.custom.orderCode);
    if (!order) {
        log.debug('Order No: {0} not found in instance', co.custom.orderCode);
        return null;
    }

    var data = [];
    if (args.isRefundCallRequired) {
        var paymentInstrumentsItr = order.paymentInstruments.iterator();
        while (paymentInstrumentsItr.hasNext()) {
            var paymentInstr = paymentInstrumentsItr.next();
            if (!paymentInstr || !paymentInstr.paymentTransaction || !paymentInstr.paymentTransaction.paymentProcessor || !paymentInstr.paymentTransaction.paymentProcessor.ID) continue;
            var paymentProcessorID = paymentInstr.paymentTransaction.paymentProcessor.ID.toLowerCase();
            var returnCostAndPosition = returnHelpers.fetchReturnCostAndPosition(co);
            if (!returnCostAndPosition || !returnCostAndPosition.price) continue;
            var isPaid = order.paymentStatus.value === require('dw/order/Order').PAYMENT_STATUS_PAID;
            var status;
            if (!isPaid && HookMgr.hasHook('app.payment.settlement.void.' + paymentProcessorID)) status = HookMgr.callHook('app.payment.settlement.void.' + paymentProcessorID, 'processRefund', order.orderNo, order.currencyCode, paymentInstr, amount);
            if (isPaid && HookMgr.hasHook('app.payment.settlement.refund.' + paymentProcessorID)) {
                status = HookMgr.callHook('app.payment.settlement.refund.' + paymentProcessorID, 'processRefund', order.orderNo, order.currencyCode, paymentInstr, returnCostAndPosition.price);
                if (status && status.status && HookMgr.hasHook('app.tax.refund.avalara')) status = HookMgr.callHook('app.tax.refund.avalara', 'refundTax', order, co.custom.rmaOrderNumber, returnCostAndPosition.price, returnCostAndPosition.position);
                if (status && status.status && HookMgr.hasHook('emarsys.order.return')) status = HookMgr.callHook('emarsys.order.return', 'orderReturn', {Order: order, orderNumber: co.custom.rmaOrderNumber, price: returnCostAndPosition.price, isPaid: isPaid, cardNumber: paymentInstr.creditCardNumber, cardHolder: paymentInstr.creditCardHolder});
            }
            if (isPaid && HookMgr.hasHook('app.singnifyd.cancel.guarantee')) HookMgr.callHook('app.singnifyd.cancel.guarantee', 'cancelGuarantee', order.orderNo);
            data.push({
                uuid: paymentInstr.UUID,
                serviceStatus: status
            });
        }
    } else if (HookMgr.hasHook('app.singnifyd.cancel.guarantee')) {
        HookMgr.callHook('app.singnifyd.cancel.guarantee', 'cancelGuarantee', order.orderNo);
    }
    var lineItemsItr = order.productLineItems ? order.productLineItems.toArray() : [];
    var productLineItem = lineItemsItr.find((pli) => pli.custom.entryCode === co.custom.entryCode);
    if (productLineItem) {
        Transaction.wrap(function () {
            productLineItem.custom.shippingstatus = 'RETURN_RECEIVED';
        });
    }
    return {
        data: data,
        customObj: co
    };
}

function write(args, params) {
    var iter = args.iterator();
    while (iter.hasNext()) {
        var items = iter.next();
        if (!params.isRefundCallRequired || !items.data.find((item) => !item.serviceStatus.status)) returnHelpers.removeCO(items.customObj);
    }
}

function beforeStep(args) {
    returnsItr = returnHelpers.fetchAll();
}

module.exports = {
    read: read,
    process: process,
    write: write,
    beforeStep: beforeStep
};