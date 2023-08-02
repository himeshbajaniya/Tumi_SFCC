'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
var ImageModel = require('*/cartridge/models/product/productImages');
var StoreMgr = require('dw/catalog/StoreMgr');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var BasketMgr = require('dw/order/BasketMgr');
var HashMap = require('dw/util/HashMap');
var log = require('dw/system/Logger').getLogger('accent');
var Resource = require('dw/web/Resource');

/**
 * Determines whether a product attribute has image swatches.  Currently, the only attribute that
 *     does is Color.
 * @param {string} dwAttributeId - Id of the attribute to check
 * @returns {boolean} flag that specifies if the current attribute should be displayed as a swatch
 */
function isSwatchable(dwAttributeId) {
    var imageableAttrs = ['styleVariant', 'color'];
    return imageableAttrs.indexOf(dwAttributeId) > -1;
}

/**
 * 
 * @param {string} pid product id
 * @returns {number} product quantity
 */
function getStoreProductQtyInCart(pid) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var productLineItems = currentBasket.productLineItems;
    var productQtyInCart = 0;
    collections.forEach(productLineItems, function (productLineItem) {
        if (productLineItem.shipment.custom.shipmentType === 'instore' && productLineItem.product.ID === pid) {
            productQtyInCart++;
        }
    });
    return productQtyInCart;
}

/**
 * 
 * @param {Object} colorVal color attribute value
 * @param {Object} sizeVal size attribute value
 * @param {dw.catalog.ProductVariationModel} variationModel product variation model
 * @returns 
 */
function getProductByAttributes(colorVal, sizeVal, variationModel) {
    var product = collections.find(variationModel.variants, function (variant) {
        var isMatched = variant.custom.styleVariant === (colorVal != null ? colorVal.value : '') && variant.custom.size === (sizeVal != null ? sizeVal.value : '');
        return isMatched;
    });
    return product;
}

/**
 * 
 * @param {dw.catalog.ProductVariationModel} variationModel product variation model
 * @param {Object} attribute product attribute
 * @param {Object} value attribute value
 * @returns 
 */
function getProductByVariationAttribute(variationModel, attribute, value) {
    var allAttributes = variationModel.productVariationAttributes;
    if (allAttributes.length > 1 && (variationModel.getAllValues(allAttributes[0]).length > 1 || variationModel.getAllValues(allAttributes[1]).length > 1)) {
        var product;
        if (attribute.ID === 'color') {
            var sizeAttribute = allAttributes[0].ID === 'color' ? allAttributes[1] : allAttributes[0];
            var sizeSelectedValue = variationModel.getSelectedValue(sizeAttribute);
            product = getProductByAttributes(value, sizeSelectedValue, variationModel);
            return product ? product.ID : null;
        }
        var colorAttribute = allAttributes[0].ID === 'color' ? allAttributes[0] : allAttributes[1];
        var colorSelectedValue = variationModel.getSelectedValue(colorAttribute);
        product = getProductByAttributes(colorSelectedValue, value, variationModel);
        return product ? product.ID : null;
    } else if (allAttributes.length === 1 && variationModel.getAllValues(allAttributes[0]).length > 1) {
        product = collections.find(variationModel.variants, function (variant) {
            if (attribute.ID === 'color') {
                return variant.custom.styleVariant === value.value;
            } else if (attribute.ID === 'size') {
                return variant.custom.size === value.value;
            }
        });
        return product ? product.ID : null;
    }
    return 0;
}

/**
 * 
 * @param {string} storeId store id
 * @param {string} productId product id
 * @returns 
 */
function checkAvailabilityInStore(storeId, productId) {
    var store = StoreMgr.getStore(storeId);
    var inventoryListId;
    if (store.inventoryListID ||
        (('inventoryListId' in store.custom) && store.custom.inventoryListId)) {
        inventoryListId = store.inventoryListID || store.custom.inventoryListId;
    }
    if (store && inventoryListId) {
        var storeinventory = ProductInventoryMgr.getInventoryList(inventoryListId);
        if (storeinventory) {
            var storeProductQtyInCart = getStoreProductQtyInCart(productId);
            if (storeinventory.getRecord(productId) &&
                storeinventory.getRecord(productId).ATS.value >=
                storeProductQtyInCart) {
                return true;
            }
        }
    }
    return false;
}

