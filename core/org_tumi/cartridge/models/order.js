'use strict';
var Resource = require('dw/web/Resource');

var AddressModel = require('*/cartridge/models/address');
var BillingModel = require('*/cartridge/models/billing');
var PaymentModel = require('*/cartridge/models/payment');
var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
var TotalsModel = require('*/cartridge/models/totals');
var COHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');

var ShippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');

var DEFAULT_MODEL_CONFIG = {
    numberOfLineItems: '*'
};

var RESOURCES = {
    noSelectedPaymentMethod: Resource.msg('error.no.selected.payment.method', 'creditCard', null),
    cardType: Resource.msg('msg.payment.type.credit', 'confirmation', null),
    cardEnding: Resource.msg('msg.card.type.ending', 'confirmation', null),
    shippingMethod: Resource.msg('Shipping Method', 'checkout', null),
    items: Resource.msg('msg.items', 'checkout', null),
    item: Resource.msg('msg.item', 'checkout', null),
    addNewAddress: Resource.msg('msg.new.address', 'checkout', null),
    newAddress: Resource.msg('msg.new.address', 'checkout', null),
    shipToAddress: Resource.msg('msg.ship.to.address', 'checkout', null),
    shippingAddresses: Resource.msg('msg.shipping.addresses', 'checkout', null),
    accountAddresses: Resource.msg('msg.account.addresses', 'checkout', null),
    shippingTo: Resource.msg('msg.shipping.to', 'checkout', null),
    shippingAddress: Resource.msg('label.order.shipping.address', 'confirmation', null),
    addressIncomplete: Resource.msg('heading.address.incomplete', 'checkout', null),
    giftMessage: Resource.msg('heading.gift.message', 'checkout', null)
};

/**
 * Creates an object of information that contains information about the steps
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @returns {Object} Creates an object that contains information about the checkout steps
 */
function getCheckoutStepInformation(lineItemContainer) {
    var shippingAddress = COHelper.ensureValidShipments(lineItemContainer);
    return {
        shipping: { iscompleted: !!shippingAddress },
        billing: { iscompleted: !!lineItemContainer.billingAddress }
    };
}

/**
 * Returns the first productLineItem from a collection of productLineItems.
 * @param {Object} productLineItemsModel - line items model
 * @return {Object} returns an object with image properties
*/
function getFirstProductLineItem(productLineItemsModel) {
    if (productLineItemsModel && productLineItemsModel.items[0]) {
        var imageExists = productLineItemsModel.items[0].images && productLineItemsModel.items[0].images.small.length > 0;
        if (imageExists) {
            var firstItemImage = productLineItemsModel.items[0].images.small[0];
            if (firstItemImage) {
                return {
                    imageURL: firstItemImage.url,
                    alt: firstItemImage.alt,
                    title: firstItemImage.title
                };
            } else {
                return null;
            }

        }
    }
    return null;
}

/**
 * Returns the second productLineItem from a collection of productLineItems.
 * @param {Object} productLineItemsModel - line items model
 * @return {Object} returns an object with image properties
*/
function getSecondProductLineItem(productLineItemsModel, secondUUID) {
    if (productLineItemsModel) {
        for each(var pli in productLineItemsModel.items) {
            if (pli.UUID == secondUUID) {
                var imageExists = pli.images && pli.images.small.length > 0;
                if (imageExists) {
                    var secondItemImage = pli.images.small[0];
                    if (secondItemImage) {
                        return {
                            imageURL: secondItemImage.url,
                            alt: secondItemImage.alt,
                            title: secondItemImage.title
                        };
                    } else {
                        return null;
                    }

                }
            }
        }
    }
    return null;
}

function countLineItems(productLineItems) {
    var count = 0;

    var secondUUID = '';

    for each(var pli in productLineItems) {
        if (!pli.custom.isPremiumMonogramLetter) {
            count = count + 1;
        }
        if (count > 1) {
            secondUUID = pli.UUID
            break;
        }
    }
    return secondUUID;
}

/**
 * Returns the matching address ID or UUID for a billing address
 * @param {dw.order.Basket} basket - line items model
 * @param {Object} customer - customer model
 * @return {string|boolean} returns matching ID or false
*/
function getAssociatedAddress(basket, customer) {
    var address = basket.billingAddress;
    var matchingId;
    var anAddress;

    if (!address) return false;

    // First loop through all shipping addresses
    for (var i = 0, ii = basket.shipments.length; i < ii; i++) {
        anAddress = basket.shipments[i].shippingAddress;

        if (anAddress && anAddress.isEquivalentAddress(address)) {
            matchingId = basket.shipments[i].UUID;
            break;
        }
    }

    // If we still haven't found a match, then loop through customer addresses to find a match
    if (!matchingId && customer && customer.addressBook && customer.addressBook.addresses) {
        for (var j = 0, jj = customer.addressBook.addresses.length; j < jj; j++) {
            anAddress = customer.addressBook.addresses[j];

            if (anAddress && anAddress.isEquivalentAddress(address)) {
                matchingId = anAddress.ID;
                break;
            }
        }
    }

    return matchingId;
}

