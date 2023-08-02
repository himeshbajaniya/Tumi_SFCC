'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var StoreMgr = require('dw/catalog/StoreMgr');

/**
 * validates that the product line items exist, are online, and have available inventory.
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {Object} an error object
 */
function validateProducts(basket) {
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var result = {
        error: false,
        hasInventory: true
    };
    var productLineItems = basket.productLineItems;
    if (productLineItems.length == 0) {
        result.error = true;
        return result; 
    }
    var webProductLineItemTotalQuantityMap = cartHelper.getWebProductLineItemTotalQuantityMap(productLineItems);
    var storesProductLineItemTotalQuantityMappingArray = cartHelper.getStoresProductLineItemTotalQuantityMappingArray(productLineItems);
    collections.forEach(productLineItems, function (item) {
        if (item.product === null || !item.product.online) {
            result.error = true;
            return result;
        }

        if (Object.hasOwnProperty.call(item.shipment.custom, 'fromStoreId')
                && item.shipment.custom.fromStoreId) {
                var store = StoreMgr.getStore(item.shipment.custom.fromStoreId);
                var storeInventoryListId;
                if (store.inventoryListID ||
                    (('inventoryListId' in store.custom) && store.custom.inventoryListId)) {
                    storeInventoryListId = store.inventoryListID || store.custom.inventoryListId;
                }
                var storeInventory = ProductInventoryMgr.getInventoryList(storeInventoryListId);
                var storeProductLineTotalQuantityMap = storesProductLineItemTotalQuantityMappingArray[item.shipment.custom.fromStoreId];
                var productLineItemTotalQunatityForSelectedStore = storeProductLineTotalQuantityMap.get(item.productID);

                result.hasInventory = result.hasInventory
                    && (storeInventory.getRecord(item.productID)
                    && storeInventory.getRecord(item.productID).ATS.value >= productLineItemTotalQunatityForSelectedStore);
        } else {
            var productLineItemTotalQuantity = webProductLineItemTotalQuantityMap.get(item.productID);
            if (productLineItemTotalQuantity) {
                var availabilityLevels = item.product.availabilityModel.getAvailabilityLevels(productLineItemTotalQuantity);
                result.hasInventory = result.hasInventory && (availabilityLevels.notAvailable.value === 0);
            }
        }
    });

    return result;
}

/**
 * Validates coupons
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {Object} an error object
 */
function validateCoupons(basket) {
    var invalidCouponLineItem = collections.find(basket.couponLineItems, function (couponLineItem) {
        return !couponLineItem.valid;
    });

    return {
        error: !!invalidCouponLineItem
    };
}

module.exports = {
    validateProducts: validateProducts,
    validateCoupons: validateCoupons,
    validateShipments: COHelpers.ensureValidShipments
};
