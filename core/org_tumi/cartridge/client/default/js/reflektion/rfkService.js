'use strict';

/**
 * Get cookie value by cookie name from browser
 * @param {string} cookieName - name of the cookie
 * @returns {string} cookie value of the found cookie name
 */
 function getCookie(cookieName) {
    var name = cookieName + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(';');
    for (var i = 0; i < cookieArray.length; i++) {
        var cookieItem = cookieArray[i];
        while (cookieItem.charAt(0) === ' ') {
            cookieItem = cookieItem.substring(1);
        }
        if (cookieItem.indexOf(name) === 0) {
            return cookieItem.substring(name.length, cookieItem.length);
        }
    }
    return '';
}

function reflektionUrl() {
    return window.rfk_preferences.reflktionUrl;
}

function reflektionHeaders() {
    return {
        'content-type': 'application/json',
        'authorization': window.rfk_preferences.authorization,
        'accept': 'application/json'
    }
}

function buildContentLookRFkRequestData() {
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = window.rfk_preferences.uri;
    context.page = page;
    var user = {};
    user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    user.groups = [window.rfk_preferences.rfkGroupValue];
    var geo = {};
    geo.ip = window.ipAddress;
    context.geo = geo;
    var browser = {
        device: window.deviceType
    }
    context.browser = browser;
    context.user = user;
    rfkProductSearch.context = context;
    var widget = {};
    widget.rfkid = window.rfk_preferences.rfkid_search_page;
    rfkProductSearch.widget = widget;
    var filter = {
        sku : {
            value: []
        }
    };
    rfkProductSearch.filter = filter;
    var content = {
        product : {}
    };
    rfkProductSearch.content = content;
    return '{"data":'+JSON.stringify(rfkProductSearch)+'}';
}

function buildRfkCategoryRequestData() { //buildRfkCategoryRequestData move to rfk helpers

    var rfkProductSearch = new Object();
    //PLP Start
    var currentLocale = window.rfk_preferences.currentLocale;
    var locale = currentLocale.split('_');
    var context = {};
    var page = {};
    page.uri = window.location.pathname;
    page.locale_country = locale[1];
    page.locale_language = locale[0];
    context.page = page;
    var user = {};
    user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    user.groups = [window.rfk_preferences.rfkGroupValue];
    var geo = {};
    geo.ip = window.ipAddress;
    context.geo = geo;
    var browser = {
        device: window.deviceType
    }
    context.browser = browser;
    context.user = user;
    var store = {};
    store.id = 'us';
    rfkProductSearch.context = context;

    var widget = {};
    widget.rfkid = window.rfk_preferences.rfkid_category_page;
    rfkProductSearch.widget = widget;

    rfkProductSearch.n_item = window.rfk_preferences.n_item;
    rfkProductSearch.page_number = 1;

    var facet = {};
    facet.all = true;
    facet.total = true;
    rfkProductSearch.facet = facet;

    var sort = {
        value: [
            {
                name: 'name',
                order: 'asc'
            }
        ],
        choices : true
    };
    rfkProductSearch.filter = {};
    rfkProductSearch.sort = sort;

    var content = {};
    content.product = {};
    rfkProductSearch.content = content;
    //PLP End

    return '{"data":'+JSON.stringify(rfkProductSearch)+'}';
}

function buildRfkPDPRequestData() {
    var rfkProductSearch = new Object();
    //Product Page Start
    var context = {};
    var page = {};
    var user = {};
    page.uri = window.location.pathname;
    var product_group = $(document).find('.bookmark').attr('data-pid');
    page.product_group = [product_group];
    var sku = $('.product-wrapper').attr('data-pid');
    page.sku = [sku];
    user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    user.groups = [window.rfk_preferences.rfkGroupValue];
    var geo = {};
    geo.ip = window.ipAddress;
    context.geo = geo;
    var browser = {
        device: window.deviceType
    }
    context.browser = browser;
    context.user = user;
    context.page = page;
    rfkProductSearch.context = context;
    var widget = {};
    widget.rfkid = window.rfk_preferences.rfkid_pdp;
    rfkProductSearch.widget = widget;
    if ($(window).width() < 640) {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_mobile_nitem;
    } else {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_desktop_nitem;
    }
    var content = {
        product : {}
    };
    rfkProductSearch.content = content;
    //Product Page End
    return rfkProductSearch;
}

