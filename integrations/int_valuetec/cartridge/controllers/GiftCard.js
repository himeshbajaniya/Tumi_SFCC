'use strict';

/* global session */

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var productHelpers = require('*/cartridge/scripts/helpers/productHelpers')

/**
 * gift card landing/purchase page
 */
server.get(
    'Show',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var giftCardHelpers = require('*/cartridge/scripts/helpers/giftCardHelpers');
        var plpHelper = require('*/cartridge/scripts/helpers/plpHelpers');
        var viewData = res.getViewData();
        var showProductPageHelperResult = productHelpers.showProductPage({pid:'GCARD'}, req.pageMetaData);
        // gift card amount drop down from site preference
        var amountList = giftCardHelpers.getGiftCardAmountList();
        if (amountList && amountList.length > 0) {
            session.forms.giftCard.purchase.amount.setOptions(amountList.iterator());
        }
        
        var giftCardForm = giftCardHelpers.prepareCheckBalanceForm();
        var gcProduct = ProductMgr.getProduct('GCARD');
        var category = gcProduct.getPrimaryCategory();
        var breadcrumbs = [];
        breadcrumbs = plpHelper.getAllBreadcrumbsforPLP(category.ID, breadcrumbs).reverse();

        res.render('giftcard/giftCardPurchaseForm', {
            addProductActionURL: URLUtils.https('GiftCard-AddGiftCardProduct'),
            navTabValue: 'purchase',
            breadcrumbs: breadcrumbs,
            product: showProductPageHelperResult.product,
            forms: {
                giftCardForm: giftCardForm
            }
        });
        viewData = {
            checkBalanceActionURL: URLUtils.url('GiftCard-CheckBalanceGiftCard'),
            breadcrumbs: breadcrumbs
        };
        res.setViewData(viewData);

        next();
    }
);

server.post(
    'AddGiftCardProduct',
    server.middleware.https,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var CartModel = require('*/cartridge/models/cart');
        var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var giftCardHelpers = require('*/cartridge/scripts/helpers/giftCardHelpers');

        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        if (!currentBasket) {
            res.json({
                success: false
            });
            return next();
        }

        var form = server.forms.getForm('giftCard').purchase;
        var result = giftCardHelpers.validateGiftCardPurchaseForm(form);
        if (result && !result.success) {
            res.json(result);
            return next();
        }

        var productId = result.giftCardAmount;
        var quantity = 1;
        var giftCardAmount = result.giftCardAmount;
        var addToCartResult;
        var recipientName = form.recipientName.value;
        var senderName = form.senderName.value;
        var gcMessage = form.gcMessage.value;
        var giftCardJson;
        giftCardJson = {
            recipientName: recipientName,
            senderName: senderName,
            gcMessage: gcMessage
        };
        Transaction.wrap(function () {
            if (productId) {
                addToCartResult = cartHelper.addGiftCardProductToCart(
                    currentBasket,
                    productId,
                    quantity,
                    giftCardAmount,
                    req,
                    giftCardJson
                );
            }
            if (!addToCartResult.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            }
        });

        var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
        var cartModel = new CartModel(currentBasket);

        res.json({
            cartLink: '<a class="button button--secondary w-100" href="' + URLUtils.https('Cart-Show') + '">' + Resource.msgf('link.minicart.view.mycart', 'cart', null, quantityTotal) + '</a>',
            checkoutLink: '<a class="button button--primary w-100" href="' + URLUtils.https('Checkout-Begin') + '">' + Resource.msgf('link.minicart.checkout', 'cart', null) + '</a>',
            success: true,
            quantityTotal: quantityTotal,
            message: addToCartResult.message,
            cart: cartModel,
            error: addToCartResult.error,
            pliUUID: addToCartResult.uuid
        });

        return next();
    }
);

server.get(
    'BalanceComponent',
    csrfProtection.generateToken,
    function (req, res, next) {
        var giftCardHelpers = require('*/cartridge/scripts/helpers/giftCardHelpers');
        var giftCardForm = giftCardHelpers.prepareCheckBalanceForm();

        res.render('/giftcard/components/giftCardBalance', {
            checkBalanceActionURL: URLUtils.https('GiftCard-BalanceCheck'),
            forms: {
                giftCardForm: giftCardForm
            }
        });

        next();
    }
);

/**
 * gift card check balance form submission
 */
server.post(
    'BalanceCheck',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var giftCardHelpers = require('*/cartridge/scripts/helpers/giftCardHelpers');
        var form = server.forms.getForm('billing').giftCardFields.balance;
        var form2 = server.forms.getForm('giftCard').balance;
        var result = giftCardHelpers.validateGiftCardCheckBalanceForm(form, req);
        res.json(result);

        return next();
    }
);

server.post(
    'CheckBalanceGiftCard',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var giftCardHelpers = require('*/cartridge/scripts/helpers/giftCardHelpers');
        var form = server.forms.getForm('giftCard').balance;
        var result = giftCardHelpers.validateGiftCardCheckBalanceForm(form, req);
        res.json(result);

        return next();
    }
);

