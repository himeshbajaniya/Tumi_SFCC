'use strict';

var Logger = require('dw/system/Logger');
var base = module.superModule;
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var ProductAvailabilityModel = require('dw/catalog/ProductAvailabilityModel');
/**
 * 
 * @param {Object} product - product
 * @returns {string/boolean} returns the string or boolean
 */
function getActiveProductBadge(product) {
    
    var ratingThreshold = Site.getCurrent().getCustomPreferenceValue('ratingThreshold');
    if (product.backInStockSoon) {
        var backInStockSoon = Resource.msg('label.product.badge.backinstocksoon', 'common', null)
        return backInStockSoon;
    } else if (product.backInStock) {
        var backInStock = Resource.msg('label.product.badge.backinStock', 'common', null)
        return backInStock;
    } else if (product.onlyFewLeft) {
        var OnlyFewLeft = Resource.msg('label.product.badge.onlyfewleft', 'common', null)
        return OnlyFewLeft;
    } else if (product.comingSoon) {
        var comingSoon = Resource.msg('label.product.badge.comingsoon', 'common', null)
        return comingSoon;
    } else if (product.badge) {
        return product.badge;
    } else if (product.turntoAverageRating && product.turntoAverageRating >= ratingThreshold) {
        var topRatedProduct = Resource.msg('label.product.badge.topratedproduct', 'common', null)
        return topRatedProduct;
    } else if (product.newlyAddedProduct) {
        var newlyAddedProduct = Resource.msg('label.product.badge.newlyaddedproduct', 'common', null)
        return newlyAddedProduct;
    }

    return false;
}

function getProductAvailability(product, object) {
    if (object.backInStockSoon || object.backInStock) {
        var inStockDate = new Date(product.availabilityModel.inventoryRecord.inStockDate);
        var calender =  new Calendar(inStockDate);
        var productInStockDate = StringUtils.formatCalendar(calender, "MM/dd");
        return {
            label: Resource.msg('label.product.backorder', 'common', null),
            expectedToShipLabel: Resource.msgf('label.product.msg.expected', 'common', null, productInStockDate),
            inStockDate: productInStockDate
        }
    } else if (object.comingSoon) {
        var inStockDate = new Date(product.availabilityModel.inventoryRecord.inStockDate);
        var calender =  new Calendar(inStockDate);
        var productInStockDate = StringUtils.formatCalendar(calender, "MM/dd");
        return {
            label: Resource.msgf('label.product.preorder', 'common', null),
            launchingLabel: Resource.msgf('label.product.preorder.msg', 'common', null, productInStockDate),
            expectedToShipLabel: Resource.msgf('label.product.msg.expected', 'common', null, productInStockDate),
            inStockDate: productInStockDate
        }
    }

    return null;
}

/**
 * 
 * @param {Object} variantProduct - product from API
 * @returns {boolean}  returns boolean
 */
function getOnlyFewLeftFlag(variantProduct) {

    var stockStatus = variantProduct && variantProduct.availabilityModel && variantProduct.availabilityModel.availabilityStatus === "IN_STOCK" 
        && variantProduct.availabilityModel.inventoryRecord && variantProduct.availabilityModel.inventoryRecord.ATS ? variantProduct.availabilityModel.inventoryRecord.ATS : null;

    var onlyFewLeftThreshold = Site.getCurrent().getCustomPreferenceValue('onlyFewLeftThreshold');
    if (stockStatus !== null && stockStatus <= onlyFewLeftThreshold) {
        return true;
    }
    return false;
}

/**
 * 
 * @param {Object} productAddedDate - productAddedDate
 * @returns {boolean}  returns boolean
 */
function getNewlyAddedProductFlag(productAddedDate) {

    var CurrentDate = new Date();
    var diffDays = parseInt((CurrentDate - productAddedDate) / (1000 * 60 * 60 * 24), 10);

    var newlyAddedProductThreshold = Site.getCurrent().getCustomPreferenceValue('newlyAddedProductThreshold');
    if (diffDays < newlyAddedProductThreshold) {
        return true;
    }
    return false;
}

