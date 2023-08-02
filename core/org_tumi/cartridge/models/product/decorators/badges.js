'use strict';

var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');

/**
 *
 * @param {Object} product product object
 * @returns {string/null} returns badge data for product type boolean or string
 */

module.exports = function (object, apiProduct, options) {
    var variantProduct = apiProduct;
    Object.defineProperty(object, 'badge', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'badge') && apiProduct.custom.badge ? apiProduct.custom.badge : null
    });

    Object.defineProperty(object, 'backInStockSoon', {
        enumerable: true,
        value: productHelpers.getBackInStockSoonFlag(variantProduct)
    });

    Object.defineProperty(object, 'backInStock', {
        enumerable: true,
        value: productHelpers.getBackInStockFlag(variantProduct)
    });

    Object.defineProperty(object, 'onlyFewLeft', {
        enumerable: true,
        value: productHelpers.getOnlyFewLeftFlag(variantProduct)
    });

    Object.defineProperty(object, 'comingSoon', {
        enumerable: true,
        value: variantProduct && variantProduct.availabilityModel && variantProduct.availabilityModel.inventoryRecord 
        && variantProduct.availabilityModel.inventoryRecord.preorderable ? true : false
    });

    Object.defineProperty(object, 'newlyAddedProduct', {
        enumerable: true,
        value: productHelpers.getNewlyAddedProductFlag(variantProduct.creationDate)
    });

    Object.defineProperty(object, 'activeProductBadge', {
        enumerable: true,
        value: productHelpers.getActiveProductBadge(object)
    });

    Object.defineProperty(object, 'productAvailability', {
        enumerable: true,
        value: productHelpers.getProductAvailability(variantProduct, object)
    });

}