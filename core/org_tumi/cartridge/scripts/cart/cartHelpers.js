'use strict';

var base = module.superModule;

var StoreMgr = require('dw/catalog/StoreMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var UUIDUtils = require('dw/util/UUIDUtils');
var Resource = require('dw/web/Resource');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var arrayHelper = require('*/cartridge/scripts/util/array');
var collections = require('*/cartridge/scripts/util/collections');
var instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var Site = require('dw/system/Site');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var tumiHelpers = require('*/cartridge/scripts/helpers/tumiHelpers');
/**
 * Determines whether a product's current instore pickup store setting are
 * the same as the previous selected
 *
 * @param {string} existingStoreId - store id currently associated with this product
 * @param {string} selectedStoreId - store id just selected
 * @return {boolean} - Whether a product's current store setting is the same as
 * the previous selected
 */
function hasSameStore(existingStoreId, selectedStoreId) {
    return existingStoreId === selectedStoreId;
}

/**
 * Get the existing in store pickup shipment in cart by storeId
 * @param {dw.order.Basket} basket - the target Basket object
 * @param {string} storeId - store id
 * @return {dw.order.Shipment} returns Shipment object if the existing shipment has the same storeId
 */
function getInStorePickupShipmentInCartByStoreId(basket, storeId) {
    var existingShipment = null;
    if (basket && storeId) {
        var shipments = basket.getShipments();
        if (shipments.length) {
            existingShipment = arrayHelper.find(shipments, function (shipment) {
                return hasSameStore(shipment.custom.fromStoreId, storeId);
            });
        }
    }
    return existingShipment;
}

/**
 * create a new instore pick shipment if the store shipment
 * is not exist in the basket for adding product line item
 * @param {dw.order.Basket} basket - the target Basket object
 * @param {string} storeId - store id
 * @param {Object} req - The local instance of the request object
 * @return {dw.order.Shipment} returns Shipment object
 */
function createInStorePickupShipmentForLineItem(basket, storeId, req) {
    var shipment = null;
    if (basket && storeId) {
        // check if the instore pickup shipment is already exist.
        shipment = getInStorePickupShipmentInCartByStoreId(basket, storeId);
        if (!shipment) {
            // create a new shipment to put this product line item in
            shipment = basket.createShipment(UUIDUtils.createUUID());
            shipment.custom.fromStoreId = storeId;
            shipment.custom.shipmentType = 'instore';
            req.session.privacyCache.set(shipment.UUID, 'valid');

            // Find in-store method in shipping methods.
            var shippingMethods =
                ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods();
            var shippingMethod = collections.find(shippingMethods, function (method) {
                return method.custom.storePickupEnabled;
            });
            var store = StoreMgr.getStore(storeId);
            var storeName = tumiHelpers.removeSpecialCharacterFromStoreName(store.name);
            var storeAddress = {
                address: {
                    firstName: storeName,
                    lastName: '',
                    address1: store.address1,
                    address2: store.address2,
                    city: store.city,
                    stateCode: store.stateCode,
                    postalCode: store.postalCode,
                    countryCode: store.countryCode.value,
                    phone: store.phone
                },
                shippingMethod: shippingMethod.ID
            };
            COHelpers.copyShippingAddressToShipment(storeAddress, shipment);
        }
    }
    return shipment;
}

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @param {string} [storeId] - store id
 * @param {Object} req - The local instance of the request object
 * @param {Object} [monogramData] - Monogram Data
 * @param {Object} [originalPLI] - PLI
 * @return {Object} returns an error object
 */
function addProductToCart(currentBasket, productId, quantity, childProducts, options, storeId, req, monogramData, originalPLI) {
    var availableToSell;
    var defaultShipment = currentBasket.defaultShipment;
    var perpetual;
    var product = ProductMgr.getProduct(productId);
    var productInCart;
    var productLineItems = currentBasket.productLineItems;
    var productQuantityInCart;
    var quantityToSet;
    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };
    var Transaction = require('dw/system/Transaction');

    var lineItemQuantity = isNaN(quantity) ? base.DEFAULT_LINE_ITEM_QUANTITY : quantity;
    var totalQtyRequested = 0;
    var canBeAdded = false;

    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, lineItemQuantity);
    } else {
        if (storeId) {
            var storeInventoryListId;
            var storeInventory
            var store = StoreMgr.getStore(storeId);
            if (store.inventoryListID || (('inventoryListId' in store.custom) && store.custom.inventoryListId)) {
                storeInventoryListId = store.inventoryListID || store.custom.inventoryListId;
                storeInventory = ProductInventoryMgr.getInventoryList(storeInventoryListId);
            }

            var storesProductLineItemTotalQuantityMappingArray = getStoresProductLineItemTotalQuantityMappingArray(productLineItems);
            if (storeInventory && storesProductLineItemTotalQuantityMappingArray.length) {
                var storeProductLineTotalQuantityMap = storesProductLineItemTotalQuantityMappingArray[storeId];
                if (storeProductLineTotalQuantityMap) {
                    var productLineItemTotalQunatityForSelectedStore = storeProductLineTotalQuantityMap.get(productId);
                    if (productLineItemTotalQunatityForSelectedStore) {
                        totalQtyRequested = lineItemQuantity + productLineItemTotalQunatityForSelectedStore;
                        if (storeInventory.getRecord(productId) && storeInventory.getRecord(productId).ATS.value >= totalQtyRequested) {
                            canBeAdded = true;
                        }
                    }
                } else {
                    if (storeInventory.getRecord(productId) && storeInventory.getRecord(productId).ATS.value >= lineItemQuantity) {
                        canBeAdded = true;
                    }
                }
            } else if (storesProductLineItemTotalQuantityMappingArray.length < 1) {
                if (storeInventory.getRecord(productId) && storeInventory.getRecord(productId).ATS.value >= lineItemQuantity) {
                    canBeAdded = true;
                }
            }
        } else {
            var webProductLineItemTotalQuantityMap = getWebProductLineItemTotalQuantityMap(productLineItems);
            if (webProductLineItemTotalQuantityMap) {
                var productLineItemTotalQuantity = webProductLineItemTotalQuantityMap.get(productId);
                if (productLineItemTotalQuantity) {
                    totalQtyRequested = lineItemQuantity + productLineItemTotalQuantity;
                } else {
                    totalQtyRequested = lineItemQuantity;
                }                
                perpetual = product.availabilityModel.inventoryRecord.perpetual;
                canBeAdded = (perpetual || totalQtyRequested <= product.availabilityModel.inventoryRecord.ATS.value);
            }
        }
    }

    if (!canBeAdded) {
        result.error = true;
        result.message = Resource.msg(
            'product.add.to.cart.limited.inventory',
            'product',
            null
        );
        return result;
    }
    var productLineItem;
    // Create a new instore pickup shipment as default shipment for product line item
    var inStoreShipment = createInStorePickupShipmentForLineItem(currentBasket, storeId, req);
    var ShipToMeShipment = getShipToMeShipment(currentBasket);
    
    if (!storeId && !ShipToMeShipment) {
        // create new shipment for Ship to home if one does not exist. 
        ShipToMeShipment = currentBasket.createShipment(UUIDUtils.createUUID()); 
        var shippingAddress = ShipToMeShipment.shippingAddress;
        if (!shippingAddress) {
            shippingAddress = ShipToMeShipment.createShippingAddress();
        }
    }
    var shipment = inStoreShipment || ShipToMeShipment;
    
    if (shipment.shippingMethod && shipment.shippingMethod.custom.storePickupEnabled && !storeId) {
        shipment = currentBasket.createShipment(UUIDUtils.createUUID());
    }

    productLineItem = originalPLI || base.addLineItem(
        currentBasket,
        product,
        lineItemQuantity,
        childProducts,
        optionModel,
        shipment
    );

    var letterProductLineItems = [];

    if (monogramData && (monogramData.metalMonogramPatchEnabled || monogramData.metalMonogramTagEnabled)) {
        for (var count = 0; count < monogramData.metalMonogramID.length; count++) {
            var letterProduct = ProductMgr.getProduct(monogramData.metalMonogramID[count]);
            var letterquantity = monogramData.letterQuantity[count];
            var letterOptionModel = productHelper.getCurrentOptionModel(letterProduct.optionModel, options);

            letterProductLineItems.push(base.addLineItem(
                currentBasket,
                letterProduct,
                letterquantity,
                childProducts,
                letterOptionModel,
                shipment
            ));
            // eslint-disable-next-line no-loop-func
            Transaction.wrap(function () {
                // eslint-disable-next-line block-scoped-var
                letterProductLineItems[count].custom.isPremiumMonogramLetter = true;
                // eslint-disable-next-line block-scoped-var
                letterProductLineItems[count].custom.associatedProductLineItemID = productLineItem.UUID;
            });
        }
    }

    // Once the new product line item is added, set the instore pickup fromStoreId for the item
    if (storeId) {
        instorePickupStoreHelper.setStoreInProductLineItem(storeId, productLineItem);
    }

    var associatedLettersUUID = '';

    if (monogramData && (monogramData.metalMonogramPatchEnabled || monogramData.metalMonogramTagEnabled)) {
        // eslint-disable-next-line no-plusplus
        for (var count = 0; count < letterProductLineItems.length; count++) {
            if (count === 0) {
                associatedLettersUUID += letterProductLineItems[count].UUID;
            } else {
                associatedLettersUUID = associatedLettersUUID + ',' + letterProductLineItems[count].UUID;
            }
        }
    }

    Transaction.wrap(function () {
        // eslint-disable-next-line no-undef
        if (!empty(monogramData)) {
            productLineItem.custom.monogramDataOnPLI = monogramData.vasData;
            if (monogramData.metalMonogramPatchEnabled || monogramData.metalMonogramTagEnabled) {
                productLineItem.custom.associatedLetters = associatedLettersUUID;
                productLineItem.custom.isPremiumMonogram = true;
            }
        }
    });

    basketCalculationHelpers.calculateTotals(currentBasket);

    var bonusProductLineItem = productLineItem.getRelatedBonusProductLineItems();
    if(bonusProductLineItem && bonusProductLineItem.length > 0) {
        collections.forEach(bonusProductLineItem, function (item) {
            var bProductLineItem = collections.find(currentBasket.getAllProductLineItems(), function (val) {
                return val.UUID == item.UUID
            });
            if(bProductLineItem != null) {
                Transaction.wrap(function () {
                    bProductLineItem.setShipment(shipment);
                    bProductLineItem.custom.fromStoreId = null;
                    bProductLineItem.setProductInventoryList(null);
                });
            }
        });
    }

    result.uuid = productLineItem.UUID;
    Transaction.wrap(function () {
        COHelpers.ensureNoEmptyShipments(req);
    });

    return result;
}

