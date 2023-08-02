'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Transaction = require('dw/system/Transaction');
var AddressModel = require('*/cartridge/models/address');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
var collections = require('*/cartridge/scripts/util/collections');
/**
 * Handle Ajax shipping form submit
 */
/**
 * CheckoutShippingServices-SubmitShipping : The CheckoutShippingServices-SubmitShipping endpoint submits the shopper's shipping addresse(s) and shipping method(s) and saves them to the basket
 * @name Base/CheckoutShippingServices-SubmitShipping
 * @function
 * @memberof CheckoutShippingServices
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - shipmentUUID - The universally unique identifier of the shipment
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_shippingMethodID - The selected shipping method id
 * @param {httpparameter} - shipmentSelector - For Guest shopper: A shipment UUID that contains address that matches the selected address, For returning shopper: ab_<address-name-from-address-book>" of the selected address. For both type of shoppers: "new" if a brand new address is entered
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_firstName - shipping address input field, shopper's shipping first name
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_lastName - shipping address input field, shopper's last name
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_address1 - shipping address input field, address line 1
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_address2 - shipping address nput field address line 2
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_country - shipping address input field, country
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_states_stateCode - shipping address input field, state code (Not all locales have state code)
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_city - shipping address input field, city
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_postalCode - shipping address input field, postal code (or zipcode)
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_phone - shipping address input field, shopper's phone number
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_giftMessage - text area for gift message
 * @param {httpparameter} - csrf_token - Hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace(
    'SubmitShipping',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var URLUtils = require('dw/web/URLUtils');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var ShippingMgr = require('dw/order/ShippingMgr');
        var StoreMgr = require('dw/catalog/StoreMgr');
        
        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
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

        var form = server.forms.getForm('shipping');
        var coCustomerForm = server.forms.getForm('coCustomer');
        var contactInfoForm = server.forms.getForm('contactInfo');
        var result = {};

        // verify shipping form data
        var shippingFormErrors = COHelpers.validateShippingForm(form.shippingAddress.addressFields);
        var coCustomerFormErrors = COHelpers.validateCustomerForm(coCustomerForm);
        var contactInfoFormErrors = COHelpers.validateContactInfoForm(contactInfoForm);

        if (Object.keys(shippingFormErrors).length > 0 || Object.keys(coCustomerFormErrors).length > 0 || Object.keys(contactInfoFormErrors).length > 0) {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'invalid');

            res.json({
                form: form,
                fieldErrors: [shippingFormErrors, coCustomerFormErrors, contactInfoFormErrors],
                serverErrors: [],
                error: true
            });
        } else {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'valid');

            result.address = {
                firstName: form.shippingAddress.addressFields.firstName.value,
                lastName: form.shippingAddress.addressFields.lastName.value,
                address1: form.shippingAddress.addressFields.address1.value,
                address2: form.shippingAddress.addressFields.address2.value,
                city: form.shippingAddress.addressFields.city.value,
                postalCode: form.shippingAddress.addressFields.postalCode.value,
                countryCode: form.shippingAddress.addressFields.country.value,
                phone: form.shippingAddress.addressFields.phone.value
            };
            if (Object.prototype.hasOwnProperty
                .call(form.shippingAddress.addressFields, 'states')) {
                result.address.stateCode =
                    form.shippingAddress.addressFields.states.stateCode.value;
            }

            result.shippingBillingSame =
                form.shippingAddress.shippingAddressUseAsBillingAddress.value;

            result.shippingMethod = form.shippingAddress.shippingMethodID.value
                ? form.shippingAddress.shippingMethodID.value.toString()
                : null;

            result.isGift = form.shippingAddress.isGift.checked;

            result.giftMessage = result.isGift ? form.shippingAddress.giftMessage.value : null;

            res.setViewData(result);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var AccountModel = require('*/cartridge/models/account');
                var OrderModel = require('*/cartridge/models/order');
                var Locale = require('dw/util/Locale');

                var shippingData = res.getViewData();
                var basketShipments = currentBasket.getShipments();
                var billingAddress = currentBasket.billingAddress;
                
                if (basketShipments.length == 1 && empty(basketShipments[0].custom.fromStoreId)) {
                    // Basket has only Ship To Home shipment. Set shipping address as shipment address.
                    COHelpers.copyShippingAddressToShipment(shippingData, currentBasket.defaultShipment);
                } else if (req.querystring.isBasketHavingOnlyStorePickupitems === 'true') {
                    // Basket is having only store pickup items. it may be for one store or multiple stores (multi-shipment) as well. Copy store address in respective shipment.
                    COHelpers.copyStoreAddressToShipment(basketShipments);
                } else if (req.querystring.isBasketHavingOnlyStorePickupitems !== 'true') {
                    // Basket is having mixed shipments. i.e one Ship To Home and one/multiple store pickup shipments. Copy shipping address in STH shipment and store address in respective store shipment.
                    COHelpers.copyShippingAndStoreAddressToShipment(shippingData, basketShipments);
                }

                var currentCustomer = req.currentCustomer.raw;
                var savedPaymentInstruments = [];
                var paymentInstrumentsForCurrentSite = [];
                if (currentCustomer.authenticated) {
                    var wallet = customer.getProfile().getWallet();
                    savedPaymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).toArray();
                    if (savedPaymentInstruments.length) {
                        paymentInstrumentsForCurrentSite = COHelpers.getPaymentInstrumentsForCurrentSite(req.currentCustomer, savedPaymentInstruments);
                    }
                }
                
                var PayPalpaymentInstrumentAlreadyExists = collections.find(currentBasket.getPaymentInstruments(), function (item) {
                    return item.paymentMethod === 'PayPal';
                });
                // Update billing address with shipping address if Basket is having Ship To Home Shipment and logged in user don't have any saved card
                if(req.querystring.isBasketHavingOnlyStorePickupitems !== 'true' && paymentInstrumentsForCurrentSite.length < 1) {
                    var shipToMeShipment = cartHelper.getShipToMeShipment(currentBasket);
                    if (shipToMeShipment && shipToMeShipment.shippingAddress && shipToMeShipment.shippingAddress.address1) {
                        var AddressModel = require('*/cartridge/models/address');
                        var shipToMeShipmentAddressModel = new AddressModel(shipToMeShipment.shippingAddress);
                        if (PayPalpaymentInstrumentAlreadyExists && billingAddress) {
                            // if basket is having paypal as payment instrument, billing address returned from Paypal will be used. just update the phone number because phone number might be missing.
                            Transaction.wrap(function () {
                                billingAddress.setPhone(shipToMeShipmentAddressModel.address.phone);
                            });
                        } else {
                            COHelpers.copyCustomerAddressToBilling(shipToMeShipmentAddressModel.address);
                        }
                    }
                } else if (req.querystring.isBasketHavingOnlyStorePickupitems === 'true' && paymentInstrumentsForCurrentSite.length > 0 && !PayPalpaymentInstrumentAlreadyExists) {
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
                }
                
                var giftResult = COHelpers.setGift(
                    currentBasket.defaultShipment,
                    shippingData.isGift,
                    shippingData.giftMessage
                );

                if (giftResult.error) {
                    res.json({
                        error: giftResult.error,
                        fieldErrors: [],
                        serverErrors: [giftResult.errorMessage]
                    });
                    return;
                }

                var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                    req.session.privacyCache.set('usingMultiShipping', false);
                    usingMultiShipping = false;
                }

                COHelpers.recalculateBasket(currentBasket);

                var currentLocale = Locale.getLocale(req.locale.id);
                var basketModel = new OrderModel(
                    currentBasket,
                    {
                        usingMultiShipping: usingMultiShipping,
                        shippable: true,
                        countryCode: currentLocale.country,
                        containerView: 'basket'
                    }
                );

                var KlarnaSessionManager = require('*/cartridge/scripts/common/klarnaSessionManager');

                var klarnaSessionManager = new KlarnaSessionManager();
                klarnaSessionManager.createOrUpdateSession();

                res.json({
                    customer: new AccountModel(req.currentCustomer),
                    order: basketModel,
                    form: server.forms.getForm('shipping'),
                    isBasketHavingOnlyStorePickupitems: req.querystring.isBasketHavingOnlyStorePickupitems === 'true' ? true : false
                });
            });
        }

        return next();
    }
);