function instoreAvailability(variationModel, attribute, value, storeId) {
    var productId = getProductByVariationAttribute(variationModel, attribute, value);
    if (productId) {
        return checkAvailabilityInStore(storeId, productId);
    }
    return false;
}
function swatchColorName(variationModel, selectedValue, attribute, value) {
    var productId = getProductByVariationAttribute(variationModel, attribute, value);
    var ProductMgr = require('dw/catalog/ProductMgr');
    var apiProduct = ProductMgr.getProduct(productId);
    var colorSwatchName;
    if (apiProduct && apiProduct.custom && 'hardwareColor' in apiProduct.custom && !empty(apiProduct.custom.hardwareColor) && (apiProduct.custom.hardwareColor.length > 0)) {
        colorSwatchName = apiProduct.custom.color + ' ' + Resource.msg('product.hardware.with', 'product', null) + ' ' + apiProduct.custom.hardwareColor + ' ' + Resource.msg('product.color.with.hardware', 'product', null);
        return colorSwatchName;
    } else {
        return value.displayValue;
    }
}
function accentCheck(variationModel) {
    var varientAll = variationModel.getVariants();
    var accentableProduct;
    var visible = true;
    for (let index = 0; index < varientAll.length; index++) {
        if (varientAll[index].custom.accentable == true) {
            accentableProduct = varientAll[index];
        }
    }

    if (accentableProduct) {
        var abc = accentableProduct.custom.accentingSkus.split(',');
        for (var i = 0; i < abc.length; i++) {
            for (var j = 0; j < varientAll.length; j++) {
                if (abc[i] == varientAll[j].ID) {
                    visible = false;
                }
            }
        }
    }
    return false;
}

function getAccentMap(variationModel, selectedValue) {
    var accentMap = new HashMap();
    var productVariatonAttribute = "color";
    var pvacolor = variationModel.getProductVariationAttribute(productVariatonAttribute);
    var variants = variationModel.getVariants().iterator();

    while (variants.hasNext()) {
        var variant = variants.next();
        if (!pvacolor) continue;
        var productVariationAttributeColor = variationModel.getVariationValue(variant, pvacolor); //black,anthracite
        // var accentable = variant.custom.accentable == true ? true : false;
        // var isAccentingSku = variant.custom.isAccentingSku == true ? true : false;
        // var accentingskus = variant.custom.accentingSkus ? variant.custom.accentingSkus : false;
        var accentObject = new Object();
        if ('accentable' in variant.custom) {
            accentObject.accentable = variant.custom.accentable;
        }
        if ('isAccentingSku' in variant.custom) {
            accentObject.isAccentingSku = variant.custom.isAccentingSku;
        }
        if ('accentingSkus' in variant.custom) {
            accentObject.accentingskus = variant.custom.accentingSkus;
        }
        if (variant.custom.isAccentingSku) {
            // if ('coloraccentImg' in variant.custom) {
            //     accentObject.coloraccentImg = variant.custom.coloraccentImg;
            // }
            if ('baseaccentingSKU' in variant.custom) {
                accentObject.baseaccentingSKU = variant.custom.baseaccentingSKU;
            }
            if ('baseaccentingSKUColor' in variant.custom) {
                accentObject.baseaccentingSKUColor = variant.custom.baseaccentingSKUColor;
            }
            //accentObject.mainProductImage = 'https://s7d2.scene7.com/is/image/Tumi/' + productVariationAttributeColor.ID + '_main?wid=400&amp;hei=400';

        }

        if (productVariationAttributeColor) {
            accentObject.mainProductImage = require('dw/system/Site').current.getCustomPreferenceValue('scene7ImageHost') + productVariationAttributeColor.ID + '_main?wid=400&amp;hei=400';
            accentMap.put(productVariationAttributeColor.ID, accentObject);
        }
    }
    return accentMap;
}

function getAcccentable(value, accentmap) {
    var accentMapDataforColor = accentmap.get(value);
    if (accentMapDataforColor) {
        if ('accentable' in accentMapDataforColor) {
            return accentMapDataforColor.accentable;
        }
        return null;
    }
}

