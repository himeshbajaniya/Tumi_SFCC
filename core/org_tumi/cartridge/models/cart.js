'use strict';
var base = module.superModule;

function CartModel(basket) {
    base.call(this, basket);
    if (basket) this.isRegisterCustomer = basket.customer && basket.customer.authenticated;
    if(this.items && basket && basket.bonusLineItems.length > 0) {
        var collections = require('*/cartridge/scripts/util/collections');
        this.items.map(function (item) {
            var bonusItem = collections.find(basket.bonusLineItems, function (bItem) {
                return bItem.UUID == item.UUID
            });

            item.isGWP = bonusItem != null
        });
    }
}

module.exports = CartModel;
