'use strict';

var server = require('server');
var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');
var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelper');

server.get('Show', function (req, res, next) {
    var reflektionHelpers = require('*/cartridge/scripts/helpers/reflektionHelpers');
    var data = {};
    var headers = {
        'content-type': 'application/json',
        'authorization': Site.getCurrent().getCustomPreferenceValue('reflektion_authorization'),
        'accept': 'application/json'
    };
    data.headers = headers;
    data.reflktionUrl = Site.getCurrent().getCustomPreferenceValue('reflektion_URL');
    if (req.querystring.cgid === 'Alpha 3') {
        var buildContentLookRFkData = reflektionHelpers.buildContentLookRFkRequestData();
        var contentLookRFkRequestData = '{"data":'+JSON.stringify(buildContentLookRFkData)+'}';
        data.contentLookRFkRequestData = contentLookRFkRequestData;
        res.json(data);
    } else {
        var params = {};
        params.uuid = require('*/cartridge/scripts/helpers/cookieHelper').getCookie('__ruid');
        params.rfkid = Site.getCurrent().getCustomPreferenceValue('rfkid_type_ahead');
        params.uri = Site.getCurrent().getCustomPreferenceValue('reflektion_uri');
        params.exact_match = Site.getCurrent().getCustomPreferenceValue('reflektion_exact_match');
        params.n_item = Site.getCurrent().getCustomPreferenceValue('rfksearchflyout_n_item');
        params.trending_category_max = Site.getCurrent().getCustomPreferenceValue('reflektion_trending_category_max');
        params.product_max = Site.getCurrent().getCustomPreferenceValue('reflektion_product_max');
        params.category_max = Site.getCurrent().getCustomPreferenceValue('reflektion_category_max');
        var product_group = Site.getCurrent().getCustomPreferenceValue('reflektion_product_group');
        params.product_group =[product_group];
        var query_keyphrase_value = Site.getCurrent().getCustomPreferenceValue('reflektion_query_keyphrase_value');
        params.query_keyphrase_value = [query_keyphrase_value];
        params.product = {};

        var rfksearchInputData = reflektionHelpers.buildRfkSearchRequestData(params);
        var dataString = '{"data":'+JSON.stringify(rfksearchInputData)+'}';
        data.dataString = dataString;
        res.json(data);      
    }
    next();
});

server.get('getPersonalizationData', function (req, res, next) {
    var customerUUID = cookieHelpers.getCookie('__ruid');
    var ipAddress = session.custom.ipAddress;
    var deviceType = session.custom.device;
    res.render('reflektion/personalizationData', {
        deviceType: deviceType,
        ipAddress: ipAddress,
        customerUUID: customerUUID
    });
    next();
});


server.get('Beacon', function (req, res, next) {
    var loggedIn = req.session.privacyCache.get('loggedIn');
    var customer = req.currentCustomer;
    if (loggedIn && customer.raw.registered) {
        req.session.privacyCache.set('loggedIn', true);
    } else {
        if (loggedIn && !customer.raw.registered) {
            req.session.privacyCache.set('loggedIn', false);
        }
        customer = null;
    }

    var currentBasket = BasketMgr.getCurrentBasket();
    var pushCart = request.httpParameterMap.pushCart;  // eslint-disable-line
    res.render('reflektion/beacon', {
        customer: customer,
        currentBasket: currentBasket,
        pushCart: pushCart
    });
    next();
});

module.exports = server.exports();