/**
 * Generates an object of URLs
 * @returns {Object} an object of URLs in string format
 */
 function getActionUrls() {
    var URLUtils = require('dw/web/URLUtils');
    return {
        removeProductLineItemUrl: URLUtils.url('Cart-RemoveProductLineItem').toString(),
        updateQuantityUrl: URLUtils.url('Cart-UpdateQuantity').toString(),
        selectShippingUrl: URLUtils.url('Cart-SelectShippingMethod').toString(),
        submitCouponCodeUrl: URLUtils.url('Cart-AddCoupon').toString(),
        removeCouponLineItem: URLUtils.url('Cart-RemoveCouponLineItem').toString()
    };
}

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    this.resources = RESOURCES;

    if (!lineItemContainer) {
        this.orderNumber = null;
        this.creationDate = null;
        this.orderEmail = null;
        this.orderStatus = null;
        this.usingMultiShipping = null;
        this.shippable = null;
    } else {
        var safeOptions = options || {};
        var countryCode = safeOptions.countryCode || null;
        var modelConfig = safeOptions.config || DEFAULT_MODEL_CONFIG;
        var customer = safeOptions.customer || lineItemContainer.customer;
        var usingMultiShipping = (safeOptions.usingMultiShipping
            || lineItemContainer.shipments.length > 1);

        var shippingModels = ShippingHelpers.getShippingModels(lineItemContainer, customer, safeOptions.containerView, safeOptions);

        var paymentModel = new PaymentModel(lineItemContainer, customer, countryCode);

        var billingAddressModel = new AddressModel(lineItemContainer.billingAddress);

        var associatedAddress = getAssociatedAddress(lineItemContainer, customer);

        var billingModel = new BillingModel(billingAddressModel, paymentModel, associatedAddress);

        var secondUUID = countLineItems(lineItemContainer.productLineItems);

        var productLineItemsModel = new ProductLineItemsModel(lineItemContainer.productLineItems, options.containerView, lineItemContainer);
        var totalsModel = new TotalsModel(lineItemContainer);

        this.shippable = safeOptions.shippable || false;
        this.usingMultiShipping = usingMultiShipping;
        this.orderNumber = Object.hasOwnProperty.call(lineItemContainer, 'orderNo')
            ? lineItemContainer.orderNo
            : null;
        this.priceTotal = totalsModel ? totalsModel.grandTotal
            : null;
        this.creationDate = Object.hasOwnProperty.call(lineItemContainer, 'creationDate')
            ? lineItemContainer.creationDate
            : null;
        this.orderEmail = lineItemContainer.customerEmail;
        this.orderStatus = Object.hasOwnProperty.call(lineItemContainer, 'status')
            ? (lineItemContainer.shippingStatus.displayValue == 'SHIPPED' ? 'Order Shipped' : 'Ordered')
            : null;
        this.productQuantityTotal = lineItemContainer.productQuantityTotal ?
            lineItemContainer.productQuantityTotal : null;

        if (modelConfig.numberOfLineItems === '*') {
            this.totals = totalsModel;
            this.lineItemTotal = productLineItemsModel ? productLineItemsModel.length : null;
            this.steps = lineItemContainer
                ? getCheckoutStepInformation(lineItemContainer)
                : null;
            this.items = productLineItemsModel;
            this.billing = billingModel;
            this.shipping = shippingModels;
        } else if (modelConfig.numberOfLineItems === 'single'
                && shippingModels[0].shippingAddress) {
            this.firstLineItem = getFirstProductLineItem(productLineItemsModel);
            if (!empty(secondUUID)) {
                this.secondLineItem = getSecondProductLineItem(productLineItemsModel, secondUUID);
            }
            this.shippedToFirstName = shippingModels[0].shippingAddress.firstName || '';
            this.shippedToLastName = shippingModels[0].shippingAddress.lastName || '';
            if (this.firstLineItem) {
                this.firstLineItem.availability = productLineItemsModel.items[0].availability;
                this.firstLineItem.productAvailability = productLineItemsModel.items[0].productAvailability;
            }
        }
        this.actionUrls = getActionUrls();

        this.klarnaOrderId = ('kpOrderID' in lineItemContainer.custom && lineItemContainer.custom.kpOrderID) ? lineItemContainer.custom.kpOrderID : '';
    
        this.klarnaSessionId = ('kpSessionId' in lineItemContainer.custom && lineItemContainer.custom.kpSessionId) ? lineItemContainer.custom.kpSessionId : '';
    
        this.klarnaClientToken = ('kpClientToken' in lineItemContainer.custom && lineItemContainer.custom.kpClientToken) ? lineItemContainer.custom.kpClientToken : '';
    }
}

module.exports = OrderModel;
