'use strict';

var Site = require('dw/system/Site');
var siteID = Site.getCurrent().getID();
var System = require('dw/system/System');
var sitePrefs = Site.getCurrent().getPreferences();
var EnableCartridge = sitePrefs.getCustom().SignifydEnableCartridge;
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var OrderMgr = require('dw/order/OrderMgr');
var collections = require('*/cartridge/scripts/util/collections');
var signifydInit = require('int_signifyd/cartridge/scripts/service/signifydInit');

/**
 * Get Main Payment Instrument. It's the first credit card payment instrument,
 * If not available, the first payment instrument is returned
 *
 * @param {dw.util.Collection} paymentInstruments collection of PaymentInstruments on order
 * @return {dw.order.PaymentInstrument} main payment instrument
 */
function getMainPaymentInst(paymentInstruments) {
    var creditCardPaymentInst = null;
    var firstPaymentInst = null;
    if (!empty(paymentInstruments)) { // eslint-disable-line no-undef
        var iterator = paymentInstruments.iterator();
        firstPaymentInst = paymentInstruments[0];

        while (iterator.hasNext() && empty(creditCardPaymentInst)) { // eslint-disable-line no-undef
            var paymentInst = iterator.next();
            if (paymentInst.getPaymentMethod() === dw.order.PaymentInstrument.METHOD_CREDIT_CARD) { // eslint-disable-line no-undef
                creditCardPaymentInst = paymentInst;
            }
        }
    }

    if (!empty(creditCardPaymentInst)) { // eslint-disable-line no-undef
        return creditCardPaymentInst;
    }
    return firstPaymentInst;
}

function getSendTransactionParams(order) {
    var cal = new Calendar(order.creationDate);
    var paymentInstruments = order.allProductLineItems[0].lineItemCtnr.getPaymentInstruments();
    var paymentTransaction = paymentInstruments[0].getPaymentTransaction();
    var paymentInstrument = paymentTransaction.getPaymentInstrument();
    var mainPaymentInst = getMainPaymentInst(order.getPaymentInstruments());
    var mainTransaction = mainPaymentInst.getPaymentTransaction();
    var mainPaymentProcessor = mainTransaction.getPaymentProcessor();
    var paramsObj = {
        transactions: [{
            parentTransactionId: null,
            transactionId: paymentTransaction.transactionID,
            createdAt: StringUtils.formatCalendar(cal, "yyyy-MM-dd'T'HH:mm:ssZ"),
            gateway: mainPaymentProcessor.ID,
            paymentMethod: paymentInstrument.getPaymentMethod(),
            type: 'AUTHORIZATION',
            gatewayStatusCode: 'SUCCESS',
            currency: paymentTransaction.amount.currencyCode,
            amount: paymentTransaction.amount.value,
            avsResponseCode: '', // to be updated by the merchant
            cvvResponseCode: '' // to be updated by the merchant
        }]
    };

    if (!empty(mainPaymentInst)) { // eslint-disable-line no-undef
        paramsObj.checkoutToken = mainPaymentInst.UUID;
        paramsObj.transactions[0].checkoutPaymentDetails = {
            holderName: mainPaymentInst.creditCardHolder,
            cardLast4: mainPaymentInst.creditCardNumberLastDigits,
            cardExpiryMonth: mainPaymentInst.creditCardExpirationMonth,
            cardExpiryYear: mainPaymentInst.creditCardExpirationYear,
            bankAccountNumber: mainPaymentInst.getBankAccountNumber(),
            bankRoutingNumber: mainPaymentInst.getBankRoutingNumber(),
            billingAddress: {
                streetAddress: order.billingAddress.address1,
                unit: order.billingAddress.address2,
                city: order.billingAddress.city,
                provinceCode: order.billingAddress.stateCode,
                postalCode: order.billingAddress.postalCode,
                countryCode: order.billingAddress.countryCode.value
            }
        };
        paramsObj.transactions[0].paymentAccountHolder = {
            accountId: mainPaymentInst.getBankAccountNumber(),
            accountHolderName: mainPaymentInst.getBankAccountHolder(),
            billingAddress: {
                streetAddress: order.billingAddress.address1,
                unit: order.billingAddress.address2,
                city: order.billingAddress.city,
                provinceCode: order.billingAddress.stateCode,
                postalCode: order.billingAddress.postalCode,
                countryCode: order.billingAddress.countryCode.value
            }
        };
    }

    if (!empty(mainPaymentProcessor)) { // eslint-disable-line no-undef
        paramsObj.transactions[0].gateway = mainPaymentProcessor.ID;
    }

    return paramsObj;
}