function getProductLineItemByUUID(currentBasket, pliUUID) {
    var collections = require('*/cartridge/scripts/util/collections');
    var productLineItem = null;
    if (currentBasket && pliUUID) {
        collections.forEach(currentBasket.getAllProductLineItems(), function (pli) {
            if (pli.UUID === pliUUID) {
                productLineItem = pli;
                return;
            }
        });
    }

    return productLineItem;
}   


function getShipToMeShipment(basket) {
    var shipments = basket.getShipments();
    var shipToMeShipment = collections.find(shipments, function (shipment) {
        return (shipment.custom.shipmentType === null) && (shipment.custom.fromStoreId === null) ;
    });
    return shipToMeShipment;
}

function updateAddressStoreMethodOfShipment(shipment, shippingMethod, storeId) {
    shipment.custom.fromStoreId = storeId;
    shipment.custom.shipmentType = storeId ? 'instore': null;
    shipment.setShippingMethod(shippingMethod);
    var shippingAddress = shipment.getShippingAddress();
    if(!shippingAddress) {
        shippingAddress = shipment.createShippingAddress();
    }
    if(storeId) {
        var store = StoreMgr.getStore(storeId);
        shippingAddress.setFirstName(store.name);
        shippingAddress.setLastName('');
        shippingAddress.setAddress1(store.address1);
        shippingAddress.setAddress2(store.address2);
        shippingAddress.setCity(store.city);
        shippingAddress.setPostalCode(store.postalCode);
        shippingAddress.setStateCode(store.stateCode);
        shippingAddress.setCountryCode(store.countryCode.value);
        shippingAddress.setPhone(store.phone);
    } else {
        shippingAddress.setFirstName('');
        shippingAddress.setLastName('');
        shippingAddress.setAddress1('');
        shippingAddress.setAddress2('');
        shippingAddress.setCity('');
        shippingAddress.setPostalCode('');
        shippingAddress.setStateCode('');
        shippingAddress.setCountryCode('');
        shippingAddress.setPhone('');
    }
}

