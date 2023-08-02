'use strict';

var base = module.superModule;

/**
 * Get product schema information
 * @param {Object} product - Product Object
 *
 * @returns {Object} - Product Schema object
 */
 function getProductSchema(product) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var schema = {
        '@context': 'http://schema.org/',
        '@type': 'Product',
        name: product.productName,
        description: product.shortDescription,
        mpn: product.id,
        sku: product.id
    };
    if (product.brand) {
        schema.brand = {
            '@type': 'Brand',
            name: product.brand
        };
    }
    if (product.images && product.images.large) {
        schema.image = [];
        product.images.large.forEach(function (image) {
            schema.image.push(image.absURL);
        });
    }
    if (product.price) {
        schema.offers = {
            url: productHelper.generatePdpURL(product.id, false)
        };
        if (product.price.type === 'range') {
            schema.offers['@type'] = 'AggregateOffer';
            schema.offers.priceCurrency = product.price.currency;
            schema.offers.lowprice = product.price.min;
            schema.offers.highprice = product.price.max;
        } else {
            schema.offers['@type'] = 'Offer';
            if (product.price.sales) {
                schema.offers.priceCurrency = product.price.sales.currency;
                schema.offers.price = product.price.sales.decimalPrice;
            } else if (product.price.list) {
                schema.offers.priceCurrency = product.price.list.currency;
                schema.offers.price = product.price.list.decimalPrice;
            }
        }
        schema.offers.availability = 'http://schema.org/InStock';
        if (product.available) {
            if (product.availability && product.availability.messages[0] === require('dw/web/Resource').msg('label.preorder', 'common', null)) {
                schema.offers.availability = 'http://schema.org/PreOrder';
            }
        } else {
            schema.offers.availability = 'http://schema.org/OutOfStock';
        }
    }
    if (!empty(product.turntoReviewCount) && !empty(product.turntoAverageRating)) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: product.turntoAverageRating,
            reviewCount: product.turntoReviewCount
        };
    }
    return schema;
}

/**
 * Get product listing page schema information
 *
 * @returns {Object} - Listing Schema object
 */

function getListingPageSchemaUpdated(products) {
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var productUrlSplitId = Site.getCurrent().getCustomPreferenceValue('productUrlSplitId');
    var schema = {
        '@context': 'http://schema.org/',
        '@type': 'ItemList',
        itemListElement: []
    };
    Object.keys(products).forEach(function (item) {
        var productID = products[item].sku;
        var productName = products[item].name;
        var productImage = products[item].image_url;
        var product_url = '';
        var prod_url = URLUtils.https('Product-Show', 'pid', productID).toString();
        prod_url = prod_url.replace('.html', '/');
        schema.itemListElement.push({
            '@type': 'ListItem',
            position: Number(item) + 1,
            name: productName,
            url: prod_url,
            image: productImage
        });
    });
    return schema;
}
module.exports = {
    getProductSchema: getProductSchema,
    getListingPageSchema: base.getListingPageSchema,
    getListingPageSchemaUpdated: getListingPageSchemaUpdated
};