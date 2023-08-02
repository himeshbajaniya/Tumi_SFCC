'use strict';

var server = require('server');
server.extend(module.superModule);

var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var IsCartridgeEnabled = Site.getCurrent().getCustomPreferenceValue('IsCartridgeEnabled');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');


server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var SignifydCreateCasePolicy = dw.system.Site.getCurrent().getCustomPreferenceValue('SignifydCreateCasePolicy');
    var CybersourceHelper = require('*/cartridge/scripts/cybersource/libCybersource').getCybersourceHelper();
    var CybersourceConstants = require('*/cartridge/scripts/utils/CybersourceConstants');
    var CsSAType = Site.getCurrent().getCustomPreferenceValue('CsSAType').value;
    var DFReferenceId;
    if (request.httpParameterMap.DFReferenceId.submitted) {
        DFReferenceId = request.httpParameterMap.DFReferenceId.stringValue;
        session.privacy.DFReferenceId = DFReferenceId;
    }

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        if ('isPaymentRedirectInvoked' in session.privacy && session.privacy.isPaymentRedirectInvoked
            && 'orderID' in session.privacy && session.privacy.orderID !== null) {
            var order = OrderMgr.getOrder(session.privacy.orderID);
            var currentBasket = COHelpers.reCreateBasket(order);
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var paymentInstrument = null;
    if (!empty(currentBasket.getPaymentInstruments())) {
        paymentInstrument = require('*/cartridge/scripts/util/collections').find(currentBasket.getPaymentInstruments(), (paymentInst) => (paymentInst.paymentMethod === require('dw/order/PaymentInstrument').METHOD_CREDIT_CARD));
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

 // If SFRA version is 3.2 ,then skip new way of validating order.
    if (Resource.msg('global.version.number', 'version', null) != '3.1.0') {
        var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
        var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
        if (validationOrderStatus.error) {
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', validationOrderStatus.message));
            return next();
        }
    } else {
        var validationOrderStatus = hooksHelper(
            'app.validate.order',
            'validateOrder',
            currentBasket,
            require('*/cartridge/scripts/hooks/validateOrder').validateOrder
        );
        if (validationOrderStatus.error) {
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', validationOrderStatus.message));
            return next();
        }
    }
    var hasCC = !!require('*/cartridge/scripts/util/collections').find(currentBasket.paymentInstruments, (paymentInstrument) => paymentInstrument.paymentMethod === 'CREDIT_CARD' || paymentInstrument.paymentMethod.toLowerCase() === 'paypal');
    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        return next();
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        return next();
    }
    var shipToMeShipment = cartHelper.getShipToMeShipment(currentBasket);
    var billingAddress = currentBasket.billingAddress;
    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
        if (shipToMeShipment && shipToMeShipment.shippingAddress && shipToMeShipment.shippingAddress.phone && billingAddress.phone === null) {
            billingAddress.setPhone(shipToMeShipment.shippingAddress.phone);
        }
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'payerAuthError', Resource.msg('error.payment.not.valid', 'checkout', null)));
        return next();
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'payerAuthError', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }

    /* Signifyd Modification Start */
    var Signifyd = require('int_signifyd/cartridge/scripts/service/signifyd');
    var orderSessionID = Signifyd.getOrderSessionId();
    /* Signifyd Modification End */

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }

    if (SignifydCreateCasePolicy == "PRE_AUTH") {
        var SignifydPassiveMode = dw.system.Site.getCurrent().getCustomPreferenceValue('SignifydPassiveMode');
        Signifyd.setOrderSessionId(order, orderSessionID);
        var response = Signifyd.Call(order);

        if (!empty(response) && response.declined) {
            Transaction.wrap(function () {
                if (response.declined) {
                    order.custom.SignifydOrderFailedReason = Resource.msg('error.signifyd.order.failed.reason', 'signifyd', null);
                }
                if (!SignifydPassiveMode) {
                    OrderMgr.failOrder(order);
                }
            });
            if (!SignifydPassiveMode) {
                if (hasCC) {
                    res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.technical', 'checkout', null)));
                } else {
                    res.json({
                        error: true,
                        errorMessage: Resource.msg('error.technical', 'checkout', null)
                    });
                }
                return next();
            }
        }
    }

    // Handles payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
    if (handlePaymentResult.error) {
        if (SignifydCreateCasePolicy === "PRE_AUTH") {
            Signifyd.SendTransaction(order);
        }
        // If Non credit card payment methods
        if (!paymentInstrument) return next();

        if (paymentInstrument.paymentMethod != null
                && (paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.creditcard', 'cybersource', null)
                        || (CsSAType == Resource.msg('cssatype.SA_REDIRECT', 'cybersource', null)
                        || CsSAType == Resource.msg('cssatype.SA_SILENTPOST', 'cybersource', null)
                        || CsSAType == Resource.msg('cssatype.SA_FLEX', 'cybersource', null)))
                        || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.alipay', 'cybersource', null)
                        || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.sof', 'cybersource', null)
                        || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.idl', 'cybersource', null)
                        || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.mch', 'cybersource', null)
                        || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.paypalcredit', 'cybersource', null)

        ) {
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.technical', 'checkout', null)));
        } else {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
        }
        return next();
    } if (handlePaymentResult.returnToPage) {
        res.render('secureacceptance/secureAcceptanceIframeSummmary', {
            Order: handlePaymentResult.order
        });
        return next();
    } if (handlePaymentResult.intermediate) {
        res.render(handlePaymentResult.renderViewPath, {
            alipayReturnUrl: handlePaymentResult.alipayReturnUrl
        });
        return next();
    } if (handlePaymentResult.intermediateSA) {
        res.render(handlePaymentResult.renderViewPath, {
            Data: handlePaymentResult.data, FormAction: handlePaymentResult.formAction
        });
        return next();
    } if (handlePaymentResult.intermediateSilentPost) {
        res.render(handlePaymentResult.renderViewPath, {
            requestData: handlePaymentResult.data, formAction: handlePaymentResult.formAction, cardObject: handlePaymentResult.cardObject
        });
        return next();
    }
    if (handlePaymentResult.redirection) {
        res.redirect(handlePaymentResult.redirectionURL);
        return next();
    }

    //  Set order confirmation status to not confirmed for REVIEW orders.
    if (session.privacy.CybersourceFraudDecision === 'REVIEW') {
        var Order = require('dw/order/Order');
        Transaction.wrap(function () {
            // eslint-disable-next-line
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
        });

        if (CybersourceConstants.BANK_TRANSFER_PROCESSOR.equals(order.paymentTransaction.paymentProcessor.ID)) {
            res.redirect(handlePaymentResult.redirectionURL);
            return next();
        }
    }

    if (handlePaymentResult.declined) {
        session.privacy.SkipTaxCalculation = false;
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        if (paymentInstrument.paymentMethod != null
                && (paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.creditcard', 'cybersource', null)
                && (CsSAType == Resource.msg('cssatype.SA_REDIRECT', 'cybersource', null)
                || CsSAType == Resource.msg('cssatype.SA_SILENTPOST', 'cybersource', null)))
                || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.alipay', 'cybersource', null)
                || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.sof', 'cybersource', null)
                || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.idl', 'cybersource', null)
                || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.mch', 'cybersource', null)
                || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.klarna', 'cybersource', null)
                || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.paypalcredit', 'cybersource', null)
        ) {
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'placeOrderError', Resource.msg('sa.billing.payment.error.declined', 'cybersource', null)));
        } else {
            res.json({
                error: true,
                errorMessage: Resource.msg('sa.billing.payment.error.declined', 'cybersource', null)
            });
        }
        return next();
    }
    if (handlePaymentResult.missingPaymentInfo) {
        session.privacy.SkipTaxCalculation = false;
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        if (paymentInstrument.paymentMethod != null
                    && (paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.creditcard', 'cybersource', null)
                            && (CsSAType == Resource.msg('cssatype.SA_REDIRECT', 'cybersource', null)
                            || CsSAType == Resource.msg('cssatype.SA_SILENTPOST', 'cybersource', null)))
                            || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.alipay', 'cybersource', null)
                            || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.sof', 'cybersource', null)
                            || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.idl', 'cybersource', null)
                            || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.mch', 'cybersource', null)
                            || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.paypalcredit', 'cybersource', null)
        ) {
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('sa.billing.payment.error.declined', 'cybersource', null)));
        } else {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
        }
        return next();
    } if (handlePaymentResult.rejected) {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        currentBasket = BasketMgr.getCurrentBasket();
        Transaction.wrap(function () {
            COHelpers.handlePayPal(currentBasket);
        });
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'payerAuthError', Resource.msg('payerauthentication.carderror', 'cybersource', null)).toString());
        /* res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.https('Checkout-Begin', 'stage', 'payment', 'payerAuthError', Resource.msg('payerauthentication.carderror', 'cybersource', null)).toString()
        });*/
        return next();
    } if (handlePaymentResult.process3DRedirection) {
        res.redirect(URLUtils.url('CheckoutServices-PayerAuthentication'));
        return next();
    }
    if (handlePaymentResult.processWeChat) {
        res.render('checkout/confirmation/weChatConfirmation', {
            paymentResult: handlePaymentResult,
            weChatQRCode: handlePaymentResult.WeChatMerchantURL,
            orderNo: order.orderNo,
            order: order,
            noOfCalls: CybersourceHelper.getNumofCheckStatusCalls() != null ? CybersourceHelper.getNumofCheckStatusCalls() : 6,
            serviceCallInterval: CybersourceHelper.getServiceCallInterval() != null ? CybersourceHelper.getServiceCallInterval() : 10
        });
        this.emit('route:Complete', req, res);
        return;
    }

    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () { OrderMgr.failOrder(order); });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    // Places the order
    if (handlePaymentResult.authorized) {
        var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
        if (placeOrderResult.error) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }
    }

    if (req.currentCustomer.addressBook) {
        // save all used shipping addresses to address book of the logged in customer
        var allAddresses = addressHelpers.gatherShippingAddresses(order);
        allAddresses.forEach(function (address) {
            if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
            }
        });
    }

    session.privacy.paypalShippingIncomplete = '';
    session.privacy.paypalBillingIncomplete = '';

    // COHelpers.sendConfirmationEmail(order, req.locale.id);

    //  Reset decision session variable
    session.privacy.CybersourceFraudDecision = '';
    session.privacy.SkipTaxCalculation = false;
    session.privacy.cartStateString = null;

    // Handle Authorized status for Payer Authentication flow
    if (DFReferenceId !== undefined && (handlePaymentResult.authorized || handlePaymentResult.review)) {
        // eslint-disable-next-line
        res.redirect(URLUtils.url('COPlaceOrder-SubmitOrderConformation', 'ID', order.orderNo, 'token', order.orderToken));
        return next();
    }

    if ((handlePaymentResult.authorized || handlePaymentResult.review) && (paymentInstrument && paymentInstrument.paymentMethod === Resource.msg('paymentmethodname.googlepay', 'cybersource', null) || (paymentInstrument && paymentInstrument.paymentMethod === Resource.msg('paymentmethodname.paypal', 'cybersource', null) && !session.privacy.paypalminiCart)) || (paymentInstrument && paymentInstrument.paymentMethod === Resource.msg('paymentmethodname.paypalcredit', 'cybersource', null))) {
        // eslint-disable-next-line
        res.redirect(URLUtils.url('COPlaceOrder-SubmitOrderConformation', 'ID', order.orderNo, 'token', order.orderToken));
        return next();
    }

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    /* Signifyd Modification Start */
    if (SignifydCreateCasePolicy === "PRE_AUTH") {
        Signifyd.SendTransaction(order);
    } else {
        Signifyd.setOrderSessionId(order, orderSessionID);
        Signifyd.Call(order);
    }
    /* Signifyd Modification End */
    if (!hasCC) {
        res.json({
            error: false,
            orderID: order.orderNo,
            orderToken: order.orderToken,
            continueUrl: URLUtils.url('Order-Confirm').toString()
        })
    } else {
        res.redirect(URLUtils.url('COPlaceOrder-SubmitOrderConformation', 'ID', order.orderNo, 'token', order.orderToken).toString());
    }
    return next();
});