function buildPersonalizationData(personalizationData) {
    if (!empty(personalizationData)) {
        var monogramResponse = JSON.parse(personalizationData);
        var monogramPatchEnabled = ('monogramPatch' in monogramResponse) && (monogramResponse.monogramPatch != null);
        var monogramTagEnabled = ('monogramTag' in monogramResponse) && (monogramResponse.monogramTag != null);

        var metalMonogramPatchEnabled = ('metalMonogramPatch' in monogramResponse) && (monogramResponse.metalMonogramPatch != null);
        var metalMonogramTagEnabled = ('metalMonogramTag' in monogramResponse) && (monogramResponse.metalMonogramTag != null);

        var monogramFontStyle;
        var monogramFontColor;
        var monogramText = '';
        var vasData = '';
        var metalMonogramID = [];
        var letterQuantity = [];

        vasData += '[';

        if (monogramPatchEnabled) {
            monogramFontStyle = monogramResponse.monogramPatch.fontStyle;
            monogramFontColor = monogramResponse.monogramPatch.fontColor;
            monogramText = monogramResponse.monogramPatch.monogramText;

            vasData += '{';
            vasData += '"productCode": "MONOPATCH",';
            vasData += '"productType": "MONOPATCH",';
            vasData += '"quantity": 1,';
            vasData += '"character":"' + monogramText + '",';
            vasData += '"color":"' + monogramFontColor + '",';
            vasData += '"font":"' + monogramFontStyle + '"';

            if (monogramTagEnabled) {
                vasData += '},';
            }
        }
        if (monogramTagEnabled) {
            monogramFontStyle = monogramResponse.monogramTag.fontStyle;
            monogramFontColor = monogramResponse.monogramTag.fontColor;
            monogramText = monogramResponse.monogramTag.monogramText;

            vasData += '{';
            vasData += '"productCode": "MONOTAG",';
            vasData += '"productType": "MONOTAG",';
            vasData += '"quantity": 1,';
            vasData += '"character":"' + monogramText + '",';
            vasData += '"color":"' + monogramFontColor + '",';
            vasData += '"font":"' + monogramFontStyle + '"';
        }

        var tagProductCodeonOrder = '';
        var tagSizeOnOrder = '';
        var tagColorOnOrder = '';
        var patchProductCodeonOrder = '';
        var patchSizeOnOrder = '';
        var patchColorOnOrder = '';

        if (metalMonogramPatchEnabled || metalMonogramTagEnabled) {
            var Site = require('dw/system/Site');

            var monogrammedProduct = ProductMgr.getProduct(monogramResponse.monogrammerProductID);
            var premMonogramPatchJSON = JSON.parse(Site.getCurrent().getCustomPreferenceValue('premiumMonogramPatchLookupTable'));
            var premMonogramTagJSON = JSON.parse(Site.getCurrent().getCustomPreferenceValue('premiumMonogramTagLookupTable'));

            var letterCount = 0;

            if (metalMonogramPatchEnabled) {
                for each (var monogramPatchSize in premMonogramPatchJSON) {
                    if (monogramPatchSize.Size === monogrammedProduct.custom.premiumPatchSize) {
                        patchProductCodeonOrder = monogramPatchSize.productCodeonOrder
                        patchSizeOnOrder = monogramPatchSize.SizeOnOrder
                        patchColorOnOrder = monogramPatchSize.ColorOnOrder
                        break;
                    }
                }
            }

            if (metalMonogramTagEnabled) {
                for each (var monogramTagSize in premMonogramTagJSON) {
                    if (monogramTagSize.Size === monogrammedProduct.custom.premiumTagSize) {
                        tagProductCodeonOrder = monogramTagSize.productCodeonOrder
                        tagSizeOnOrder = monogramTagSize.SizeOnOrder
                        tagColorOnOrder = monogramTagSize.ColorOnOrder
                        break;
                    }
                }
            }
        }
        
        if (metalMonogramPatchEnabled) {
            monogramFontColor = monogramResponse.metalMonogramPatch.fontColor;
            var monogramJSON = monogramResponse.metalMonogramPatch.monogramText;
            for (var count = 0; count < monogramJSON.length; count++) {
                monogramText += monogramJSON[count].letter;
                letterQuantity.push(monogramJSON[count].qty)
                metalMonogramID.push(monogramJSON[count].ID);
            }

            vasData += '{';
            vasData += '"productCode":"' + patchProductCodeonOrder + '",';
            vasData += '"productType": "PREMIUMMONOPATCH",';
            vasData += '"quantity": 1,';
            vasData += '"character":"' + monogramText + '",';
            vasData += '"color":"' + monogramFontColor + '",';
            vasData += '"monogramtag": "Metal Monogram Patch",';
            vasData += '"size":"' + patchSizeOnOrder + '",';
            vasData += '"patchColor":"' + patchColorOnOrder + '"';
            vasData += '},';

            for (var count = 0; count < monogramJSON.length; count++) {
                var tempProduct = ProductMgr.getProduct(metalMonogramID[count]);
                vasData += '{';
                vasData += '"productType": "PREMIUMMONOPATCH",';
                vasData += '"productCode":"' + metalMonogramID[count] + '",';
                vasData += '"quantity":"' + letterQuantity[count] + '",';
                vasData += '"productName":"' + monogramJSON[count].letter + '"';
                if ((count < (monogramJSON.length - 1)) || metalMonogramTagEnabled) {
                    vasData += '},';
                }
            }
        }
        if (metalMonogramTagEnabled) {
            monogramFontColor = monogramResponse.metalMonogramTag.fontColor;
            var monogramJSON = monogramResponse.metalMonogramTag.monogramText;
            for (var count = 0; count < monogramJSON.length; count++) {
                if (metalMonogramTagEnabled && metalMonogramPatchEnabled) {
                    if (monogramText.indexOf(monogramJSON[count].letter) === -1) monogramText += monogramJSON[count].letter;
                } else {
                    monogramText += monogramJSON[count].letter
                }
                letterQuantity.push(monogramJSON[count].qty);
                metalMonogramID.push(monogramJSON[count].ID);
            }

            vasData += '{';
            vasData += '"productCode":"' + tagProductCodeonOrder + '",';
            vasData += '"productType": "PREMIUMMONOTAG",';
            vasData += '"quantity": 1,';
            vasData += '"character":"' + monogramText + '",';
            vasData += '"color":"' + monogramFontColor + '",';
            vasData += '"monogramtag": "Metal Monogram Tag",';
            vasData += '"size":"' + tagSizeOnOrder + '",';
            vasData += '"patchColor":"' + tagColorOnOrder + '"';
            vasData += '},';

            for (var count = 0; count < monogramJSON.length; count++) {
                var tempProduct = ProductMgr.getProduct(metalMonogramID[count]);
                vasData += '{';
                vasData += '"productType": "PREMIUMMONOTAG",';
                vasData += '"productCode":"' + metalMonogramID[count] + '",';
                vasData += '"quantity":"' + letterQuantity[count] + '",';
                vasData += '"productName":"' + monogramJSON[count].letter + '"';
                if (count < (monogramJSON.length - 1)) {
                    vasData += '},';
                }
            }
        }

        vasData += '}';
        vasData += ']';
        return {
            monogramPatchEnabled: monogramPatchEnabled,
            monogramTagEnabled: monogramTagEnabled,
            metalMonogramPatchEnabled: metalMonogramPatchEnabled,
            metalMonogramTagEnabled: metalMonogramTagEnabled,
            monogramFontStyle: monogramFontStyle,
            monogramFontColor: monogramFontColor,
            monogramText: monogramText,
            vasData: vasData,
            metalMonogramID: metalMonogramID,
            letterQuantity: letterQuantity
        };
    }
}

