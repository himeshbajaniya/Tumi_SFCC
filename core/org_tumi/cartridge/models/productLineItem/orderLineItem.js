'use strict';

var productDecorators = require('*/cartridge/models/product/decorators/index');
var productLineItemDecorators = require('*/cartridge/models/productLineItem/decorators/index');

/**
 * Decorate product with product line item information from within an order
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.lineItemOptions - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.currentOptionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function orderLineItem(product, apiProduct, options) {
    productDecorators.base(product, apiProduct, options.productType);
    productDecorators.price(product, apiProduct, options.promotions, false, options.currentOptionModel);
    productDecorators.images(product, apiProduct, { types: ['small'], quantity: 'single' });
    productDecorators.variationAttributes(product, options.variationModel, {
        attributes: 'selected'
    });
    productDecorators.monogram(product, apiProduct);
    productLineItemDecorators.quantity(product, options.quantity);
    productLineItemDecorators.gift(product, options.lineItem);
    productLineItemDecorators.appliedPromotions(product, options.lineItem);
    productLineItemDecorators.renderedPromotions(product); // must get applied promotions first
    productLineItemDecorators.uuid(product, options.lineItem);
    productLineItemDecorators.shipment(product, options.lineItem);
    productLineItemDecorators.bonusProductLineItem(product, options.lineItem);
    productLineItemDecorators.priceTotal(product, options.lineItem);
    productLineItemDecorators.options(product, options.lineItemOptions);
    productLineItemDecorators.bonusProductLineItemUUID(product, options.lineItem);
    productLineItemDecorators.preOrderUUID(product, options.lineItem);
    require('*/cartridge/models/productLineItem/decorators/orderMonogram')(product, options.lineItem, options.lineItemCntr);
    productLineItemDecorators.customProductAttributes(product, apiProduct);
    productLineItemDecorators.giftbox(product, options.lineItem);
    productLineItemDecorators.customOrderLineItemAttributes(product, options.lineItem);
    return product;
};
