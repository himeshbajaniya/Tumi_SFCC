'use strict';

/**
 * This script generates a CSV product feed for Reflektion
 */

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var ArrayList = require('dw/util/ArrayList');
var SystemObjMgr = require('dw/object/SystemObjectMgr');
var ProductManager = require('dw/catalog/ProductMgr');
var LinkedHashMap = require('dw/util/LinkedHashMap');
var Currency = require('dw/util/Currency');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var Money = require('dw/value/Money');
var Resource = require('dw/web/Resource');

/* Script Modules */
var reflektionHelper = require('~/cartridge/scripts/reflektionHelper');
var reflektionFeedUpload = require('~/cartridge/scripts/jobs/reflektionFeedUpload');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

/* Product decorators */

var decorators = require('*/cartridge/models/product/decorators/index');

var CatalogMgr = require('dw/catalog/CatalogMgr');

/* Custom Logger */
var logger = Logger.getLogger('reflektion', 'ProductFeedExport');

/**
 * 
 * @param {string} categoryId the categoryId
 * @param {string} categoryId the targetedCategoryId
 * @return {boolean} - return a boolean
 */
function getCategoryFlag(categoryId, targetedCategoryId) {
    if (categoryId === targetedCategoryId) {
        return true;
    }
    var category = categoryId ? CatalogMgr.getCategory(categoryId) : false;
    var categoryFlag = false;
    if (category && category.parent && category.parent.ID !== 'root') {
        categoryFlag = getCategoryFlag(category.parent.ID, targetedCategoryId);
    }
    return categoryFlag;
}

/**
 * 
 * @param {object} product the product object
 * @param {string} viewType image viewType
 * @return {string} - return a string
 */
function getProductImages(product, viewType) {
    var productImages = '';
    var Images = product.getImages(viewType);
    var length = Images.length;
    if (length > 0) {
        for (var i = 0; i < length - 1; i += 1) {
            productImages = productImages + Images[i].httpsURL + ',';
        }
        productImages = productImages + Images[length-1].httpsURL;
    }
    if (productImages === '') {
        var scene7Host = Site.current.getCustomPreferenceValue('scene7Host');
        var styleVariant = Object.hasOwnProperty.call(product.custom, 'styleVariant') && product.custom.styleVariant ? product.custom.styleVariant : '';
        if (viewType === 'alt') {
            productImages = productImages + scene7Host + styleVariant + '_' + viewType + '1';
        } else {
            productImages = productImages + scene7Host + styleVariant + '_sw';
        }
    }
    return productImages;
}

/**
 * Takes Array of strings and generate a string with deviders
 * EX: ['A', 'B', 'C'], '\t' -> Output 'A\tB\tC'
 * @param {Array} arrayOfHeaders the product object
 * @param {string} devider string which devide each array's value
 * @return {string} - return a string
 */
function convertArrayValuesToStringWithDevider(arrayOfHeaders, devider) {
    var outputString = '';
    var lastIndex = arrayOfHeaders.length - 1;
    for (let i = 0; i < arrayOfHeaders.length - 1; i +=1) {
        var data = (!empty(arrayOfHeaders[i]) || arrayOfHeaders[i] !== '') ? arrayOfHeaders[i] : '';
        outputString += (data + devider);
    }
    outputString = outputString + arrayOfHeaders[lastIndex];
    return outputString;
}

/**
 * Create header record array
 * @param {Object} locales Allowed site locales
 * @param {Array} customAttributes list of custom product attributes
 * @param {Array} localizedCustomAttributes list of localized custom product attributes
 * @param {string} excludedLocals Locales to exclude
 * @return {Array} the header record labels
 */