function removePremiumMonogramLetters(currentBasket, productLineItems, associatedLetters) {
    for (var count = 0; count < associatedLetters.length; count++) {
        for each (var pli in productLineItems) {
            if (associatedLetters[count]=== pli.UUID) {
                currentBasket.removeProductLineItem(pli);
                break;
            }
        }
    }
}

function isBasketHavingOnlyStorePickupitems(basket) {
    var shipments = basket.getShipments();
    var shipment;
    var isBasketHavingOnlyStorePickupitems = true;	

    for (var i=0; i <= shipments.length -1; i++) {
        shipment = shipments[i];
        if (shipment.custom.shipmentType === 'instore') {
            continue;
        } else {
            isBasketHavingOnlyStorePickupitems = false;
            break;
        }
    }
    return isBasketHavingOnlyStorePickupitems;
}
/**
 * Creates a Map for all productLienItems and total quantity as per Web inventory.
 * This is used to validate if all Ship to Home productLineItems in cart is having enough inventory for checkout.
 */
function getWebProductLineItemTotalQuantityMap(productLineItems) {
    var HashMap = require('dw/util/HashMap');
    var productQuantityMap = new HashMap();
    collections.forEach(productLineItems, function (productLineItem) {
        if (empty(productLineItem.shipment.custom.shipmentType)) {
            var productId = productLineItem.productID;
            if (productQuantityMap.get(productId) == null) {
                productQuantityMap.put(productId, productLineItem.quantityValue);
            } else {
                var productquantity = productQuantityMap.get(productId);
                productquantity += productLineItem.quantityValue;
                productQuantityMap.put(productId, productquantity);
            }
        }        
    });
    return productQuantityMap;
}
/**
 * Creates a array of Map for all productLienItems and total quantity as per store inventory. Since there can be multiple stores involved that's why it creates an array of Map..
 * This is used to validate if all Store pickup productLineItems in cart is having enough inventory in their respective stores..
 */
