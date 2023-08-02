'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    if (isEmarsysEnable) {
        var OrderMgr = require('dw/order/OrderMgr');
        var emarsysAnalyticsHelper = new (require('*/cartridge/scripts/helpers/emarsysAnalyticsHelper'))();
        var viewData = res.getViewData();

        var order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
        if (order && order.customer.ID === req.currentCustomer.raw.ID && order.orderToken === req.form.orderToken) {
            viewData.analyticsData = emarsysAnalyticsHelper.setPageData('orderconfirmation', { order: order });
        }
        res.setViewData(viewData);
    }
    next();
});

module.exports = server.exports();