function createHeaderRecord(locales, customAttributes, localizedCustomAttributes, excludedLocals) {
    // Write header labels
    var headerRecord = [];
    headerRecord.push('prod_id');
    headerRecord.push('basestyle');
    headerRecord.push('luggage_size');
    headerRecord.push('prod_url');
    headerRecord.push('manufacturer');
    headerRecord.push('flash_sale');
    headerRecord.push('available_us');
    headerRecord.push('available_ca');
    headerRecord.push('new_arrival');
    headerRecord.push('exclusive');
    headerRecord.push('bestseller');
    headerRecord.push('accentable');
    headerRecord.push('monogramable');
    headerRecord.push('rating');
    headerRecord.push('review_count');
    headerRecord.push('backorder_na');
    headerRecord.push('parent_stock_USwarehouse');
    headerRecord.push('parent_stock_CAwarehouse');
    headerRecord.push('prod_breadcrumbs_list');
    headerRecord.push('prod_name');
    headerRecord.push('prod_desc');
    headerRecord.push('prod_final_price');
    headerRecord.push('prod_price');
    headerRecord.push('prod_final_price_ca');
    headerRecord.push('prod_price_ca');
    headerRecord.push('category_en');
    headerRecord.push('colours_en');
    headerRecord.push('size_us_list');
    headerRecord.push('size_belts');
    headerRecord.push('size_apparrel');
    headerRecord.push('launch_date');
    headerRecord.push('color_group_en');
    headerRecord.push('collection_en');
    headerRecord.push('material');
    headerRecord.push('expandable');
    headerRecord.push('suitor_section');
    headerRecord.push('gender_en');
    headerRecord.push('badge_en');
    headerRecord.push('sku_stock');
    headerRecord.push('sku_id_list');
    headerRecord.push('prod_img_url');
    headerRecord.push('altimage_url');
    headerRecord.push('prod_active');
    headerRecord.push('product_type');
    headerRecord.push('laptop_size');
    headerRecord.push('wheels');
    headerRecord.push('security_friendly');
    headerRecord.push('swatch_image');
    headerRecord.push('product_accent');
    headerRecord.push('sale_us');
    headerRecord.push('search_keywords');
    headerRecord.push('ccids');
    headerRecord.push('derived_feature');
    headerRecord.push('promo_label_id_en');
    headerRecord.push('promo_label_us');
    headerRecord.push('promo_label_ca');
    headerRecord.push('prod_active_ca');
    headerRecord.push('prod_active_us');
    headerRecord.push('product_group');
    headerRecord.push('hardsided');
    headerRecord.push('softsided');
    headerRecord.push('garment_compartment');
    headerRecord.push('packable');
    headerRecord.push('usb_port');
    headerRecord.push('lock_closure');
    headerRecord.push('media_pocket');
    headerRecord.push('add_a_bag');

    return headerRecord;
}

/**
 * Retrieve the list price pricebook value for product
 * @param {string} productID the productID
 * @param {string} priceBookID Either US or CA priceBook ID
 * @return {string} return list price for product
 */
function getProductListPrice(productID, priceBookID) {
    var listPrice = '';
    var product = ProductManager.getProduct(productID);
    if (product != null) {
        var priceModel = product.getPriceModel();
        listPrice = priceModel.price;
        if (!empty(priceModel.priceInfo)) { // eslint-disable-line no-undef
            var priceBook = priceModel.priceInfo.priceBook;
            while (priceBook.parentPriceBook) {
                priceBook = priceBook.parentPriceBook ? priceBook.parentPriceBook : priceBook;
                var price = priceModel.getPriceBookPrice(priceBookID);
                if (price !== Money.NOT_AVAILABLE) {
                    listPrice = price;
                }
            }
        }
    }
    return listPrice;
}

/**
 * Get product custom attributes from site preference
 * @return {ArrayList} the collection of custom attributes
 */