function getStoresProductLineItemTotalQuantityMappingArray(productLineItems) {
    var HashMap = require('dw/util/HashMap');
    var storesProductLineItemTotalQuantityMappingArray = [];

    collections.forEach(productLineItems, function (productLineItem) {
        if (productLineItem.shipment.custom.shipmentType === 'instore') {
            var storeId = productLineItem.shipment.custom.fromStoreId;
            if (storeId && storeId in storesProductLineItemTotalQuantityMappingArray) {
                var storeProductQtyMap = storesProductLineItemTotalQuantityMappingArray[storeId];
                if (storeProductQtyMap && storeProductQtyMap.get(productLineItem.productID) == null) {
                    storeProductQtyMap.put(productLineItem.productID, productLineItem.quantityValue);
                } else {
                    var productQuantity = storeProductQtyMap.get(productLineItem.productID);
                    var updatedquantity = productQuantity + productLineItem.quantityValue;
                    storeProductQtyMap.put(productLineItem.productID, updatedquantity);
                }
            } else if (storeId) {
                var storeProductLineItemQuantityMap = new HashMap();
                var productId = productLineItem.productID;
                storeProductLineItemQuantityMap.put(productId, productLineItem.quantityValue);
                storesProductLineItemTotalQuantityMappingArray[storeId] = storeProductLineItemQuantityMap;
            }
        }
    });
    return storesProductLineItemTotalQuantityMappingArray;
}

