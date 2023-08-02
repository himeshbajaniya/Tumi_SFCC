'use strict';

var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Order = require('dw/order/Order');
var Money = require('dw/value/Money');
var Site = require('dw/system/Site');
var siteID = Site.getCurrent().getID();
const STATUS_SHIPPED = 'SHIPPED';
const STATUS_CANCELLED = 'CANCELLED';

function defineModel(headerArray, contentArray) {
    var obj = {};
    headerArray.forEach(function (head, index) {
        if (head) {
            Object.defineProperty(obj, head, {
                value: contentArray[index],
                enumerable: true
            });
        }
    });
    return obj;
}

function getModel(csvStreamReader) {
    var orderProperyArray = csvStreamReader.readNext();
    var orderModel = null,
        lineItemProperyArray = null,
        lineItems = [];
    if (orderProperyArray && orderProperyArray.length > 0 && orderProperyArray[0] === 'rowType') {
        // Normal Order
        lineItemProperyArray = csvStreamReader.readNext();
        orderModel = defineModel(orderProperyArray, csvStreamReader.readNext());
    }
    var line = csvStreamReader.readNext();
    while (line) {
        var lineItem = defineModel(lineItemProperyArray || orderProperyArray, line);
        lineItems.push(lineItem);
        if (!orderModel) {
            orderModel = {
                orderCode: lineItem.orderCode
            };
        }
        line = csvStreamReader.readNext();
    }
    return {
        order: orderModel,
        lineItems: lineItems
    }
}

function updateShippingOrder(model) {
    if (model && model.order) {
        var order = require('dw/order/OrderMgr').getOrder(model.order.orderCode);
        if (order) {
            model.lineItems.forEach(function (item, index) {
                var pli = order.productLineItems.toArray().find((productLineItem) => productLineItem.custom.entryCode === item.entryCode);
                if (pli) {
                    var signifydFulfilmentEntryObj;
                    Transaction.wrap(function () {
                        pli.custom.packageTrackingId = item.packageTrackingId;
                        pli.custom.packageShippingVendor = item.packageShippingVendor;
                        pli.custom.shippingstatus = item.entryStatus;
                        if (item && item.shipDate) pli.custom.shipDate = item.shipDate;
                        if (item.entryStatus === STATUS_SHIPPED && order.custom.SignifydCaseID) {
                            if(siteID === 'tumi-us' && !CustomObjectMgr.getCustomObject('SignifydFulfilmentEntriesForUS', pli.UUID)) {
                                signifydFulfilmentEntryObj = CustomObjectMgr.createCustomObject('SignifydFulfilmentEntriesForUS', pli.UUID);
                                signifydFulfilmentEntryObj.custom.orderno = model.order.orderCode;
                            } else if (siteID === 'tumi-ca' && !CustomObjectMgr.getCustomObject('SignifydFulfilmentEntriesForCA', pli.UUID)) {
                                signifydFulfilmentEntryObj = CustomObjectMgr.createCustomObject('SignifydFulfilmentEntriesForCA', pli.UUID);
                                signifydFulfilmentEntryObj.custom.orderno = model.order.orderCode;
                            }
                        }
                    });
                }
            });
        }
    }
}

