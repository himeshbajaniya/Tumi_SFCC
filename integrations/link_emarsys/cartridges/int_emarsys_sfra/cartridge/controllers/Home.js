'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    if (isEmarsysEnable) {
        var emarsysAnalyticsHelper = new (require('*/cartridge/scripts/helpers/emarsysAnalyticsHelper'))();
        var viewData = res.getViewData();
        viewData.analyticsData = emarsysAnalyticsHelper.setPageData('storefront');
        res.setViewData(viewData);
    }
    next();
});


module.exports = server.exports();
