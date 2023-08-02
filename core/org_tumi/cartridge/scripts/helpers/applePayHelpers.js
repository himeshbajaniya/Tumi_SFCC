/* globals session */
'use strict';

/* API Includes */
var Logger = require('dw/system/Logger').getLogger('ApplePay', 'ApplePayHelpers');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
var ShippingMgr = require('dw/order/ShippingMgr');
var ArrayList = require('dw/util/ArrayList');
var tumiHelpers = require('*/cartridge/scripts/helpers/tumiHelpers');
/**
 * calculate Apple Pay basket
 *
 * @param {dw.order.Basket} basket - the basket
 */
function calculateBasket(basket) {
    var Transaction = require('dw/system/Transaction');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    try {
        if (basket) {
            // Calculate the basket
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(basket);
            });
        }
    } catch (ex) {
        Logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
    }
}
/**
 * Validate Apple Pay Order
 *
 * @param {dw.order.Order} order - the order
 * @returns {dw.System.Status} status
 */
function validateOrder(order) {
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    var Status = require('dw/system/Status');
    var validationHelpers = require('org_tumi/cartridge/scripts/helpers/applePayAddressValidationHelpers');
    var status = new Status(Status.OK);

    if (!order) {
        status = new Status(Status.ERROR);
        status.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
        return status;
    }

    var shipments = order.getShipments();
    if (shipments.length > 0) {
        for (var i = 0; i < shipments.length; i++) {
            var shipment = shipments[i];

            // skip shipment if it is empty
            if (shipment.productLineItems.length === 0) {
                continue; // eslint-disable-line no-continue
            }
            var shippingIgnoreFields = [];
            var storeId = Object.hasOwnProperty.call(shipment.custom, 'fromStoreId') && shipment.custom.fromStoreId ? shipment.custom.fromStoreId : null;
            if (storeId) {
                var shippingIgnoreFields = ['lastName'];
            }

            // make sure shipping address passes basic validation
            var shippingAddress = shipment.getShippingAddress();
            var eligibleShippingMethods = new ArrayList(ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods());
            if (!storeId && eligibleShippingMethods.length == 1 && eligibleShippingMethods[0].ID === 'pickup') {
                status = new Status(Status.ERROR);
                status.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_ADDRESS);
                return status;
            }
            
            var shippingAddressValidationErrors = validationHelpers.shippingAddress(shippingAddress, shippingIgnoreFields);
            if (shippingAddressValidationErrors && shippingAddressValidationErrors.length > 0) {
                status = new Status(Status.ERROR);
                session.custom.applePayAddressError = true;
                status.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_ADDRESS);
                return status;
            }
        }
    }

    // make sure billing address passes basic validation
    var billingAddress = order.getBillingAddress();
    var billingAddressValidationErrors = validationHelpers.billingAddress(billingAddress);
    if (billingAddressValidationErrors && billingAddressValidationErrors.length > 0) {
        status = new Status(Status.ERROR);
        session.custom.applePayAddressError = true;
        status.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_BILLING_ADDRESS);
        return status;
    }

    return status;
}

/**
 * validate Apple Pay shipments
 *
 * @param {dw.order.Basket} basket - the basket
 */
function validateShipments(basket, apResponse) {
    if (!basket) {
        return;
    }

    var shipments = basket.getShipments();
    if (shipments.length > 0) {
        for (var i = 0; i < shipments.length; i++) {
            var shipment = shipments[i];

            // skip shipment if it is empty
            if (shipment.productLineItems.length === 0) {
                continue; // eslint-disable-line no-continue
            }

            // make sure store shipment still has store address
            var storeId = Object.hasOwnProperty.call(shipment.custom, 'fromStoreId') && shipment.custom.fromStoreId ? shipment.custom.fromStoreId : null;
            if (storeId) {
                //updateStoreShippingAddress(shipment.getShippingAddress(), shipment, storeId);
                // set the shipping address to the store address
                // make sure all physical shipments have the same shipping address
                //updatePhysicalShippingAddress(shipment.getShippingAddress(), shipment, basket);
            }
        }
    }
}

