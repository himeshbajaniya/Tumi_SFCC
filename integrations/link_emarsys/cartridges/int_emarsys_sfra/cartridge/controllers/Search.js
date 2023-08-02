'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    if (isEmarsysEnable) {
        var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
        var emarsysAnalyticsHelper = new (require('*/cartridge/scripts/helpers/emarsysAnalyticsHelper'))();
        var viewData = res.getViewData();
        var result = searchHelper.search(req, res);

        viewData.analyticsData = emarsysAnalyticsHelper.setPageData('search', { productSearch: result.productSearch.productSearch });
        res.setViewData(viewData);
    }
    next();
});


module.exports = server.exports();
