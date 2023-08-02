'use strict';

const WAREHOUSE_INVENTORY_ID = (require('dw/system/Site').current.getCustomPreferenceValue('warehouseStoreId')) || '1500';

function removePremiumMonogram(uuid) {
    var basket = require('dw/order/BasketMgr').currentBasket;
    if (!basket) return false;
    var collections = require('*/cartridge/scripts/util/collections');
    var productLineItem = collections.find(basket.productLineItems, (lineItem) => uuid);
    if (!productLineItem) return false;
    return require('dw/system/Transaction').wrap(() => {
        if ('associatedLetters' in productLineItem.custom && productLineItem.custom.associatedLetters) {
            require('*/cartridge/scripts/cart/cartHelpers').removePremiumMonogramLetters(basket, basket.productLineItems, productLineItem.custom.associatedLetters.split(','));
            require('*/cartridge/scripts/helpers/basketCalculationHelpers').calculateTotals(basket);
            delete productLineItem.custom.monogramDataOnPLI;
            delete productLineItem.custom.isPremiumMonogram;
            delete productLineItem.custom.isPremiumMonogramLetter;
            delete productLineItem.custom.associatedLetters;
            return true;
        }
    });
}

function isWareHouseInventoryExists(varientProduct) {
    var storeInventory = require('dw/catalog/ProductInventoryMgr').getInventoryList(WAREHOUSE_INVENTORY_ID);
    if (!storeInventory) return false;
    var storeInventoryRecords = storeInventory.getRecord(varientProduct);
    return (storeInventoryRecords && storeInventoryRecords.ATS) ? storeInventoryRecords.ATS.value > 0 : false;
}

function ensurePremiumMonogramCheck(items) {
    if (!items || !items.length) return [];
    var plis = [];
    items.forEach((item) => {
        if (item.isPremiumMonogrammedPLI && !isWareHouseInventoryExists(item.id) && removePremiumMonogram(item.UUID)) {
            plis.push(item.UUID);
        }
    });
    var CartModel = require('*/cartridge/models/cart');
    var updatedItems = new CartModel(require('dw/order/BasketMgr').currentBasket).items;
    updatedItems.forEach((updatedItem) => {
        if (plis.indexOf(updatedItem.UUID) !== -1) updatedItem.premiumErrorMsg = require('dw/web/Resource').msg('premium.warehouse.notavailable', 'monogram', null);
    });
    return updatedItems;
}

module.exports = {
    isWareHouseInventoryExists: isWareHouseInventoryExists,
    ensurePremiumMonogramCheck: ensurePremiumMonogramCheck,
    removePremiumMonogram: removePremiumMonogram
};