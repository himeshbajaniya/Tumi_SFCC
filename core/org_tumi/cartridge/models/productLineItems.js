'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var StoreMgr = require('dw/catalog/StoreMgr');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var decorators = require('*/cartridge/models/product/decorators/index');

function getAvailabilty(availabilityModel, quantity) {
    var availability = {};
    availability.messages = [];
    var productQuantity = quantity ? parseInt(quantity, 10) : 1;
    var availabilityModelLevels = availabilityModel.getAvailabilityLevels(productQuantity);
    var inventoryRecord = availabilityModel.inventoryRecord;

    if (inventoryRecord && inventoryRecord.inStockDate) {
        var inStockDate = new Date(inventoryRecord.inStockDate)
        var calender =  new Calendar(inStockDate)
        availability.inStockDate = StringUtils.formatCalendar(calender, "MM/dd");
    } else {
        availability.inStockDate = null;
    }

    availability.label = '';
    availability.expected = '';

    if (availabilityModelLevels.inStock.value > 0) {
        if (availabilityModelLevels.inStock.value === productQuantity) {
            availability.messages.push(Resource.msg('label.instock', 'common', null));
        } else {
            availability.messages.push(
                Resource.msgf(
                    'label.quantity.in.stock',
                    'common',
                    null,
                    availabilityModelLevels.inStock.value
                )
            );
        }
    }

    if (availabilityModelLevels.preorder.value > 0) {
        if (availabilityModelLevels.preorder.value === productQuantity) {
            availability.messages.push(Resource.msg('label.preorder', 'common', null));
        } else {
            availability.messages.push(
                Resource.msgf(
                    'label.product.preorder.msg',
                    'common',
                    null,
                    availability.inStockDate
                )
            );

        }
        availability.label = Resource.msg('label.product.preorder', 'common', null);
        availability.expected = Resource.msgf('label.product.preorder.msg', 'common', null, availability.inStockDate);
        availability.expectedMsg = Resource.msgf('label.product.msg.expected', 'common', null, availability.inStockDate);
    }

    if (availabilityModelLevels.backorder.value > 0) {
        if (availabilityModelLevels.backorder.value === productQuantity) {
            availability.messages.push(Resource.msg('label.back.order', 'common', null));
        } else {
            availability.messages.push(
                Resource.msgf(
                    'label.product.msg.expected',
                    'common',
                    null,
                    availability.inStockDate
                )
            );
        }
        availability.label = Resource.msg('label.product.backorder', 'common', null);
        availability.expected = Resource.msgf('label.product.msg.expected', 'common', null, availability.inStockDate);
        availability.expectedMsg = availability.expected;
    }

    if (availabilityModelLevels.notAvailable.value > 0) {
        if (availabilityModelLevels.notAvailable.value === productQuantity) {
            availability.messages.push(Resource.msg('label.not.available', 'common', null));
        } else {
            availability.messages.push(Resource.msg('label.not.available.items', 'common', null));
        }
    }

    return availability;
}


/**
 * Creates an array of product line items
 * @param {dw.util.Collection<dw.order.ProductLineItem>} allLineItems - All product
 * line items of the basket
 * @param {string} view - the view of the line item (basket or order)
 * @returns {Array} an array of product line items.
 */
