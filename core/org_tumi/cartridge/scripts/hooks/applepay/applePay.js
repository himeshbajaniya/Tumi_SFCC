'use strict';

var Status = require('dw/system/Status');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Transaction = require('dw/system/Transaction');
var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
var validationHelpers = require('org_tumi/cartridge/scripts/helpers/applePayAddressValidationHelpers');
var applePayHelpers = require('org_tumi/cartridge/scripts/helpers/applePayHelpers');
var cartHelper = require('org_tumi/cartridge/scripts/cart/cartHelpers');
var CardHelper = require('int_cybersource_sfra/cartridge/scripts/helper/CardHelper.js');
var tumiHelpers = require('*/cartridge/scripts/helpers/tumiHelpers');
var Logger = require('dw/system/Logger').getLogger('ApplePayHooks', 'ApplePayHooks');
var paymentMethodID = 'DW_APPLE_PAY';

exports.getRequest = function (basket, apRequest) {
    session.custom.applepaysession = 'yes';   // eslint-disable-line
    applePayHelpers.customizeRequest(basket, apRequest);
};

exports.shippingContactSelected = function (basket, event, apResponse) {
    session.custom.applepayShippingContactSelected = 'true';
    var status = new Status(Status.OK);

    if (!basket) {
        status = new Status(Status.ERROR);
        return new ApplePayHookResult(status, null);
    }

    try {
        if (event && Object.hasOwnProperty.call(event, 'shippingContact')) {
            var shippingContact = event.shippingContact;
            if (Object.hasOwnProperty.call(shippingContact, 'countryCode')) {
                var shippingAddress = {
                    firstName: null,
                    lastName: null,
                    address1: null,
                    address2: null,
                    phone: null,
                    postalCode: shippingContact.postalCode,
                    stateCode: shippingContact.administrativeArea,
                    countryCode: shippingContact.countryCode
                };
                var shippingIgnoreFields = ['firstName', 'lastName', 'address1', 'address2', 'phone', 'city'];
                var shippingAddressValidationErrors = validationHelpers.shippingAddress(shippingAddress, shippingIgnoreFields);
                if (shippingAddressValidationErrors && shippingAddressValidationErrors.length > 0 && empty(shippingContact.locality)) {
                    status = new Status(Status.ERROR);
                    status.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_ADDRESS);
                    return new ApplePayHookResult(status, null);
                }
            }
        }

        //applePayHelpers.validateShipments(basket, apResponse);
        applePayHelpers.customizeRequest(basket, apResponse);
    } catch (ex) {
        Logger.error('shippingContactSelected failed: ' + ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
        status = new Status(Status.ERROR);
    }

    if (!status || !status.isError()) {
        status = new Status(Status.OK);
    }

    return new ApplePayHookResult(status, null);
};

exports.authorizeOrderPayment = function (order, responseData) {
    var status = Status.ERROR;
    var authResponseStatus;
    try {
        var paymentMethod = require('dw/order/PaymentMgr').getPaymentMethod(paymentMethodID);
        if (order && order.billingAddress && empty(order.billingAddress.phone)) {
            Transaction.wrap(function () {
                if (order.shipments && order.shipments[0].shippingAddress && order.shipments[0].shippingAddress.phone) {
                    // set billing phone from shipping details
                    order.billingAddress.phone = order.shipments[0].shippingAddress.phone;
                }
            });
        }

        // Update BOPIS SHIPMENT first name from store name.
        var isBasketHavingOnlyStorePickupitems = cartHelper.isBasketHavingOnlyStorePickupitems(order);
        var shipments = order.getShipments();
        if (shipments.length === 1 && isBasketHavingOnlyStorePickupitems && !empty(shipments[0].custom.fromStoreId)) {
            var storeMgr = require('dw/catalog/StoreMgr');
            var store = storeMgr.getStore(shipments[0].custom.fromStoreId);
            if (store) {
                var storeName = tumiHelpers.removeSpecialCharacterFromStoreName(store.name);
                var shippingAddress = shipments[0].getShippingAddress();
                if (shippingAddress) {
                    Transaction.wrap(function () {
                        shippingAddress.setFirstName(storeName);
                        shippingAddress.setLastName('');
                    });
                }
            }
        }
        
        // Validate order
        var orderValidationStatus = applePayHelpers.validateOrder(order);
        if (orderValidationStatus.isError()) {
            return orderValidationStatus;
        }

        // eslint-disable-next-line
        Transaction.wrap(function () {
            //  lineItemCtnr.paymentInstrument field is deprecated.  Get default payment method.
            var paymentInstrument = null;
            // eslint-disable-next-line
            if (!empty(order.getPaymentInstruments())) {
                paymentInstrument = order.getPaymentInstruments()[0];
                paymentInstrument.paymentTransaction.paymentProcessor = paymentMethod.getPaymentProcessor();
            } else {
                return new Status(status);
            }
            paymentInstrument.paymentTransaction.paymentProcessor = paymentMethod.getPaymentProcessor();
        });
        authResponseStatus = require('int_cybersource_sfra/cartridge/scripts/mobilepayments/adapter/MobilePaymentsAdapter').processPayment(order);

        if (CardHelper.HandleCardResponse(authResponseStatus.ServiceResponse.serviceResponse).authorized || CardHelper.HandleCardResponse(authResponseStatus.ServiceResponse.serviceResponse).review) {
            status = Status.OK;
        }
        Transaction.wrap(function () {
            // Set this custom attribute to search Apple pay order in BM based on isApplePayOrder boolean flag.
            order.custom.isApplePayOrder = true;
        });
    } catch (ex) {
        Logger.error('authorizeOrderPayment failed: ' + ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
        status = new Status(Status.ERROR);
    }

    return new Status(status);
};

exports.cancel = function (basket) {	
    Transaction.wrap(function () {
        delete session.custom.applepayShippingContactSelected;
    });
}