function buildRfkCartRequestData() {

    var rfkProductSearch = new Object();
    //Cart Page Start
    var context = {};
    var page = {};
    var user = {};
    page.uri = window.location.pathname
    var pids = document.getElementsByClassName('move-to-wishlist');
    var sku = [];
    for (var i = 0; i < pids.length; i += 1) {
        sku.push(pids[i].getAttribute('data-pid'));
    }
    page.sku = sku;
    context.page = page;
    user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    user.groups = [window.rfk_preferences.rfkGroupValue];
    var geo = {};
    geo.ip = window.ipAddress;
    context.geo = geo;
    var browser = {
        device: window.deviceType
    }
    context.browser = browser;
    context.user = user ;
    rfkProductSearch.context = context;
    var widget = {};
    if (pids.length === 0) { //empty cart
        widget.rfkid = window.rfk_preferences.rfkid_empty_cart;
    } else { //non empty cart
        widget.rfkid = window.rfk_preferences.rfkid_cart;
    }
    rfkProductSearch.widget = widget;
    if ($(window).width() < 640) {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_mobile_nitem;
    } else {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_desktop_nitem;
    }
    var content = {
        product : {}
    };
    rfkProductSearch.content = content;
    //Cart Page End
    return rfkProductSearch;
}

function buildRfkHomeRequestData() {
    //Homepage Start
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = window.location.pathname
    context.page = page;
    var user = {};
    user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    user.groups = [window.rfk_preferences.rfkGroupValue];
    var geo = {};
    geo.ip = window.ipAddress;
    context.geo = geo;
    var browser = {
        device: window.deviceType
    }
    context.browser = browser;
    context.user = user ;
    rfkProductSearch.context = context;
    var widget = {};
    widget.rfkid = window.rfk_preferences.rfkid_homepage;
    rfkProductSearch.widget = widget;
    if ($(window).width() < 640) {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_mobile_nitem;
    } else {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_desktop_nitem;
    }
    var content = {
        product : {}
    };
    rfkProductSearch.content = content;
    //Homepage End
    return rfkProductSearch;
}

function buildWishlistRequestData() {
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = window.location.pathname
    var wishlistPidArray = sessionStorage.getItem('wishlistPidArray');
    var sku = wishlistPidArray.split(',');
    var value = [];
    for (var i in sku) {
        value.push(sku[i]);
    }
    page.sku = value;
    context.page = page;
    var user = {};
    user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    user.groups = [window.rfk_preferences.rfkGroupValue];
    var geo = {};
    geo.ip = window.ipAddress;
    context.geo = geo;
    var browser = {
        device: window.deviceType
    }
    context.browser = browser;
    context.user = user;
    rfkProductSearch.context = context;
    var widget = {};
    widget.rfkid = window.rfk_preferences.rfkid_search_page;
    rfkProductSearch.widget = widget;
    if ($(window).width() < 640) {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_mobile_nitem;
    } else {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_desktop_nitem;
    }
    var content = {
        product : {}
    };
    rfkProductSearch.content = content;
    return rfkProductSearch;
}