function updateShipmentStatus(order, isReconcillationRequired) {
    var HookMgr = require('dw/system/HookMgr');
    var HashMap = require('dw/util/HashMap');
    var collections = require('*/cartridge/scripts/util/collections');
    var isAllCancelled = true,
        isAllShipped = true,
        isCompleted = true;
    var shipmentsItr = order.shipments.iterator();
    var consignments = new HashMap();
    var signifydTransactionEntryObj;
    while (shipmentsItr.hasNext()) {
        var shipment = shipmentsItr.next();
        var productLineItemsItr = shipment.productLineItems.iterator();
        while (productLineItemsItr.hasNext()) {
            var productLineItem = productLineItemsItr.next();

            var consignmentID = productLineItem.custom.consignmentID;
            if (!consignments.containsKey(consignmentID)) {
                consignments.put(consignmentID, { delivered: productLineItem.custom.shippingstatus.value === STATUS_SHIPPED ? 1 : 0, totalItems: 1, items: [productLineItem] });
            } else {
                var existedConsignment = consignments.get(consignmentID);
                var delivered = productLineItem.custom.shippingstatus.value === STATUS_SHIPPED ? (existedConsignment.delivered + 1) : existedConsignment.delivered;
                var totalItems = totalItems + 1;
                existedConsignment.delivered = delivered;
                existedConsignment.totalItems = totalItems;
                existedConsignment.items.push(productLineItem);
            }
            var isLetterProduct = 'isPremiumMonogramLetter' in productLineItem.custom && !!productLineItem.custom.isPremiumMonogramLetter ;
            isAllShipped = isAllShipped && (productLineItem.custom.shippingstatus.value === STATUS_SHIPPED || isLetterProduct);
            isAllCancelled = isAllCancelled && (productLineItem.custom.shippingstatus.value === STATUS_CANCELLED || isLetterProduct);
            isCompleted = (productLineItem.custom.shippingstatus.value === STATUS_SHIPPED || productLineItem.custom.shippingstatus.value === STATUS_CANCELLED || isLetterProduct);
            if (!isCompleted) break;
        }
        if (isCompleted && !isAllCancelled) Transaction.wrap(() => shipment.setShippingStatus(require('dw/order/Shipment').SHIPPING_STATUS_SHIPPED));
    }
    if (isCompleted) {
        Transaction.wrap(() => {
            if (isAllCancelled) {
                order.setStatus(Order.ORDER_STATUS_CANCELLED);
                if (isReconcillationRequired && HookMgr.hasHook('app.avatax.settlement')) HookMgr.callHook('app.avatax.settlement', 'voidTransaction', order.orderNo);
                // send cancellation e-mail
                if (HookMgr.hasHook('emarsys.sendOrderCancellation')) HookMgr.callHook('emarsys.sendOrderCancellation', 'orderCancellation', {Order: order});
                if (siteID === 'tumi-us' && order.allProductLineItems && order.allProductLineItems.length > 0 && !CustomObjectMgr.getCustomObject('SignifydTransactionEntriesForUS', order.orderNo)) {
                    signifydTransactionEntryObj = CustomObjectMgr.createCustomObject('SignifydTransactionEntriesForUS', order.orderNo);
                } else if (siteID === 'tumi-ca' && order.allProductLineItems && order.allProductLineItems.length > 0 && !CustomObjectMgr.getCustomObject('SignifydTransactionEntriesForCA', order.orderNo)) {
                    signifydTransactionEntryObj = CustomObjectMgr.createCustomObject('SignifydTransactionEntriesForCA', order.orderNo);
                }
            } else {
                if (isReconcillationRequired && HookMgr.hasHook('app.tax.adjust.avalara')) HookMgr.callHook('app.tax.adjust.avalara', 'adjustTax', order);
                order.setShippingStatus(Order.SHIPPING_STATUS_SHIPPED);
                if (isReconcillationRequired && HookMgr.hasHook('app.avatax.settlement')) HookMgr.callHook('app.avatax.settlement', 'commitDocument', order.orderNo);
            }
        });
    }

    var consignmentsList = consignments.keySet().toArray();

    consignmentsList.forEach(function (consignmentID) {
        var consignment = consignments.get(consignmentID);
        if (consignment.delivered === consignment.totalItems && !order.custom.emarsysShippingEmailSent) {
            // send shipping confirmation mail
            if (HookMgr.hasHook('emarsys.sendShippingConfirmation')) HookMgr.callHook('emarsys.sendShippingConfirmation', 'shippingConfirm', {Order: order, consignmentID: consignmentID, items: consignment.items});
        }
    });
}