server.append('SubmitShipping', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shipment;
    var billingFname = req.form['dwfrm_contactInfo_firstName'];
    var billingLname = req.form['dwfrm_contactInfo_lastName'];
    var billingPhone = req.form['dwfrm_contactInfo_phone'];
    var billingEmail = req.form['dwfrm_coCustomer_email'];
    var billingAddress = currentBasket.billingAddress;
    if (billingFname && billingLname && billingPhone) {
        Transaction.wrap(function () {
            if (!billingAddress) {
                billingAddress = currentBasket.createBillingAddress();
            }
            billingAddress.setFirstName(billingFname);
            billingAddress.setLastName(billingLname);
            billingAddress.setPhone(billingPhone);
        });
    }

    Transaction.wrap(function () {
        if (currentBasket.customer.authenticated) {
            currentBasket.setCustomerEmail(req.currentCustomer.profile.email);
        } else if (billingEmail) {
            currentBasket.setCustomerEmail(billingEmail);
        }
    });

    next();
});

/*
 * This gets called when user clicks on Use Shipping address as billing address.
 */
server.post('GetShippingAddress', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var URLUtils = require('dw/web/URLUtils');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var shipToMeShipmentAddress = {};
    var shipToMeShipment = cartHelper.getShipToMeShipment(currentBasket);
	if (shipToMeShipment && shipToMeShipment.shippingAddress && shipToMeShipment.shippingAddress.address1) {
        var address = shipToMeShipment.shippingAddress;
        shipToMeShipmentAddress.firstName = address.firstName;
        shipToMeShipmentAddress.lastName = address.lastName;
        shipToMeShipmentAddress.address1 = address.address1;
        shipToMeShipmentAddress.city = address.city;
        shipToMeShipmentAddress.phone = address.phone;
        shipToMeShipmentAddress.postalCode = address.postalCode;
        shipToMeShipmentAddress.stateCode = address.stateCode;
        shipToMeShipmentAddress.countryCode = address.countryCode.value;
        shipToMeShipmentAddress.email = currentBasket.getCustomerEmail();
    }
    res.json({shipToMeShipmentAddress: shipToMeShipmentAddress});
    return next();
});

