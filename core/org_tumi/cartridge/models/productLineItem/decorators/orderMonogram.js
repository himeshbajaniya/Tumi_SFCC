'use strict';

var log = require('dw/system/Logger').getLogger('orderMonogram');

function findPLIFromUUID(lineItemCntr, uuid) {
    var productLineItems = (lineItemCntr || require('dw/order/BasketMgr').currentOrNewBasket).productLineItems;
    return require('*/cartridge/scripts/util/collections').find(productLineItems, (productLineItem) => productLineItem.UUID === uuid);
}

module.exports = function (object, lineItem, lineItemCntr) {

    Object.defineProperty(object, 'isMonogramInLineItem', {
        enumerable: true,
        value: 'monogramDataOnPLI' in lineItem.custom && !!lineItem.custom.monogramDataOnPLI
    });

    Object.defineProperty(object, 'isPremiumMonogrammedPLI', {
        enumerable: true,
        value: 'isPremiumMonogram' in lineItem.custom && !!lineItem.custom.isPremiumMonogram
    });


    Object.defineProperty(object, 'isPremiumMonogramLetter', {
        enumerable: true,
        value: 'isPremiumMonogramLetter' in lineItem.custom && !!lineItem.custom.isPremiumMonogramLetter
    });

    if (object.isMonogramInLineItem && !object.isPremiumMonogrammedPLI && !object.isPremiumMonogramLetter) {
        Object.defineProperty(object, 'monogramLineItem', {
            enumerable: true,
            writable: true,
            value: (function () {
                try {
                    var vasMonogramAttributes = lineItem.custom.monogramDataOnPLI;
                    var vasEntries = JSON.parse(vasMonogramAttributes);
                    var monogram;
                    if (vasEntries.length === 2) {
                        var monogram = vasEntries[0];
                        monogram.location = 'BOTH';
                        monogram.character = monogram.vasField1 || '';
                        monogram.color = monogram.vasField2;
                        return monogram;
                    }
                    if (vasEntries.length === 1) {
                        monogram = vasEntries.find((item) => item.productCode === 'MONOPATCH');
                        if (!monogram) monogram = vasEntries.find((item) => item.productCode === 'MONOTAG');
                        monogram.location = monogram.productCode;
                        monogram.character = monogram.vasField1 || '';
                        monogram.color = monogram.vasField2;
                    }
                    return monogram;
                } catch (e) {
                    log.error('Message: {0} \n stack: {1}', e.message, e.stack);
                }
                return null;
            })()
        });
    } else if (object.isPremiumMonogrammedPLI) {

        Object.defineProperty(object, 'associatedLetter', {
            enumerable: true,
            value: (function () {
                try {
                    var vasMonogramAttributes = lineItem.custom.monogramDataOnPLI;
                    var vasEntries = JSON.parse(vasMonogramAttributes);
                    var characters = '';
                    vasEntries.forEach((item) => {
                        if (item && 'productName' in item) characters += item.productName;
                    });
                    return characters;
                } catch (e) {
                    log.error('Message: {0} \n stack: {1}', e.message, e.stack);
                }
                return '';
            }())
        });

        Object.defineProperty(object, 'monogramCost', {
            enumerable: true,
            value: (function () {
                var cost = new(require('dw/value/Money'))(0, session.currency.currencyCode);
                try {
                    var vasMonogramAttributes = lineItem.custom.monogramDataOnPLI;
                    var vasEntries = JSON.parse(vasMonogramAttributes);
                    if (vasEntries && vasEntries.length > 1) {
                        vasEntries.forEach((item, index) => {
                            if ('totalPrice' in item && item.totalPrice) cost = cost.add(new(require('dw/value/Money'))(item.totalPrice, session.currency.currencyCode));
                        });
                    }
                } catch (e) {
                    log.error('Message: {0} \n stack: {1}', e.message, e.stack);
                }
                return require('dw/util/StringUtils').formatMoney(cost);
            }())
        });

    }

};