/**
* This script serves as helper to use throughout the reflektion cartridges
*
* To use specify the global variable reflektionHelper then a dot then the function name (e.g. reflektionHelper.getRFKEnabled() )
*
*/

'use strict';

/* API Includes */
var Locale = require('dw/util/Locale');
var Site = require('dw/system/Site');
var ProductManager = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var HashMap = require('dw/util/HashMap');
var ArrayList = require('dw/util/ArrayList');
var OrderMgr = require('dw/order/OrderMgr');
var Basket = require('dw/order/Basket');
var Order = require('dw/order/Order');
var Money = require('dw/value/Money');

/* Constants */
var RFKID_ATTRIBUTE = 'data-rfkid';
var RFK_KEYWORD_ATTRIBUTE = 'data-keyphrase';
var RFK_CAMPAIGN_COOKIE_NAME = '__rslct';
var RFK_CAMPAIGN_COOKIE_SEARCH_PAGE_VALUE = 'sp';
var RFK_CAMPAIGN_COOKIE_DELIMITER = '%2C';

/* Custom Logger */
var logger = Logger.getLogger('reflektion', 'reflektionHelper');

var reflektionHelper = {
    // Service IDs
    SERVICES: {
        UPLOAD: 'reflektion.sftp'
    },
    /**
     * @return {boolean} return rfkEnabled site preference value used to disabled/enable reflektion
     */
    getRFKEnabled: function () {
        return Site.current.getCustomPreferenceValue('rfkEnabled');
    },
    /**
     * @return {string} return rfkFilenamePrefix site preference value, used as the filename prefix to the product and category feeds
     */
    getRFKFilenamePrefix: function () {
        return Site.current.getCustomPreferenceValue('rfkFilenamePrefix');
    },
    /**
     * @return {string} return rfkFeedExportPath site preference value, SFCC path to export product and category feeds
     */
    getRFKFeedExportPath: function () {
        return Site.current.getCustomPreferenceValue('rfkFeedExportPath');
    },
    /**
     * @return {string} return rfkFeedUploadPath site preference value, Remote path to upload the product and category feeds to.
     */
    getRFKFeedUploadPath: function () {
        return Site.current.getCustomPreferenceValue('rfkFeedUploadPath');
    },
    /**
     * @return {string} return rfkProductFeedImageType site preference value, Product Image Type to use for Product Feed image_url
     */
    getRFKProductFeedImageType: function () {
        return Site.current.getCustomPreferenceValue('rfkProductFeedImageType');
    },
    /**
     * @return {string} return rfkCustomAttributes site preference value, Comma-delimited list of product custom attribute IDs to include in the product feed
     */
    getRFKCustomAttributes: function () {
        return Site.current.getCustomPreferenceValue('rfkCustomAttributes');
    },
    /**
     * @return {string} return rfkLocalizedCustomAttributes site preference value, Comma-delimited list of localized product custom attribute IDs to include in the product feed, must be a subset of rfkCustomAttributes.
     */
    getRFKLocalizedCustomAttributes: function () {
        return Site.current.getCustomPreferenceValue('rfkLocalizedCustomAttributes');
    },
    /**
     * @return {string} return rfkExcludeLocales site preference value, Comma-delimited list of site locales to exclude from the product and category feeds. ex. default,en_US
     */
    getRFKExcludeLocales: function () {
        return Site.current.getCustomPreferenceValue('rfkExcludeLocales');
    },
    /**
     * @return {boolean} return rfkProductFeedUploadEnabled site preference value, if true, then upload the product feed after it is exported
     */
    getRFKProductFeedUploadEnabled: function () {
        return Site.current.getCustomPreferenceValue('rfkProductFeedUploadEnabled');
    },
    /**
     * @return {boolean} return rfkCategoryFeedUploadEnabled site preference value, if true, then upload the category feed after it is exported
     */
    getRFKCategoryFeedUploadEnabled: function () {
        return Site.current.getCustomPreferenceValue('rfkCategoryFeedUploadEnabled');
    },
    /**
     * @return {JSON} return rfkCurrencyMap site preference value, JSON config that maps locale code to currency code.
     */
    getRFKCurrencyMap: function () {
        return JSON.parse(Site.current.getCustomPreferenceValue('rfkCurrencyMap'));
    },
    /**
     * @return {string} return rfkUATBeacon site preference value, UAT Beacon Source URL.  RFK_CUSTOMER_KEY placeholder will be replaced.
     */
    getRFKUATBeacon: function () {
        return Site.current.getCustomPreferenceValue('rfkUATBeacon');
    },
    /**
     * @return {string} return rfkPRODBeacon site preference value, Production Beacon Source URL.  DOMAIN_HASH and RFK_CUSTOMER_KEY placeholders will be replaced.
     */
    getRFKPRODBeacon: function () {
        return Site.current.getCustomPreferenceValue('rfkPRODBeacon');
    },
    /**
     * Breadcrumb for category feed
     * @param {Object} category the category object
     * @return {string} return breadcrumb for the given category, category names in the breadcrumb are delimited by '>'
     */
    getBreadcrumb: function (category) {
        try {
            var currentCat = category;
            var breadcrumb = [];
            breadcrumb.push(currentCat.displayName);
            while (!currentCat.root) {
                var parentCat = currentCat.parent;
                if (!parentCat.root) {
                    breadcrumb.push(parentCat.displayName);
                }
                currentCat = parentCat;
            }
            return (breadcrumb.reverse().join('>'));
        } catch (e) {
            logger.error('Error in script reflektionHelper.js: getBreadcrumb() - Error message: ' + e.message);
            return '';
        }
    },
    /**
     * All online categories for given product id
     * Category names in the breadcrumb are delimited by '>'
     * Breadcrumb list is delimited by '|'
     * @param {string} productID the product id
     * @return {string} return breadcrumbs for the given product id, e.g. Hidden Category>Sale>Womens>Clothing|Womens>Clothing>Tops
     */
    getProductBreadcrumb: function (productID) {
        var breadCrumbs = '';
        try {
            var product = ProductManager.getProduct(productID);
            var productBreadcrumbs = [];
            var catIterator = product.onlineCategories.iterator();
            while (catIterator.hasNext()) {
                var currentCat = catIterator.next();
                var breadcrumb = reflektionHelper.getBreadcrumb(currentCat);
                productBreadcrumbs.push(breadcrumb);
            }
            breadCrumbs = productBreadcrumbs.join('|');
        } catch (e) {
            logger.error('Error in script reflektionHelper.js: getProductBreadcrumb() - Error message: ' + e.message);
            return '';
        }

        return breadCrumbs;
    },
    /**
     * @return {string} return '<rfkFilenamePrefix >_product_feed.csv'
     */
    getRFKProductFeedFilename: function () {
        var rfkFilenamePrefix = reflektionHelper.getRFKFilenamePrefix();
        return rfkFilenamePrefix + '_product_feed.txt';
    },
    /**
     * @return {string} return '<rfkFilenamePrefix >_category_feed.csv'
     */
    getRFKCategoryFeedFilename: function () {
        var rfkFilenamePrefix = reflektionHelper.getRFKFilenamePrefix();
        return rfkFilenamePrefix + '_category_feed.txt';
    },
    /**
     * @return {string} return rfkEnvironment site preference value, reflektion environment to use. UAT or PROD
     */
    getRFKEnvironment: function () {
        return Site.current.getCustomPreferenceValue('rfkEnvironment');
    },
    /**
     * @return {string} return rfkCustomerKey site preference value, customer key in Reflektion
     */
    getRFKCustomerKey: function () {
        return Site.current.getCustomPreferenceValue('rfkCustomerKey');
    },
    /**
     * Retrieve domain from request
     * @return {string} return request.httpHost
     */
    getDomain: function () {
        return request.httpHost; // eslint-disable-line no-undef
    },
    /**
     * Return country code from request
     * @return {string} return current locale country code
     */
    getCountry: function () {
        var currentLocale = Locale.getLocale(request.locale); // eslint-disable-line no-undef
        return currentLocale.country;
    },
    /**
     * Return language from request
     * @return {string} return current locale language code
     */
    getLanguage: function () {
        var currentLocale = Locale.getLocale(request.locale); // eslint-disable-line no-undef
        return currentLocale.language;
    },
    /**
     * Return currency from session
     * @return {string} return code for the currency used in the current session
     */
    getCurrency: function () {
        return session.currency.currencyCode; // eslint-disable-line no-undef
    },
    /**
     * @return {string} return rfkSimpleSearch site preference value, Reflektion Simple Search rfkid
     */
    getRFKSimpleSearch: function () {
        return Site.current.getCustomPreferenceValue('rfkSimpleSearch');
    },
    /**
     * @return {string} return rfkFullPageSearch site preference value, Reflektion Full Page Search rfkid
     */
    getRFKFullPageSearch: function () {
        return Site.current.getCustomPreferenceValue('rfkFullPageSearch');
    },
    /**
     * @return {string} return rfkHomepageRec site preference value, Reflektion Home page rec rfkid
     */
    getRFKHomepageRec: function () {
        return Site.current.getCustomPreferenceValue('rfkHomepageRec');
    },
    /**
     * @return {string} return rfkHomepageRec 2 site preference value, Reflektion Home page rec rfkid
     */
    getRFKHomepageRec2: function () {
        return Site.current.getCustomPreferenceValue('rfkHomepageRec2');
    },
    /**
     * @return {string} return rfkPDPRec site preference value, Reflektion PDP rec rfkid
     */
    getRFKPDPRec: function () {
        return Site.current.getCustomPreferenceValue('rfkPDPRec');
    },
    /**
     * @return {string} return rfkPDPRec2 site preference value, Reflektion PDP rec2 rfkid
     */
    getRFKPDPRec2: function () {
        return Site.current.getCustomPreferenceValue('rfkPDPRec2');
    },
    /**
     * @return {string} return rfkCartRec site preference value, Reflektion Category rec rfkid
     */
    getRFKCategoryRec: function () {
        return Site.current.getCustomPreferenceValue('rfkCategoryRec');
    },
    /**
     * @return {string} return rfkCartRec site preference value, Reflektion Cart rec rfkid
     */
    getRFKCartRec: function () {
        return Site.current.getCustomPreferenceValue('rfkCartRec');
    },
    /**
     * @return {string} return rfkNoSearchResultsRec site preference value, Reflektion No Search Results rec rfkid
     */
    getRFKNoSearchResultsRec: function () {
        return Site.current.getCustomPreferenceValue('rfkNoSearchResultsRec');
    },
    /**
     * @return {string} return simple search rfkid, e.g. ('data-rfkid='rfkid_6'')
     */
    getSimpleSearch: function () {
        var rfkSimpleSearch = reflektionHelper.getRFKSimpleSearch();
        if (reflektionHelper.getRFKEnabled() && rfkSimpleSearch != null) {
            return RFKID_ATTRIBUTE + "='" + rfkSimpleSearch + "'";
        }
        return '';
    },
    /**
     * Will render full page search results based on cookie logic
     * The campaign cookie is named RFK_CAMPAIGN_COOKIE_NAME
     * This optional cookie specifies the Reflektion widgets that can be rendered when a campaign is running
     * If the cookie exists, split the cookie value using RFK_CAMPAIGN_COOKIE_DELIMITER
     * If the resulting array contains RFK_CAMPAIGN_COOKIE_SEARCH_PAGE_VALUE, then the full page search results widget is available to be rendered
     * @param {boolean} isCategoryPage boolean to determine if we are on the category page
     * @return {string} return full page search rfkid, e.g. ('data-rfkid='rfkid_7'')
     */
    getFullPageSearch: function (isCategoryPage) {
        try {
            if (isCategoryPage) {
                return '';
            }
            var rfkFullPageSearch = reflektionHelper.getRFKFullPageSearch();
            var cookieValue = reflektionHelper.getCookie(RFK_CAMPAIGN_COOKIE_NAME);
            var cookieSearchPageExist = false;
            if (cookieValue !== '' && cookieValue !== null) {
                var cookieSearchPage = cookieValue.split(RFK_CAMPAIGN_COOKIE_DELIMITER);
                for (var i = 0; i < cookieSearchPage.length; i += 1) {
                    if (cookieSearchPage[i] === RFK_CAMPAIGN_COOKIE_SEARCH_PAGE_VALUE) {
                        cookieSearchPageExist = true;
                        break;
                    }
                }
            }
            if (reflektionHelper.getRFKEnabled() && rfkFullPageSearch != null && cookieSearchPageExist) {
                return RFKID_ATTRIBUTE + "='" + rfkFullPageSearch + "' " + RFK_KEYWORD_ATTRIBUTE + "='" + request.httpParameterMap.q.value + "'"; // eslint-disable-line no-undef
            }
            return '';
        } catch (e) {
            logger.error('Error in script reflektionHelper.js: getFullPageSearch() - Error message: ' + e.message);
            return '';
        }
    },
    /**
     * Check for reflektion cookie in http request, cookieName is constant string
     * @param {string} cookieName Name of cookie value to retrieve
     * @return {string} return cookie value or empty string if cookie does not exist
     */
    getCookie: function (cookieName) {
        var httpCookies = (!empty(request) && ('httpCookies' in request) ? request.httpCookies : []); // eslint-disable-line no-undef

        if (!empty(httpCookies) && cookieName in httpCookies && !empty(httpCookies[cookieName].value)) { // eslint-disable-line no-undef
            return httpCookies[cookieName].value;
        }
        return '';
    },
    /**
     * Check site preference for rfkid, string will be added to templates to render widgets
     * @return {string} return homepage rfkid, e.g. ('data-rfkid='rfkid_1'')
     */
    getHomepageRec: function () {
        var rfkHomepageRec = reflektionHelper.getRFKHomepageRec();
        if (reflektionHelper.getRFKEnabled() && rfkHomepageRec != null) {
            return RFKID_ATTRIBUTE + "='" + rfkHomepageRec + "'";
        }
        return '';
    },
    /**
     * Check site preference for rfkid, string will be added to templates to render widgets
     * @return {string} return homepage rfkid, e.g. ('data-rfkid='rfkid_1'')
     */
    getHomepageRec2: function () {
        var rfkHomepageRec = reflektionHelper.getRFKHomepageRec2();
        if (reflektionHelper.getRFKEnabled() && rfkHomepageRec != null) {
            return RFKID_ATTRIBUTE + "='" + rfkHomepageRec + "'";
        }
        return '';
    },
    /**
     * Check site preference for rfkid, string will be added to templates to render widgets
     * @return {string} return PDP rfkid, e.g. ('data-rfkid='rfkid_31'')
     */
    getPDPRec: function () {
        var rfkPDPRec = reflektionHelper.getRFKPDPRec();
        if (reflektionHelper.getRFKEnabled() && rfkPDPRec != null) {
            return RFKID_ATTRIBUTE + "='" + rfkPDPRec + "'";
        }
        return '';
    },
    /**
     * Check site preference for rfkid, string will be added to templates to render widgets
     * @return {string} return PDP2 rfkid, e.g. ('data-rfkid='rfkid_32'')
     */
    getPDPRec2: function () {
        var rfkPDPRec2 = reflektionHelper.getRFKPDPRec2();
        if (reflektionHelper.getRFKEnabled() && rfkPDPRec2 != null) {
            return RFKID_ATTRIBUTE + "='" + rfkPDPRec2 + "'";
        }
        return '';
    },
    /**
     * Check site preference for rfkid, string will be added to templates to render widgets
     * @return {string} return category rfkid, e.g. ('data-rfkid='rfkid_33'')
     */
    getCategoryRec: function () {
        var rfkCategoryRec = reflektionHelper.getRFKCategoryRec();
        if (reflektionHelper.getRFKEnabled() && rfkCategoryRec != null) {
            return RFKID_ATTRIBUTE + "='" + rfkCategoryRec + "'";
        }
        return '';
    },
    /**
     * Check site preference for rfkid, string will be added to templates to render widgets
     * @return {string} return cart rfkid, e.g. ('data-rfkid='rfkid_4'')
     */
    getCartRec: function () {
        var rfkCartRec = reflektionHelper.getRFKCartRec();
        if (reflektionHelper.getRFKEnabled() && rfkCartRec != null) {
            return RFKID_ATTRIBUTE + "='" + rfkCartRec + "'";
        }
        return '';
    },
    /**
     * Check site preference for rfkid, string will be added to templates to render widgets
     * @return {string} return no search result rfkid, e.g. ('data-rfkid='rfkid_a1'')
     */
    getNoSearchResultsRec: function () {
        var rfkNoSearchResultsRec = reflektionHelper.getRFKNoSearchResultsRec();
        if (reflektionHelper.getRFKEnabled() && rfkNoSearchResultsRec != null) {
            return RFKID_ATTRIBUTE + "='" + rfkNoSearchResultsRec + "'";
        }
        return '';
    },
    /**
     * Check site preference for reflektion url, will build script source based on settings
     * @return {string} return Beacon src, e.g ('//initjs.uat.rfksrv.com/rfk/js/<rfkCustomerKey>/init.js')
     */
    getBeaconSrc: function () {
        var src = '';
        try {
            var rfkEnvironment = reflektionHelper.getRFKEnvironment().value;
            var rfkCustomerKey = reflektionHelper.getRFKCustomerKey();

            if (rfkEnvironment === 'UAT') {
                src = reflektionHelper.getRFKUATBeacon();
                src = src.replace('RFK_CUSTOMER_KEY', rfkCustomerKey);
            } else if (rfkEnvironment === 'PROD') {
                var customerKeySplit = rfkCustomerKey.split('-');
                var domainHash = customerKeySplit[1];
                src = reflektionHelper.getRFKPRODBeacon();
                src = src.replace('RFK_CUSTOMER_KEY', rfkCustomerKey);
                src = src.replace('DOMAIN_HASH', domainHash);
            }
        } catch (e) {
            logger.error('Error in script reflektionHelper.js: getBeaconSrc() - Error message: ' + e.message);
            return '';
        }
        return src;
    },
    /**
     * Will grab product line items for productIDs used for cart status event reporting
     * @param {Object} itemsObject Object containing items
     * @return {string} return items JSON for use in Reflektion event reporting
     */
    getItemsJSON: function (itemsObject) {
        var isSGJC = itemsObject instanceof Basket;
        var rfkItems = [];
        if (isSGJC) {
            var itemIterator = itemsObject.productLineItems.iterator();
            while (itemIterator.hasNext()) {
                var item = itemIterator.next();
                /* eslint-disable quote-props */
                rfkItems.push({
                    'sku': item.productID
                });
                /* eslint-enable quote-props */
            }
        } else {
            var itemIterator2 = itemsObject.iterator();
            while (itemIterator2.hasNext()) {
                var item2 = itemIterator2.next();
                /* eslint-disable quote-props */
                rfkItems.push({
                    'sku': item2.id
                });
                /* eslint-enable quote-props */
            }
        }
        return (JSON.stringify(rfkItems));
    },
    /**
     * Determine if we are on the cart page for event reporting
     * @return {boolean} return true if rfkid for cart is not empty and we are on the cart page
     */
    pushCart: function () {
        return (!empty(this.getRFKCartRec()) && request.httpPath.indexOf('Cart-Show') > -1); // eslint-disable-line no-undef
    },
    /**
     * Will grab all skus added to basket used for event reporting when the customer views cart
     * @param {Object} basket the basket object
     * @return {string} return comma separated string of all skus added to basket
     */
    getSKUs: function (basket) {
        var skus = [];
        if (!empty(basket)) { // eslint-disable-line no-undef
            var itemIterator = basket.productLineItems.iterator();
            while (itemIterator.hasNext()) {
                var item = itemIterator.next();
                skus.push("'" + item.productID + "'");
            }
        }
        return ('[' + skus.join(',') + ']');
    },
    /**
     * Will grab the data used for order confirmation event reporting
     * @param {Object} itemsObject the order object or order model
     * @return {string} return order JSON for use in Reflektion event reporting
     */
    getOrderJSON: function (itemsObject) {
        var products = [];
        try {
            var isSGJC = itemsObject instanceof Order;
            var listPrice = '';
            if (isSGJC) {
                var itemIterator = itemsObject.productLineItems.iterator();
                while (itemIterator.hasNext()) {
                    var item = itemIterator.next();
                    listPrice = reflektionHelper.getProductListPrice(item.productID);
                    /* eslint-disable quote-props */
                    products.push({
                        'sku': item.productID,
                        'quantity': item.quantityValue,
                        'price': item.adjustedPrice.divide(item.quantityValue).value,
                        'price_original': listPrice.value
                    });
                    /* eslint-enable quote-props */
                }
            } else {
                var order = OrderMgr.getOrder(itemsObject.orderNumber);
                var itemIterator2 = order.productLineItems.iterator();
                while (itemIterator2.hasNext()) {
                    var item2 = itemIterator2.next();
                    listPrice = reflektionHelper.getProductListPrice(item2.productID);
                    /* eslint-disable quote-props */
                    products.push({
                        'sku': item2.productID,
                        'quantity': item2.quantityValue,
                        'price': item2.adjustedPrice.divide(item2.quantityValue).value,
                        'price_original': listPrice.value
                    });
                    /* eslint-enable quote-props */
                }
            }
        } catch (e) {
            logger.error('Error in script reflektionHelper.js: getOrderJSON() - Error message: ' + e.message);
            return (JSON.stringify(products));
        }
        return (JSON.stringify(products));
    },
    /**
     * Retrieve the list price pricebook value for product
     * @param {string} productID the productID
     * @return {string} return list price for product
     */
    getProductListPrice: function (productID) {
        var listPrice = '';
        try {
            var product = ProductManager.getProduct(productID);
            if (product != null) {
                var priceModel = product.getPriceModel();
                listPrice = priceModel.price;
                if (!empty(priceModel.priceInfo)) { // eslint-disable-line no-undef
                    var priceBook = priceModel.priceInfo.priceBook;
                    while (priceBook.parentPriceBook) {
                        priceBook = priceBook.parentPriceBook ? priceBook.parentPriceBook : priceBook;
                        var price = priceModel.getPriceBookPrice(priceBook.ID);
                        if (price !== Money.NOT_AVAILABLE) {
                            listPrice = price;
                        }
                    }
                }
            }
        } catch (e) {
            logger.error('Error in script reflektionHelper.js: getProductListPrice() - Error message: ' + e.message);
            return listPrice;
        }
        return listPrice;
    },
    /**
     * Retrieve inventory record and check availability
     * @param {string} productID the productID
     * @return {number} return inventory record ATS value
     */
    getProductAvailability: function (productID) {
        var availability = 0;
        var product = ProductManager.getProduct(productID);
        if (product.isMaster() || product.variationGroup) {
            return availability;
        }
        if (product.availabilityModel.inventoryRecord != null) {
            availability = product.availabilityModel.inventoryRecord.ATS.value ? product.availabilityModel.inventoryRecord.ATS.value : 0;
        }
        return availability;
    },
    /**
     * Creating variation group hashmap to map out variant groups with group id and variant
     * @return {HashMap} return hashmap of variation groups for variation product
     */
    getVariationGroupMap: function () {
        var productIter = ProductManager.queryAllSiteProducts();
        var variationGroupMap = new HashMap();
        while (productIter.hasNext()) {
            var product = productIter.next();
            if (product.variationGroup) {
                var variantIterator = product.variants.iterator();
                while (variantIterator.hasNext()) {
                    var variant = variantIterator.next();
                    variationGroupMap.put(variant.ID, product.ID);
                }
                variationGroupMap.put(product.ID, product.ID);
            } else {
                continue; // eslint-disable-line no-continue
            }
        }
        return variationGroupMap;
    },
    /**
     * Retrieve customer number from order model for sfra
     * @param {Object} orderModel the order model
     * @return {string} return customer number for logged in user
     */
    getCustomerNo: function (orderModel) {
        var order = OrderMgr.getOrder(orderModel.orderNumber);
        var customerNo = 'null';
        if (order.customerNo != null) {
            customerNo = order.customerNo;
        }
        return customerNo;
    },
    /**
     * Get comma delimited list of site locales to exclude from the product and category feeds
     * @return {ArrayList} the list of locales
     */
    getLocalExcludeList: function () {
        var excludedLocals;
        // Get Get exluded local list from site preference
        var locals = reflektionHelper.getRFKExcludeLocales();
        if (locals != null) {
            excludedLocals = new ArrayList(locals.split(','));
        }
        return excludedLocals;
    },
    /**
     * Get the order subtotal for SFRA and SFRA Global site
     * @param {Object} orderModel the order model
     * @return {string} the order subtotal
     */
    getOrderSubTotal: function (orderModel) {
        var order = OrderMgr.getOrder(orderModel.orderNumber);
        return order.adjustedMerchandizeTotalPrice.value;
    },
    /**
     * Get the order total for SFRA and SFRA Global site
     * @param {Object} orderModel the order model
     * @return {string} the order grand total
     */
    getOrderTotal: function (orderModel) {
        var order = OrderMgr.getOrder(orderModel.orderNumber);
        return order.totalGrossPrice.value;
    },

    getOrderUserData: function (order) {
        var orderObject = {};
        try {
            orderObject = {
                id: order.shipping[0].UUID,
                email: order.orderEmail,
                address: {
                    "address_line_1": order.shipping[0].shippingAddress.address1,
                    "address_line_2": order.shipping[0].shippingAddress.address2 ? order.shipping[0].shippingAddress.address2 : '',
                    "state": order.shipping[0].shippingAddress.stateCode,
                    "zip": order.shipping[0].shippingAddress.postalCode,
                    "country": order.shipping[0].shippingAddress.countryCode.value
                }
            };
        } catch (error) {
            logger.error('Error in script reflektionHelper.js: getOrderUserData() - Error message: ' + error.message);
            return (JSON.stringify(orderObject));
        }
        return (JSON.stringify(orderObject));
    },

    getCustomerUUID: function () {
        return require('*/cartridge/scripts/helpers/cookieHelper').getCookie('__ruid');
    }
};
module.exports = reflektionHelper;
