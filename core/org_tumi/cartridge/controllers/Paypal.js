'use strict';

const server = require('server');
server.extend(module.superModule);

const Transaction = require('dw/system/Transaction');
const HookMgr = require('dw/system/HookMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const Money = require('dw/value/Money');
const BasketMgr = require('dw/order/BasketMgr');
const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Status = require('dw/system/Status');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const CustomerMgr = require('dw/customer/CustomerMgr');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

const {
    getOrderByOrderNo,
    isPurchaseUnitChanged,
    getPurchaseUnit,
    getBARestData,
    hasOnlyGiftCertificates
} = require('*/cartridge/scripts/paypal/helpers/paypalHelper');

const {
    validateExpiredTransaction,
    parseBody,
    validateProcessor,
    removeNonPaypalPayment,
    validateHandleHook,
    validateGiftCertificateAmount,
    validateConnectWithPaypalUrl
} = require('*/cartridge/scripts/paypal/middleware');

const {
    updateOrderBillingAddress,
    updateOrderShippingAddress,
    updateBAShippingAddress
} = require('*/cartridge/scripts/paypal/helpers/addressHelper');

const {
    authorizationAndCaptureWhId,
    paypalPaymentMethodId
} = require('*/cartridge/config/paypalPreferences');

const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

server.replace('ReturnFromCart',
    server.middleware.https,
    removeNonPaypalPayment,
    validateProcessor,
    validateHandleHook,
    validateGiftCertificateAmount,
    function (req, res, next) {
        var {
            currentBasket
        } = BasketMgr;
        var paymentFormResult;
        var paymentForm = server.forms.getForm('billing');
        var processorId = PaymentMgr.getPaymentMethod(paypalPaymentMethodId).getPaymentProcessor().ID.toLowerCase();

        if (HookMgr.hasHook('app.payment.form.processor.' + processorId)) {
            paymentFormResult = HookMgr.callHook('app.payment.form.processor.' + processorId,
                'processForm',
                req,
                paymentForm, {}
            );
        } else {
            paymentFormResult = HookMgr.callHook('app.payment.form.processor.default_form_processor', 'processForm');
        }

        if (!paymentFormResult || paymentFormResult.error) {
            res.setStatusCode(500);
            res.print(createErrorMsg());
            return next();
        }

        var processorHandle = HookMgr.callHook('app.payment.processor.' + processorId,
            'Handle',
            currentBasket,
            paymentFormResult.viewData.paymentInformation
        );

        if (!processorHandle || !processorHandle.success) {
            res.setStatusCode(500);
            res.print(createErrorMsg());
            return next();
        }

        var {
            shippingAddress
        } = processorHandle;

        if (shippingAddress.shipping && !cartHelper.isPaypalShippingValid(shippingAddress.shipping, req.locale.id)) {
            res.json({
                invalidShipping: true
            });
            return next();
        }

        // shippingAddress.phone = '123-123-1234'; // Added this code to test with phone number as PayPal not returning phone number
        var isBasketHavingOnlyStorePickupitems = cartHelper.isBasketHavingOnlyStorePickupitems(currentBasket);
        if (isBasketHavingOnlyStorePickupitems) {
            var basketShipments = currentBasket.getShipments();
            COHelpers.copyStoreAddressToShipment(basketShipments);
        } else {
            updateBAShippingAddress(currentBasket, shippingAddress);
        }

        if (!shippingAddress.phone) {
            res.json({phonenumbermissing: true});
        } else {
            res.json();
        }
        return next();
});

module.exports = server.exports();
