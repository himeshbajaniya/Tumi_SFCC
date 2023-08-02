'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('SubmitPayment', function (req, res, next) {
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    if (isEmarsysEnable) {
        this.on('route:Complete', function (req, res) { // eslint-disable-line no-shadow
            var emarsysHelper = require('*/cartridge/scripts/helpers/emarsysSFRAHelper');
            var billingData = res.getViewData();

            emarsysHelper.checkoutSubscription(res, billingData);
        });
    }
    next();
});


module.exports = server.exports();
