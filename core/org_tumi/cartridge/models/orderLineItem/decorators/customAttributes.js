'use strict';

module.exports = function (object, lineItem) {

    Object.defineProperty(object, 'shippingStatus', {
        enumerable: true,
        value: ('shippingstatus' in lineItem.custom && lineItem.custom.shippingstatus) ? lineItem.custom.shippingstatus.value : null
    });

    Object.defineProperty(object, 'shippingStatusMsg', {
        enumerable: true,
        value: (function (shippingStatus) {
            if (!shippingStatus || (shippingStatus !== 'CANCELLED' && shippingStatus !== 'RETURN_RECEIVED')) return null;
            return require('dw/web/Resource').msg('order.shipping.satus.' + shippingStatus, 'order', null);
        }(object.shippingStatus))
    });

};