function getCustomAttributes() {
    var customAttributes = new ArrayList();
    // Get product custom attributes from site preference
    var attributes = reflektionHelper.getRFKCustomAttributes();
    if (attributes != null) {
        var attributesArray = new ArrayList(attributes.split(','));
        var typeDef = SystemObjMgr.describe('Product');

        // Verify custom attributes exist
        var typeDefIterator = typeDef.attributeDefinitions.iterator();
        while (typeDefIterator.hasNext()) {
            var def = typeDefIterator.next();
            if (!def.system && attributesArray.contains(def.ID)) {
                customAttributes.add(def.ID);
            }
        }
    }
    return customAttributes;
}
/**
 * Get subset localized product custom attributes from site preference
 * @return {ArrayList} the subset collection of localized product custom attributes
 */
function getLocalizedCustomAttributes() {
    var customAttributes = new ArrayList();
    // Get localized product custom attributes from site preference
    var attributes = reflektionHelper.getRFKLocalizedCustomAttributes();
    if (attributes != null) {
        var attributesArray = new ArrayList(attributes.split(','));
        var typeDef = SystemObjMgr.describe('Product');

        // Verify custom attributes exist
        var typeDefIterator = typeDef.attributeDefinitions.iterator();
        while (typeDefIterator.hasNext()) {
            var def = typeDefIterator.next();
            if (!def.system && attributesArray.contains(def.ID)) {
                customAttributes.add(def.ID);
            }
        }
    }
    return customAttributes;
}
/**
 * Get product custom attributes from site preference
 * @return {LinkedHashMap} the link hash map of custom attributes
 */
function getCustomAttributeMap() {
    var customAttributeMap = new LinkedHashMap();
    // Get product custom attributes from site preference
    var attributes = reflektionHelper.getRFKCustomAttributes();
    if (attributes != null) {
        var attributesArray = new ArrayList(attributes.split(','));
        var typeDef = SystemObjMgr.describe('Product');

        // Verify custom attributes exist
        var typeDefIterator = typeDef.attributeDefinitions.iterator();
        while (typeDefIterator.hasNext()) {
            var def = typeDefIterator.next();
            if (!def.system && attributesArray.contains(def.ID)) {
                customAttributeMap.put(def.ID, def.objectTypeDefinition.getCustomAttributeDefinition(def.ID).multiValueType);
            }
        }
    }
    return customAttributeMap;
}
/**
 * Get localized product custom attributes from site preference
 * @return {LinkedHashMap} the link hash map of localized custom attributes
 */
function getLocalizedCustomAttributeMap() {
    var customAttributeMap = new LinkedHashMap();
    // Get product custom attributes from site preference
    var attributes = reflektionHelper.getRFKLocalizedCustomAttributes();
    if (attributes != null) {
        var attributesArray = new ArrayList(attributes.split(','));
        var typeDef = SystemObjMgr.describe('Product');

        // Verify custom attributes exist
        var typeDefIterator = typeDef.attributeDefinitions.iterator();
        while (typeDefIterator.hasNext()) {
            var def = typeDefIterator.next();
            if (!def.system && attributesArray.contains(def.ID)) {
                customAttributeMap.put(def.ID, def.objectTypeDefinition.getCustomAttributeDefinition(def.ID).multiValueType);
            }
        }
    }
    return customAttributeMap;
}
/**
 * Get product list price from pricebook and final price from product price model
 * @param {Object} product the product object
 * @return {Object} the list price and final price for product
 */
function getPrice(product) {
    var price;
    var finalPrice;
    var productPrice = {};
    if (product.master || product.variationGroup) {
        var pid = product.getID(); // Used to log any master products that do not have any variants
        var defaultVariant = product.getVariationModel().defaultVariant;
        if (empty(defaultVariant)) { // eslint-disable-line no-undef
            logger.info('Error in script reflektionProductFeedExport.js - Error message - Missing variants for masterID ' + pid);
            price = '';
        } else {
            finalPrice = defaultVariant.getPriceModel().price ? defaultVariant.getPriceModel().price : '';
            price = reflektionHelper.getProductListPrice(defaultVariant.ID);
        }
    } else {
        finalPrice = product.getPriceModel().price ? product.getPriceModel().price : '';
        price = reflektionHelper.getProductListPrice(product.ID);
    }
    // product has sale pricebook price, no list price book price
    if (price == '') { // eslint-disable-line eqeqeq
        price = finalPrice;
    }
    productPrice.Price = price;
    productPrice.FinalPrice = finalPrice;

    return productPrice;
}