function getIsaccentable(value, accentmap) {
    var accentMapDataforColor = accentmap.get(value);
    if (accentMapDataforColor) {
        if ('isAccentingSku' in accentMapDataforColor) {
            return accentMapDataforColor.isAccentingSku;
        }
        return null;
    }
}
function getIsaccentableSKUs(value, accentmap) {
    var accentMapDataforColor = accentmap.get(value);
    if (accentMapDataforColor) {
        if ('accentingskus' in accentMapDataforColor) {
            return accentMapDataforColor.accentingskus;
        }
        return null;
    }
}
function getColorAccentImg(value, accentmap) {
    var accentMapDataforColor = accentmap.get(value);
    if (accentMapDataforColor) {
        if ('coloraccentImg' in accentMapDataforColor) {
            return accentMapDataforColor.coloraccentImg;
        }
        if (accentMapDataforColor.isAccentingSku && accentMapDataforColor.baseaccentingSKU) return require('dw/system/Site').current.getCustomPreferenceValue('scene7Host') + value + '_alt5';
        if (accentMapDataforColor.accentable) return require('dw/system/Site').current.getCustomPreferenceValue('noaccentimg') || 'https://cdn.media.amplience.net/i/tumi/accenting-null';
    }
    return null;
}
function getAccentPrice(value, accentmap) {
    var accentMapDataforColor = accentmap.get(value);
    if (!accentMapDataforColor) {
        log.debug('accentMapDataforColor is null');
        return null;
    }
    if ('accentPriceContainer' in accentMapDataforColor) return accentMapDataforColor.accentPriceContainer;
    if (!accentMapDataforColor.isAccentingSku || !accentMapDataforColor.baseaccentingSKU) return null;
    var ProductMgr = require('dw/catalog/ProductMgr');
    var baseProduct = ProductMgr.getProduct(accentMapDataforColor.baseaccentingSKU);
    if (!baseProduct || !baseProduct.masterProduct || !baseProduct.masterProduct.variationModel || !baseProduct.priceModel || !baseProduct.priceModel.price.available) {
        log.debug('baseProduct is not valid');
        return null;
    }
    var variationModel = baseProduct.masterProduct.variationModel;
    var hashMap = new HashMap();
    hashMap.put('color', value);
    var variants = variationModel.getVariants(hashMap);
    if (variants.length && variants.iterator().hasNext()) {
        var variant = variants.iterator().next();
        if (!variant.priceModel || !variant.priceModel.price) {
            log.debug('accent variant is not valid');
            return null;
        }
        return require('dw/util/StringUtils').formatMoney(variant.priceModel.price.subtract(baseProduct.priceModel.price));
    }
    return null;
}
function getAccentImage(value, accentmap) {
    var accentMapDataforColor = accentmap.get(value);
    if (accentMapDataforColor) {
        if ('mainProductImage' in accentMapDataforColor) {
            return accentMapDataforColor.mainProductImage;
        }
        return null;
    }
}
function getBaseaccentingSKU(value, accentmap) {
    var accentMapDataforColor = accentmap.get(value);
    if (accentMapDataforColor) {
        if ('baseaccentingSKU' in accentMapDataforColor) {
            return accentMapDataforColor.baseaccentingSKU;
        }
        return null;
    }
}

function getBaseaccentingSKUColor(value, accentmap) {
    var baseaccentingSKUColor = accentmap.get(value);
    if (baseaccentingSKUColor) {
        if ('baseaccentingSKUColor' in baseaccentingSKUColor) {
            return baseaccentingSKUColor.baseaccentingSKUColor;
        }
        return null;
    }
}

/**
 * Retrieve all attribute values
 *
 * @param {dw.catalog.ProductVariationModel} variationModel - A product's variation model
 * @param {dw.catalog.ProductVariationAttributeValue} selectedValue - Selected attribute value
 * @param {dw.catalog.ProductVariationAttribute} attr - Attribute value'
 * @param {string} endPoint - The end point to use in the Product Controller
 * @param {string} selectedOptionsQueryParams - Selected options query params
 * @param {string} quantity - Quantity selected
 * @returns {Object[]} - List of attribute value objects for template context
 */
