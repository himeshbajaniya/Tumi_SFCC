'use strict';

var Site = require('dw/system/Site');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

function sortingSwatchesAndAddingSkuInSwatches(rfkPLPSearchResults, prefetchImages) {
    try {
        var products = rfkPLPSearchResults.content.product.value;
        Object.keys(products).forEach(function (item) {
            prefetchImages.push(products[item].image_url + '' + Site.getCurrent().getCustomPreferenceValue('s7PresetsPlp'));
            var swatch_list = products[item].swatch_list;
            Object.keys(swatch_list).forEach(function (swatch) {
                var product_url = swatch_list[swatch].product_url.split('/');
                var splitUrl = product_url[product_url.length - 2].split('-');
                var swatch_sku = splitUrl[splitUrl.length - 1];
                Object.defineProperty(swatch_list[swatch], 'swatch_sku', {
                    enumerable: true,
                    value: swatch_sku
                });
                Object.defineProperty(swatch_list[swatch], 'product_url', {
                    enumerable: true,
                    value: URLUtils.url('Product-Show', 'pid', swatch_sku).toString()
                });
                if (swatch_sku == products[item].sku) {
                    let swap = swatch_list[0];
                    swatch_list[0] = swatch_list[swatch];
                    swatch_list[swatch] = swap;
                }
            });
            Object.defineProperty(rfkPLPSearchResults.content.product.value[item], 'swatch_list', {
                enumerable: true,
                value: swatch_list
            });
            Object.defineProperty(rfkPLPSearchResults.content.product.value[item], 'url', {
                enumerable: true,
                value: URLUtils.url('Product-Show', 'pid', products[item].sku).toString()
            });
        });
    } catch (error) {
        Logger.error('Error in script reflektionHelpers.js - Error message: ' + error);
        return new Status(Status.OK, null, error.message);  
    }
}

function buildCompareProductRFkRequestData(pids) {
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = Site.getCurrent().getCustomPreferenceValue('reflektion_uri');
    context.page = page;
    var user = {};
    var ruid = require('*/cartridge/scripts/helpers/cookieHelper').getCookie('__ruid');
    user.uuid = ruid ? ruid : session.custom.sessionID;
    user.groups = [Site.getCurrent().getCustomPreferenceValue('rfkGroupValue')];
    var geo = {};
    geo.ip = session.custom.ipAddress;
    context.geo = geo;
    var browser = {
        device: session.custom.device
    }
    context.browser = browser;
    context.user = user;
    rfkProductSearch.context = context;
    var value = [];
    for (var i in pids) {
        value[i] = pids[i];
    }
    var filter = {
        sku : {
            value: value
        }
    };
    rfkProductSearch.filter = filter;
    var widget = {};
    widget.rfkid = Site.getCurrent().getCustomPreferenceValue('rfkid_CompareProducts');
    rfkProductSearch.widget = widget;
    var content = {
        product : {}
    };
    rfkProductSearch.content = content;
    return '{"data":'+JSON.stringify(rfkProductSearch)+'}';
}

function buildcompareSuggestionsRFkRequestData(pids) {
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = Site.getCurrent().getCustomPreferenceValue('reflektion_uri');
    var sku = [];
    for (var i in pids) {
        sku[i] = pids[i];
    }
    page.sku = sku;
    context.page = page;
    var user = {};
    var ruid = require('*/cartridge/scripts/helpers/cookieHelper').getCookie('__ruid');
    user.uuid = ruid ? ruid : session.custom.sessionID;
    user.groups = [Site.getCurrent().getCustomPreferenceValue('rfkGroupValue')];
    var geo = {};
    geo.ip = session.custom.ipAddress;
    context.geo = geo;
    var browser = {
        device: session.custom.device
    }
    context.browser = browser;
    context.user = user;
    rfkProductSearch.context = context;
    var widget = {};
    widget.rfkid = Site.getCurrent().getCustomPreferenceValue('rfkid_CompareSuggestion');
    rfkProductSearch.widget = widget;
    var content = {
        product : {}
    };
    rfkProductSearch.content = content;
    return '{"data":'+JSON.stringify(rfkProductSearch)+'}';
}

