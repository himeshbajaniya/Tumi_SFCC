'use strict';

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');

/**
 * validates customer having saved credit card or not
 * @param {Object} wallet Customer Wallet
 * @returns {boolean} returs whether customer having saved credit card
 */
function isContainsCreditCard(customer) {
    var wallet = customer.profile.wallet;
    if (!wallet || !wallet.paymentInstruments || wallet.paymentInstruments.length === 0) return false;
    var siteCountryCode = dw.system.Site.getCurrent().getCustomPreferenceValue("siteCountryCode");

    var addressBook = customer.addressBook;
    return !!collections.find(wallet.paymentInstruments, function (paymentInstrument) {
        if (paymentInstrument.paymentMethod === require('dw/order/PaymentInstrument').METHOD_CREDIT_CARD && paymentInstrument.custom.cardAddressReference) {
            var addressId = paymentInstrument.custom.cardAddressReference;
            var cardAddressObj = addressBook.getAddress(addressId);
            if (cardAddressObj && cardAddressObj.countryCode.value && cardAddressObj.countryCode.value.equalsIgnoreCase(siteCountryCode)) {
                return paymentInstrument;
            }
        }
    });
}

/**
 * Move current basket product to wishlist
 * @returns {Void} current basket product to wishlist
 */
function moveProductToWishlist(req) {
    var currentBasket = require('dw/order/BasketMgr').currentBasket;
    if (!currentBasket) return;
    // If basket exists
    var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
    collections.forEach(currentBasket.productLineItems, (productLineItem) => {
        if (productLineItem.product) {
            var list = productListHelper.getCurrentOrNewList(req.currentCustomer.raw, {
                type: 12
            });
            var config = {
                qty: 1,
                optionId: null,
                optionValue: null,
                req: req,
                type: 12
            };
            productListHelper.addItem(list, productLineItem.productID, config);
            currentBasket.removeProductLineItem(productLineItem);
        }
    });
}

/**
 * Add the product to cart and returns status whether it is success or not
 * @param {Object} req demandware server request
 * @returns {Object} returns status object
 */
function addToCart(req) {
    var status = {
        success: true,
        errorMsg: null
    };
    var currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
    if (!currentBasket) {
        status.success = false;
        status.errorMsg = Resource.msg('error.basket.null', 'buynow', null);
        return status;
    };
    // If basket is not null
    var productId = req.form.pid;
    var childProducts = Object.hasOwnProperty.call(req.form, 'childProducts') ?
        JSON.parse(req.form.childProducts) : [];
    var options = req.form.options ? JSON.parse(req.form.options) : [];
    var quantity = parseInt(req.form.quantity || 1, 10);

    var monogramPatchEnabled = false;
    var monogramTagEnabled = false;
    var metalMonogramPatchEnabled = false;
    var metalMonogramTagEnabled = false;
    var monogramJSON;
    var personalizationData;
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    if (!empty(req.form.personalizationData)) {
        personalizationData = JSON.parse(req.form.personalizationData);
        personalizationData.monogrammerProductID = productId;
        monogramJSON = cartHelper.buildPersonalizationData(JSON.stringify(personalizationData));
        monogramPatchEnabled = monogramJSON.monogramPatchEnabled;
        monogramTagEnabled = monogramJSON.monogramTagEnabled;
        metalMonogramPatchEnabled = monogramJSON.metalMonogramPatchEnabled;
        metalMonogramTagEnabled = monogramJSON.metalMonogramTagEnabled;
    }
    var monogramData = (monogramTagEnabled || monogramPatchEnabled || metalMonogramPatchEnabled || metalMonogramTagEnabled) ? monogramJSON : null;
    var result = cartHelper.addProductToCart(
        currentBasket,
        productId,
        quantity,
        childProducts,
        options,
        null,
        req,
        monogramData
    );
    if (!result.error) currentBasket.setCustomerEmail(req.currentCustomer.profile.email);
    status.success = !result.error;
    status.errorMsg = result.message;
    return status;
}

/**
 * Update shipping details and shipping method
 * @param {Object} req SFRA server request object
 * @returns {Object} returns status of shipping details
 */
function addShippingAddress(req) {
    var status = {
        success: true,
        errorMsg: null
    };
    var currentBasket = require('dw/order/BasketMgr').currentBasket;
    if (!currentBasket) {
        status.success = false;
        status.errorMsg = Resource.msg('error.basket.null', 'buynow', null);
        return status;
    };
    var validatedProducts = require('*/cartridge/scripts/helpers/basketValidationHelpers').validateProducts(currentBasket);
    if (validatedProducts.error) {
        status.success = false;
        status.errorMsg = Resource.msg('error.products.invalid', 'buynow', null);
        return status;
    }
    if (req.currentCustomer.addressBook && (req.currentCustomer.addressBook.preferredAddress || req.currentCustomer.addressBook.addresses.length > 0)) {
        var savedAddress = COHelpers.getPreferredAddressForCurrentSite(req.currentCustomer);
        var shipments = currentBasket.shipments;
        collections.forEach(shipments, function (shipment) {
            if (!shipment.shippingAddress) COHelpers.copyCustomerAddressToShipment(savedAddress, shipment);
            // set valid shipping method
            shipment.setShippingMethod(null);
            var ShippingMgr = require('dw/order/ShippingMgr');
            var shippingMethods = ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods(savedAddress);
            var isValidShippingMethods = !!require('*/cartridge/scripts/util/collections').find(shippingMethods, (shippingMethod) => !shippingMethod.custom.storePickupEnabled);
            if (isValidShippingMethods && shippingMethods.length > 0) {
                var shippingMethod = collections.find(shippingMethods, (shippingAddress) => ShippingMgr.getDefaultShippingMethod() && shippingAddress.ID === ShippingMgr.getDefaultShippingMethod().ID);
                shipment.setShippingMethod(shippingMethod || shippingMethods[0]);
            }
        });
        var invalidShipping = collections.find(shipments, (shipment) => !shipment.shippingMethod || !shipment.shippingAddress);
        if (invalidShipping) {
            status.errorMsg = Resource.msg('error.no.shipping', 'buynow', null);
            return status;
        }
        COHelpers.ensureNoEmptyShipments(req);
        return status;
    }
    status.success = false;
    status.errorMsg = Resource.msg('error.no.savedaddress', 'buynow', null);
    return status;
}

