'use strict';

/**
 * @namespace Checkout
 */

var server = require('server');
server.extend(module.superModule);

var Transaction = require('dw/system/Transaction');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var giftCardHelpers = require('*/cartridge/scripts/helpers/giftCardHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

/**
 * Main entry point for Checkout
 */

/**
 * Checkout-Begin : The Checkout-Begin endpoint will render the checkout shipping page for both guest shopper and returning shopper
 * @name Base/Checkout-Begin
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - stage - a flag indicates the checkout stage
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append(
    'Begin',
    function (req, res, next) {
        var AccountModel = require('*/cartridge/models/account');
        var BasketMgr = require('dw/order/BasketMgr');
        var checkoutHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var currentBasket = BasketMgr.getCurrentBasket();
        var viewData = res.getViewData();
        var currentCustomer = req.currentCustomer.raw;
        var accountModel = new AccountModel(req.currentCustomer);
        var pickupPersonDetailsAvailable = false;
        if (viewData.customer.preferredAddress) {
            viewData.defaultAddressID= viewData.customer.preferredAddress.ID;
        }
        if (viewData.isBasketHavingOnlyStorePickupitems && viewData.customer.profile && !empty(viewData.customer.profile.firstName) && !empty(viewData.customer.profile.lastName) && !empty(viewData.customer.profile.phone) && !empty(viewData.customer.profile.email)) {
            pickupPersonDetailsAvailable = true;
        }
        var billingAddress = currentBasket.billingAddress;
        if (!viewData.isBasketHavingOnlyStorePickupitems && billingAddress && viewData.order && viewData.order.shipping && viewData.order.shipping[0].shippingAddress && viewData.order.shipping[0].shippingAddress.phone) {
            Transaction.wrap(function () {
                billingAddress.setPhone(viewData.order.shipping[0].shippingAddress.phone);
            });
        }
        var shipToMeShipment = cartHelper.getShipToMeShipment(currentBasket);

        viewData.paypalExpressCheckout = !!(Object.hasOwnProperty.call(req.querystring, 'fromPayPalExpress') && req.querystring.fromPayPalExpress);
        viewData.phonenumbermissing = !!(Object.hasOwnProperty.call(req.querystring, 'phonenumbermissing') && req.querystring.phonenumbermissing);
        res.setViewData({pickupPersonDetailsAvailable: pickupPersonDetailsAvailable});

        var isGiftCardPaymentMethodEnabled = giftCardHelpers.isGiftCardPaymentMethodEnabled();
        res.setViewData({isGiftCardPaymentMethodEnabled: isGiftCardPaymentMethodEnabled});
        var orderLineItems = viewData.order.items.items;
        var isOrderAccentableOrMonogramable = false;
        // orderLineItems.map(function (lineItem) {
        for (var i in orderLineItems) {
            if ((orderLineItems[i].isPremiumMonogrammedPLI && orderLineItems[i].associatedLetter) || (orderLineItems[i].monogramable && orderLineItems[i].monogramLineItem) || (orderLineItems[i].isAccentingSku)) {
                isOrderAccentableOrMonogramable = true;
                break;
            }
        }
        res.setViewData({isOrderAccentableOrMonogramable: isOrderAccentableOrMonogramable});

        if (viewData.currentStage == 'placeOrder') return next();

        if(viewData.currentStage == 'customer') {
            res.setViewData({
                currentStage : 'shipping'
            });
        } else if (viewData.isBasketHavingOnlyStorePickupitems && pickupPersonDetailsAvailable) {
            res.setViewData({
                currentStage : 'payment'
            });
        } else if (accountModel.registeredUser && !viewData.isBasketHavingOnlyStorePickupitems && !viewData.paypalExpressCheckout && currentCustomer.addressBook.addresses.length > 0 && currentBasket.defaultShipment.shippingAddress && currentBasket.defaultShipment.shippingAddress.address1 && currentBasket.defaultShipment.shippingAddress.city && currentBasket.defaultShipment.shippingAddress.postalCode && checkoutHelpers.isShippingAddressValid(currentBasket.defaultShipment.shippingAddress)) {
            res.setViewData({
                currentStage : 'payment'
            });
        } else if (!accountModel.registeredUser && !viewData.isBasketHavingOnlyStorePickupitems && shipToMeShipment && shipToMeShipment.shippingAddress && empty(shipToMeShipment.shippingAddress.address1)) {
            res.setViewData({
                currentStage : 'shipping'
            });
        }
        return next();
    }
);


module.exports = server.exports();
