'use strict';

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
                        return monogram;
                    }
                    if (vasEntries.length === 1) {
                        monogram = vasEntries.find((item) => item.productCode === 'MONOPATCH');
                        if (!monogram) monogram = vasEntries.find((item) => item.productCode === 'MONOTAG');
                        monogram.location = monogram.productCode;
                    }
                    return monogram;
                } catch (e) {
                    e.stack;
                }
                return null;
            })()
        });
    } else if (object.isPremiumMonogrammedPLI) {

        Object.defineProperty(object, 'premiumMonogramData', {
            enumerable: true,
            value: (function () {
                try {
                    var premiumItem = JSON.parse(lineItem.custom.monogramDataOnPLI);
                    return (premiumItem && premiumItem.length) ? premiumItem[0] : null;
                } catch (e) {
                    require('dw/system/Logger').getLogger('premium-monogram').error('Error msg: {0} \n stack: {1}', e.message, e.stack);
                }
            })()
        });

        Object.defineProperty(object, 'premiumMonogramType', {
            enumerable: true,
            value: (function () {
                try {
                    var premiumItem = JSON.parse(lineItem.custom.monogramDataOnPLI);
                    var isPatch = premiumItem.find((item) => !!item.monogramtag && item.productType === 'PREMIUMMONOPATCH');
                    var isTag = premiumItem.find((item) => !!item.monogramtag && item.productType === 'PREMIUMMONOTAG');
                    if (isPatch && isTag) return 'both';
                    if (isPatch) return 'patch';
                    if (isTag) return 'tag';
                } catch (e) {
                    require('dw/system/Logger').getLogger('premium-monogram').error('Error msg: {0} \n stack: {1}', e.message, e.stack);
                }
                return '';
            })()
        });

        Object.defineProperty(object, 'associatedLetterUUID', {
            enumerable: true,
            value: ('associatedLetters' in lineItem.custom && !!lineItem.custom.associatedLetters) ? lineItem.custom.associatedLetters : ''
        });

        Object.defineProperty(object, 'associatedLetter', {
            enumerable: true,
            value: (function () {
                return lineItem.custom.associatedLetters.split(',').map((uuid) => {
                    var pli = findPLIFromUUID(lineItemCntr, uuid);
                    return (pli && pli.product && 'premiumMonogramLetter' in pli.product.custom) ? pli.product.custom.premiumMonogramLetter : null;
                });
            }())
        });

        Object.defineProperty(object, 'monogramCost', {
            enumerable: true,
            value: (function () {
                var cost = new (require('dw/value/Money'))(0, session.currency.currencyCode);
                lineItem.custom.associatedLetters.split(',').forEach((uuid) => {
                    var pli = findPLIFromUUID(lineItemCntr, uuid);
                    if (pli) cost = cost.add(pli.netPrice);
                });
                return cost;
            }())
        });

        Object.defineProperty(object, 'associatedStyle', {
            enumerable: true,
            value: (function () {
                try {
                    var premiumItem = JSON.parse(lineItem.custom.monogramDataOnPLI);
                    var currentItem =  premiumItem.find((item) => ('color' in item && !!item.color));
                    if (currentItem) return currentItem.color;
                } catch (e) {
                    require('dw/system/Logger').getLogger('premiumMonogram').error('Error msg: {0} \n stack: {1}', e.message, e.stack);
                }
                return '';
            })()
        });

    } else if (object.isPremiumMonogramLetter) {
        Object.defineProperty(object, 'associatedProductLineItemUUID', {
            enumerable: true,
            value: ('associatedProductLineItemUUID' in lineItem.custom && !!lineItem.custom.associatedLetters) ? lineItem.custom.associatedLetters : ''
        });
    }

};