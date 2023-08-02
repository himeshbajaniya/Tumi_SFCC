'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');

/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function fullProduct(product, apiProduct, options) {
    decorators.base(product, apiProduct, options.productType);
    decorators.price(product, apiProduct, options.promotions, false, options.optionModel);

    if (options.variationModel) {
        decorators.images(product, options.variationModel, { types: ['large', 'small'], quantity: 'all', pView: 'PDP'});
    } else {
        decorators.images(product, apiProduct, { types: ['large', 'small'], quantity: 'all', pView: 'PDP'});
    }

    decorators.quantity(product, apiProduct, options.quantity);
    decorators.variationAttributes(product, options.variationModel, {
        attributes: '*',
        endPoint: 'Variation',
        storeId: options.storeId
    });
    decorators.description(product, apiProduct);
    decorators.ratings(product);
    decorators.promotions(product, options.promotions);
    decorators.attributes(product, apiProduct.attributeModel);
    decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel);
    decorators.options(product, options.optionModel, options.variables, options.quantity);
    decorators.quantitySelector(product, apiProduct.stepQuantity.value, options.variables, options.options);

    var category = apiProduct.getPrimaryCategory();

    if (!category && (options.productType === 'variant' || options.productType === 'variationGroup')) {
        category = apiProduct.getMasterProduct().getPrimaryCategory();
    }

    if (category && 'sizeChartID' in category.custom) {
        decorators.sizeChart(product, category.custom.sizeChartID);
    }
 // gather selected variation attributes, return variant that matches selection for color and size
    // decorators.selectedVariant(product, apiProduct, options);

    decorators.currentUrl(product, options.variationModel, options.optionModel, 'Product-Show', apiProduct.ID, options.quantity);
    decorators.readyToOrder(product, options.variationModel);
    decorators.online(product, apiProduct);
    decorators.raw(product, apiProduct);
    decorators.pageMetaData(product, apiProduct);
    decorators.template(product, apiProduct);
    decorators.customProductAttributes(product, apiProduct);
    if(product.id != 'GCARD') {
        decorators.monogram(product, apiProduct);
    }
    decorators.buyItNow(product);
    decorators.availableToSell(product, apiProduct.availabilityModel);
    decorators.badges(product, apiProduct);
    return product;
};
