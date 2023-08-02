'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Begin', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.setViewData({
        redeemGiftCardUrl: URLUtils.url('GiftCard-Redeem'),
        checkBalanceActionURL: URLUtils.url('GiftCard-BalanceCheck')
    });
    next();
});

module.exports = server.exports();
