'use strict';

/**
 * @namespace Checkout
 */

var server = require('server');
server.extend(module.superModule);

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
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
server.replace(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var AccountModel = require('*/cartridge/models/account');
        var OrderModel = require('*/cartridge/models/order');
        var URLUtils = require('dw/web/URLUtils');
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var Locale = require('dw/util/Locale');
        var collections = require('*/cartridge/scripts/util/collections');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }

        var requestStage = req.querystring.stage;
        var currentStage = requestStage || 'customer';
        var billingAddress = currentBasket.billingAddress;
        var paypalExpressCheckout = !!(Object.hasOwnProperty.call(req.querystring, 'fromPayPalExpress') && req.querystring.fromPayPalExpress);
        var currentCustomer = req.currentCustomer.raw;
        var currentLocale = Locale.getLocale(req.locale.id);
        var preferredAddressForCurrentSite;
        var shipToMeShipment = cartHelper.getShipToMeShipment(currentBasket);
        var isBasketHavingOnlyStorePickupitems = cartHelper.isBasketHavingOnlyStorePickupitems(currentBasket);
        // only true if customer is registered
        if (currentCustomer.authenticated) {
            preferredAddressForCurrentSite = COHelpers.getPreferredAddressForCurrentSite(req.currentCustomer);
        }
        if (!paypalExpressCheckout && shipToMeShipment && req.currentCustomer.addressBook && preferredAddressForCurrentSite) {
            if (!shipToMeShipment.shippingAddress || !shipToMeShipment.shippingAddress.address1) {
                COHelpers.copyCustomerAddressToShipment(preferredAddressForCurrentSite, shipToMeShipment);
            }
        }

        if (currentCustomer.authenticated && isBasketHavingOnlyStorePickupitems) {
            COHelpers.copyStoreAddressToShipment(currentBasket.getShipments());
        }

        var PayPalpaymentInstrumentAlreadyExists = collections.find(currentBasket.getPaymentInstruments(), function (item) {
            return item.paymentMethod === 'PayPal';
        });

        var defaultPaymentCardAddressObj;
        if (currentCustomer.authenticated && !PayPalpaymentInstrumentAlreadyExists) {
            var wallet = customer.getProfile().getWallet();
            var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).toArray();
            var paymentInstrumentsForCurrentSite = [];
            if (paymentInstruments.length) {
                paymentInstrumentsForCurrentSite = COHelpers.getPaymentInstrumentsForCurrentSite(req.currentCustomer, paymentInstruments);
            }

            if (paymentInstrumentsForCurrentSite.length) {
                var paymentInstrumentsForCurrentSite = paymentInstrumentsForCurrentSite.sort(function (a, b) {
                     return b.custom.defaultPaymentCard - a.custom.defaultPaymentCard;
                 });
                var defaultPaymentCardAddressId = paymentInstrumentsForCurrentSite[0].custom.cardAddressReference;
                if (defaultPaymentCardAddressId) {
                    var addressBook = currentCustomer.getProfile().getAddressBook();
                    var rawAddress = addressBook.getAddress(defaultPaymentCardAddressId);
                    if (rawAddress) {
                        var AddressModel = require('*/cartridge/models/address');
                        var defaultPaymentCardAddressObj = new AddressModel(rawAddress);
                        COHelpers.copyCustomerAddressToBilling(defaultPaymentCardAddressObj.address);
                    }
                }
            } else if (shipToMeShipment && shipToMeShipment.shippingAddress && shipToMeShipment.shippingAddress.address1) {
                var AddressModel = require('*/cartridge/models/address');
                var shipToMeShipmentAddressModel = new AddressModel(shipToMeShipment.shippingAddress);
                COHelpers.copyCustomerAddressToBilling(shipToMeShipmentAddressModel.address);
            } else if (isBasketHavingOnlyStorePickupitems) {
                Transaction.wrap(function () {
                    if (!billingAddress) {
                        billingAddress = currentBasket.createBillingAddress();
                    }
                    billingAddress.setFirstName(currentCustomer.profile.firstName);
                    billingAddress.setLastName(currentCustomer.profile.lastName);
                    billingAddress.setPhone(currentCustomer.profile.phoneHome);
                });
            }
        }

        // Calculate the basket
        Transaction.wrap(function () {
            COHelpers.ensureNoEmptyShipments(req);
        });

        if (currentBasket.shipments.length <= 1) {
            req.session.privacyCache.set('usingMultiShipping', false);
        }

        if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
            Transaction.wrap(function () {
                currentBasket.updateCurrency();
            });
        }

        COHelpers.recalculateBasket(currentBasket);

        var guestCustomerForm = server.forms.getForm('coCustomer');
        var registeredCustomerForm = COHelpers.prepareCustomerForm('coRegisteredCustomer');
        var shippingForm = COHelpers.prepareShippingForm();
        var paypalForm = server.forms.getForm('billing').paypal;
        var billingForm = COHelpers.prepareBillingForm();
        var contactInfoForm = COHelpers.prepareContactInfoForm();
        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');

        if (preferredAddressForCurrentSite) {
            shippingForm.copyFrom(preferredAddressForCurrentSite);
        }
        
        if (currentCustomer.authenticated && defaultPaymentCardAddressObj && defaultPaymentCardAddressObj.address) {
            billingForm.copyFrom(defaultPaymentCardAddressObj.address);
        }

        // Loop through all shipments and make sure all are valid
        var allValid = COHelpers.ensureValidShipments(currentBasket);

        var orderModel = new OrderModel(
            currentBasket,
            {
                customer: currentCustomer,
                usingMultiShipping: usingMultiShipping,
                shippable: allValid,
                countryCode: currentLocale.country,
                containerView: 'basket'
            }
        );

        // Get rid of this from top-level ... should be part of OrderModel???
        var currentYear = new Date().getFullYear();
        var creditCardExpirationYears = [];

        for (var j = 0; j < 10; j++) {
            creditCardExpirationYears.push(currentYear + j);
        }

        var accountModel = new AccountModel(req.currentCustomer);

        var reportingURLs;
        reportingURLs = reportingUrlsHelper.getCheckoutReportingURLs(
            currentBasket.UUID,
            2,
            'Shipping'
        );

        if (currentStage === 'customer') {
            if (accountModel.registeredUser) {
                // Since the shopper already login upon starting checkout, fast forward to shipping stage
                currentStage = 'shipping';

                // Only need to update email address in basket if start checkout from other page like cart or mini-cart
                // and not on checkout page reload.
                if (!requestStage) {
                    Transaction.wrap(function () {
                        currentBasket.customerEmail = accountModel.profile.email;
                        orderModel.orderEmail = accountModel.profile.email;
                    });
                }
            } else if (currentBasket.customerEmail) {
                // Email address has already collected so fast forward to shipping stage
                currentStage = 'shipping';
            }
        }

        res.render('checkout/checkout', {
            order: orderModel,
            customer: accountModel,
            forms: {
                guestCustomerForm: guestCustomerForm,
                registeredCustomerForm: registeredCustomerForm,
                shippingForm: shippingForm,
                billingForm: billingForm,
                contactInfoForm: contactInfoForm,
                paypalForm: paypalForm
            },
            expirationYears: creditCardExpirationYears,
            currentStage: currentStage,
            reportingURLs: reportingURLs,
            oAuthReentryEndpoint: 2
        });

        return next();
    }
);


module.exports = server.exports();
