'use strict';

/* Script Includes */
var currentSite = require('dw/system/Site').getCurrent();
var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
var ProductAvailabilityModel = require('dw/catalog/ProductAvailabilityModel');
var URLAction = require('dw/web/URLAction');
var Site = require('dw/system/Site');
var URLParameter = require('dw/web/URLParameter');
var URLUtils = require('dw/web/URLUtils');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');

/**
 * Gets selected variant
 * @param {dw.util.HashMap} variantFilter - variant filter of selected attributes
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @returns {dw.catalog.Variant} - variant product
 */
function getSelectedVariant(variantFilter, apiProduct) {
    var selectedVariant = null;
    var variants = null;

    if (variantFilter && !variantFilter.isEmpty()) {
        variants = productHelpers.getVariants(apiProduct, variantFilter, false, false);
        if (variants && variants.length > 0) {
            selectedVariant = variants[0];
        }
    }

    return selectedVariant;
}
function getProductURL(apiProduct,defaultVariant ,options) {
    var ProductVariationColorAttribute = apiProduct.getVariationModel().getProductVariationAttribute('color');
    var ProductVariationSizeAttribute = apiProduct.getVariationModel().getProductVariationAttribute('size');
    var defaultVariantColor = ProductVariationColorAttribute && defaultVariant && defaultVariant.custom.styleVariant ? defaultVariant.custom.styleVariant : null;
    var defaultVariantSize = ProductVariationSizeAttribute && defaultVariant && defaultVariant.custom.size ? defaultVariant.custom.size : null;

    var masterProductId = apiProduct.ID;
    if (options.productType === 'variant') {
        masterProductId = apiProduct.getMasterProduct().ID;
    }

    var params = [];
    if (defaultVariantColor) {
        params.push(new URLParameter('dwvar_' + masterProductId + '_color', defaultVariantColor));
    }
    if (defaultVariantSize) {
        params.push(new URLParameter('dwvar_' + masterProductId + '_size', defaultVariantSize));
    }
    var action = new URLAction('Product-Variation', Site.getCurrent().getID(), Site.getCurrent().defaultLocale);
    var defaultVariationUrl = URLUtils.https(action, params).toString();
    defaultVariationUrl = urlHelper.appendQueryParams(defaultVariationUrl, { pid: masterProductId, quantity: 1 }).toString();
    
    return defaultVariationUrl;
};
/**
 * Decorate product with product line item information
 * @param {Object} productModel - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @param {string} conditionAttrib - Product type condition used for default variant selection
 */
module.exports = function (productModel, apiProduct, options) {
    var collections = require('*/cartridge/scripts/util/collections');
    var selectedVariant = null;
    var selectedVariationAttributes = productHelpers.getSelectedVariationAttributes(productModel.variationAttributes);
    var variantFilter = productHelpers.createVariantFilter(selectedVariationAttributes);
    selectedVariant = getSelectedVariant(variantFilter, apiProduct);
    var defaultVariant = options.variationModel.defaultVariant;
    var getProductVariants = options.variationModel.getVariants();

    if(defaultVariant.availabilityModel.availabilityStatus !== 'IN_STOCK') {
        defaultVariant = collections.find(getProductVariants, function (item) {
           return item.availabilityModel.availabilityStatus == 'IN_STOCK';
        });
    }
    Object.defineProperty(productModel, 'defaultVariantId', {
        enumerable: true,
        writable: true,
        value: defaultVariant ? defaultVariant.ID : null
    });

    Object.defineProperty(productModel, 'defaultVariationUrl', {
        enumerable: true,
        writable: true,
        value: getProductURL(apiProduct,defaultVariant,options)
    });

    Object.defineProperty(productModel, 'selectedVariantUrl', {
        enumerable: true,
        writable: true,
        value: selectedVariant ? getProductURL(apiProduct,selectedVariant,options) : null
    });
};