if (IsCartridgeEnabled) {
    server.prepend('SubmitPayment', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
        var currentBasket = BasketMgr.getCurrentBasket();
        var billingAddress = currentBasket.billingAddress;
        var paymentForm = server.forms.getForm('billing').base;
        var billingPhone = paymentForm.contactInfoFields.phone.value;
        var billingEmail = paymentForm.contactInfoFields.email.value;
        var collections = require('*/cartridge/scripts/util/collections');
        var currentBasket = BasketMgr.getCurrentBasket();
        var isGiftCardAvailable = collections.find(currentBasket.paymentInstruments, (paymentIns) => paymentIns.paymentMethod === 'GIFT_CERTIFICATE');
        if(isGiftCardAvailable) {
            var klarnaOrApplePayWithGC = collections.find(currentBasket.paymentInstruments, (paymentIns) => paymentIns.paymentMethod === 'DW_APPLE_PAY' || paymentIns.paymentMethod === 'KLARNA_PAYMENTS');
            if(klarnaOrApplePayWithGC) {
                res.json({
                    error: true,
                    fieldErrors: [],
                    serverErrors: [],
                    klarnaOrApplePayWithGC : true
                });
                
                return this.emit('route:Complete', req, res);
            }
        }
        if (req.currentCustomer && req.currentCustomer.profile && req.currentCustomer.profile.email) {
            billingEmail = req.currentCustomer.profile.email;
        }
        if (billingAddress && billingPhone) {
            paymentForm.creditCardFields.phone.value = billingPhone;
            paymentForm.contactInfoFields.phone.value = billingPhone;
        }
        if (billingEmail) {
            paymentForm.creditCardFields.email.value = billingEmail;
            paymentForm.contactInfoFields.email.value = billingEmail;
        }
        next();
    });
}

server.append('PlaceOrder', function (req, res, next) {
    var redirectURL = req.session.privacyCache.get('KlarnaPaymentsRedirectURL');

    if (redirectURL) {
        req.session.privacyCache.set('KlarnaPaymentsRedirectURL', null);

        if (!res.viewData.error) {
            res.setViewData({
                orderID: null,
                orderToken: null,
                error: false,
                continueUrl: redirectURL
            });
        }
    }

    // clear KEB method
    req.session.privacyCache.set('KlarnaExpressCategory', null);

    return next();
});

module.exports = server.exports();