function getDeliveryAddress(shipment) {
    var deliveryAddress = {
        streetAddress: shipment.shippingAddress.address1,
        unit: shipment.shippingAddress.address2 || '',
        city: shipment.shippingAddress.city,
        provinceCode: '',
        postalCode: shipment.shippingAddress.postalCode,
        countryCode: shipment.shippingAddress.countryCode.value
    };

    return deliveryAddress;
}

function getSendFulfillmentParams(order, pli) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var cal = new Calendar(new Date());
    var shipment = pli.getShipment();
    var products = [];
    products.push({
        ItemName: pli.lineItemText,
        ItemPrice: pli.grossPrice.value,
        ItemQuantity: pli.quantity.value,
        ItemIsDigital: false,
        ItemId: pli.productID,
    });

    var recipientName = shipment.custom.shipmentType === 'instore' ? shipment.shippingAddress.firstName + ' ' + shipment.shippingAddress.firstName : shipment.shippingAddress.fullName;
    var isInStorePickup =  shipment.custom.shipmentType === 'instore';
    var packageTrackingId = pli.custom.packageTrackingId ? pli.custom.packageTrackingId : '';
    var packageShippingVendor = pli.custom.packageShippingVendor ? pli.custom.packageShippingVendor : '';
    var store = StoreMgr.getStore(pli.shipment.custom.fromStoreId);
    var fulfillmentStatus = order.getShippingStatus().displayValue === 'PARTSHIPPED' ? 'PARTIAL' : 'COMPLETE';
    var paramsObj = {
        fulfillments: [{
            id: pli.custom.consignmentID,
            orderId: order.orderNo,
            createdAt: StringUtils.formatCalendar(cal, "yyyy-MM-dd'T'HH:mm:ssZ"),
            recipientName: recipientName,
            deliveryEmail: order.getCustomerEmail(),
            fulfillmentStatus: fulfillmentStatus,
            shipmentStatus: 'OUT FOR DELIVERY',
            shippingCarrier: isInStorePickup ? '' : packageShippingVendor,
            trackingNumbers: [packageTrackingId],
            trackingUrls: ['http://tumi.narvar.com/tumi/tracking/UPS?tracking_numbers=' + packageTrackingId],
            products: products,
            deliveryAddress: getDeliveryAddress(shipment),
            ConfirmationName: isInStorePickup && store ? store.name : '',
            ConfirmationPhone: isInStorePickup ? shipment.shippingAddress.phone : ''
        }]
    };

    return paramsObj;
}

function sendFulfillment(orderno, pliuuid) {
    if (EnableCartridge) {
        var OrderMgr = require('dw/order/OrderMgr');
        var collections = require('*/cartridge/scripts/util/collections');
        var order = OrderMgr.getOrder(orderno);

        if (order && order.currentOrderNo) {
            var productLineItems = order.allProductLineItems;
            var pli = collections.find(productLineItems, function (item) {
                return item.UUID === pliuuid;
            });
            if (pli) {
                var params = getSendFulfillmentParams(order, pli);
                var service = signifydInit.sendFulfillment();

                if (service) {
                    var result = service.call(params);
                    if (result.ok) {
                        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
                        var signifydFulfilmentEntryObj;
                        if (siteID === 'tumi-us') {
                            signifydFulfilmentEntryObj = CustomObjectMgr.getCustomObject('SignifydFulfilmentEntriesForUS', pliuuid);
                        } else if (siteID === 'tumi-ca') {
                            signifydFulfilmentEntryObj = CustomObjectMgr.getCustomObject('SignifydTransactionEntriesForCA', pliuuid);
                        }
                        if (signifydFulfilmentEntryObj) {
                            CustomObjectMgr.remove(signifydFulfilmentEntryObj);
                        }
                    } else {
                        Logger.getLogger('Signifyd', 'signifyd').error('Error: SendFulfillment API call for order {0} has failed.', order.currentOrderNo);
                    }
                }
            }
        }
    }
}