function getAllAttrValues(
    variationModel,
    selectedValue,
    attr,
    config,
    selectedOptionsQueryParams,
    quantity,
    accentmap
) {
    var attrValues = variationModel.getAllValues(attr);
    var visible = true;
    var varientAll = variationModel.getVariants();
    var actionEndpoint = 'Product-' + config.endPoint;

    return collections.map(attrValues, function (value) {
        var isSelected = (selectedValue && selectedValue.equals(value)) || false;
        var valueUrl = '';
        var storeId = config.storeId;
        var selectable = config.storeId ? instoreAvailability(variationModel, attr, value, config.storeId) : variationModel.hasOrderableVariants(attr, value)
        var processedAttr = {
            id: value.ID,
            description: value.description,
            displayValue: value.displayValue,
            value: value.value,
            selected: isSelected,
            selectable: selectable
            //visible: accentCheck(variationModel)
        };
        var displayColorName = swatchColorName(variationModel, selectedValue, attr, value);
        if (displayColorName != null) {
            processedAttr.displayValue = '';
            processedAttr.displayValue = displayColorName;
        }
        var accentable = getAcccentable(value.ID, accentmap);
        var isAccentable = getIsaccentable(value.ID, accentmap);
        var accentingSKUs = getIsaccentableSKUs(value.ID, accentmap);
        var coloraccentImg = getColorAccentImg(value.ID, accentmap);
        var accentPriceContainer = getAccentPrice(value.ID, accentmap);
        var accentImageContainer = getAccentImage(value.ID, accentmap);
        var baseAccentingSku = getBaseaccentingSKU(value.ID, accentmap);
        var baseAccentingSkuColor = getBaseaccentingSKUColor(value.ID, accentmap);
        if (baseAccentingSkuColor) processedAttr.accentingBaseSkuColor = baseAccentingSkuColor;
        if (accentable != null) {
            processedAttr.accentable = accentable;
        }
        if (isAccentable != null) {
            processedAttr.isAccentable = isAccentable;
        }
        if (accentingSKUs != null) {
            processedAttr.accentingSKUs = accentingSKUs;
        }

        if (coloraccentImg != null) {
            processedAttr.coloraccentImg = coloraccentImg;
        }
        if (accentPriceContainer != null) {
            processedAttr.accentPriceContainer = accentPriceContainer;
        }
        if (accentImageContainer != null) {
            processedAttr.accentImageContainer = accentImageContainer;
        }
        if (baseAccentingSku != null) {
            processedAttr.baseAccentingSku = baseAccentingSku;
        }
        if (processedAttr.selectable) {
            valueUrl = (!accentable && isSelected && config.endPoint !== 'Show') ?
                variationModel.urlUnselectVariationValue(actionEndpoint, attr) :
                variationModel.urlSelectVariationValue(actionEndpoint, attr, value);
            processedAttr.url = urlHelper.appendQueryParams(valueUrl, [selectedOptionsQueryParams,
                'quantity=' + quantity
            ]);
        }

        if (isSwatchable(attr.attributeID)) {
            processedAttr.images = new ImageModel(value, {
                types: ['swatch'],
                quantity: 'all'
            });
        }

        return processedAttr;
    });
}

/**
 * Gets the Url needed to relax the given attribute selection, this will not return
 * anything for attributes represented as swatches.
 *
 * @param {Array} values - Attribute values
 * @param {string} attrID - id of the attribute
 * @returns {string} -the Url that will remove the selected attribute.
 */
function getAttrResetUrl(values, attrID) {
    var urlReturned;
    var value;

    for (var i = 0; i < values.length; i++) {
        value = values[i];
        if (!value.images) {
            if (value.selected) {
                urlReturned = value.url;
                break;
            }

            if (value.selectable) {
                urlReturned = value.url.replace(attrID + '=' + value.value, attrID + '=');
                break;
            }
        }
    }

    return urlReturned;
}

/**
 * @constructor
 * @classdesc Get a list of available attributes that matches provided config
 *
 * @param {dw.catalog.ProductVariationModel} variationModel - current product variation
 * @param {Object} attrConfig - attributes to select
 * @param {Array} attrConfig.attributes - an array of strings,representing the
 *                                        id's of product attributes.
 * @param {string} attrConfig.attributes - If this is a string and equal to '*' it signifies
 *                                         that all attributes should be returned.
 *                                         If the string is 'selected', then this is comming
 *                                         from something like a product line item, in that
 *                                         all the attributes have been selected.
 *
 * @param {string} attrConfig.endPoint - the endpoint to use when generating urls for
 *                                       product attributes
 * @param {string} selectedOptionsQueryParams - Selected options query params
 * @param {string} quantity - Quantity selected
 */
function VariationAttributesModel(variationModel, attrConfig, selectedOptionsQueryParams, quantity) {
    var allAttributes = variationModel.productVariationAttributes;
    var result = [];
    collections.forEach(allAttributes, function (attr) {
        var selectedValue = variationModel.getSelectedValue(attr);
        var defaultVarient = variationModel.getDefaultVariant();
        var accentmap = getAccentMap(variationModel, selectedValue);
        var values = getAllAttrValues(variationModel, selectedValue, attr, attrConfig,
            selectedOptionsQueryParams, quantity, accentmap);
        var resetUrl = getAttrResetUrl(values, attr.ID);
        if ((Array.isArray(attrConfig.attributes) &&
                attrConfig.attributes.indexOf(attr.attributeID) > -1) ||
            attrConfig.attributes === '*') {
            result.push({
                attributeId: attr.attributeID,
                displayName: attr.displayName,
                id: attr.ID,
                swatchable: isSwatchable(attr.attributeID),
                displayValue: selectedValue && selectedValue.displayValue ? selectedValue.displayValue : '',
                values: values,
                resetUrl: resetUrl
            });
        } else if (attrConfig.attributes === 'selected') {
            result.push({
                displayName: attr.displayName,
                displayValue: selectedValue && selectedValue.displayValue ? selectedValue.displayValue : '',
                attributeId: attr.attributeID,
                id: attr.ID
            });
        }
    });
    result.forEach(function (item) {
        this.push(item);
    }, this);
}

VariationAttributesModel.prototype = [];

module.exports = VariationAttributesModel;