function calculateShippedReconcillation(order) {
    var shipmentsItr = order.shipments.iterator();
    var orderReconcillationPrice = new Money(0, order.currencyCode);
    var orderTaxReconcillationPrice = new Money(order.custom.reconcileTaxPrice || 0, order.currencyCode);
    while (shipmentsItr.hasNext()) {
        var shipment = shipmentsItr.next();
        var lineItemsItr = shipment.allLineItems.iterator();
        var reconcillationPrice = new Money(0, order.currencyCode);
        while (lineItemsItr.hasNext()) {
            var lineItem = lineItemsItr.next();
            var isLetterProduct = 'isPremiumMonogramLetter' in lineItem.custom && !!lineItem.custom.isPremiumMonogramLetter ;
            if (lineItem instanceof require('dw/order/ProductLineItem') && lineItem.custom.shippingstatus.value === STATUS_SHIPPED || isLetterProduct) reconcillationPrice = reconcillationPrice.add(lineItem.proratedPrice);
            if (lineItem instanceof require('dw/order/ShippingLineItem')) reconcillationPrice = reconcillationPrice.add(lineItem.adjustedPrice);
        }
        if (reconcillationPrice) shipment.custom.reconcillationPrice = reconcillationPrice.value;
        orderReconcillationPrice = orderReconcillationPrice.add(reconcillationPrice);
    }
    return orderReconcillationPrice.add(orderTaxReconcillationPrice);
}

function calculateCancelledReconcillation(order) {
    // Not required at this point of time.

    /* var shipmentsItr = order.shipments.iterator();
    var orderReconcillationPrice = new Money(0, order.currencyCode);
    while (shipmentsItr.hasNext()) {
        var shipment = shipmentsItr.next();
        var lineItemsItr = shipment.allLineItems.iterator();
        var reconcillationPrice = new Money(0, order.currencyCode);
        while (lineItemsItr.hasNext()) {
            var lineItem = lineItemsItr.next();
            if (lineItem instanceof require('dw/order/ProductLineItem') && lineItem.custom.shippingstatus.value === STATUS_CANCELLED) reconcillationPrice = reconcillationPrice.add(lineItem.proratedPrice);
        }
        if (reconcillationPrice.available) shipment.custom.reconcillationPrice = reconcillationPrice.value;
        orderReconcillationPrice = orderReconcillationPrice.add(reconcillationPrice);
    } */
    return order.totalGrossPrice;
}

function reconcillationPrice(order) {
    var orderReconcillationPrice = new Money(0, order.currencyCode);;
    if (order.status.value === Order.ORDER_STATUS_CANCELLED) orderReconcillationPrice = orderReconcillationPrice.add(calculateCancelledReconcillation(order));
    if (order.shippingStatus.value === Order.SHIPPING_STATUS_SHIPPED) orderReconcillationPrice = orderReconcillationPrice.add(calculateShippedReconcillation(order));
    if ('reconcileTaxPrice' in order.custom && order.custom.reconcileTaxPrice) orderReconcillationPrice.add(new Money(order.custom.reconcileTaxPrice, session.currency.currencyCode));
    order.custom.reconcillationPrice = orderReconcillationPrice.value;
}

function reconcillationPaymentInstrument(order) {
    var reconcillationAmount = order.custom.reconcillationPrice;
    if (order.paymentInstruments.length === 1) {
        order.paymentInstruments[0].custom.settlementamount = reconcillationAmount;
    } else {
        var gcSortedPaymentInstruments = order.paymentInstruments.toArray().sort((paymentInstr1) => paymentInstr1.paymentMethod === 'GIFT_CERTIFICATE' ? -1 : 1);
        gcSortedPaymentInstruments.forEach((paymentInst) => {
            if (reconcillationAmount > 0) {
                if (reconcillationAmount > paymentInst.paymentTransaction.amount.value) {
                    paymentInst.custom.settlementamount = paymentInst.paymentTransaction.amount.value;
                    reconcillationAmount = reconcillationAmount - paymentInst.paymentTransaction.amount.value;
                } else {
                    paymentInst.custom.settlementamount = reconcillationAmount;
                    reconcillationAmount = 0;
                }
            }
        });
    }
}

module.exports = {
    getModel: getModel,
    updateShippingOrder: updateShippingOrder,
    updateShipmentStatus: updateShipmentStatus,
    reconcillationPrice: reconcillationPrice,
    reconcillationPaymentInstrument: reconcillationPaymentInstrument
};