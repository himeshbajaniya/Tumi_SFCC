'use strict';
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var HookMgr = require('dw/system/HookMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Site = require('dw/system/Site');
var collections = require('*/cartridge/scripts/util/collections');
var signifydTransactionEntries;

function read(args) {
    if( signifydTransactionEntries.hasNext() ) {
        return signifydTransactionEntries.next();
    }
    return null;
}

function process(signifydTransactionEntry, args) {
    return signifydTransactionEntry;
}

function write(args, jobparams) {
    var Order = require('dw/order/Order');
    collections.forEach(args, function (signifydTransactionEntry) {
        var order = OrderMgr.getOrder(signifydTransactionEntry.custom.orderNumber);
        if (order && HookMgr.hasHook('app.singnifyd.sendtransaction') && order.shippingStatus.value === Order.SHIPPING_STATUS_SHIPPED && order.paymentStatus.value === Order.PAYMENT_STATUS_PAID) {
            HookMgr.callHook('app.singnifyd.sendtransaction', 'sendTransaction', signifydTransactionEntry.custom.orderNumber);
        } else if (order && HookMgr.hasHook('app.singnifyd.cancel.guarantee') && order.status.value === Order.ORDER_STATUS_CANCELLED) {
            HookMgr.callHook('app.singnifyd.cancel.guarantee', 'cancelGuarantee', signifydTransactionEntry.custom.orderNumber);
        }
    });
}

function beforeStep(args) {
    var siteID = Site.getCurrent().getID();
    if (siteID === 'tumi-us') {
        signifydTransactionEntries =  CustomObjectMgr.getAllCustomObjects('SignifydTransactionEntriesForUS');
    } else if (siteID === 'tumi-ca') {
        signifydTransactionEntries =  CustomObjectMgr.getAllCustomObjects('SignifydTransactionEntriesForCA');
    }    
}

module.exports = {
    read: read,
    process: process,
    write: write,
    beforeStep: beforeStep
};