function sendTransaction(orderno) {
    try {
        Logger.getLogger('Signifyd', 'signifyd').debug('Processing Order no: {0} for sendTransaction call ', orderno);
        if (EnableCartridge) {
            var order = OrderMgr.getOrder(orderno);
            if (order && order.currentOrderNo && order.allProductLineItems && order.allProductLineItems.length > 0) {
                var params = getSendTransactionParams(order);
                var service = signifydInit.sendTransaction();

                if (service) {
                    try {
                        var result = service.call(params);
                        if (result.ok) {
                            var CustomObjectMgr = require('dw/object/CustomObjectMgr');
                            var signifydTransactionEntryObj;
                            if (siteID === 'tumi-us') {
                                signifydTransactionEntryObj = CustomObjectMgr.getCustomObject('SignifydTransactionEntriesForUS', orderno);
                            } else if (siteID === 'tumi-ca') {
                                signifydTransactionEntryObj = CustomObjectMgr.getCustomObject('SignifydTransactionEntriesForCA', orderno);
                            }
                            if (signifydTransactionEntryObj) {
                                CustomObjectMgr.remove(signifydTransactionEntryObj);
                            }
                        } else {
                            Logger.getLogger('Signifyd', 'signifyd').error('Error: API the SendTransaction was interrupted unexpectedly. Exception: {0}', e.message);
                        }
                    } catch (e) {
                        Logger.getLogger('Signifyd', 'signifyd').error('Error: API the SendTransaction was interrupted unexpectedly. Exception: {0}', e.message);
                    }
                } else {
                    Logger.getLogger('Signifyd', 'signifyd').error('Error: Service Please provide correct order for the SendTransaction method');
                }
            } else {
                Logger.getLogger('Signifyd', 'signifyd').error('Error: Please provide correct order for the SendTransaction method');
            }
        }
    } catch (e) {
        Logger.getLogger('Signifyd', 'signifyd').error('sendTransaction method crashed for OrderID: {0} at line:{1}. ERROR: {2}', orderno, e.lineNumber, e.message);
    }

    return 0;
};

function cancelGuarantee(orderno) {
    if (EnableCartridge) {
        var order = OrderMgr.getOrder(orderno);
        if (order && order.currentOrderNo && order.custom.SignifydCaseID) {
            try {
                var signifydCaseId = order.custom.SignifydCaseID;
                var params = {};
                var requestObj = { "guaranteeDisposition": "CANCELED" };
                params.signifydCaseId = signifydCaseId;
                params.requestObj = requestObj;

                requestObj.guaranteeDisposition = "CANCELED";
                var service = signifydInit.cancelGuarantee();

                if (service) {
                    Logger.getLogger('Signifyd', 'signifyd').info('Info: cancelGuarantee API call for order {0}', order.currentOrderNo);

                    var result = service.call(params);
                    if (result.ok) {
                        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
                        var signifydTransactionEntryObj;
                        if (siteID === 'tumi-us') {
                            signifydTransactionEntryObj = CustomObjectMgr.getCustomObject('SignifydTransactionEntriesForUS', orderno);
                        } else if (siteID === 'tumi-ca') {
                            signifydTransactionEntryObj = CustomObjectMgr.getCustomObject('SignifydTransactionEntriesForCA', orderno);
                        }
                        if (signifydTransactionEntryObj) {
                            CustomObjectMgr.remove(signifydTransactionEntryObj);
                        }
                    } else {
                        Logger.getLogger('Signifyd', 'signifyd').error('Error: cancelGuarantee API call for order {0} has failed.', order.currentOrderNo);
                    }
                } else {
                    Logger.getLogger('Signifyd', 'signifyd').error('Error: Could not initialize cancelGuarantee service.');
                }

            } catch (e) {
                Logger.getLogger('Signifyd', 'signifyd').error('Error: cancelGuarantee method was interrupted unexpectedly. Exception: {0}', e.message);
            }
        } else {
            Logger.getLogger('Signifyd', 'signifyd').error('Error: Please provide correct order for the cancelGuarantee method');
        }
    }
}

exports.sendFulfillment = sendFulfillment;
exports.sendTransaction = sendTransaction;
exports.cancelGuarantee = cancelGuarantee;