function getSizeForBeltsAndApparel(product, productType) {
    var Size = '';
    if (product.custom && product.custom.levelThreeType === productType) {
        Size = product.custom && product.custom.size ? product.custom.size : '';
    }
    return Size;
}

/**
 * @function
 * @name execute
 * @param {Object} jobParams Job parameters
 * @returns {dw.system.Status} Status object
 */
function execute(jobParams) { // eslint-disable-line no-unused-vars
    try {
        // Check toggle switch from site preference
        var rfkEnabled = reflektionHelper.getRFKEnabled();
        if (!rfkEnabled) {
            logger.info('ReflektionProductFeedExport job finished, reflektion site preference not enabled');
            return new Status(Status.OK, null, 'ReflektionProductFeedExport job finished, reflektion site preference not enabled');
        }
        var sp = File.SEPARATOR;
        // Set file path from site preference
        var filePath = reflektionHelper.getRFKFeedExportPath();
        var fileDir = File.IMPEX + sp + filePath;
        // Set file name from site preference
        var fileName = reflektionHelper.getRFKProductFeedFilename();
        var outputFile = new File(fileDir + sp + fileName);
        if (!outputFile.exists()) {
            new File(fileDir).mkdirs();
            outputFile.createNewFile();
        }

        var writer = new FileWriter(outputFile, 'UTF-8');
        var locales = Site.current.allowedLocales;
        var customAttributes = getCustomAttributes();
        var localizedCustomAttributes = getLocalizedCustomAttributes();
        var excludedLocals = reflektionHelper.getLocalExcludeList(); // list of locales to suppress from feed
        var customAttributeMap = getCustomAttributeMap();
        var localizedCustomAttributeMap = getLocalizedCustomAttributeMap();
        // Retrieve locale currencies
        var rfkCurrencyMapJSON = reflektionHelper.getRFKCurrencyMap();

        // Write header labels
        var headerRecord = createHeaderRecord(locales, customAttributes, localizedCustomAttributes, excludedLocals);
        var productFeedStringWithDevider = '';
        productFeedStringWithDevider = convertArrayValuesToStringWithDevider(headerRecord, '\t');
        writer.writeLine(productFeedStringWithDevider);

        var siteInventoryIDUS = Site.getCurrent().getCustomPreferenceValue('siteInventoryIDUS');
        var siteInventoryIDCA = Site.getCurrent().getCustomPreferenceValue('siteInventoryIDCA');
        var usInventory = ProductInventoryMgr.getInventoryList(siteInventoryIDUS);
        var caInventory = ProductInventoryMgr.getInventoryList(siteInventoryIDCA);
        var cadListPrice = Site.getCurrent().getCustomPreferenceValue('cad_list_prices'); // site pref needs to be created
        var cadSalePrice = Site.getCurrent().getCustomPreferenceValue('cad_sale_prices');
        var productUrlSplitId = Site.getCurrent().getCustomPreferenceValue('productUrlSplitId');
        var saleCategoryId = Site.getCurrent().getCustomPreferenceValue('saleCategoryId');
        var inActiveProducts = Site.getCurrent().getCustomPreferenceValue('inActiveProductsFlag');
        if (!inActiveProducts) {
            logger.info('ReflektionProductFeedExport job finished, inActiveProductsFlag site preference not enabled, Enable the inActiveProductsFlag to skip the inActive Products in Feed');
        }
        // Loop through the products and write to file
        var productIter = ProductManager.queryAllSiteProducts();
        var rfkProductFeedImageType = reflektionHelper.getRFKProductFeedImageType();
        var variantToVariationGroupMap = reflektionHelper.getVariationGroupMap();
        while (productIter.hasNext()) {
            var product = productIter.next();
            if (product.bundle || product.productSet || product.master || !product.variant) {
                continue; // eslint-disable-line no-continue
            }
            var isAccentingSku = Object.hasOwnProperty.call(product.custom, 'isAccentingSku') && product.custom.isAccentingSku ? product.custom.isAccentingSku : false;
            if (isAccentingSku || product.onlineCategories.length === 0) {
                continue;
            }
            if (inActiveProducts) {
                if (!(product.online && product.onlineFlag && product.searchable)) {
                    continue;
                }
            }
            // Set default locale
            request.setLocale('default'); // eslint-disable-line no-undef
            // Set default currency
            var currency = Currency.getCurrency(Site.current.defaultCurrency);
            session.setCurrency(currency); // eslint-disable-line no-undef
            var productRecordArray = [];
            var productPrice = {};
            var scene7Host = Site.current.getCustomPreferenceValue('scene7Host');
            var scene7Postfix = JSON.parse(Site.current.getCustomPreferenceValue('scene7Postfix'));
            var styleVariant = Object.hasOwnProperty.call(product.custom, 'styleVariant') && product.custom.styleVariant ? product.custom.styleVariant : '';
            var imageUrl = !empty(styleVariant) ? (scene7Host + styleVariant + scene7Postfix.main) : '';
            productPrice = getPrice(product); // retrieve product list price from pricebook and final price from product price model
            var caListPrice = product.getPriceModel() && product.getPriceModel().getPriceBookPrice(cadListPrice) ? product.getPriceModel().getPriceBookPrice(cadListPrice) : '';
            var caSalePrice = product.getPriceModel() && product.getPriceModel().getPriceBookPrice(cadSalePrice) ? product.getPriceModel().getPriceBookPrice(cadSalePrice) : '';
            try {
                var usInventoryRecord = usInventory.getRecord(product.ID) !== null ? usInventory.getRecord(product.ID).ATS.value : 0;
                var caInventoryRecord = caInventory.getRecord(product.ID) !== null ? caInventory.getRecord(product.ID).ATS.value : 0;
                var usAvailability = (usInventory.getRecord(product.ID) !== null && usInventory.getRecord(product.ID).ATS > 0) ? 1 : 0;
                var caAvailability = (caInventory.getRecord(product.ID) !== null && caInventory.getRecord(product.ID).ATS > 0) ? 1 : 0;
            } catch (e) {
                var error = e;
                logger.error('Error in script reflektionProductFeedExport.js - Error message: ' + error);
                return new Status(Status.OK, null, error.message);
            }
            productRecordArray.push(product.ID); //prod_id
            productRecordArray.push((product.variant || product.variationGroup) ? product.masterProduct.ID : product.ID); //basestyle master id
            productRecordArray.push(product.custom.luggageSize ? product.custom.luggageSize : ''); //luggage_size
            var product_url = '';
            try {
                var prod_url = URLUtils.https('Product-Show', 'pid', product.ID).toString();
                prod_url = prod_url.replace('.html', '/');
                if (prod_url.indexOf(productUrlSplitId) !== -1) {
                    var prod_url_arr = prod_url.split(productUrlSplitId);
                    product_url = productUrlSplitId + prod_url_arr[1];
                }
            } catch (e) {
                var error = e;
                logger.error('Error in script reflektionProductFeedExport.js - Error message: ' + error);
                return new Status(Status.OK, null, error.message);
            }
            productRecordArray.push(product_url); //prod_url
            productRecordArray.push(product.manufacturerName ? product.manufacturerName : ''); //manufacturer
            productRecordArray.push(''); //flash_sale
            productRecordArray.push(usAvailability ? usAvailability : 0); //available_us
            productRecordArray.push(caAvailability ? caAvailability : 0); //available_ca
            productRecordArray.push(productHelper.getNewlyAddedProductFlag(product.creationDate)); //new_arrival new_releases
            productRecordArray.push(''); //exclusive
            productRecordArray.push(''); //bestseller
            productRecordArray.push(product.custom && product.custom.accentable ? product.custom.accentable : false); //accentable
            productRecordArray.push(product.custom && product.custom.monogramable ? product.custom.monogramable : false); //monogramable
            productRecordArray.push(product.custom && product.custom.turntoAverageRating ? product.custom.turntoAverageRating : 0); //rating
            productRecordArray.push(product.custom && product.custom.turntoReviewCount ? product.custom.turntoReviewCount : 0); //review_count
            productRecordArray.push(product.availabilityModel && product.availabilityModel.inventoryRecord && product.availabilityModel.inventoryRecord.backorderable && product.availabilityModel.inventoryRecord.preorderBackorderAllocation && product.availabilityModel.inventoryRecord.preorderBackorderAllocation.value ? product.availabilityModel.inventoryRecord.preorderBackorderAllocation.value : ''); //backorder_na ()
            productRecordArray.push(usInventoryRecord ? usInventoryRecord : 0); //parent_stock_USwarehouse
            productRecordArray.push(caInventoryRecord ? caInventoryRecord : 0); //parent_stock_CAwarehouse
            productRecordArray.push(reflektionHelper.getProductBreadcrumb(product.ID)); //prod_breadcrumbs_list
            productRecordArray.push(product.getName()); //prod_name
            productRecordArray.push(product.getShortDescription()); //prod_desc
            productRecordArray.push(productPrice && productPrice.FinalPrice ? productPrice.FinalPrice.value : 0); //prod_final_price
            productRecordArray.push(productPrice && productPrice.Price ? productPrice.Price.value : 0); //prod_price
            productRecordArray.push(caSalePrice.value || ''); //prod_final_price_ca
            productRecordArray.push(caListPrice.value || ''); //prod_price_ca
            productRecordArray.push(product.custom && product.custom.categories ? product.custom.categories : ''); //category_en
            productRecordArray.push(product.custom && product.custom.color ? product.custom.color : ''); //colours_en
            productRecordArray.push(product.custom.size ? product.custom.size : ''); //size_us_list
            productRecordArray.push(getSizeForBeltsAndApparel(product, 'Belts')); //size_belts
            productRecordArray.push(getSizeForBeltsAndApparel(product, 'Outerwear')); //size_apparrel
            productRecordArray.push(product.creationDate ? product.creationDate : ''); //launch_date
            var color_group_en = Object.hasOwnProperty.call(product.custom, 'colorFamily') && product.custom.colorFamily ? product.custom.colorFamily : '';
            productRecordArray.push(color_group_en); //color_group_en
            var collection_en = Object.hasOwnProperty.call(product.custom, 'grandCollection') && product.custom.grandCollection ? product.custom.grandCollection : '';
            productRecordArray.push(collection_en); //collection_en
            productRecordArray.push(product.custom && product.custom.primaryMaterial ? product.custom.primaryMaterial : ''); //material use basicMaterial
            productRecordArray.push(product.custom && product.custom.expandable ? true : false); //expandable
            productRecordArray.push(product.custom && product.custom.suitorSection ? true : false); //suitor_section
            var gender_en = Object.hasOwnProperty.call(product.custom, 'gender') && product.custom.gender ? product.custom.gender : ''
            productRecordArray.push(gender_en); //gender_en
            var object = {};
            try {
                decorators.badges(object, product);
            } catch (e) {
                var error = e;
                logger.error('Error in script reflektionProductFeedExport.js - Error message: ' + error);
                return new Status(Status.OK, null, error.message);
            }
            productRecordArray.push(object.activeProductBadge ? object.activeProductBadge : ''); //badge_en
            productRecordArray.push(product.master ? '' : product.availabilityModel && product.availabilityModel.inventoryRecord && product.availabilityModel.inventoryRecord.ATS ? product.availabilityModel.inventoryRecord.ATS.value : 0); //sku_stock
            try {
                var sku_id_list = '';
                if (product.master) {
                    for (var i in product.variants) {
                        sku_id_list = sku_id_list + product.variants[i].ID + ' ';
                    }
                } 
            } catch (e) {
                var error = e;
                logger.error('Error in script reflektionProductFeedExport.js - Error message: ' + error);
                return new Status(Status.OK, null, error.message);
            }
            var altImages = getProductImages(product, 'alt');
            var swatchImages = getProductImages(product, 'swatch');
            productRecordArray.push(product.master ? (sku_id_list ? sku_id_list : '') : product.ID); //sku_id_list
            productRecordArray.push(imageUrl !== '' ? imageUrl : '' ); //prod_img_url
            productRecordArray.push(altImages !== '' ? altImages : ''); //altimage_url
            var masterProduct = product.variationModel && product.variationModel.master ? product.variationModel.master : false;
            var isMasterOnline = masterProduct && masterProduct.online && masterProduct.onlineFlag && masterProduct.searchable ? true : false;
            productRecordArray.push(isMasterOnline && product.online && product.onlineFlag && product.searchable ? 1 : 0); //prod_active
            var product_type = Object.hasOwnProperty.call(product.custom, 'levelThreeType') && product.custom.levelThreeType ? product.custom.levelThreeType : '';
            productRecordArray.push(product_type); //product_type
            var laptopSize = Object.hasOwnProperty.call(product.custom, 'laptopSize') && product.custom.laptopSize ? product.custom.laptopSize : '';
            productRecordArray.push(laptopSize); //laptop_size
            var numberOfWheels = Object.hasOwnProperty.call(product.custom, 'numberOfWheels') && product.custom.numberOfWheels ? product.custom.numberOfWheels : '';
            var numberOfWheelsText = '';
            if (numberOfWheels && numberOfWheels == 4) {
                numberOfWheelsText = Resource.msg('reflektion.product.4Wheeled', 'common', null);
            } else if (numberOfWheels && numberOfWheels == 2) {
                numberOfWheelsText = Resource.msg('reflektion.product.2Wheeled', 'common', null);
            } else {
                numberOfWheelsText = Resource.msg('reflektion.product.NonWheeled', 'common', null);
            }
            productRecordArray.push(numberOfWheelsText); //wheels
            var securityFriendly = Object.hasOwnProperty.call(product.custom, 'securityFriendly') && product.custom.securityFriendly ? product.custom.securityFriendly : '';
            productRecordArray.push(securityFriendly); //security_friendly
            productRecordArray.push(swatchImages !== '' ? swatchImages : ''); //swatch_image/
            productRecordArray.push(product.custom && product.custom.isAccentingSku ? 1 : 0); //product_accent
            var sale_us = false;
            try {
                if (product.onlineCategories.length !== 0) {
                    var length = product.onlineCategories.length;
                    if (length !== 0) {
                        for (var i = 0;  i < length - 1; i += 1) {
                            sale_us = getCategoryFlag(product.onlineCategories[i].ID, saleCategoryId);
                            if (sale_us) {
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                var error = e;
                logger.error('Error in script reflektionProductFeedExport.js - Error message: ' + error);
                return new Status(Status.OK, null, error.message);
            }
            productRecordArray.push(sale_us); //sale_us
            var keywords = '';
            try {
                if (product.custom && product.custom.keywords  && product.custom.keywords.length > 0) {
                    for (var i in product.custom.keywords) {
                        keywords = keywords + product.custom.keywords[i].displayValue + '';
                    }
                }
            }
            catch (e) {
                var error = e;
                logger.error('Error in script reflektionProductFeedExport.js - Error message: ' + error);
                return new Status(Status.OK, null, error.message);
            }
            productRecordArray.push(keywords); //search_keywords
            try {
                var ccids = '';
                if (product.onlineCategories.length !== 0) {
                    var length = product.onlineCategories.length;
                    if (length !== 0) {
                        for (var i = 0;  i < length - 1; i += 1) {
                            ccids = ccids + product.onlineCategories[i].ID + ' | ';
                        }
                        ccids = ccids + product.onlineCategories[length-1].ID;
                    }
                }
            } catch (e) {
                var error = e;
                logger.error('Error in script reflektionProductFeedExport.js - Error message: ' + error);
                return new Status(Status.OK, null, error.message);
            }
            productRecordArray.push(ccids ? ccids : ''); //ccids
            productRecordArray.push((product.custom && product.custom.monogramable ? 'monogramable ' : '') + (product.custom && product.custom.suitorSection ? 'suitor Section ' : '') + (product.custom && product.custom.expandable ? 'expandable' : '')); //derived_feature
            productRecordArray.push(''); //promo_label_id_en
            productRecordArray.push(''); //promo_label_us
            productRecordArray.push(''); //promo_label_ca
            productRecordArray.push(''); //prod_active_ca
            productRecordArray.push(isMasterOnline && product.online && product.onlineFlag && product.searchable ? 1 : 0); //prod_active_us
            productRecordArray.push((product.variant || product.variationGroup) ? product.masterProduct.ID : product.ID); //product_group
            var hardsided = Object.hasOwnProperty.call(product.custom, 'hardsided') && product.custom.hardsided ? true : false;
            productRecordArray.push(hardsided); //hardsided
            var softsided = Object.hasOwnProperty.call(product.custom, 'softsided') && product.custom.softsided ? true : false;
            productRecordArray.push(softsided); //softsided
            var garment_compartment = Object.hasOwnProperty.call(product.custom, 'garmentCompartment') && product.custom.garmentCompartment ? true : false;
            productRecordArray.push(garment_compartment); //garment_compartment
            var packable = Object.hasOwnProperty.call(product.custom, 'packable') && product.custom.packable ? true : false;
            productRecordArray.push(packable); //packable
            var usb_port = Object.hasOwnProperty.call(product.custom, 'usbPort') && product.custom.usbPort ? true : false;
            productRecordArray.push(usb_port); //usb_port
            var lock_closure = Object.hasOwnProperty.call(product.custom, 'lockClosure') && product.custom.lockClosure ? true : false;
            productRecordArray.push(lock_closure); //lock_closure
            var media_pocket = Object.hasOwnProperty.call(product.custom, 'mediaPocket') && product.custom.mediaPocket ? true : false;
            productRecordArray.push(media_pocket); //media_pocket
            var add_a_bag = Object.hasOwnProperty.call(product.custom, 'addaBag') && product.custom.addaBag ? true : false;
            productRecordArray.push(add_a_bag); //add_a_bag
            var productFeedStringWithDevider = '';
            productFeedStringWithDevider = convertArrayValuesToStringWithDevider(productRecordArray, '\t');

            writer.writeLine(productFeedStringWithDevider);
        }

        writer.close();

        // If true, then upload the product feed after it is exported.
        var rfkProductFeedUploadEnabled = reflektionHelper.getRFKProductFeedUploadEnabled();
        if (rfkProductFeedUploadEnabled) {
            // Service Call
            var responseObj = reflektionFeedUpload.upload(fileName);
            if (responseObj.code === 'ERROR') {
                return new Status(Status.ERROR, null, 'Error in script reflektionProductFeedExport.js - Feed upload service error - Message: ' + responseObj.message);
            }
            if (responseObj.code === 'OK') {
                return new Status(Status.OK, null, 'ReflektionProductFeedExport job finished, product feed upload successful');
            }
        }
    } catch (e) {
        var error = e;
        logger.error('Error in script reflektionProductFeedExport.js - Error message: ' + error);
        return new Status(Status.ERROR, null, e.message);
    }
    return new Status(Status.OK, null, 'ReflektionProductFeedExport job finished, product upload feed not enabled');
}

module.exports = {
    execute: execute
};
