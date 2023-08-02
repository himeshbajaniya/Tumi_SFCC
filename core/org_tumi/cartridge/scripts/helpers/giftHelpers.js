'use strict';
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var CartModel = require('*/cartridge/models/cart');
var collections = require('*/cartridge/scripts/util/collections');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

/**
 * reset the Gifting message
 * @param  basket - Current users's basket
 * @param  requestPLIUUID - Current product in basket
 */

function resetGiftMsgandbox(requestPLIUUID, basket) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var requestPLI = collections.find(BasketMgr.getCurrentBasket().allProductLineItems, function (item) {
        return item.UUID === requestPLIUUID;
    });
    if (requestPLI.custom.giftBoxUUID) {
        var giftBoxPLI = null;
        var giftBoxUUID = requestPLI.custom.giftBoxUUID;
        var giftBoxProductLineItem = collections.find(BasketMgr.getCurrentBasket().allProductLineItems, function (item) {
            return item.UUID === giftBoxUUID;
        });
        if (giftBoxProductLineItem) {
            Transaction.wrap(function () {
                currentBasket.removeProductLineItem(giftBoxProductLineItem);
                requestPLI.custom.giftBoxUUID = null;
            });
        }
    }
}

/**
 * reset the Gifting message
 * @param  result - Data from gift form
 * @param  requestPLIUUID - Current product in basket
 */
function setGiftMsg(result, requestPLI) {
    Transaction.wrap(function () {
        requestPLI.setGiftMessage(result.giftMessage);
        requestPLI.custom.recipientName = result.receiverName;
        requestPLI.custom.senderName = result.senderName;
        // requestPLI.custom.complimentaryGiftBox = result.complimentaryBox;
        // requestPLI.custom.premiumGiftBox = result.premiumBox;
        // requestPLI.custom.noGiftBox = result.skipBox;
    });
}
/**
 * reset the Gifting message
 * @param  result - Data from gift form
 * @param  requestPLIUUID - Current product in basket
 * @param  quantity - quantity of the product that should added
 */

function addGiftBox(requestPLI) {
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    var UUIDUtils = require('dw/util/UUIDUtils');
    var childProducts = [];
    var options = [];
    return Transaction.wrap(function () {
        // var giftBoxProduct = cartHelper.addProductToCart(
        //     basket,
        //     giftBoxSKUId,
        //     quantity,
        //     childProducts,
        //     options,
        //     requestPLI.custom.fromStoreId
        // );
        // if (!giftBoxProduct || giftBoxProduct.error) return false;
        // var giftBoxProductLineItem = collections.find(BasketMgr.getCurrentBasket().allProductLineItems, function (item) {
        //     return item.UUID === giftBoxProduct.uuid;
        // });
        // if (!giftBoxProductLineItem) return false;
        //resetGiftMsgandbox(requestPLI.UUID, basket);
        requestPLI.custom.giftBoxEnableLineitem = true;
        // requestPLI.custom.giftBoxUUID = giftBoxProduct.uuid;
        // var UUIDNew = UUIDUtils.createUUID();
        // giftBoxProductLineItem.custom.parentProductLineItemID = UUIDNew;
        // requestPLI.custom.giftBoxUUIDNew = UUIDNew;
        // if (requestPLI.custom.premiumGiftBox) {
        //     requestPLI.custom.premiumGiftBoxPrice = formatMoney(giftBoxProductLineItem.adjustedPrice);
        // }
        // return true;
    });
}
module.exports = {
    resetGiftMsgandbox: resetGiftMsgandbox,
    addGiftBox: addGiftBox,
    setGiftMsg: setGiftMsg
};