/**
 * CheckoutShippingServices-SelectShippingMethod : The CheckoutShippingServices-SelectShippingMethod endpoint saves the selected shipping method to the basket
 * @name Base/CheckoutShippingServices-SelectShippingMethod
 * @function
 * @memberof CheckoutShippingServices
 * @param {middleware} - server.middleware.https
 * @param {querystringparameter} - shipmentUUID - the universally unique identifier of the shipment
 * @param {querystringparameter} - methodID - the selected shipping method id
 * @param {httpparameter} - firstName - shipping address input field, shopper's shipping first name
 * @param {httpparameter} - lastName - shipping address input field, shopper's last name
 * @param {httpparameter} - address1 - shipping address input field, address line 1
 * @param {httpparameter} - address2 - shipping address input field address line 2
 * @param {httpparameter} - city - shipping address input field, city
 * @param {httpparameter} - postalCode -  shipping address input field, postal code (or zipcode)
 * @param {httpparameter} - stateCode - shipping address input field, state code (Not all locales have state code)
 * @param {httpparameter} - countryCode -  shipping address input field, country
 * @param {httpparameter} - phone - shipping address input field, shopper's phone number
 * @param {httpparameter} - shipmentUUID - the universally unique identifier of the shipment
 * @param {httpparameter} - methodID - The selected shipping method id
 * @param {httpparameter} - isGift - Checkbox that is for determining whether or not this is a gift
 * @param {httpparameter} - giftMessage - text area for gift message
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('SelectShippingMethod', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var URLUtils = require('dw/web/URLUtils');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var Locale = require('dw/util/Locale');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shippingMethodID = req.querystring.methodID || req.form.methodID;
    var shipment;
    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    var viewData = res.getViewData();
    viewData.address = ShippingHelper.getAddressFromRequest(req);
    viewData.isGift = req.form.isGift === 'true';
    viewData.giftMessage = req.form.isGift ? req.form.giftMessage : null;
    res.setViewData(viewData);

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var shippingData = res.getViewData();
        var address = shippingData.address;

        try {
            Transaction.wrap(function () {
                var shippingAddress = shipment.shippingAddress;

                if (!shippingAddress) {
                    shippingAddress = shipment.createShippingAddress();
                }

                shippingAddress.setFirstName(address.firstName || '');
                shippingAddress.setLastName(address.lastName || '');
                shippingAddress.setAddress1(address.address1 || '');
                shippingAddress.setAddress2(address.address2 || '');
                shippingAddress.setCity(address.city || '');
                shippingAddress.setPostalCode(address.postalCode || '');
                shippingAddress.setStateCode(address.stateCode || '');
                shippingAddress.setCountryCode(address.countryCode || '');
                shippingAddress.setPhone(address.phone || '');

                ShippingHelper.selectShippingMethod(shipment, shippingMethodID);

                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        } catch (err) {
            res.setStatusCode(500);
            res.json({
                error: true,
                errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
            });

            return;
        }

        COHelpers.setGift(shipment, shippingData.isGift, shippingData.giftMessage);

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        var currentLocale = Locale.getLocale(req.locale.id);

        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );

        res.json({
            customer: new AccountModel(req.currentCustomer),
            order: basketModel
        });
    });

    return next();
});

/**
 * CheckoutShippingServices-UpdateShippingMethodsList : The CheckoutShippingServices-UpdateShippingMethodsList endpoint gets hit once a shopper has entered certain address infromation and gets the applicable shipping methods based on the shopper's supplied shipping address infromation
 * @name Base/CheckoutShippingServices-UpdateShippingMethodsList
 * @function
 * @memberof CheckoutShippingServices
 * @param {middleware} - server.middleware.https
 * @param {querystringparameter} - shipmentUUID - the universally unique identifier of the shipment
 * @param {httpparameter} - firstName - shipping address input field, shopper's shipping first name
 * @param {httpparameter} - lastName - shipping address input field, shopper's last name
 * @param {httpparameter} - address1 - shipping address input field, address line 1
 * @param {httpparameter} - address2 - shipping address nput field address line 2
 * @param {httpparameter} - city - shipping address input field, city
 * @param {httpparameter} - postalCode -  shipping address input field, postal code (or zipcode)
 * @param {httpparameter} - stateCode - shipping address input field, state code (Not all locales have state code)
 * @param {httpparameter} - countryCode -  shipping address input field, country
 * @param {httpparameter} - phone - shipping address input field, shopper's phone number
 * @param {httpparameter} - shipmentUUID - The universally unique identifier of the shipment
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('UpdateShippingMethodsList', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var URLUtils = require('dw/web/URLUtils');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var Locale = require('dw/util/Locale');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shipment;
    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    var address = ShippingHelper.getAddressFromRequest(req);

    var shippingMethodID;

    if (shipment.shippingMethod) {
        shippingMethodID = shipment.shippingMethod.ID;
    }

    Transaction.wrap(function () {
        var shippingAddress = shipment.shippingAddress;

        if (!shippingAddress) {
            shippingAddress = shipment.createShippingAddress();
        }

        Object.keys(address).forEach(function (key) {
            var value = address[key];
            if (value) {
                shippingAddress[key] = value;
            } else {
                shippingAddress[key] = null;
            }
        });

        ShippingHelper.selectShippingMethod(shipment, shippingMethodID);

        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var currentLocale = Locale.getLocale(req.locale.id);

    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );

    res.json({
        customer: new AccountModel(req.currentCustomer),
        order: basketModel,
        shippingForm: server.forms.getForm('shipping')
    });

    return next();
});

module.exports = server.exports();
