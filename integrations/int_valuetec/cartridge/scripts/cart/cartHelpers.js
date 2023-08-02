'use strict';

var base = module.superModule;

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string} giftCardAmount - gift card amount to put on the cards
 * @param {Object} req - The local instance of the request object
 * @param {Object} giftCardJson - get giftCardJson object
 * @return {Object} returns an error object
 */
function addGiftCardProductToCart(currentBasket, productId, quantity, giftCardAmount, req, giftCardJson) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var defaultShipment = currentBasket.defaultShipment;
    var productLineItems = currentBasket.productLineItems;
    var product = ProductMgr.getProduct(productId);
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, null);
    var result = {
        error: false,
        message: Resource.msg('text.alert.giftdardaddedtobasket', 'giftcard', null)
    };

    var canBeAdded = false;
    var totalQtyRequested = quantity + base.getQtyAlreadyInCart(productId, productLineItems);
    var perpetual = product.availabilityModel.inventoryRecord.perpetual;
    canBeAdded = (perpetual || totalQtyRequested <= product.availabilityModel.inventoryRecord.ATS.value);
    if (!canBeAdded) {
        result.error = true;
        result.message = Resource.msgf('error.alert.selected.quantity.cannot.be.added.for', 'product', null, product.name);
        return result;
    }

    var productLineItem;
    var childProducts = null;
    var shipment = defaultShipment;

    // if (shipment.shippingMethod && (shipment.shippingMethod.custom.storePickupEnabled || shipment.shippingMethod.custom.bopsPreorderEnabled)) {
    if (shipment.shippingMethod && (shipment.shippingMethod.custom.storePickupEnabled)) {
        shipment = currentBasket.createShipment(UUIDUtils.createUUID());
    }

    productLineItem = base.addLineItem(
        currentBasket,
        product,
        quantity,
        childProducts,
        optionModel,
        shipment
    );

    // update EGC and PGC amounts
    if (productLineItem) {
        Transaction.wrap(function () {
            if (!empty(giftCardJson)) { // eslint-disable-line no-undef
                productLineItem.custom.recipientName = giftCardJson.recipientName;
                productLineItem.custom.senderName = giftCardJson.senderName;
                productLineItem.setGiftMessage(giftCardJson.gcMessage);
                //productLineItem.custom.gcMessage = giftCardJson.gcMessage;
            }
            // giftCardHelpers.setGiftCardAmount(productLineItem, giftCardAmount);
        });
    }

    result.uuid = productLineItem.UUID;

    return result;
}

base.addGiftCardProductToCart = addGiftCardProductToCart;
module.exports = base;
