'use strict';

var server = require('server');

server.get('GetDataLayerObject', function (req, res, next) {
    var dataLayer = require('*/cartridge/scripts/helpers/gtmDataLayerHelpers');
    var querystring = req.querystring;
    var pageType = dataLayer.getPageType(querystring.action);
    var pid = querystring.pid || null;
    var categoryID = querystring.categoryID || null;
    var orderID = querystring.orderID || null;
    var orderToken = querystring.orderToken || null;
    var dataLayerJson = dataLayer.getData(req, pageType, pid, categoryID, orderID, orderToken);
    res.render('/gtm/gtmDataLayer', {
        dataLayerJson: dataLayerJson
    });
    next();
});

module.exports = server.exports();
