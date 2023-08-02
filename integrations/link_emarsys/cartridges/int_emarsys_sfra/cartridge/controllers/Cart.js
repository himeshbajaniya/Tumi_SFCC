'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    if (isEmarsysEnable) {
        var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
        var emarsysAnalyticsHelper = new (require('*/cartridge/scripts/helpers/emarsysAnalyticsHelper'))();
        var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
        var viewData = res.getViewData();

        viewData.analyticsData = emarsysAnalyticsHelper.setPageData('cart', { cart: showProductPageHelperResult.product });
        res.setViewData(viewData);
    }
    next();
});

module.exports = server.exports();