/**
 * 
 * @param {Object} variantProduct - product from API
 * @returns {boolean}  returns boolean
 */
function getBackInStockSoonFlag(variantProduct) {
    var outOfStock = variantProduct && variantProduct.availabilityModel && (variantProduct.availabilityModel.getAvailabilityStatus() === ProductAvailabilityModel.AVAILABILITY_STATUS_NOT_AVAILABLE);

    if (outOfStock) {
        var stockStatus = variantProduct && variantProduct.availabilityModel && variantProduct.availabilityModel.inventoryRecord 
        && variantProduct.availabilityModel.inventoryRecord ? variantProduct.availabilityModel.inventoryRecord : null;
    
        var estimatedDate = variantProduct && variantProduct.availabilityModel && variantProduct.availabilityModel.inventoryRecord 
        && variantProduct.availabilityModel.inventoryRecord.inStockDate ? variantProduct.availabilityModel.inventoryRecord.inStockDate : null;
        var CurrentDate = new Date();
        var diffDays = parseInt((estimatedDate - CurrentDate) / (1000 * 60 * 60 * 24), 10);
        var backOrderMinDaysThreshold = Site.getCurrent().getCustomPreferenceValue('backOrderMinDaysThreshold');
        var backOrderMaxDaysThreshold = Site.getCurrent().getCustomPreferenceValue('backOrderMaxDaysThreshold');
        if ((stockStatus && stockStatus.ATS === 0 && (diffDays >= backOrderMinDaysThreshold && diffDays <= backOrderMaxDaysThreshold)) || (stockStatus && stockStatus.allocation.value === 0 && diffDays >= backOrderMinDaysThreshold && diffDays <= backOrderMaxDaysThreshold)) {
            return true;
        }
    }
    return false;
}

/**
 * 
 * @param {Object} variantProduct - product from API
 * @returns {boolean}  returns boolean
 */
function getBackInStockFlag(variantProduct) {

    var backorderable = variantProduct && variantProduct.availabilityModel && variantProduct.availabilityModel.inventoryRecord 
    && variantProduct.availabilityModel.inventoryRecord.backorderable ? variantProduct.availabilityModel.inventoryRecord.backorderable : false;

    if (backorderable) {
        var stockStatus = variantProduct && variantProduct.availabilityModel && variantProduct.availabilityModel.inventoryRecord 
        && variantProduct.availabilityModel.inventoryRecord.ATS ? variantProduct.availabilityModel.inventoryRecord.ATS : null;
    
        var estimatedDate = variantProduct && variantProduct.availabilityModel && variantProduct.availabilityModel.inventoryRecord 
        && variantProduct.availabilityModel.inventoryRecord.inStockDate ? variantProduct.availabilityModel.inventoryRecord.inStockDate : null;
        var CurrentDate = new Date();
        var diffDays = parseInt((estimatedDate - CurrentDate) / (1000 * 60 * 60 * 24), 10); 
        var backInStockThreshold = Site.getCurrent().getCustomPreferenceValue('backInStockThreshold');
        var backOrderMinDaysThreshold = Site.getCurrent().getCustomPreferenceValue('backOrderMinDaysThreshold');
    
        if ((stockStatus !== null && stockStatus === 0 && diffDays <= backOrderMinDaysThreshold) || (stockStatus !== null && diffDays <= backOrderMinDaysThreshold && stockStatus >= backInStockThreshold)) {
            return true;
        }
    }
    return false;
}

