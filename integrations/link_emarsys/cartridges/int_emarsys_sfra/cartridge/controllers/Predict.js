'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var Site = require('dw/system/Site');/**

/**
 * @description return Cart object
 * @returns {void}
 */
server.get(
    'ReturnCartObject',
    function (req, res, next) {
        var useGrossPrice = Site.getCurrent().getCustomPreferenceValue('emarsysUseGrossPrice');
        var cart = BasketMgr.getCurrentBasket();
        var productItemsArray = [];

        if (cart) {
            var productItems = cart.getProductLineItems();
            for (var i = 0; i < productItems.length; i++) {
                var ProductLineItem = productItems[i];
                if (!(ProductLineItem.bonusProductLineItem || ProductLineItem.bundledProductLineItem)) {
                    var prodObject = {};
                    prodObject.item = ProductLineItem.productID;
                    prodObject.price = useGrossPrice === true ? parseFloat((ProductLineItem.adjustedGrossPrice.value).toFixed(2)) : parseFloat((ProductLineItem.adjustedNetPrice.value).toFixed(2));
                    prodObject.quantity = ProductLineItem.quantityValue;

                    productItemsArray.push(prodObject);
                }
            }
        }
        res.json({
            cartObj: productItemsArray
        });
        next();
    }
);

module.exports = server.exports();
