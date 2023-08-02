'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;
module.exports = function (object, lineItem) {

    Object.defineProperty(object, 'complimentaryGiftBox', {
        enumerable: true,
        value: 'complimentaryGiftBox' in lineItem.custom && !!lineItem.custom.complimentaryGiftBox
    });
    
    Object.defineProperty(object, 'giftMessage', {
        enumerable: true,
        value: ('giftMessage' in lineItem && !!lineItem.giftMessage) ? lineItem.giftMessage : ''
    });
    
    Object.defineProperty(object, 'senderName', {
        enumerable: true,
        value: ('senderName' in lineItem.custom && !!lineItem.custom.senderName) ? lineItem.custom.senderName : ''
    });

    Object.defineProperty(object, 'recipientName', {
        enumerable: true,
        value: ('recipientName' in lineItem.custom && !!lineItem.custom.recipientName) ? lineItem.custom.recipientName : ''
    });
    Object.defineProperty(object, 'premiumGiftBox', {
        enumerable: true,
        value: 'premiumGiftBox' in lineItem.custom && !!lineItem.custom.premiumGiftBox
    });

    Object.defineProperty(object, 'noGiftBox', {
        enumerable: true,
        value: 'noGiftBox' in lineItem.custom && !!lineItem.custom.noGiftBox
    });

    Object.defineProperty(object, 'giftBoxUUID', {
        enumerable: true,
        value: 'giftBoxUUID' in lineItem.custom && !!lineItem.custom.giftBoxUUID
    });
    Object.defineProperty(object, 'parentProductLineItemID', {
        enumerable: true,
        value: 'parentProductLineItemID' in lineItem.custom && !!lineItem.custom.parentProductLineItemID
    });
    Object.defineProperty(object, 'premiumGiftBoxPrice', {
        enumerable: true,
        value: ('premiumGiftBoxPrice' in lineItem.custom && !!lineItem.custom.premiumGiftBoxPrice) ? lineItem.custom.premiumGiftBoxPrice : ''
    });
    Object.defineProperty(object, 'giftBoxEnableLineitem', {
        enumerable: true,
        value: ('giftBoxEnableLineitem' in lineItem.custom && !!lineItem.custom.giftBoxEnableLineitem) ? lineItem.custom.giftBoxEnableLineitem : ''
    });
    Object.defineProperty(object, 'isGiftBoxEditable', {
        enumerable: true,
        value: (function () {
            try {
                // var skipGiftBox = 'noGiftBox' in lineItem.custom && !!lineItem.custom.noGiftBox;
                // var premiumGiftBox = 'premiumGiftBox' in lineItem.custom && !!lineItem.custom.premiumGiftBox;
                // var complimentaryGiftBox = 'complimentaryGiftBox' in lineItem.custom && !!lineItem.custom.complimentaryGiftBox;
                var giftBox = 'giftBoxEnableLineitem' in lineItem.custom && !!lineItem.custom.giftBoxEnableLineitem;
                var giftMessage = ('giftMessage' in lineItem && !!lineItem.giftMessage) ? true : false;

                return (giftBox || giftMessage);
            } catch (e) {
                e.stack;
            }
            return false;
        })()
    });
    Object.defineProperty(object, 'giftBoxlabel', {
        enumerable: true,
        value: (function () {
            var Resource = require('dw/web/Resource');
            try {
                var labelText = Resource.msg('label.gift.box', 'common', null);
                var skipGiftBox = 'noGiftBox' in lineItem.custom && !!lineItem.custom.noGiftBox;
                //var premiumGiftBox = 'premiumGiftBox' in lineItem.custom && !!lineItem.custom.premiumGiftBox;
                var complimentaryGiftBox = 'giftBoxEnableLineitem' in lineItem.custom && !!lineItem.custom.giftBoxEnableLineitem;
                // if (premiumGiftBox) {
                //     labelText = Resource.msg('label.premium.gift.box', 'common', null);
                // } else 
                if (complimentaryGiftBox) {
                    labelText = Resource.msg('label.complimentary.gift.box', 'common', null);
                }

                return labelText;
            } catch (e) {
                e.stack;
            }
            return false;
        })()
    });
    Object.defineProperty(object, 'giftBoxPrice', {
        enumerable: true,
        value: (function () {
            if ('giftboxPrice' in lineItem.custom && lineItem.custom.giftboxPrice) {
                return lineItem.custom.giftboxPrice;
            }
            var BasketMgr = require('dw/order/BasketMgr');
            var collections = require('*/cartridge/scripts/util/collections');
            var currentBasket = BasketMgr.getCurrentOrNewBasket();
            // var abc = session.custom.orderID;
            try {
                var premiumGiftBox = 'premiumGiftBox' in lineItem.custom && !!lineItem.custom.premiumGiftBox
                if (premiumGiftBox) {
                    var giftBoxUUID = lineItem.custom.giftBoxUUID;
                    var giftBoxProductLineItem = collections.find(BasketMgr.getCurrentOrNewBasket().allProductLineItems, function (item) {
                        return item.UUID === giftBoxUUID;
                    });
                    return !giftBoxProductLineItem.adjustedPrice ? '-' : formatMoney(giftBoxProductLineItem.adjustedPrice);
                }
                return null;
            } catch (e) {
                e.stack;
            }
            return null;
        })()
    });

};