function buildContentLookRFkRequestData() {
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = Site.getCurrent().getCustomPreferenceValue('reflektion_uri');
    context.page = page;
    var user = {};
    var ruid = require('*/cartridge/scripts/helpers/cookieHelper').getCookie('__ruid');
    user.uuid = ruid ? ruid : session.custom.sessionID;
    user.groups = [Site.getCurrent().getCustomPreferenceValue('rfkGroupValue')];
    var geo = {};
    geo.ip = session.custom.ipAddress;
    context.geo = geo;
    var browser = {
        device: session.custom.device
    }
    context.browser = browser;
    context.user = user;
    rfkProductSearch.context = context;
    var widget = {};
    widget.rfkid = Site.getCurrent().getCustomPreferenceValue('rfkid_search_page');
    rfkProductSearch.widget = widget;
    rfkProductSearch.n_item = Site.getCurrent().getCustomPreferenceValue('reflektion_n_item');
    var query = {
        keyphrase : {
            value: []
        }
    };
    rfkProductSearch.query = query;
    var content = {
        product : {}
    };
    rfkProductSearch.content = content;
    return rfkProductSearch;
}

function rfkPLPSearchResults(rfkCategoryRequestData) {

    var authorization = Site.getCurrent().getCustomPreferenceValue('reflektion_authorization');
    try {
        var service = LocalServiceRegistry.createService('reflektion.search.results', {
            createRequest: function (service, rfkCategoryRequestData) {
                service.setRequestMethod('POST');
                service.addHeader('Content-Type', 'application/json');
                service.addHeader('authorization', authorization);
                service.addHeader('accept', 'application/json');
    
                if (service.getRequestMethod() === 'POST') {
                    var dataString = rfkCategoryRequestData;
                    return dataString;
                }
                return service;
            },
            parseResponse: function (service, output) {
                return output;
            },
            getRequestLogMessage: function (reqObj) {
                return reqObj;
            }
        });
    
        var serviceResult = service.call(rfkCategoryRequestData);
    } catch (e) {
        var error = e;
        Logger.error('Error in script reflektionHelpers.js - Error message: ' + error);
        return new Status(Status.OK, null, error.message);
    }
 
    return JSON.parse(serviceResult.object.text) ? JSON.parse(serviceResult.object.text) : null;
}

function getCategoryPathForRfk(cgid ,breadcrumbs) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var category;

    if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (category) {
        breadcrumbs.push({
            ID: category.ID
        });

        if (category.parent && category.parent.ID !== 'root') {
            return getCategoryPathForRfk(category.parent.ID, breadcrumbs);
        }
        if (category.parent.ID === 'root') {
            breadcrumbs.push({
                ID: 'c'
            });
        }
    }
    breadcrumbs = breadcrumbs.reverse();

    var categoryPath = '';
    for (var i in breadcrumbs) {
        categoryPath = categoryPath + '/' + breadcrumbs[i].ID;
    }

    return categoryPath;
}

