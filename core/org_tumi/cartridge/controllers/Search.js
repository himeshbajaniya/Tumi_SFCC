'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var Site = require('dw/system/Site');
var rfkSitePreferences = require('*/cartridge/scripts/middleware/rfkSitePreferences');

/**
 * Search-Show : This endpoint is called when a shopper type a query string in the search box
 * @name Search-Show
 * @function
 * @memberof Search
 * @param {middleware} - cache.applyShortPromotionSensitiveCache
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - q - query string a shopper is searching for
 * @param {querystringparameter} - search-button
 * @param {querystringparameter} - lang - default is en_US
 * @param {querystringparameter} - cgid - Category ID
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var plpHelper = require('*/cartridge/scripts/helpers/plpHelpers');
    var reflektionHelpers = require('*/cartridge/scripts/helpers/reflektionHelpers');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var URLUtils = require('dw/web/URLUtils');
    var addToCartUrl = URLUtils.url('Cart-AddProduct').toString();
    var viewData = res.getViewData();
    var breadcrumbs = [];
    breadcrumbs = plpHelper.getAllBreadcrumbsforPLP(req.querystring.cgid, breadcrumbs).reverse();
    var result = searchHelper.search(req, res);
    var categoryID = req.querystring.cgid;
    viewData.categoryID = categoryID;

    if (result.searchRedirect) {
        res.redirect(result.searchRedirect);
        return next();
    }

    var plprfkEnable = Site.getCurrent().getCustomPreferenceValue('plprfkenabled');
    if (plprfkEnable) {
        var template = 'search/rfkSearchResults';
        if (result.category && result.categoryTemplate) {
            template = result.categoryTemplate;
        }
        if (req.querystring.cgid) {
            var category = CatalogMgr.getCategory(req.querystring.cgid);
        }

        var Locale = require('dw/util/Locale');
        var currentLocale = Locale.getLocale(req.locale.id);

        var buildRfkCategoryRequestData = reflektionHelpers.buildRfkCategoryRequestData(category, req);
        var rfkCategoryRequestData = '{"data":'+JSON.stringify(buildRfkCategoryRequestData)+'}';
        var rfkPLPSearchResults = reflektionHelpers.rfkPLPSearchResults(rfkCategoryRequestData);
        var prefetchImages = [];
        reflektionHelpers.sortingSwatchesAndAddingSkuInSwatches(rfkPLPSearchResults, prefetchImages);
        var schemaData = require('*/cartridge/scripts/helpers/structuredDataHelper').getListingPageSchemaUpdated(rfkPLPSearchResults.content.product.value);

        res.render(template, {
            rfkCategoryRequestData: rfkCategoryRequestData,
            rfkPLPSearchResults: rfkPLPSearchResults,
            breadcrumbs: breadcrumbs,
            canonicalUrl: result.canonicalUrl,
            schemaData: schemaData,
            refineurl: result.refineurl,
            category: category,
            query: req.querystring,
            addToCartUrl: addToCartUrl,
            country: currentLocale.country,
            prefetchImages: prefetchImages
        });

    } else {

        if (req.querystring.cgid) {
            var pageLookupResult = searchHelper.getPageDesignerCategoryPage(req.querystring.cgid);

            if ((pageLookupResult.page && pageLookupResult.page.hasVisibilityRules()) || pageLookupResult.invisiblePage) {
                // the result may be different for another user, do not cache on this level
                // the page itself is a remote include and can still be cached
                res.cachePeriod = 0; // eslint-disable-line no-param-reassign
            }

            if (pageLookupResult.page) {
                res.page(pageLookupResult.page.ID, {}, pageLookupResult.aspectAttributes);
                return next();
            }
        }

        var template = 'search/searchResults';

        if (result.category && result.categoryTemplate) {
            template = result.categoryTemplate;
        } //get template from category id(cgid)

        var redirectGridUrl = searchHelper.backButtonDetection(req.session.clickStream);
        if (redirectGridUrl) {
            res.redirect(redirectGridUrl);
        }

        res.render(template, {
            productSearch: result.productSearch,
            maxSlots: result.maxSlots,
            reportingURLs: result.reportingURLs,
            refineurl: result.refineurl,
            category: result.category ? result.category : null,
            canonicalUrl: result.canonicalUrl,
            schemaData: result.schemaData,
            apiProductSearch: result.apiProductSearch,
            breadcrumbs: breadcrumbs
        });
    }

    var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');
    var URLParameter = require('dw/web/URLParameter');

    var returnParams = [];
    returnParams.push(new URLParameter('rurl', '6'));
    returnParams.push(new URLParameter('cgid', req.querystring.cgid));
    var janrainrUrlData =  accountHelper.getJanrainReturnUrl(returnParams, 0);
    var viewData = res.getViewData();
    if(viewData) {
        viewData.janrainrUrlData = janrainrUrlData
        res.setViewData(viewData)
    }
    return next();
}, rfkSitePreferences.getRfkSitePreferences, pageMetaData.computedPageMetaData);

module.exports = server.exports();