function getProductURL(apiProduct, defaultVariant, options) {
    var URLAction = require('dw/web/URLAction');
    var Site = require('dw/system/Site');
    var URLParameter = require('dw/web/URLParameter');
    var URLUtils = require('dw/web/URLUtils');
    var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');

    var ProductVariationColorAttribute = apiProduct.getVariationModel().getProductVariationAttribute('color');
    var ProductVariationSizeAttribute = apiProduct.getVariationModel().getProductVariationAttribute('size');
    var defaultVariantColor = ProductVariationColorAttribute && defaultVariant && defaultVariant.custom.styleVariant ? defaultVariant.custom.styleVariant : null;
    var defaultVariantSize = ProductVariationSizeAttribute && defaultVariant && defaultVariant.custom.size ? defaultVariant.custom.size : null;

    var masterProductId = apiProduct.ID;
    if (options.productType === 'variant') {
        masterProductId = apiProduct.getMasterProduct().ID;
    }

    var params = [];
    if (defaultVariantColor) {
        params.push(new URLParameter('dwvar_' + masterProductId + '_color', defaultVariantColor));
    }
    if (defaultVariantSize) {
        params.push(new URLParameter('dwvar_' + masterProductId + '_size', defaultVariantSize));
    }

    var action = new URLAction('Product-Variation', Site.getCurrent().getID(), Site.getCurrent().defaultLocale);
    var defaultVariationUrl = URLUtils.https(action, params).toString();
    defaultVariationUrl = urlHelper.appendQueryParams(defaultVariationUrl, { pid: masterProductId, quantity: 1 }).toString();

    return defaultVariationUrl;
};

function getIncludedWithPurchaseData(product) {
    var Site = require('dw/system/Site');
    var compitablelistOfPurchaseAttributes = Site.getCurrent().getCustomPreferenceValue('PurchaseComponentText');
    var purchaseAttrs = [];
    if (compitablelistOfPurchaseAttributes) {
        var listOfPurchaseAttributes = JSON.parse(compitablelistOfPurchaseAttributes);
        listOfPurchaseAttributes.forEach(function (item) {
            var purchaseAttr = {
                text : item.subtext,
                linkText: item.linktext,
                linkUrl: item.linkUrl,
                imageUrl: item.imageURL,
            }

            switch (item.attributeId) {
                case 'warranty':
                    if(product.warranty) {
                        purchaseAttr.text = product.warranty + ' ' + purchaseAttr.text;
                        purchaseAttrs.push(purchaseAttr);
                    }
                    break;
                case 'giftbox':
                    if(product.giftbox) {
                        purchaseAttrs.push(purchaseAttr);
                    }
                    break;
                case 'monogramable':
                    if(product.premiumMono || product.monogramable) {
                        purchaseAttrs.push(purchaseAttr);
                    }
                    break;
                default:
                    purchaseAttrs.push(purchaseAttr);
                    break;
            }
        });
    }
    return purchaseAttrs;
}

/**
 * Merge the basket with existing basket
 */