function getInstorePickUpInventory(productlineItems, latitude, longitude) {
    var storeHelper = require('*/cartridge/scripts/helpers/storeHelpers');
    var checkedProductLineItems = [];
    productlineItems.forEach(function (item) {
        var existingLineItem = checkedProductLineItems.filter(function (checkedItem) {
             return checkedItem.id == item.id 
        });

        if(existingLineItem.length > 0) {
            item.storeWithInventory = existingLineItem[0].storeWithInventory
        } else {
            item.storeWithInventory = true; // storeHelper.getStoresInventoryForProduct(latitude, longitude, item.id);
        }
        checkedProductLineItems.push(item);
    });
    return productlineItems;
}

function getLineItemInventory(uuid, variant) {
    var currentBasket = require('dw/order/BasketMgr').currentBasket;
    if (uuid && currentBasket && currentBasket.productLineItems && currentBasket.productLineItems.length) {
        var pli = require('*/cartridge/scripts/util/collections').find(currentBasket.productLineItems, (item) => item.UUID === uuid);
        if (pli && pli.custom.fromStoreId) {
            var store = require('dw/catalog/StoreMgr').getStore(pli.custom.fromStoreId);
            if (store) {
                var productInventoryRecord = store.inventoryList ? store.inventoryList.getRecord(variant.ID) : null;
                return !!productInventoryRecord && (productInventoryRecord.perpetual || productInventoryRecord.ATS.value);
            }
        }
    }
    return variant.availabilityModel ? variant.availabilityModel.orderable : false;
}