/**
 * Customize the Apple Pay payment sheet
 *
 * @param {dw.order.Basket} basket - the basket
 * @param {Object} apRequest - the Apple Pay Request
 */
function customizeRequest(basket, apRequest) {
    var ArrayList = require('dw/util/ArrayList');
    var Currency = require('dw/util/Currency');
    var Money = require('dw/value/Money');
    var Resource = require('dw/web/Resource');
    var TaxMgr = require('dw/order/TaxMgr');

    if (!basket) {
        return;
    }

    var lineItemsList = new ArrayList();
    var productLabel;
    var shippingType = 'shipping';
    var shipments = basket.getShipments();
    var shipToMeShipment = cartHelper.getShipToMeShipment(basket);
    var isBasketHavingOnlyStorePickupitems = cartHelper.isBasketHavingOnlyStorePickupitems(basket);
    var respShippingMethods = [];

    if (shipments.length === 1 && isBasketHavingOnlyStorePickupitems && !empty(shipments[0].custom.fromStoreId)) {
        var shipment = shipments[0];
        var storeId = shipments[0].custom.fromStoreId;
        var storeMgr = require('dw/catalog/StoreMgr');
        var store = storeMgr.getStore(shipments[0].custom.fromStoreId);
        if (store) {
            var storeName = tumiHelpers.removeSpecialCharacterFromStoreName(store.name);
            Transaction.wrap(function () {
                var shippingAddress = shipment.getShippingAddress();
                if (!shippingAddress) {
                    shippingAddress = shipment.createShippingAddress();
                }
                shippingAddress.setFirstName(storeName);
                shippingAddress.setLastName('');
                shippingAddress.setAddress1(store.address1);
                shippingAddress.setAddress2(store.address2);
                shippingAddress.setCity(store.city);
                shippingAddress.setPostalCode(store.postalCode);
                shippingAddress.setStateCode(store.stateCode);
                shippingAddress.setCountryCode(String(store.countryCode.value).toUpperCase());
                shippingAddress.setPhone(store.phone);
            });

            var shippingContact = {};
            shippingContact.familyName = '';
            shippingContact.givenName = storeName;
            shippingContact.addressLines = [];
            shippingContact.addressLines[0] = store.address1 || '';
            shippingContact.addressLines[1] = store.address2 || '';
            shippingContact.locality = store.city || '';
            shippingContact.postalCode = store.postalCode || '';
            shippingContact.administrativeArea = store.stateCode || '';
            shippingContact.countryCode = String(store.countryCode.value).toUpperCase();
            shippingContact.phoneNumber = store.phone || '';

            for(var j = 0; j < apRequest.shippingMethods.length; j++) {
                var method = apRequest.shippingMethods[j];
                if(method.identifier === 'pickup') {
                    respShippingMethods.push(method);
                }
            }
            apRequest.shippingMethods = respShippingMethods;

            apRequest.shippingType = 'storePickup';
            apRequest.shippingContactEditingMode = 'storePickup';
            apRequest.shippingContact = shippingContact; // eslint-disable-line no-param-reassign
        }
    }
    
    if (shipToMeShipment) {
        for(var i = 0; i < apRequest.shippingMethods.length; i++) {
            var method = apRequest.shippingMethods[i];
            if(method.identifier !== 'pickup') {
                respShippingMethods.push(method);
            }
        }

        if (respShippingMethods.length == 0) {
            var shippingMethodObj = {
               identifier: 'NA',
               amount: '0.00',
               label: 'SHIPPING UNAVAILABLE',
               detail: 'We are unable to deliver to your selected address.'
            };
            respShippingMethods.push(shippingMethodObj);
            apRequest.shippingMethods = respShippingMethods;
        }
        apRequest.shippingMethods = respShippingMethods;
    }

    // re-calculate the basket
    calculateBasket(basket);
}

module.exports = {
    calculateBasket: calculateBasket,
    validateOrder: validateOrder,
    validateShipments: validateShipments,
    customizeRequest: customizeRequest
};
