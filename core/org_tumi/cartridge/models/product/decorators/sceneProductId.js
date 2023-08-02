'use strict';

function getProductID (object) {
    var ProductMgr = require('dw/catalog/ProductMgr');

    var productObject = ProductMgr.getProduct(object.id);
    var styleVariant = "";
    var product;

    if (Object.hasOwnProperty.call(productObject, 'selectedVariant') && productObject.selectedVariant) {
        product = productObject.selectedVariant;
    } else if (Object.hasOwnProperty.call(productObject, 'defaultVariant') && productObject.defaultVariant) {
        product = productObject.defaultVariant;
    } else if (productObject.isMaster()) {
        var prodVariationModel = productObject.variationModel;
        product = Object.hasOwnProperty.call(prodVariationModel, 'defaultVariant') && prodVariationModel.defaultVariant ? prodVariationModel.defaultVariant : prodVariationModel.variants[0];
    } else {
        product = productObject;
    }
    styleVariant = Object.hasOwnProperty.call(product.custom, 'styleVariant') && product.custom.styleVariant ? product.custom.styleVariant : '';
    return styleVariant;
}

module.exports = function (object) {
    Object.defineProperty(object, 'scene7ProductId', {
        enumerable: true,
        value: getProductID(object)
    });
}