function updateStorePremiumMonogramItem(currentBasket, shipment, productLineItem, storeId) {
    if ('associatedLetters' in productLineItem.custom && productLineItem.custom.associatedLetters && productLineItem.custom.associatedLetters.split(',').length) {
        var isRemove = false;
        productLineItem.custom.associatedLetters.split(',').forEach((item) => {
            var pli = collections.find(currentBasket.productLineItems, (productLineItem) => productLineItem.UUID === item);
            var store = require('dw/catalog/StoreMgr').getStore(storeId);
            isRemove = !(!isRemove && pli && store && store.inventoryList && store.inventoryList.getRecord(pli.productID));
            if (!isRemove) {
                var record = store.inventoryList.getRecord(pli.productID);
                if (record.perpetual || record.ATS.value) {
                    pli.setShipment(shipment);
                    pli.setProductInventoryListID(store.inventoryListID);
                } else {
                    isRemove = true;
                }
            }
        });
        if (isRemove) {
            productLineItem.custom.associatedLetters.split(',').forEach((item) => {
                var pli = collections.find(currentBasket.productLineItems, (productLineItem) => productLineItem.UUID === item);
                if (pli) {
                    currentBasket.removeProductLineItem(pli);
                    delete productLineItem.custom.associatedLetters;
                    delete productLineItem.custom.isPremiumMonogram;
                    delete productLineItem.custom.monogramDataOnPLI;
                }
            });
        }
    }
}

function updateHomePremiumMonogramItem(currentBasket, shipment, productLineItem) {
    if ('associatedLetters' in productLineItem.custom && productLineItem.custom.associatedLetters && productLineItem.custom.associatedLetters.split(',').length) {
        var isRemove = false;
        productLineItem.custom.associatedLetters.split(',').forEach((item) => {
            var pli = collections.find(currentBasket.productLineItems, (productLineItem) => productLineItem.UUID === item);
            isRemove = !(!isRemove && pli && pli.product && pli.product.availabilityModel);
            if (!isRemove) {
                var orderable = pli.product.availabilityModel.orderable;
                if (orderable) {
                    pli.setShipment(shipment);
                    pli.setProductInventoryListID(null);
                }
                isRemove = !orderable;
            }
        });
        // Remove from basket
        if (isRemove) {
            productLineItem.custom.associatedLetters.split(',').forEach((item) => {
                var pli = collections.find(currentBasket.productLineItems, (productLineItem) => productLineItem.UUID === item);
                if (pli) {
                    delete productLineItem.custom.associatedLetters;
                    delete productLineItem.custom.isPremiumMonogram;
                    delete productLineItem.custom.monogramDataOnPLI;
                    currentBasket.removeProductLineItem(pli);
                }
            });
        }
    }
}

function UpdatePremiumMonogramLineItem(currentBasket, shipment, productLineItem, storeId) {
    return storeId ? updateStorePremiumMonogramItem(currentBasket, shipment, productLineItem, storeId) : updateHomePremiumMonogramItem(currentBasket, shipment, productLineItem, storeId);
}

function isPaypalShippingValid(shippingAddress, localeID) {
    return shippingAddress &&
        shippingAddress.address &&
        shippingAddress.address.country_code &&
        require('dw/util/Locale').getLocale(localeID).country === shippingAddress.address.country_code;
}


module.exports = {
    addProductToCart: addProductToCart,
    buildPersonalizationData: buildPersonalizationData,
    getProductLineItemByUUID: getProductLineItemByUUID,
    getShipToMeShipment: getShipToMeShipment,
    updateAddressStoreMethodOfShipment: updateAddressStoreMethodOfShipment,
    getInStorePickupShipmentInCartByStoreId: getInStorePickupShipmentInCartByStoreId,
    removePremiumMonogramLetters: removePremiumMonogramLetters,
    isBasketHavingOnlyStorePickupitems: isBasketHavingOnlyStorePickupitems,
    createInStorePickupShipmentForLineItem: createInStorePickupShipmentForLineItem,
    getWebProductLineItemTotalQuantityMap: getWebProductLineItemTotalQuantityMap,
    getStoresProductLineItemTotalQuantityMappingArray: getStoresProductLineItemTotalQuantityMappingArray,
    getInstorePickUpInventory: getInstorePickUpInventory,
    getLineItemInventory: getLineItemInventory,
    UpdatePremiumMonogramLineItem: UpdatePremiumMonogramLineItem,
    isPaypalShippingValid: isPaypalShippingValid
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