function buildRfkCategoryRequestData(category, req) { //buildRfkCategoryRequestData move to rfk helpers

    var rfkProductSearch = new Object();
    //PLP Start
    var pageURL;
    var rfkId;
    if (req.querystring.cgid) {
        var catSplitId = Site.getCurrent().getCustomPreferenceValue('categorySplitId');
        var categoryUrl = '';
        var catUrl = URLUtils.https('Search-Show', 'cgid', req.querystring.cgid).toString();
        if (catUrl.indexOf(catSplitId) !== -1) {
            var catUrlArr = catUrl.split(catSplitId);
            categoryUrl += catSplitId + catUrlArr[1];
        }
        pageURL = categoryUrl;
        rfkId = Site.getCurrent().getCustomPreferenceValue('rfkid_category_page');
    } else {
        pageURL = Site.getCurrent().getCustomPreferenceValue('reflektion_uri');
        rfkId = Site.getCurrent().getCustomPreferenceValue('rfkid_search_page');
        var query = {
            keyphrase : {
                value: [req.querystring.q]
            }
        };
        var suggestion = {
            keyphrase: {
                max: 1
            }
        };
        rfkProductSearch.suggestion = suggestion;
        rfkProductSearch.query = query;
    }
    var currentLocale = request.getLocale();
    var locale = currentLocale.split('_');
    var context = {};
    var page = {};
    page.uri = pageURL ? pageURL : '';
    page.locale_country = locale[1];
    page.locale_language = locale[0];
    context.page = page;
    var user = {};
    var ruid = require('*/cartridge/scripts/helpers/cookieHelper').getCookie('__ruid');
    user.uuid = ruid ? ruid : session.custom.sessionID;
    user.groups = [Site.getCurrent().getCustomPreferenceValue('rfkGroupValue')];
    var geo = {};
    geo.ip = session.custom.ipAddress;
    context.geo = geo;
    var browser = {
        device: session.custom.device
    }
    context.browser = browser;
    context.user = user;
    var store = {};
    store.id = 'us';
    rfkProductSearch.context = context;

    var widget = {};
    widget.rfkid = rfkId;
    rfkProductSearch.widget = widget;

    rfkProductSearch.n_item = Site.getCurrent().getCustomPreferenceValue('reflektion_n_item');
    rfkProductSearch.page_number = 1;

    var facet = {};
    facet.all = true;
    facet.total = true;
    rfkProductSearch.facet = facet;

    var sort = {
        value: [
            {
                name: Site.getCurrent().getCustomPreferenceValue('reflektion_sort_name'),
                order: Site.getCurrent().getCustomPreferenceValue('reflektion_sort_order')
            }
        ],
        choices : true
    };
    rfkProductSearch.sort = sort;

    var content = {};
    content.product = {};
    rfkProductSearch.content = content;
    //PLP End

    return rfkProductSearch;
}

function buildRfkSearchRequestData(params) {
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = params.uri;
    page.product_group = params.product_group;

    context.page = page;
    var user = {};
    var ruid = require('*/cartridge/scripts/helpers/cookieHelper').getCookie('__ruid');
    user.uuid = ruid ? ruid : session.custom.sessionID;
    user.groups = [Site.getCurrent().getCustomPreferenceValue('rfkGroupValue')];
    var geo = {};
    geo.ip = session.custom.ipAddress;
    context.geo = geo;
    var browser = {
        device: session.custom.device
    }
    context.browser = browser;
    context.user = user ;

    rfkProductSearch.context = context ;

    var widget = {};
    widget.rfkid = params.rfkid ;
    rfkProductSearch.widget = widget;

    rfkProductSearch.n_item = params.n_item ;

    var query = {
        keyphrase : {
            value: params.query_keyphrase_value
        }
    };

    rfkProductSearch.query = query;

    rfkProductSearch.exact_match = params.exact_match;

    var suggestion = {
        category : {
            max: params.category_max
        },
        keyphrase: {
            max: params.category_max
        },
        trending_category : {
            max : params.trending_category_max
        }
    };

    rfkProductSearch.suggestion = suggestion;
    var content = {
        product : {
            max: params.product_max
        }
    };

    rfkProductSearch.content = content;
    return rfkProductSearch ;

};

module.exports = {
    buildRfkSearchRequestData: buildRfkSearchRequestData,
    buildRfkCategoryRequestData: buildRfkCategoryRequestData,
    rfkPLPSearchResults: rfkPLPSearchResults,
    buildContentLookRFkRequestData: buildContentLookRFkRequestData,
    buildcompareSuggestionsRFkRequestData: buildcompareSuggestionsRFkRequestData,
    buildCompareProductRFkRequestData: buildCompareProductRFkRequestData,
    getCategoryPathForRfk: getCategoryPathForRfk,
    sortingSwatchesAndAddingSkuInSwatches: sortingSwatchesAndAddingSkuInSwatches
};
