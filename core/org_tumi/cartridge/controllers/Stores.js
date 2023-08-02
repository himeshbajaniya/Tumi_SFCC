'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
server.extend(module.superModule);

server.post('SaveMyStore', function (req, res, next) {
    if (!empty(req.form.storeId)) {
        var URLUtils = require('dw/web/URLUtils');
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var profile = customer.getProfile();
        Transaction.wrap(function () {
            profile.custom.favouriteStore = req.form.storeId;
        });
        res.json({
            success: true,
            redirectUrl: URLUtils.url('Account-MySettings').toString()
        });
    } else {
        res.json({
            success: false
        });
    }
    return next();
});

module.exports = server.exports();
