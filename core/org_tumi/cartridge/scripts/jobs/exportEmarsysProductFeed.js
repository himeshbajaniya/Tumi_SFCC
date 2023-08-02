'use strict';

var FileWriter = require('dw/io/FileWriter');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var ProductManager = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');

var cronjobHelper = require('org_tumi/cartridge/scripts/helpers/cronjobHelper');

/* Custom Logger */
var logger = Logger.getLogger('Emarsys', 'ProductFeedExport');

/* Headers */
var customAttributes = ['c_hybris_sku', 'c_legacy_sku', 'c_upc', 'c_material_grid', 'title', 'link', 'link_us', 'link_ca', 'image', 'zoom_image', 
'category', 'available', 'available_us', 'available_ca', 'description', 'price', 'price_us', 'price_ca', 'msrp', 'msrp_us', 'msrp_ca', 
'c_parentproductid', 'c_status', 'c_status_us', 'c_status_ca', 'c_salecondition', 'c_available_qty', 'c_availableqty_us', 'c_availableqty_ca', 
'c_size', 'c_color', 'c_weight', 'c_collection', 'c_gender', 'c_content', 'c_silhouette', 'c_colorfamily'];

/**
 * Takes product Feeds object and push values into feeds array with same order as customAttributes order.
 * @param {Object} - Return value of getFeeds function: Contains all values associated with customAttributes values
 * @return {Array} returns array of feed values - ex: ['01357801596', '', '', 'Leather' ...]
 */
 function addFeedsIntoArray(productFeeds) {
    var feeds = [];
    for (let attribute of customAttributes) {
        if (productFeeds[attribute] == undefined) {
            feeds.push(''); 
        } else {
            feeds.push(productFeeds[attribute]);
        }
    }
    return feeds;
}

/**
 * Breadcrumb for category feed
 * @param {Object} category the category object
 * @return {string} return breadcrumb for the given category, category names in the breadcrumb are delimited by '>'
 */
function getBreadcrumb(category) {
    try {
        var currentCat = category;
        var breadcrumb = [];
        breadcrumb.push(currentCat.displayName);
        while (!currentCat.root) {
            var parentCat = currentCat.parent;
            if (!parentCat.root) {
                breadcrumb.push(parentCat.displayName);
            }
            currentCat = parentCat;
        }
        return (breadcrumb.reverse().join('>'));
    } catch (e) {
        logger.error('Error in script exportEmarsysProductFeed.js: getBreadcrumb() - Error message: ' + e.message);
        return '';
    }
}

/**
 * All online categories for given product id
 * @param {string} productID the product id
 * @return {string} return breadcrumbs for the given product id, e.g. Hidden Category>Sale>Womens>Clothing|Womens>Clothing>Tops
 */
function getProductBreadcrumb(productID) {
    var breadCrumbs = '';
    try {
        var product = ProductManager.getProduct(productID);
        var productBreadcrumbs = [];
        if (product.isVariant()) {
            product = product.getMasterProduct();
        }
        var catIterator = product.onlineCategories.iterator();
        while (catIterator.hasNext()) {
            var currentCat = catIterator.next();
            var breadcrumb = getBreadcrumb(currentCat);
            productBreadcrumbs.push(breadcrumb);
        }
        breadCrumbs = productBreadcrumbs.join('|');
    } catch (e) {
        logger.error('Error in script exportEmarsysProductFeed.js: getProductBreadcrumb() - Error message: ' + e.message);
        return '';
    }
    return breadCrumbs;
}

/**
 * Create feeds object with associated key value pairs
 * @param {Object} product the product object
 * @param {String} productName product name
 * @param {String} imageUrl product image URL
 * @param {String} link_us for us pdp
 * @param {String} link_ca for ca pdp
 * @return {Object} return product's feeds object which contains customAttributes as key and associated values
 */