/**
 * gift card check balance form submission
 */
server.post(
    'Authorize',
    server.middleware.https,
    function (req, res, next) {
        // var giftCardHelpers = require('*/cartridge/scripts/helpers/giftCardHelpers');
        var GiftCardModel = require('*/cartridge/scripts/valuetec/models/GiftCardModel');
        // var result = giftCardHelpers.validateGiftCardCheckBalanceForm(form, req);
        var result = GiftCardModel.authorizeTestGiftCard();
        var response = {};
        response.authAmount = result.responseObject.authAmount;
        response.success = true;
        response.authMessage = 'you have successfully authorized $' + result.responseObject.authAmount;
        res.json(response);

        return next();
    }
);

/**
 * gift card check balance form submission
 */
server.post(
    'Void',
    server.middleware.https,
    function (req, res, next) {
        var GiftCardModel = require('*/cartridge/scripts/valuetec/models/GiftCardModel');
        var result = GiftCardModel.voidTestGiftCard();
        var response = {};
        response.success = result.success;
        if (response.success) {
            response.voidMessage = 'You have successfully reverted the giftcard transaction of $' + result.authAmount;
        }

        res.json(response);

        return next();
    }
);

/**
 * gift card check balance form submission
 */
server.post(
    'ReverseAuthorize',
    server.middleware.https,
    function (req, res, next) {
        var GiftCardModel = require('*/cartridge/scripts/valuetec/models/GiftCardModel');
        var result = GiftCardModel.revauthorizeTestGiftCard();
        var response = {};
        response.success = result.success;
        if (response.success) {
            response.reverseauthMessage = 'you have successfully reverseauthorized $';
        }
        res.json(response);

        return next();
    }
);

server.post(
    'Redeem',
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var success = false;
        var fieldErrors = [];
        var balanceForm = server.forms.getForm('billing').giftCardFields.balance;
        try {
            var giftCardHelpers = require('*/cartridge/scripts/helpers/giftCardHelpers');
            var giftCardCheckBalanceStatus = giftCardHelpers.validateGiftCardCheckBalanceForm(balanceForm);
            if (!giftCardCheckBalanceStatus.success || giftCardCheckBalanceStatus.balance <= 0) throw new Error(Resource.msg('label.error.giftcard.insufficient', 'giftcard', null));
            // on giftcard balance
            var basket = require('dw/order/BasketMgr').getCurrentBasket();
            var params = {
                Basket: basket,
                GiftCardCode: balanceForm.accountNumber.value,
                GiftCardPin: balanceForm.pinNumber.value,
                Balance: giftCardCheckBalanceStatus.balance
            };
            var gcPaymentInst = require('dw/system/Transaction').wrap(() => giftCardHelpers.createGiftCertificatePaymentInstrument(params));
            if (!gcPaymentInst) throw new Error(Resource.msg('label.error.invalid.giftcard', 'giftcard', null));
            success = true;
            var payment = giftCardHelpers.getPaymentModel(basket, req.currentCustomer.raw);
            res.setViewData({
                payment: payment,
                savedpaymentscontent: giftCardHelpers.renderHtml({ payment : payment}, 'valuetec/selectedpayments')
            });
            // Is giftcard enough to place order
            var onlyGC = giftCardHelpers.calculateNonGiftCertificateAmount(basket).value <= 0;
            res.setViewData({
                onlyGC: onlyGC,
                msg: Resource.msg('label.input.giftcard.redeem.success', 'giftcard', null)
            });
        } catch (e) {
            success = false;
            var obj = {};
            obj[balanceForm.accountNumber.htmlName] = e.message;
            fieldErrors.push(obj);
        }
        res.json({
            success: success,
            fieldErrors: fieldErrors
        });
        return next();
    }
);

server.post('RemoveGiftCard', function (req, res, next) {
    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    if (!currentBasket) {
        res.json({
            success: false,
            error: 'basket is empty'
        });
        return next();
    }
    var collections = require('*/cartridge/scripts/util/collections');
    var selectedgc = collections.find(currentBasket.paymentInstruments, (paymentInstrument) => paymentInstrument.UUID === req.form.puuid);
    if (!selectedgc) {
        res.json({
            success: false,
            error: 'Not applicable payment method'
        });
        return next();
    }
    var voidMsg = Resource.msgf('label.gifcard.removed.success', 'giftcard', null, selectedgc.paymentTransaction.amount);
    require('dw/system/Transaction').wrap(() => currentBasket.removePaymentInstrument(selectedgc));
    var giftCardHelpers = require('*/cartridge/scripts/helpers/giftCardHelpers');
    var payment = giftCardHelpers.getPaymentModel(currentBasket, req.currentCustomer.raw);
    res.setViewData({
        payment: payment,
        savedpaymentscontent: giftCardHelpers.renderHtml({ payment : payment}, 'valuetec/selectedpayments')
    });
    res.json({
        success: true,
        voidMessage: voidMsg
    });
    return next();
});

module.exports = server.exports();
