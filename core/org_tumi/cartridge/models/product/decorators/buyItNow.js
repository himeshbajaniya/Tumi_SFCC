'use strict';

module.exports = function (object) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    Object.defineProperty(object, 'eligibleForBuyNow', {
        enumerable: true,
        value: customer.authenticated && COHelpers.getPreferredAddressForCurrentSite(customer) && require('*/cartridge/scripts/helpers/buyNowhelpers').isContainsCreditCard(customer)
    });

}