function getFeeds(product, productName, imageUrl, link_us, link_ca) {
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');

    var customPreferenceObj = cronjobHelper.generateCronJobConfigObj();
    var usInventory = ProductInventoryMgr.getInventoryList(customPreferenceObj.usSiteInventoryID);
    var caInventory = ProductInventoryMgr.getInventoryList(customPreferenceObj.caSiteInventoryID);

    var usInventoryRecord = (usInventory !== null && usInventory.getRecord(product.ID) !== null) ? usInventory.getRecord(product.ID).ATS.value : 0;
    var caInventoryRecord = (caInventory !== null && caInventory.getRecord(product.ID) !== null) ? caInventory.getRecord(product.ID).ATS.value : 0;

    var usAvailability = (usInventory !== null && usInventory.getRecord(product.ID) !== null && usInventory.getRecord(product.ID).ATS > 0) ? 'inStock' : '';
    var caAvailability = (caInventory !== null && caInventory.getRecord(product.ID) !== null && caInventory.getRecord(product.ID).ATS > 0) ? 'in stock' : 'out of stock';
    return {
        c_hybris_sku: product.getID(),
        c_legacy_sku: '',
        c_upc: product.UPC,
        c_material_grid: product.custom.primaryMaterial,
        title: productName,
        link: link_us, 
        link_us: link_us,
        link_ca: link_ca,
        image: imageUrl,
        zoom_image: (imageUrl !== '') ? imageUrl + '?hei=600&wid=600' : '',
        category: getProductBreadcrumb(product.ID),
        available: '', 
        available_us: usAvailability,
        available_ca: caAvailability, 
        description: product.getShortDescription(),
        price: '', 
        price_us: cronjobHelper.getProductListPrice(product.ID, customPreferenceObj.usSiteListPriceBookID) || '',
        price_ca: cronjobHelper.getProductListPrice(product.ID, customPreferenceObj.caSiteListPriceBookID) || '',
        msrp: '',
        msrp_us: '',
        msrp_ca: '',
        c_parentproductid: (product.variant || product.variationGroup ? product.masterProduct.ID : product.ID),
        c_status: '',
        c_status_us: usAvailability,
        c_status_ca: caAvailability,
        c_salecondition: 'new',
        c_available_qty: '',
        c_availableqty_us: usInventoryRecord,
        c_availableqty_ca: caInventoryRecord,
        c_size: product.custom.size ? product.custom.size : 'NULL',
        c_color: product.custom.color,
        c_weight: product.custom.netWeightLb ? product.custom.netWeightLb : '',
        c_collection: product.custom.grandCollection ? product.custom.grandCollection : product.custom.collection, 
        c_gender: product.custom.gender,
        c_content: '',
        c_silhouette: '',
        c_colorfamily: product.custom.color
    }
}

/**
 * @function - Loop through the catalog and write a emarsysProductFeed CSV files 
 * @name getProductFeeds
 * @param {Object} jobParams Job parameters
 * @returns {dw.system.Status} Status object
 */
function getProductFeeds(jobParams) { // eslint-disable-line no-unused-vars
    try {
        var sp = File.SEPARATOR;
        // Set file path from site preference
        var filePath = 'src/product/emarsys';
        var fileDir = File.IMPEX + sp + filePath;
        var exportedDate = StringUtils.formatCalendar(new Calendar(), 'yyyyMMdd');
        // Set file name from site preference
        var fileName = 'sfcc_products_' + exportedDate + '.csv';
        var outputFile = new File(fileDir + sp + fileName);
        if (!outputFile.exists()) {
            new File(fileDir).mkdirs();
            outputFile.createNewFile();
        }

        var fw = new FileWriter(outputFile, 'UTF-8');
        var writer = new CSVStreamWriter(fw);
        var locales = Site.current.allowedLocales;

        // Write header labels
        writer.writeNext(customAttributes);

        // Loop through the products and write to file
        var productIter = ProductManager.queryAllSiteProducts();
        while (productIter.hasNext()) {
            var product = productIter.next();

            if (product.isMaster() || product.variationGroup || !product.ID) {
                continue;// eslint-disable-line no-continue
            }

            if (product.bundle || product.productSet) {
                continue; // eslint-disable-line no-continue
            }
           
            //Generate image Url
            var scene7Host = Site.current.getCustomPreferenceValue('scene7Host');
            var scene7Postfix = JSON.parse(Site.current.getCustomPreferenceValue('scene7Postfix'));
            var styleVariant = Object.hasOwnProperty.call(product.custom, 'styleVariant') && product.custom.styleVariant ? product.custom.styleVariant : '';
            var imageUrl = !empty(styleVariant) ? (scene7Host + styleVariant + scene7Postfix.main) : '';
            //Get product Name
            var productName = product.getName() ? product.getName() : '';
            //Get Object which contains CronJobConfiguration custom preference values 
            var customPreferenceObj = cronjobHelper.generateCronJobConfigObj();
            
            //PDP links for US and CA
            var usUrl = cronjobHelper.generateUSandCAPdpUrls(product, customPreferenceObj.usSiteHostName);
            var caUrl = cronjobHelper.generateUSandCAPdpUrls(product, customPreferenceObj.caSiteHostName);

            //Get Feeds and convert Feeds object into Array
            var productFeeds = getFeeds(product, productName, imageUrl, usUrl, caUrl);
            var convertToStrProductFeeds = addFeedsIntoArray(productFeeds);

            // Write product feeds
            writer.writeNext(convertToStrProductFeeds);
        }

        writer.close();
        fw.close();

    } catch (e) {
        var error = e;
        logger.error('Error in script exportEmarsysProductFeed.js - Error message: ' + error);
        return new Status(Status.ERROR, null, e.message);
    }
    return new Status(Status.OK, null, 'EmarsysProductFeed job finished, product upload feed not enabled');
}

module.exports = {
    getProductFeeds: getProductFeeds
};