function createProductLineItemsObject(allLineItems, view, lineItemContainer) {
    var lineItems = [];

    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var storesProductLineItemTotalQuantityMappingArray = cartHelper.getStoresProductLineItemTotalQuantityMappingArray(allLineItems);
    var webProductLineItemTotalQuantityMap = cartHelper.getWebProductLineItemTotalQuantityMap(allLineItems);
    collections.forEach(allLineItems, function (item) {
        // when item's category is unassigned, return a lineItem with limited attributes
        if (!item.product) {
            lineItems.push({
                id: item.productID,
                quantity: item.quantity.value,
                productName: item.productName,
                UUID: item.UUID,
                noProduct: true,
                images:
                {
                    small: [
                        {
                            url: URLUtils.staticURL('/images/noimagelarge.png'),
                            alt: Resource.msgf('msg.no.image', 'common', null),
                            title: Resource.msgf('msg.no.image', 'common', null)
                        }
                    ]

                }

            });
            return;
        }
        var options = collections.map(item.optionProductLineItems, function (optionItem) {
            return {
                optionId: optionItem.optionID,
                selectedValueId: optionItem.optionValueID
            };
        });

        var bonusProducts = null;

        if (!item.bonusProductLineItem
            && item.custom.bonusProductLineItemUUID
            && item.custom.preOrderUUID) {
            bonusProducts = [];
            collections.forEach(allLineItems, function (bonusItem) {
                if (!!item.custom.preOrderUUID && bonusItem.custom.bonusProductLineItemUUID === item.custom.preOrderUUID) {
                    var bpliOptions = collections.map(bonusItem.optionProductLineItems, function (boptionItem) {
                        return {
                            optionId: boptionItem.optionID,
                            selectedValueId: boptionItem.optionValueID
                        };
                    });
                    var params = {
                        pid: bonusItem.product.ID,
                        quantity: bonusItem.quantity.value,
                        variables: null,
                        pview: 'bonusProductLineItem',
                        containerView: view,
                        lineItem: bonusItem,
                        options: bpliOptions,
                        lineItemCntr: lineItemContainer
                    };

                    bonusProducts.push(ProductFactory.get(params));
                }
            });
        }

        var params = {
            pid: item.product.ID,
            quantity: item.quantity.value,
            variables: null,
            pview: 'productLineItem',
            containerView: view,
            lineItem: item,
            options: options,
            lineItemCntr: lineItemContainer
        };
        var newLineItem = ProductFactory.get(params);
        newLineItem.shipmentType = item.shipment.custom.shipmentType;
        newLineItem.availability = getAvailabilty(item.product.availabilityModel, item.quantity.value);
        decorators.badges(newLineItem, item.product);
        if (newLineItem.shipmentType === 'instore' || !empty(item.shipment.custom.fromStoreId)) {
            var store = StoreMgr.getStore(item.shipment.custom.fromStoreId);
            if (store) {
                newLineItem.storeName = store.name;
                newLineItem.storeId = store.ID;
                var storeInventoryListId;
                var storeId = newLineItem.storeId;
                if (store.inventoryListID ||
                    (('inventoryListId' in store.custom) && store.custom.inventoryListId)) {
                        storeInventoryListId = store.inventoryListID || store.custom.inventoryListId;
                }
                var storeInventory = ProductInventoryMgr.getInventoryList(storeInventoryListId);
                var storeProductLineTotalQuantityMap = storesProductLineItemTotalQuantityMappingArray[storeId];
                if (storeInventory && storeProductLineTotalQuantityMap) {                    
                    var productLineItemTotalQunatityForSelectedStore = storeProductLineTotalQuantityMap.get(params.pid);
                    var hasInventory = storeInventory.getRecord(newLineItem.id) && storeInventory.getRecord(newLineItem.id).ATS.value >= productLineItemTotalQunatityForSelectedStore;
                    newLineItem.availableForSelectedStore = hasInventory;
                }
            }
        } else if (empty(newLineItem.shipmentType) && webProductLineItemTotalQuantityMap) {
            var productLineItemTotalQuantity = webProductLineItemTotalQuantityMap.get(newLineItem.id);
            if (productLineItemTotalQuantity > 0) {
                var availabilityLevels = item.product.availabilityModel.getAvailabilityLevels(productLineItemTotalQuantity);
                var hasInventory = (availabilityLevels.notAvailable.value === 0);
                newLineItem.availableForShipToHome = hasInventory;
            } else {
                newLineItem.availableForShipToHome = false;
            }
        }
        newLineItem.bonusProducts = bonusProducts;
        if (newLineItem.bonusProductLineItemUUID === 'bonus' || !newLineItem.bonusProductLineItemUUID) {
            lineItems.push(newLineItem);
        }
    });
    return lineItems;
}

/**
 * Loops through all of the product line items and adds the quantities together.
 * @param {dw.util.Collection<dw.order.ProductLineItem>} items - All product
 * line items of the basket
 * @returns {number} a number representing all product line items in the lineItem container.
 */
function getTotalQuantity(items) {
    // TODO add giftCertificateLineItems quantity
    var totalQuantity = 0;
    collections.forEach(items, function (lineItem) {
        if (!lineItem.custom.isPremiumMonogramLetter) {
            totalQuantity += lineItem.quantity.value;
        }
    });

    return totalQuantity;
}

/**
 * @constructor
 * @classdesc class that represents a collection of line items and total quantity of
 * items in current basket or per shipment
 *
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - the product line items
 *                                                       of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function ProductLineItems(productLineItems, view, lineItemContainer) {
    if (productLineItems) {
        this.items = createProductLineItemsObject(productLineItems, view, lineItemContainer);
        this.totalQuantity = getTotalQuantity(productLineItems);
        try {
            if(this.items.length > 0 && this.items[0].storeId != null) {
                var storeMgr = require('dw/catalog/StoreMgr');
                var storeObj = storeMgr.getStore(this.items[0].storeId);
                if (storeObj) {
                    var StoreModel = require('*/cartridge/models/store');
                    var store = new StoreModel(storeObj, 50);
                    store.tomorrowOpenAt = null;
                    if (store.storeHours) {
                        var storeTime = store.storeHours.split(',');
                        var today = new Date();
                        var tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                        var date = tomorrow.toString().substring(0, 3);
                        for (var i = 0; i < storeTime.length; i++) {
                            if (storeTime[i].substring(0, 3) == date) {
                                var time = storeTime[i].split('-')[0].split(':')[0];
                                var splitTime = time.split(' ');
                                if(splitTime.length > 0) {
                                    if (splitTime[1] - 12 >= 0) {
                                        splitTime[1] += ' PM';
                                    } else {
                                        splitTime[1] += ' AM';
                                    }
                                    store.tomorrowOpenAt =  splitTime[1];
                                }
                            }
                        }
                    }
                    this.items[0].store = store;
                }
            }
        } catch (e) {}
    } else {
        this.items = [];
        this.totalQuantity = 0;
    }
}

ProductLineItems.getTotalQuantity = getTotalQuantity;

module.exports = ProductLineItems;