function mergeBasket() {
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var storedBasket = BasketMgr.getStoredBasket();
    if (!empty(storedBasket)) {
        var CouponStatusCodes = require('dw/campaign/CouponStatusCodes');
        var Transaction = require('dw/system/Transaction');
        for each(var productLineItem in storedBasket.productLineItems) {
            var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
            var productID = productLineItem.productID;
            var quantity = productLineItem.quantity.value;
            var childProducts = productLineItem.getProduct();
            var options = [];
            var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
            Transaction.wrap(function () {
                cartHelper.addProductToCart(currentBasket, productID, quantity, childProducts, options);
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        }

    }
}

/**
 * Creates the breadcrumbs object
 * @param {string} cgid - category ID from navigation and search
 * @param {string} pid - product ID
 * @param {Array} breadcrumbs - array of breadcrumbs object
 * @returns {Array} an array of breadcrumb objects
 */
function getAllBreadcrumbs(cgid, pid, breadcrumbs) {
    var URLUtils = require('dw/web/URLUtils');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var category;
    var product;
    if (pid) {
        product = ProductMgr.getProduct(pid);
        if (product.variant) {
            category = !empty(product.primaryCategory) ? product.primaryCategory : 
            product.categories.length !== 0 ? product.categories[0] : product.masterProduct.primaryCategory;
        } else {
            category = product.variant
                ? product.masterProduct.primaryCategory
                : product.primaryCategory;
        }
        breadcrumbs.push({
            htmlValue: product.name
        })
    } else if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (category) {
        breadcrumbs.push({
            htmlValue: category.displayName,
            url: URLUtils.url('Search-Show', 'cgid', category.ID)
        });

        if (category.parent && category.parent.ID !== 'root') {
            getAllBreadcrumbs(category.parent.ID, null, breadcrumbs);
        }
        if (category.parent && category.parent.ID === 'root') {
            breadcrumbs.push({
                htmlValue: URLUtils.absStatic('/images/home-icon.svg'),
                url: URLUtils.url('Home-Show')
            });
        }
    }

    return breadcrumbs;
}

/**
 * Generates a map of string resources for the template
 *
 * @returns {ProductDetailPageResourceMap} - String resource map
 */
function getResources() {
    var Resource = require('dw/web/Resource');

    return {
        info_selectforstock: Resource.msg('info.selectforstock', 'product',
            'Select Styles for Availability'),
        assistiveSelectedText: Resource.msg('msg.assistive.selected.text', 'common', null)
    };
}
/**
 * Renders the Product Details Page
 * @param {Object} querystring - query string parameters
 * @param {Object} reqPageMetaData - request pageMetaData object
 * @param {Object} usePageDesignerTemplates - wether to use the page designer version of the product detail templates, defaults to false
 * @returns {Object} contain information needed to render the product page
 */
function showProductPage(querystring, reqPageMetaData) {
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var params = querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var canonicalUrl = generatePdpURL(product.id, false);
    var breadcrumbs = getAllBreadcrumbs(null, product.id, []).reverse();

    var template = 'product/productDetails';
    //ProductMgr.getProduct(pid)
    if (product.productType === 'bundle' && !product.template) {
        template = 'product/bundleDetails';
    } else if (product.productType === 'set' && !product.template) {
        template = 'product/setDetails';
    } else if (product.template) {
        template = product.template;
    }

    pageMetaHelper.setPageMetaData(reqPageMetaData, product);
    pageMetaHelper.setPageMetaTags(reqPageMetaData, product);
    var schemaData = require('*/cartridge/scripts/helpers/structuredDataHelper').getProductSchema(product);

    return {
        template: template,
        product: product,
        addToCartUrl: addToCartUrl,
        resources: getResources(),
        breadcrumbs: breadcrumbs,
        canonicalUrl: canonicalUrl,
        schemaData: schemaData
    };
}
/**
 * Gets variants from a product
 * @param {dw.catalog.Product} product - product
 * @param {dw.util.HashMap} filter - hashmap filter of variation value to filter on
 * @param {boolean} includeOffline - flag to indicate if offline variants should be included
 * @param {boolean} includeOOS - flag to indicate if out of stock variants should be included
 * @returns {Array} variants
 */
function getVariants(product, filter, includeOffline, includeOOS) {
    var returnVariants = [];
    if (!product) return returnVariants;

    var variationModel = product.variant || product.variationGroup ? product.masterProduct.variationModel : product.variationModel;
    if (includeOffline) {
        variationModel = product.variant || product.variationGroup ? product.masterProduct : product;
    }

    // filter can only be used on ProductVariationModel
    if (!(variationModel instanceof dw.catalog.ProductVariationModel)) {
        filter = null; // eslint-disable-line no-param-reassign
    }

    var variants = filter && filter.length > 0 ? variationModel.getVariants(filter) : variationModel.getVariants();
    if (variants === null || variants.length === 0) {
        return returnVariants;
    }

    for (var i = 0; i < variants.length; i++) {
        var variant = variants[i];
        var stockStatus = variant.availabilityModel.availability > 0 || includeOOS;
        var onlineStatus = variant.onlineFlag || includeOffline;

        if (stockStatus && onlineStatus) {
            returnVariants.push(variant);
        }
    }

    return returnVariants;
}

/**
 * Returns an array of all selected variation attribtues
 * @param {Object} variationAttributes - variation attributes object
 * @returns {Array} - an arrray of the selected variation attributes
 */
function getSelectedVariationAttributes(variationAttributes) {
    var selectedVariationAttributes = [];
    if (!variationAttributes || Object.keys(variationAttributes).length === 0) return selectedVariationAttributes;

    Object.keys(variationAttributes).forEach(function (key) {
        var variationAttrObject = variationAttributes[key];
        var variationValues = variationAttrObject.values && variationAttrObject.values.length > 0 ? variationAttrObject.values : null;
        if (variationValues) {
            for (var i = 0; i < variationValues.length; i++) {
                var variationValueObject = variationValues[i];
                if (variationValueObject.selected) {
                    variationValueObject.attributeId = variationAttrObject.attributeId;
                    selectedVariationAttributes.push(variationValueObject);
                }
            }
        }
    });

    return selectedVariationAttributes;
}

/**
 * Returns a HashMap filter that can be used to get selected variants matching the filter
 * @param {Array} selectedVariationAttributes - an array of selected variation attributes
 * @returns {dw.util.HashMap} - variant filter
 */
function createVariantFilter(selectedVariationAttributes) {
    var HashMap = require('dw/util/HashMap');
    var filter = new HashMap();

    try {
        if (selectedVariationAttributes && selectedVariationAttributes.length > 0) {
            for (var i = 0; i < selectedVariationAttributes.length; i++) {
                var selectedVariationAttribute = selectedVariationAttributes[i];
                filter.put(selectedVariationAttribute.attributeId, selectedVariationAttribute.value);
            }
        }
    } catch (ex) {
        filter = new HashMap();
    }

    return filter;
}

/**
 * If a product is master and only have one variant for a given attribute - auto select it
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Object with selected parameters
 */
function normalizeSelectedAttributes(apiProduct, params) {
    var collections = require('*/cartridge/scripts/util/collections');
    if (!apiProduct.master) {
        return params.variables;
    }

    var variables = params.variables || {};
    if (apiProduct.variationModel) {
        collections.forEach(apiProduct.variationModel.productVariationAttributes, function (attribute) {
            var allValues = apiProduct.variationModel.getAllValues(attribute);
            if (allValues.length === 1) {
                variables[attribute.ID] = {
                    id: apiProduct.ID,
                    value: allValues.get(0).ID
                };
            }
        });
    }

    return Object.keys(variables) ? variables : null;
}

/**
 * Get information for model creation
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Config object
 */
function getConfig(apiProduct, params) {
    var variables = normalizeSelectedAttributes(apiProduct, params);
    var variationModel = base.getVariationModel(apiProduct, variables);
    if (variationModel) {
        apiProduct = variationModel.selectedVariant || apiProduct; // eslint-disable-line
    }
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    var optionsModel = base.getCurrentOptionModel(apiProduct.optionModel, params.options);
    var options = {
        variationModel: variationModel,
        options: params.options,
        optionModel: optionsModel,
        promotions: promotions,
        quantity: params.quantity,
        variables: variables,
        apiProduct: apiProduct,
        productType: base.getProductType(apiProduct),
        storeId: params.storeId
    };

    return options;
}

function getPremiumMonogramLetterCount(object, product) {
    var premMonogramPatchJSON = JSON.parse(object.premiumMonogramPatchLookupTable);
    var premMonogramTagJSON = JSON.parse(object.premiumMonogramTagLookupTable);

    var letterCount = 0;

    if (object.premiumPatch) {
        for each(var monogramPatchSize in premMonogramPatchJSON) {
            if (monogramPatchSize.Size === object.premiumPatchSize) {
                letterCount = monogramPatchSize.LettersInUI;
                break;
            }
        }
    }

    if (object.premiumLuggageTag) {
        for each(var monogramTagSize in premMonogramTagJSON) {
            if ((!object.premiumPatch && monogramTagSize.Size === object.premiumTagSize) || (object.premiumPatch && monogramTagSize.LettersInUI < letterCount && monogramTagSize.Size === object.premiumTagSize)) {
                letterCount = monogramTagSize.LettersInUI;
                break;
            }
        }
    }

    return letterCount;
}

/**
 * Generate PDP SEO firendly URL without html
 * @param {String} pid Product ID
 * @param {Boolean} isRealtive true for relative URL and false for full url
 * @return {String} - return PDP URL
 */
 function generatePdpURL(pid, isRealtive) {
    var URLUtils = require('dw/web/URLUtils');
    var url;
     try {
        if (isRealtive) {
            url = URLUtils.url('Product-Show', 'pid', pid).toString();
        }
        else{
            url = URLUtils.https('Product-Show', 'pid', pid).toString();
        }
        var pdpURL = url.replace('.html', '/');
        return pdpURL;
     } catch (e) {
        return URLUtils.https('Product-Show', 'pid', pid).toString();
     }
}

/**
 * Return Inventory status
 * @param {object} availabilityModel inventory status
 * @return {boolean} - return inventory flag
 */
 function getInventoryStatus(availabilityModel) {
    const inventoryStatus = {
        InStock : 'IN_STOCK',
        PreOrder : 'PREORDER',
        BackOrder : 'BACKORDER'
    }
    var isAvailable = false;
    var inventoryRecord = availabilityModel && availabilityModel.inventoryRecord;
    if(inventoryRecord && inventoryRecord.ATS != 0 && (availabilityModel.availabilityStatus == inventoryStatus.InStock 
        || availabilityModel.availabilityStatus == inventoryStatus.PreOrder 
        || availabilityModel.availabilityStatus == inventoryStatus.BackOrder)) {
        isAvailable = true;
    }
    
    return isAvailable;
}

/**
 * Find Eligiable Category for Airline Guideline
 * @param {Object} category the category object
 * @return {boolean} If category is eligiable, return value.
 */
 function getEligibleCategoryToShowAirlineGuice(category) {
    try {
        var currentCat = category;
        var eligibleToShowAirlineGuide = false;
        if (currentCat.custom.hasOwnProperty('eligibleToShowAirlineGuide')) {
            if (currentCat.custom.eligibleToShowAirlineGuide) {
                eligibleToShowAirlineGuide = currentCat.custom.eligibleToShowAirlineGuide;
                return eligibleToShowAirlineGuide;
            }
        }
        while (!currentCat.root) {
            var parentCat = currentCat.parent;
            if (!parentCat.root) {
                if (parentCat.custom.hasOwnProperty('eligibleToShowAirlineGuide')) {
                    if (parentCat.custom.eligibleToShowAirlineGuide) {
                        eligibleToShowAirlineGuide = parentCat.custom.eligibleToShowAirlineGuide;
                        break;
                    }
                }
            }
            currentCat = parentCat;
        }
        return eligibleToShowAirlineGuide;
    } catch (e) {
        Logger.error('[productHelpers.js] getEligibleCategoryToShowAirlineGuice method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
        return false;
    }
}

module.exports = {
    getEligibleCategoryToShowAirlineGuice: getEligibleCategoryToShowAirlineGuice,
    mergeBasket: mergeBasket,
    getAllBreadcrumbs: getAllBreadcrumbs,
    showProductPage: showProductPage,
    getResources: getResources,
    getVariants: getVariants,
    getSelectedVariationAttributes: getSelectedVariationAttributes,
    createVariantFilter: createVariantFilter,
    getIncludedWithPurchaseData: getIncludedWithPurchaseData,
    getProductURL: getProductURL,
    getConfig: getConfig,
    getPremiumMonogramLetterCount: getPremiumMonogramLetterCount,
    generatePdpURL: generatePdpURL,
    getBackInStockFlag: getBackInStockFlag,
    getBackInStockSoonFlag: getBackInStockSoonFlag,
    getNewlyAddedProductFlag: getNewlyAddedProductFlag,
    getOnlyFewLeftFlag: getOnlyFewLeftFlag,
    getActiveProductBadge: getActiveProductBadge,
    getProductAvailability: getProductAvailability,
    getInventoryStatus: getInventoryStatus
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});