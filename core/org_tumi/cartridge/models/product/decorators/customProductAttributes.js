'use strict';
var dataHelpers = require('*/cartridge/scripts/helpers/dataHelpers');

/**
 *
 * @param {Object} product product object
 * @returns {string/null} returns product type string or null
 */
function productType(product) {
    if (product.isMaster()) {
        return 'master';
    } else if (product.isVariant()) {
        return 'variant';
    } else if(!product.isMaster() && !product.isVariant()) {
        return 'standard';
    } else {
        return null;
    }
}

module.exports = function (object, apiProduct, options) {
    var varientProduct = apiProduct;
    if(apiProduct.master) {
        if(apiProduct.ID == 'GCARD') {
            varientProduct = apiProduct.variants[0];
        }
        else{
            varientProduct = apiProduct.variationModel.getDefaultVariant();
        }
    }
    
    var variationId = apiProduct.variationModel.getProductVariationAttribute('color');
    Object.defineProperty(object, 'productType', {
        enumerable: true,
        value: productType(apiProduct)
    });

    Object.defineProperty(object, 'division', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'division') && apiProduct.custom.division && productType(apiProduct) === 'variant' ? apiProduct.custom.division : null
    });

    Object.defineProperty(object, 'collection', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'collection') && apiProduct.custom.collection ? apiProduct.custom.collection : null
    });

    Object.defineProperty(object, 'materialDescription', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'materialDescription') && apiProduct.custom.materialDescription && productType(apiProduct) === 'variant' ? apiProduct.custom.materialDescription : null
    });

    Object.defineProperty(object, 'warranty', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'warranty') && varientProduct.custom.warranty && productType(varientProduct) === 'variant' ? varientProduct.custom.warranty : null
    });

    Object.defineProperty(object, 'relatedSKU', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'relatedSKU') && apiProduct.custom.relatedSKU && productType(apiProduct) === 'variant' ? apiProduct.custom.relatedSKU : null
    });

    Object.defineProperty(object, 'relatedMaterials', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'relatedMaterials') && apiProduct.custom.relatedMaterials && productType(apiProduct) === 'variant' ? apiProduct.custom.relatedMaterials : null
    });

    Object.defineProperty(object, 'volumeCapacity', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'volumeCapacity') && varientProduct.custom.volumeCapacity && productType(varientProduct) === 'variant' ? varientProduct.custom.volumeCapacity : null
    });

    Object.defineProperty(object, 'vertexTaxCode', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'vertexTaxCode') && apiProduct.custom.vertexTaxCode && productType(apiProduct) === 'variant' ? apiProduct.custom.vertexTaxCode : null
    });

    Object.defineProperty(object, 'volumeCap', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'volumeCap') && apiProduct.custom.volumeCap && productType(apiProduct) === 'variant' ? apiProduct.custom.volumeCap : null
    });

    Object.defineProperty(object, 'numberOfWheels', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'numberOfWheels') && apiProduct.custom.numberOfWheels && productType(apiProduct) === 'variant' ? apiProduct.custom.numberOfWheels : null
    });

    Object.defineProperty(object, 'department', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'department') && apiProduct.custom.department && productType(apiProduct) === 'variant' ? apiProduct.custom.department : null
    });

    Object.defineProperty(object, 'content', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'content') && apiProduct.custom.content && productType(apiProduct) === 'variant' ? apiProduct.custom.content : null
    });

    Object.defineProperty(object, 'categories', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'categories') && apiProduct.custom.categories && productType(apiProduct) === 'variant' ? apiProduct.custom.categories : null
    });

    Object.defineProperty(object, 'basicMaterial', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'basicMaterial') && apiProduct.custom.basicMaterial && productType(apiProduct) === 'variant' ? apiProduct.custom.basicMaterial : null
    });

    Object.defineProperty(object, 'expandable', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'expandable') && (varientProduct.custom.expandable != null) ? varientProduct.custom.expandable : false
    });

    Object.defineProperty(object, 'liningMaterial', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'liningMaterial') && apiProduct.custom.liningMaterial && productType(apiProduct) === 'variant' ? apiProduct.custom.liningMaterial : null
    });

    Object.defineProperty(object, 'lifeCycle', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'lifeCycle') && apiProduct.custom.lifeCycle && productType(apiProduct) === 'variant' ? apiProduct.custom.lifeCycle : null
    });

    Object.defineProperty(object, 'seasonCategory', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'seasonCategory') && apiProduct.custom.seasonCategory && productType(apiProduct) === 'variant' ? apiProduct.custom.seasonCategory : null
    });

    Object.defineProperty(object, 'seasonYear', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'seasonYear') && apiProduct.custom.seasonYear && productType(apiProduct) === 'variant' ? apiProduct.custom.seasonYear : null
    });

    Object.defineProperty(object, 'gender', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'gender') && apiProduct.custom.gender && productType(apiProduct) === 'variant' ? apiProduct.custom.gender : null
    });

    Object.defineProperty(object, 'MSRP', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'MSRP') && apiProduct.custom.MSRP && productType(apiProduct) === 'variant' ? apiProduct.custom.MSRP : null
    });

    Object.defineProperty(object, 'ID', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'ID') && apiProduct.custom.ID && productType(apiProduct) === 'variant' ? apiProduct.custom.ID : null
    });

    Object.defineProperty(object, 'materialGroup', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'materialGroup') && apiProduct.custom.materialGroup && productType(apiProduct) === 'variant' ? apiProduct.custom.materialGroup : null
    });

    Object.defineProperty(object, 'giftbox', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'giftbox') && (varientProduct.custom.giftbox != null) ? varientProduct.custom.giftbox : false
    });

    Object.defineProperty(object, 'accentable', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'accentable') && (varientProduct.custom.accentable != null) ? varientProduct.custom.accentable : false
    });


    Object.defineProperty(object, 'baseaccentingSKU', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'baseaccentingSKU') && (apiProduct.custom.baseaccentingSKU != null) ? apiProduct.custom.baseaccentingSKU : null
    });

    Object.defineProperty(object, 'isAccentingSku', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'isAccentingSku') && (apiProduct.custom.isAccentingSku != null) ? apiProduct.custom.isAccentingSku : false
    });

    Object.defineProperty(object, 'accentingskus', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'accentingSkus') && (apiProduct.custom.accentingSkus != null) ? apiProduct.custom.accentingSkus : false
    });

    Object.defineProperty(object, 'baseaccentingSKUColor', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'baseaccentingSKUColor') && (apiProduct.custom.baseaccentingSKUColor != null) ? apiProduct.custom.baseaccentingSKUColor : null
    });

    Object.defineProperty(object, 'accentPriceContainer', {
        enumerable: true,
        value: (function (accentObj) {
            if (!('baseaccentingSKU' in accentObj) || !accentObj.baseaccentingSKU || !('isAccentingSku' in accentObj) || !accentObj.isAccentingSku) return null;
            var ProductMgr = require('dw/catalog/ProductMgr');
            var baseSKUPrice = ProductMgr.getProduct(accentObj.baseaccentingSKU);
            if (!baseSKUPrice) return null;
            return apiProduct.priceModel.price.subtract(baseSKUPrice.priceModel.price).value;
        }(object))
    });

    if (object.accentPriceContainer) {
        Object.defineProperty(object, 'accentPriceContainerMoneyFormat', {
            enumerable: true,
            value: (function () {
                var accentPriceContainerMoney =  new (require('dw/value/Money'))(object.accentPriceContainer, session.currency);
                return require('dw/util/StringUtils').formatMoney(accentPriceContainerMoney);
            })()
        });
    }

   Object.defineProperty(object, 'coloraccentImg', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'coloraccentImg') && (apiProduct.custom.coloraccentImg != null) ? apiProduct.custom.coloraccentImg : null

    });

    Object.defineProperty(object, 'baseAccentingSku', {
       enumerable: true,
       value: Object.hasOwnProperty.call(apiProduct.custom, 'baseAccentingSku') && (apiProduct.custom.baseAccentingSku != null) ? apiProduct.custom.baseAccentingSku : null
   });

    Object.defineProperty(object, 'hasAccentingProducts', {
        enumerable: true,
        value: (function (obj) {
            if (obj.isAccentingSku) return true;
            if (obj.accentable && obj.accentingskus && obj.accentingskus.split('|').length) {
                return !!obj.accentingskus.split('|').find((accentingSku) => {
                    var masterProduct = apiProduct.variant ? apiProduct.masterProduct : apiProduct;
                    var variationModel = masterProduct.variationModel;
                    var productVariationAttribute = variationModel.getProductVariationAttribute('color');
                    variationModel.setSelectedAttributeValue('color', accentingSku);
                    var productVariationAttributeValue = variationModel.getSelectedValue(productVariationAttribute);
                    if (productVariationAttributeValue == null || productVariationAttribute == null) {
                        return false;
                    }
                    return variationModel.hasOrderableVariants(productVariationAttribute, productVariationAttributeValue);
                });
            }
            return false;
        }(object))
    });

    Object.defineProperty(object, 'securityFriendly', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'securityFriendly') && apiProduct.custom.securityFriendly && productType(apiProduct) === 'variant' ? apiProduct.custom.securityFriendly : null
    });

    Object.defineProperty(object, 'madeIn', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'madeIn') && apiProduct.custom.madeIn && productType(apiProduct) === 'variant' ? apiProduct.custom.madeIn : null
    });

    Object.defineProperty(object, 'avalaraTaxCode', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'avalaraTaxCode') && apiProduct.custom.avalaraTaxCode && productType(apiProduct) === 'variant' ? apiProduct.custom.avalaraTaxCode : null
    });

    Object.defineProperty(object, 'premiumMono', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'premiumMono') && (varientProduct.custom.premiumMono != null) ? varientProduct.custom.premiumMono : false
    });

    Object.defineProperty(object, 'premiumPatch', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'premiumPatch') && (apiProduct.custom.premiumPatch != null) ? apiProduct.custom.premiumPatch : false
    });

    Object.defineProperty(object, 'patchSize', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'patchSize') && apiProduct.custom.patchSize && productType(apiProduct) === 'variant' ? apiProduct.custom.patchSize : null
    });

    Object.defineProperty(object, 'premiumLuggageTag', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'premiumLuggageTag') && apiProduct.custom.premiumLuggageTag && productType(apiProduct) === 'variant' ? apiProduct.custom.premiumLuggageTag : null
    });

    Object.defineProperty(object, 'backorderFlag', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'backorderFlag') && apiProduct.custom.backorderFlag && productType(apiProduct) === 'variant' ? apiProduct.custom.backorderFlag : null
    });

    Object.defineProperty(object, 'badge', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'badge') && apiProduct.custom.badge && productType(apiProduct) === 'variant' ? apiProduct.custom.badge : null
    });

    Object.defineProperty(object, 'contentGroup', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'contentGroup') && apiProduct.custom.contentGroup && productType(apiProduct) === 'variant' ? apiProduct.custom.contentGroup : null
    });

    Object.defineProperty(object, 'handTag', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'handTag') && apiProduct.custom.handTag && productType(apiProduct) === 'variant' ? apiProduct.custom.handTag : null
    });

    Object.defineProperty(object, 'levelThreeType', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'levelThreeType') && apiProduct.custom.levelThreeType && productType(apiProduct) === 'variant' ? apiProduct.custom.levelThreeType : null
    });

    Object.defineProperty(object, 'addABagType', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'addABagType') && apiProduct.custom.addABagType && productType(apiProduct) === 'variant' ? apiProduct.custom.addABagType : null
    });

    Object.defineProperty(object, 'suitorSection', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'suitorSection') && apiProduct.custom.suitorSection && productType(apiProduct) === 'variant' ? apiProduct.custom.suitorSection : null
    });

    Object.defineProperty(object, 'liningMaterialContent', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'liningMaterialContent') && apiProduct.custom.liningMaterialContent && productType(apiProduct) === 'variant' ? apiProduct.custom.liningMaterialContent : null
    });

    Object.defineProperty(object, 'pouchMaterialContent', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'pouchMaterialContent') && apiProduct.custom.pouchMaterialContent && productType(apiProduct) === 'variant' ? apiProduct.custom.pouchMaterialContent : null
    });

    Object.defineProperty(object, 'exteriorFeatures', {
        enumerable: true,
        value: (function () {
            try {
                if (Object.hasOwnProperty.call(varientProduct.custom, 'exteriorFeatures') && varientProduct.custom.exteriorFeatures) {
                  var exteriorFeaturesUpdated = varientProduct.custom.exteriorFeatures.split('|');
                    return exteriorFeaturesUpdated;
                }
                return null;
            } catch (e) {
                e.stack;
            }
            return null;
        })()
        //Object.hasOwnProperty.call(varientProduct.custom, 'exteriorFeatures') && varientProduct.custom.exteriorFeatures  ? dataHelpers.getfeatures(varientProduct.custom.exteriorFeatures) : null
    });

    Object.defineProperty(object, 'interiorFeatures', {
        enumerable: true,
        value: (function () {
            try {
                if (Object.hasOwnProperty.call(varientProduct.custom, 'interiorFeatures') && varientProduct.custom.interiorFeatures) {
                  var  interiorFeaturesUpdated = varientProduct.custom.interiorFeatures.split('|');
                    return interiorFeaturesUpdated;
                }
                return null;
            } catch (e) {
                e.stack;
            }
            return null;
        })()
        //Object.hasOwnProperty.call(varientProduct.custom, 'interiorFeatures') && varientProduct.custom.interiorFeatures  ? dataHelpers.getfeatures(varientProduct.custom.interiorFeatures) : null
    });

    Object.defineProperty(object, 'luggageSize', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'luggageSize') && apiProduct.custom.luggageSize && productType(apiProduct) === 'variant' ? apiProduct.custom.luggageSize : null
    });

    Object.defineProperty(object, 'grandCollection', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'grandCollection') && apiProduct.custom.grandCollection ? apiProduct.custom.grandCollection : null
    });

    Object.defineProperty(object, 'keywords', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'keywords') && apiProduct.custom.keywords && apiProduct.custom.keywords.length > 0 ? apiProduct.custom.keywords : null
    });

    Object.defineProperty(object, 'wholesaleLongDescription', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'wholesaleLongDescription') && apiProduct.custom.wholesaleLongDescription && productType(apiProduct) === 'variant' ? apiProduct.custom.wholesaleLongDescription : null
    });

    Object.defineProperty(object, 'handleDropLengthInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'handleDropLengthInches') && apiProduct.custom.handleDropLengthInches && productType(apiProduct) === 'variant' ? apiProduct.custom.handleDropLengthInches : null
    });

    Object.defineProperty(object, 'handleDropLengthCms', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'handleDropLengthCms') && apiProduct.custom.handleDropLengthCms && productType(apiProduct) === 'variant' ? apiProduct.custom.handleDropLengthCms : null
    });

    Object.defineProperty(object, 'shoulderStrapDropLengthInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'shoulderStrapDropLengthInches') && apiProduct.custom.shoulderStrapDropLengthInches && productType(apiProduct) === 'variant' ? apiProduct.custom.shoulderStrapDropLengthInches : null
    });

    Object.defineProperty(object, 'shoulderStrapDropLengthCms', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'shoulderStrapDropLengthCms') && apiProduct.custom.shoulderStrapDropLengthCms && productType(apiProduct) === 'variant' ? apiProduct.custom.shoulderStrapDropLengthCms : null
    });

    Object.defineProperty(object, 'shoulderStrapTotalLengthInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'shoulderStrapTotalLengthInches') && apiProduct.custom.shoulderStrapTotalLengthInches && productType(apiProduct) === 'variant' ? apiProduct.custom.shoulderStrapTotalLengthInches : null
    });

    Object.defineProperty(object, 'productFeatureIcons', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'productFeatureIcons') && apiProduct.custom.productFeatureIcons && apiProduct.custom.productFeatureIcons.length > 0 ? dataHelpers.getEnumValues(apiProduct.custom.productFeatureIcons) : []
    });

    Object.defineProperty(object, 'approved', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'approved') && (apiProduct.custom.approved != null) ? apiProduct.custom.approved : true
    });

    Object.defineProperty(object, 'hangTag', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'hangTag') && apiProduct.custom.hangTag && productType(apiProduct) === 'variant' ? apiProduct.custom.hangTag : null
    });

    Object.defineProperty(object, 'grossWeightLbs', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'grossWeightLbs') && apiProduct.custom.grossWeightLbs && productType(apiProduct) === 'variant' ? apiProduct.custom.grossWeightLbs : null
    });

    Object.defineProperty(object, 'netWeightKg', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'netWeightKg') && apiProduct.custom.netWeightKg && productType(apiProduct) === 'variant' ? apiProduct.custom.netWeightKg : null
    });

    Object.defineProperty(object, 'grossWeightKg', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'grossWeightKg') && apiProduct.custom.grossWeightKg && productType(apiProduct) === 'variant' ? apiProduct.custom.grossWeightKg : null
    });

    Object.defineProperty(object, 'heightInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'heightInches') && varientProduct.custom.heightInches && productType(varientProduct) === 'variant' ? varientProduct.custom.heightInches : null
    });

    Object.defineProperty(object, 'widthInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'widthInches') && varientProduct.custom.widthInches && productType(varientProduct) === 'variant' ? varientProduct.custom.widthInches : null
    });

    Object.defineProperty(object, 'depthInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'depthInches') && varientProduct.custom.depthInches && productType(varientProduct) === 'variant' ? varientProduct.custom.depthInches : null
    });

    Object.defineProperty(object, 'heightCms', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'heightCms') && varientProduct.custom.heightCms && productType(varientProduct) === 'variant' ? varientProduct.custom.heightCms : null
    });

    Object.defineProperty(object, 'widthCms', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'widthCms') && varientProduct.custom.widthCms && productType(varientProduct) === 'variant' ? varientProduct.custom.widthCms : null
    });

    Object.defineProperty(object, 'depthCms', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'depthCms') && varientProduct.custom.depthCms && productType(varientProduct) === 'variant' ? varientProduct.custom.depthCms : null
    });

    Object.defineProperty(object, 'laptopHeightInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'laptopHeightInches') && varientProduct.custom.laptopHeightInches && productType(varientProduct) === 'variant' ? varientProduct.custom.laptopHeightInches : null
    });

    Object.defineProperty(object, 'laptopWidthInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'laptopWidthInches') && varientProduct.custom.laptopWidthInches && productType(varientProduct) === 'variant' ? varientProduct.custom.laptopWidthInches : null
    });

    Object.defineProperty(object, 'laptopDepthInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'laptopDepthInches') && varientProduct.custom.laptopDepthInches && productType(varientProduct) === 'variant' ? varientProduct.custom.laptopDepthInches : null
    });

    Object.defineProperty(object, 'laptopHeightCms', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'laptopHeightCms') && varientProduct.custom.laptopHeightCms && productType(varientProduct) === 'variant' ? varientProduct.custom.laptopHeightCms : null
    });

    Object.defineProperty(object, 'laptopWidthCms', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'laptopWidthCms') && varientProduct.custom.laptopWidthCms && productType(varientProduct) === 'variant' ? varientProduct.custom.laptopWidthCms : null
    });

    Object.defineProperty(object, 'laptopDepthCms', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'laptopDepthCms') && varientProduct.custom.laptopDepthCms && productType(varientProduct) === 'variant' ? varientProduct.custom.laptopDepthCms : null
    });

    Object.defineProperty(object, 'laptopSize', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'laptopSize') && varientProduct.custom.laptopSize && productType(varientProduct) === 'variant' ? varientProduct.custom.laptopSize : null
    });

    Object.defineProperty(object, 'customizable', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'customizable') && apiProduct.custom.customizable && productType(apiProduct) === 'variant' ? apiProduct.custom.customizable : null
    });
    Object.defineProperty(object, 'deliveryTime', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'deliveryTime') && apiProduct.custom.deliveryTime && productType(apiProduct) === 'variant' ? apiProduct.custom.deliveryTime : null
    });

    Object.defineProperty(object, 'capacity', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'capacity') && varientProduct.custom.capacity ? varientProduct.custom.capacity : null
    });

    Object.defineProperty(object, 'expansionInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'expansionInches') && varientProduct.custom.expansionInches && productType(varientProduct) === 'variant' ? varientProduct.custom.expansionInches : null
    });

    Object.defineProperty(object, 'expansionCms', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'expansionCms') && apiProduct.custom.expansionCms && productType(apiProduct) === 'variant' ? apiProduct.custom.expansionCms : null
    });
    Object.defineProperty(object, 'taxCode', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'taxCode') && apiProduct.custom.taxCode && productType(apiProduct) === 'variant' ? apiProduct.custom.taxCode : null
    });

    Object.defineProperty(object, 'wheels', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'wheels') && apiProduct.custom.wheels && productType(apiProduct) === 'variant' ? apiProduct.custom.wheels : null
    });

    Object.defineProperty(object, 'summary', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'summary') && apiProduct.custom.summary && productType(apiProduct) === 'variant' ? apiProduct.custom.summary : null
    });

    Object.defineProperty(object, 'primaryMaterial', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'primaryMaterial') && varientProduct.custom.primaryMaterial ? varientProduct.custom.primaryMaterial : null
    });

    Object.defineProperty(object, 'turntoAverageRating', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'turntoAverageRating') && apiProduct.custom.turntoAverageRating && productType(apiProduct) === 'variant' ? apiProduct.custom.turntoAverageRating : null
    });

    Object.defineProperty(object, 'turntoReviewCount', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'turntoReviewCount') && apiProduct.custom.turntoReviewCount && productType(apiProduct) === 'variant' ? apiProduct.custom.turntoReviewCount : null
    });

    Object.defineProperty(object, 'turntoRelatedReviewCount', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'turntoRelatedReviewCount') && apiProduct.custom.turntoRelatedReviewCount && productType(apiProduct) === 'variant' ? apiProduct.custom.turntoRelatedReviewCount : null
    });

    Object.defineProperty(object, 'turntoCommentCount', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'turntoCommentCount') && apiProduct.custom.turntoCommentCount && productType(apiProduct) === 'variant' ? apiProduct.custom.turntoCommentCount : null
    });

    Object.defineProperty(object, 'styleVariant', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'styleVariant') && apiProduct.custom.styleVariant && productType(apiProduct) === 'variant' ? apiProduct.custom.styleVariant : null
    });

    Object.defineProperty(object, 'sizeVariant', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'sizeVariant') && apiProduct.custom.sizeVariant && productType(apiProduct) === 'variant' ? apiProduct.custom.sizeVariant : null
    });

    Object.defineProperty(object, 'color', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'color') && apiProduct.custom.color && productType(apiProduct) === 'variant' ? apiProduct.custom.color : null
    });

    Object.defineProperty(object, 'colorFamily', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'colorFamily') && apiProduct.custom.colorFamily && productType(apiProduct) === 'variant' ? apiProduct.custom.colorFamily : null
    });

    Object.defineProperty(object, 'sizeDesc', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'sizeDesc') && apiProduct.custom.sizeDesc && productType(apiProduct) === 'variant' ? apiProduct.custom.sizeDesc : null
    });

    Object.defineProperty(object, 'material', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'material') && apiProduct.custom.material && productType(apiProduct) === 'variant' ? apiProduct.custom.material : null
    });

    Object.defineProperty(object, 'gridValue', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'gridValue') && apiProduct.custom.gridValue && productType(apiProduct) === 'variant' ? apiProduct.custom.gridValue : null
    });

    Object.defineProperty(object, 'countryOfOrigin', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'countryOfOrigin') && apiProduct.custom.countryOfOrigin && productType(apiProduct) === 'variant' ? apiProduct.custom.countryOfOrigin : null
    });

    Object.defineProperty(object, 'shoulderStrap', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'shoulderStrap') && apiProduct.custom.shoulderStrap && productType(apiProduct) === 'variant' ? apiProduct.custom.shoulderStrap : null
    });

    Object.defineProperty(object, 'handleDropLen', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'handleDropLen') && apiProduct.custom.handleDropLen && productType(apiProduct) === 'variant' ? apiProduct.custom.handleDropLen : null
    });

    Object.defineProperty(object, 'NRFColorCode', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'NRFColorCode') && apiProduct.custom.NRFColorCode && productType(apiProduct) === 'variant' ? apiProduct.custom.NRFColorCode : null
    });

    Object.defineProperty(object, 'lengthInches', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'lengthInches') && apiProduct.custom.lengthInches && productType(apiProduct) === 'variant' ? apiProduct.custom.lengthInches : null
    });

    Object.defineProperty(object, 'dimUnit', {
        enumerable: true,
        value: (function () {
            try {
                if (Object.hasOwnProperty.call(varientProduct.custom, 'dimUnit') && varientProduct.custom.dimUnit && (varientProduct.custom.dimUnit.length > 0) && (varientProduct.custom.dimUnit == 'IN') && productType(varientProduct) === 'variant' ) {
                    return '"';
                } else if (varientProduct.custom.dimUnit !== null){
                    return varientProduct.custom.dimUnit;
                } else {
                    return '';
                }
                return '';
            } catch (e) {
                e.stack;
            }
            return '';
        })()
        //Object.hasOwnProperty.call(varientProduct.custom, 'dimUnit') && varientProduct.custom.dimUnit && productType(varientProduct) === 'variant' ? varientProduct.custom.dimUnit : null
    });

    Object.defineProperty(object, 'netWeightLb', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'netWeightLb') && varientProduct.custom.netWeightLb ? varientProduct.custom.netWeightLb : null
    });

    Object.defineProperty(object, 'weightUnit', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'weightUnit') && varientProduct.custom.weightUnit && productType(varientProduct) === 'variant' ? varientProduct.custom.weightUnit : null
    });

    Object.defineProperty(object, 'packageHeight', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'packageHeight') && apiProduct.custom.packageHeight && productType(apiProduct) === 'variant' ? apiProduct.custom.packageHeight : null
    });

    Object.defineProperty(object, 'packageWidth', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'packageWidth') && apiProduct.custom.packageWidth && productType(apiProduct) === 'variant' ? apiProduct.custom.packageWidth : null
    });

    Object.defineProperty(object, 'packageLength', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'packageLength') && apiProduct.custom.packageLength && productType(apiProduct) === 'variant' ? apiProduct.custom.packageLength : null
    });

    Object.defineProperty(object, 'packageDimUnit', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'packageDimUnit') && apiProduct.custom.packageDimUnit && productType(apiProduct) === 'variant' ? apiProduct.custom.packageDimUnit : null
    });

    Object.defineProperty(object, 'packagingWeightUnit', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'packagingWeightUnit') && apiProduct.custom.packagingWeightUnit && productType(apiProduct) === 'variant' ? apiProduct.custom.packagingWeightUnit : null
    });

    Object.defineProperty(object, 'premiumTagSize', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'premiumTagSize') && apiProduct.custom.premiumTagSize && productType(apiProduct) === 'variant' ? apiProduct.custom.premiumTagSize : null
    });

    Object.defineProperty(object, 'airlineGuideEligible', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'airlineGuideEligible') && (apiProduct.custom.airlineGuideEligible != null) ? apiProduct.custom.airlineGuideEligible : false
    });

    Object.defineProperty(object, 'dimensions', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'dimensions') && varientProduct.custom.dimensions  ? varientProduct.custom.dimensions : null
    });

    Object.defineProperty(object, 'expandedDepth', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'expandedDepth') && apiProduct.custom.expandedDepth  ? apiProduct.custom.expandedDepth : null
    });

    Object.defineProperty(object, 'premiumPatchSize', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'premiumPatchSize') && apiProduct.custom.premiumPatchSize ? apiProduct.custom.premiumPatchSize : null
    });

    Object.defineProperty(object, 'tsaLock', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'tsaLock') && varientProduct.custom.tsaLock ? varientProduct.custom.tsaLock : null
    });

    Object.defineProperty(object, 'tsaLockType', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'tsaLockType') && varientProduct.custom.tsaLockType ? varientProduct.custom.tsaLockType : null
    });

    Object.defineProperty(object, 'tumiTracer', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'tumiTracer') && varientProduct.custom.tumiTracer ? varientProduct.custom.tumiTracer : null
    });

    Object.defineProperty(object, 'availableForInStorePickup', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'availableForInStorePickup') && apiProduct.custom.availableForInStorePickup && productType(apiProduct) === 'variant' ? apiProduct.custom.availableForInStorePickup : null
    });

    Object.defineProperty(object, 'p360assetID', {
        enumerable: true,
        value: (function () {
            try {
                if (Object.hasOwnProperty.call(apiProduct.custom, 'p360assetID') && apiProduct.custom.p360assetID && productType(apiProduct) === 'variant') {
                    return apiProduct.custom.p360assetID;
                } else if(Object.hasOwnProperty.call(apiProduct.custom, 'p360assetID') && apiProduct.custom.p360assetID && productType(apiProduct) === 'master') {
                    return apiProduct.custom.p360assetID;
                }
                return null;
            } catch (e) {
                e.stack;
            }
            return null;
        })()
        //Object.hasOwnProperty.call(apiProduct.custom, 'p360assetID') && apiProduct.custom.p360assetID  ? apiProduct.custom.p360assetID : null
    });

    Object.defineProperty(object, 'p360enable', {
        enumerable: true,
        value: Object.hasOwnProperty.call(apiProduct.custom, 'p360enable') && apiProduct.custom.p360enable ? apiProduct.custom.p360enable : false
    });

    Object.defineProperty(object, 'innovationsWebContent', {
        enumerable: true,
        value: Object.hasOwnProperty.call(varientProduct.custom, 'innovationsWebContent') && varientProduct.custom.innovationsWebContent  ? dataHelpers.getfeatures(varientProduct.custom.innovationsWebContent) : null
    });

    if (object.styleVariant) {
        Object.defineProperty(object, 'styleDescription', {
            enumerable: true,
            value: require('dw/web/Resource').msgf('product.style.id', 'product', null, object.styleVariant)
        });

    }
};
