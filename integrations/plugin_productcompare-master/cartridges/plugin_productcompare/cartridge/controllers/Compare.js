'use strict';

var CatalogMgr = require('dw/catalog/CatalogMgr');
var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var productFactory = require('*/cartridge/scripts/factories/product');
var CompareAttributesModel = require('*/cartridge/models/compareAttributes');
var Site = require('dw/system/Site');

server.get('Show', cache.applyDefaultCache, function (req, res, next) {
    var reflektionHelpers = require('*/cartridge/scripts/helpers/reflektionHelpers');
    var URLUtils = require('dw/web/URLUtils');
    var URLParameter = require('dw/web/URLParameter');
    var URLAction = require('dw/web/URLAction');
    var compareProductsForm = req.querystring;
    var category = CatalogMgr.getCategory(compareProductsForm.cgid);
    var pids = Object.keys(compareProductsForm)
        .filter(function (key) { return key.indexOf('pid') === 0; })
        .map(function (pid) { return compareProductsForm[pid]; });
    var products = pids.map(function (pid) {
        return productFactory.get({ pid: pid });
    });

    var params = [];
    var action = new URLAction('Search-Show');
    if(req.querystring.isFromWhishlist){
        action = new URLAction('Wishlist-Show');
    }
    else {
        if (req.querystring.cgid) {
            params.push(new URLParameter('cgid', req.querystring.cgid));
        } else {
            params.push(new URLParameter('q', req.querystring.q));
        }
    }

    var continueShopUrl = URLUtils.url(action, params).toString();
    if (pids.length === 2 || pids.length === 1) {
        var buildcompareSuggestionsRFkRequestData = reflektionHelpers.buildcompareSuggestionsRFkRequestData(pids); //compareSuggestions
        var rfkCompareSuggestionsResults = reflektionHelpers.rfkPLPSearchResults(buildcompareSuggestionsRFkRequestData);
    }
    var buildCompareProductRFkRequestData = reflektionHelpers.buildCompareProductRFkRequestData(pids);
    var rfkCompareProductTileDataResults = reflektionHelpers.rfkPLPSearchResults(buildCompareProductRFkRequestData);
    res.render('product/comparison', {
        category: {
            name: category && category.displayName ? category.displayName : null,
            imgUrl: category && category.image ? category.image.url.toString() : null
        },
        pids: pids,
        rfkCompareSuggestionsResults: rfkCompareSuggestionsResults ? rfkCompareSuggestionsResults : null,
        rfkCompareProductTileDataResults: rfkCompareProductTileDataResults ? rfkCompareProductTileDataResults : null,
        attributes: (new CompareAttributesModel(products)).slice(0),
        querystring: req.querystring,
        wishListAddProductRfk: URLUtils.url('Wishlist-AddProduct','plp','false').toString(),
        removeWishlistProductRfk: URLUtils.url('Wishlist-RemoveProduct','plp','false').toString(),
        continueShopUrl: continueShopUrl
    });

    next();
});

module.exports = server.exports();