/**
 * Add or update credit card payment instrument
 * @param {Object} req SFRA server request object
 * @returns {Object} returns status of adding payment instrument
 */
function addPaymentInstrument(req) {
    var status = {
        success: true,
        errorMsg: null
    };
    var currentBasket = require('dw/order/BasketMgr').currentBasket;
    if (!currentBasket) {
        status.success = false;
        status.errorMsg = Resource.msg('error.basket.null', 'buynow', null);
        return status;
    }
    require('*/cartridge/scripts/helpers/basketCalculationHelpers').calculateTotals(currentBasket);
    // Remove Existsing payment instruments
    collections.forEach(currentBasket.paymentInstruments, (item) => currentBasket.removePaymentInstrument(item));
    // Create Payment Instrument and update the values
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var paymentInstruments = customer.profile.wallet.paymentInstruments;
    var wallet = customer.getProfile().getWallet();
    var savedPaymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).toArray();
    var paymentInstrumentsForCurrentSite = [];
    if (savedPaymentInstruments.length) {
        paymentInstrumentsForCurrentSite = COHelpers.getPaymentInstrumentsForCurrentSite(req.currentCustomer, savedPaymentInstruments);
    }
    if(paymentInstrumentsForCurrentSite.length > 0) {
        paymentInstrumentsForCurrentSite = paymentInstrumentsForCurrentSite.sort(function (a, b) {
            return b.custom.defaultPaymentCard - a.custom.defaultPaymentCard;
        });
    }
    var creditCardPaymentInstrument = paymentInstrumentsForCurrentSite[0];
    if (!creditCardPaymentInstrument) {
        status.success = false;
        status.errorMsg = Resource.msg('error.paymentinstrument.null', 'buynow', null);
        return status;
    }

    var addressId = creditCardPaymentInstrument.custom.cardAddressReference;
    if (addressId) {
        var addressBook = customer.getProfile().getAddressBook();
        var rawAddress = addressBook.getAddress(addressId);
        if (rawAddress) {
            var AddressModel = require('*/cartridge/models/address');
            var defaultPaymentCardAddressObj = new AddressModel(rawAddress);
            COHelpers.copyCustomerAddressToBilling(defaultPaymentCardAddressObj.address);
        }
    }
    var paymentInstrument = currentBasket.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice);
    var payMethod = require('dw/order/PaymentMgr').getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    if (!payMethod) {
        status.success = false,
        status.errorMsg = Resource.msg('error.paymentinstrument.null', 'buynow', null);
        return status;
    }
    var paymentProcessor = payMethod.getPaymentProcessor();
    paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
    paymentInstrument.setCreditCardHolder(creditCardPaymentInstrument.creditCardHolder);
    paymentInstrument.setCreditCardType(creditCardPaymentInstrument.creditCardType);
    paymentInstrument.setCreditCardExpirationMonth(creditCardPaymentInstrument.creditCardExpirationMonth);
    paymentInstrument.setCreditCardExpirationYear(creditCardPaymentInstrument.creditCardExpirationYear);
    paymentInstrument.setCreditCardNumber(creditCardPaymentInstrument.maskedCreditCardNumber);
    paymentInstrument.setCreditCardToken(creditCardPaymentInstrument.creditCardToken);
    return status;
}

/**
 * Implement Buynow functionality
 * @param {Object} req SFRA server request object
 * @returns {Object} returns buynow status object
 */
function buyNow(req) {
    var Transaction = require('dw/system/Transaction');
    var err;
    try {
        Transaction.begin();
        // Moving cart product to whishlist if exists
        moveProductToWishlist(req);
        // Add Product to Cart
        var addToCartStatus = addToCart(req);
        if (!addToCartStatus.success) return addToCartStatus;
        // Add shipping and billing address to current basket
        var addShippingAddressStatus = addShippingAddress(req);
        if (!addShippingAddressStatus.success || (addShippingAddressStatus.success && Resource.msg('error.no.shipping', 'buynow', null))) return addShippingAddressStatus;
        // Add Payment Instrument to basket
        var addPaymentInstrumentStatus = addPaymentInstrument(req);
        if (!addPaymentInstrumentStatus.success) return addPaymentInstrumentStatus;
        Transaction.commit();
        return addPaymentInstrumentStatus;
    } catch (e) {
        err = e.message;
        Transaction.rollback();
    }
    return {
        status: false,
        errorMsg: err
    };
}

module.exports = {
    isContainsCreditCard: isContainsCreditCard,
    buyNow: buyNow
};