'use strict';

module.exports = function (object, product, quantity) {
    Object.defineProperty(object, 'isOrderable', {
        enumerable: true,
        value: quantity > 0 ? product.availabilityModel.isOrderable(quantity) : false
    });
};