function buildListViewRequestData() {
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = window.location.pathname;
    context.page = page;
    var user = {};
    user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    user.groups = [window.rfk_preferences.rfkGroupValue];
    var geo = {};
    geo.ip = window.ipAddress;
    context.geo = geo;
    var browser = {
        device: window.deviceType
    }
    context.browser = browser;
    context.user = user;
    rfkProductSearch.context = context;
    var widget = {};
    if (document.getElementById('cgidName')) {
        widget.rfkid = window.rfk_preferences.rfkid_category_page;
    } else {
        widget.rfkid = window.rfk_preferences.rfkid_search_page;
    }
    rfkProductSearch.widget = widget;
    if ($(window).width() < 640) {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_mobile_nitem;
    } else {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_desktop_nitem;
    }
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

function buildRequestData() {
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = window.location.pathname;
    context.page = page;
    var user = {};
    user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    user.groups = [window.rfk_preferences.rfkGroupValue];
    var geo = {};
    geo.ip = window.ipAddress;
    context.geo = geo;
    var browser = {
        device: window.deviceType
    }
    context.browser = browser;
    context.user = user;
    rfkProductSearch.context = context;
    var widget = {};
    widget.rfkid = window.rfk_preferences.rfkid_search_page;
    rfkProductSearch.widget = widget;
    if ($(window).width() < 640) {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_mobile_nitem;
    } else {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_desktop_nitem;
    }
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

function buildOrderPageRequestData() {
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = window.location.pathname;
    var sku = [];
    if (document.getElementById('rfkOrderIds')) {
        var rfkOrderIds = document.getElementById('rfkOrderIds').getAttribute('value');
        sku = rfkOrderIds ? rfkOrderIds.split(',') : [];
    } else {
        var pids = document.getElementsByClassName('lineitem');
        for (var i = 0; i < pids.length; i += 1) {
            sku.push(pids[i].getAttribute('data-pid'));
        }
    }
    page.sku = sku;
    context.page = page;
    var user = {};
    user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    user.groups = [window.rfk_preferences.rfkGroupValue];
    var geo = {};
    geo.ip = window.ipAddress;
    context.geo = geo;
    var browser = {
        device: window.deviceType
    }
    context.browser = browser;
    context.user = user;
    rfkProductSearch.context = context;
    var widget = {};
    widget.rfkid = window.rfk_preferences.rfkid_search_page;
    rfkProductSearch.widget = widget;
    if ($(window).width() < 640) {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_mobile_nitem;
    } else {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_desktop_nitem;
    }
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

function buildConfirmationRequestData() {
    var rfkProductSearch = new Object();
    var context = {};
    var page = {};
    page.uri = '/order/confirmation';
    var pids = document.getElementsByClassName('product-line-item');
    var sku = [];
    for (var i = 0; i < pids.length/2; i += 1) {
        sku.push(pids[i].getAttribute('data-pid'));
    }
    page.sku = sku;
    context.page = page;
    var user = {};
    user.uuid = window.customerUUID ? window.customerUUID : getCookie('__ruid');
    user.groups = [window.rfk_preferences.rfkGroupValue];
    var geo = {};
    geo.ip = window.ipAddress;
    context.geo = geo;
    var browser = {
        device: window.deviceType
    }
    context.browser = browser;
    context.user = user;
    rfkProductSearch.context = context;
    var widget = {};
    widget.rfkid = window.rfk_preferences.rfkid_search_page;
    rfkProductSearch.widget = widget;
    if ($(window).width() < 640) {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_mobile_nitem;
    } else {
        rfkProductSearch.n_item = window.rfk_preferences.reflektion_desktop_nitem;
    }
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

function getProductDataFromRfk(rfkId, Pid_Array) {

    var productLookUpRequestData = buildContentLookRFkRequestData();
    var productRequestDataObject = JSON.parse(productLookUpRequestData);
    var reflktionUrl = reflektionUrl();
    var reflektionHeader = JSON.stringify(reflektionHeaders());
    productRequestDataObject.data.widget.rfkid = rfkId;
    for (var i in Pid_Array) {
        productRequestDataObject.data.filter.sku.value[i] = Pid_Array[i];
    }
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: reflktionUrl,
            type: 'post',
            headers: JSON.parse(reflektionHeader),
            data: JSON.stringify(productRequestDataObject),
            success: function (response) {
                resolve(response);
            },
            error: function (err) {
                reject(err);
            }
        });
    });
}

function getProductDataUsingRfkID(rfkId) {

    var productLookUpRequestData = buildContentLookRFkRequestData();
    var productRequestDataObject = JSON.parse(productLookUpRequestData);
    var reflktionUrl = reflektionUrl();
    var reflektionHeader = JSON.stringify(reflektionHeaders());
    delete productRequestDataObject.data.query;
    productRequestDataObject.data.widget.rfkid = rfkId;
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: reflktionUrl,
            type: 'post',
            headers: JSON.parse(reflektionHeader),
            data: JSON.stringify(productRequestDataObject),
            success: function (response) {
                resolve(response);
            },
            error: function (err) {
                reject(err);
            }
        });
    });
}

function getProductDataFromRfkUsingProductGroup(Pid_Array) {

    var productLookUpRequestData = buildContentLookRFkRequestData();
    var productRequestDataObject = JSON.parse(productLookUpRequestData);
    var reflktionUrl = reflektionUrl();
    var reflektionHeader = JSON.stringify(reflektionHeaders());
    for (var i in Pid_Array) {
        productRequestDataObject.data.filter.sku.value[i] = Pid_Array[i];
    }
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: reflktionUrl,
            type: 'post',
            headers: JSON.parse(reflektionHeader),
            data: JSON.stringify(productRequestDataObject),
            success: function (response) {
                resolve(response);
            },
            error: function (err) {
                reject(err);
            }
        });
    });
}

module.exports = {
    getCookie: getCookie,
    getProductDataFromRfk: getProductDataFromRfk,
    getProductDataFromRfkUsingProductGroup: getProductDataFromRfkUsingProductGroup,
    getProductDataUsingRfkID: getProductDataUsingRfkID,
    buildRfkHomeRequestData: buildRfkHomeRequestData,
    buildRequestData: buildRequestData,
    buildRfkCartRequestData: buildRfkCartRequestData,
    buildRfkPDPRequestData: buildRfkPDPRequestData,
    reflektionUrl: reflektionUrl,
    reflektionHeaders: reflektionHeaders,
    buildWishlistRequestData: buildWishlistRequestData,
    buildRfkCategoryRequestData: buildRfkCategoryRequestData,
    buildContentLookRFkRequestData: buildContentLookRFkRequestData,
    buildListViewRequestData: buildListViewRequestData,
    buildConfirmationRequestData: buildConfirmationRequestData,
    buildOrderPageRequestData: buildOrderPageRequestData
};