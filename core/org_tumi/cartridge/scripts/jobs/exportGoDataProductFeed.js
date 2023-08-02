'use strict';

var FileWriter = require('dw/io/FileWriter');
var ProductManager = require('dw/catalog/ProductMgr');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');
var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var File = require('dw/io/File');

var cronjobHelper = require('org_tumi/cartridge/scripts/helpers/cronjobHelper');

/* Custom Logger */
var logger = Logger.getLogger('GoDataProduct', 'ProductFeedExport');

var headers = ['Unique ID', 'Name', 'Description', 'Price', 'CAD Price', 'Merchant Category', 'URL', 'Image URL',
    'Manufacturer', 'Manufacturer Part Number', 'Brand', 'Keywords', 'Shipping Price', 'Quantity', 'Weight', 'Condition',
    'UPC', 'Sale Price', 'Stock Status', 'Tax Code', 'Availability', 'Bingads Redirect', 'Google Product Category', 'gtin',
    'identifier exists', 'Long Title', 'Merchant Logo', 'Offer Type', 'Product Applicability', 'Product Name', 'Promotion Effective Dates',
    'Promotion ID', 'Redemption Channel', 'Shipping', 'Short Title', 'Small URL', 'Title', 'CA Stock Status', 'CA Sale Price', 'CA Quantity',
    'size', 'country_size', 'color', 'currency', 'instock', 'Product Type', 'Sale price effective date for US', 'Sale price effective date for CA',
    'GrandCollection', 'Image 600pURL', 'gender', 'Active'];

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
        logger.error('Error in script exportGoDataProductFeed.js: getBreadcrumb() - Error message: ' + e.message);
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
        logger.error('Error in script exportGoDataProductFeed.js: getProductBreadcrumb() - Error message: ' + e.message);
        return '';
    }
    return breadCrumbs;
}

/**
 * Checking 2 collection attributes
 * @param {Object} product the product object
 * @return {string} return collection name
 */
function getcollection(product) {
    var collection = '';
    if (product.custom.grandCollection) {
        collection = product.custom.grandCollection;
    } else if (product.custom.collection) {
        collection = product.custom.collection;
    }
    return collection;
}

/**
 * Generate product feed and push into Array
 * @param {Object} product the product object
 * @param {string} productName product name
 * @param {string} url site specific url
 * @param {string} imageUrl product image
 * @param {Object} customPreferenceObj object which contains cronJobConfiguration custom preference info
 * @param {Object} usInventory US inventory
 * @param {Object} caInventory CA inventory
 * @return {Array} - return array contains product feeds
 */
function getGoDataProductFeed(product, productName, url, imageUrl, customPreferenceObj, usInventory, caInventory) {
    var productFeed = [];
    var usInventoryRecord = usInventory.getRecord(product.ID) !== null ? usInventory.getRecord(product.ID).ATS.value : 0;
    var caInventoryRecord = caInventory.getRecord(product.ID) !== null ? caInventory.getRecord(product.ID).ATS.value : 0;

    var usAvailability = (usInventory.getRecord(product.ID) !== null && usInventory.getRecord(product.ID).ATS > 0) ? 'inStock' : '';
    var caAvailability = (caInventory.getRecord(product.ID) !== null && caInventory.getRecord(product.ID).ATS > 0) ? 'in stock' : 'out of stock';

    productFeed.push(product.getID() || '');
    productFeed.push(productName || '');
    productFeed.push(product.getShortDescription() || '');
    productFeed.push(cronjobHelper.getProductListPrice(product.ID, customPreferenceObj.usSiteListPriceBookID) || '');
    productFeed.push(cronjobHelper.getProductListPrice(product.ID, customPreferenceObj.caSiteListPriceBookID) || '');
    productFeed.push(getProductBreadcrumb(product.ID) || '');
    productFeed.push(url || '');
    productFeed.push(imageUrl || '');
    productFeed.push('');
    productFeed.push(product.getID() || '');
    productFeed.push(product.brand || '');
    productFeed.push('');
    productFeed.push('');
    productFeed.push(usInventoryRecord);
    productFeed.push(product.custom.netWeightLb || '');
    productFeed.push('new');
    productFeed.push(product.UPC || '');
    productFeed.push(cronjobHelper.getProductListPrice(product.ID, customPreferenceObj.usSiteSalePriceBookID) || '');
    productFeed.push(usAvailability);
    productFeed.push(product.custom.avalaraTaxCode || '');
    productFeed.push(usAvailability);
    productFeed.push(cronjobHelper.generateUSandCAPdpUrls(product, customPreferenceObj.usSiteHostName) || '');
    productFeed.push(getProductBreadcrumb(product.ID) || '');
    productFeed.push(product.UPC || '');
    productFeed.push('FALSE');
    productFeed.push(product.getShortDescription() || '');
    productFeed.push(URLUtils.staticURL('/images/tumi-logo-new.svg'));
    productFeed.push('NO_CODE');
    productFeed.push('');
    productFeed.push(productName || '');
    productFeed.push('');
    productFeed.push('');
    productFeed.push('online');
    productFeed.push('');
    productFeed.push(product.getShortDescription() || '');
    productFeed.push(imageUrl || '');
    productFeed.push(productName || '');
    productFeed.push(caAvailability);
    productFeed.push(cronjobHelper.getProductListPrice(product.ID, customPreferenceObj.caSiteSalePriceBookID) || '');
    productFeed.push(caInventoryRecord);
    productFeed.push(product.custom.size ? product.custom.size : 'NULL');
    productFeed.push('NULL');
    productFeed.push(product.custom.color || '');
    productFeed.push('USD');
    productFeed.push(usAvailability);
    productFeed.push('');
    productFeed.push(product.onlineFrom || '');
    productFeed.push(product.onlineFrom || '');
    productFeed.push(getcollection(product));
    productFeed.push((imageUrl !== '') ? imageUrl + '?hei=600&wid=600' : '');
    productFeed.push(product.custom.gender || '');
    productFeed.push(product.online ? 'Y' : 'F');

    return productFeed;
}

/**
 * Convert Array of column header strings to a string with semicolons
 * @param {Object} jobParams - Master catalog
 * @return {Object} Job status
 */
function exportProductFeeds(jobParams) {
    var fileWriter = null;

    try {
        var sp = File.SEPARATOR;
        // Set file path from site preference
        var filePath = 'src/product/gdf';
        var fileDir = File.IMPEX + sp + filePath;
        var exportedDate = StringUtils.formatCalendar(new Calendar(), 'yyyyMMdd');
        // Set file name from site preference
        var fileName = 'sfcc_tumi_products_' + exportedDate + '.txt';
        var outputFile = new File(fileDir + sp + fileName);
        if (!outputFile.exists()) {
            new File(fileDir).mkdirs();
            outputFile.createNewFile();
        }
        fileWriter = new FileWriter(outputFile, 'UTF-8');
        var locales = Site.current.allowedLocales;

        // Writing Headers on File
        var headersToString = cronjobHelper.convertArrayValuesToStringWithDevider(headers, '\t');
        fileWriter.writeLine(headersToString);

        // Loop through the products and write to file
        var productIter = ProductManager.queryAllSiteProducts();
        while (productIter.hasNext()) {
            var product = productIter.next();
            if (product.bundle || product.productSet) {
                continue; // eslint-disable-line no-continue
            }
            if (product.isMaster() || product.variationGroup || !product.ID) {
                continue;// eslint-disable-line no-continue
            }
            // Get product Name
            var productName = product.getName();
            // Get Object which contains CronJobConfiguration custom preference values
            var customPreferenceObj = cronjobHelper.generateCronJobConfigObj();
            // US URL
            var siteURL = cronjobHelper.generateUSandCAPdpUrls(product, customPreferenceObj.usSiteHostName);
            // Generate image Url
            var scene7Host = Site.current.getCustomPreferenceValue('scene7Host');
            var scene7Postfix = JSON.parse(Site.current.getCustomPreferenceValue('scene7Postfix'));
            var styleVariant = Object.hasOwnProperty.call(product.custom, 'styleVariant') && product.custom.styleVariant ? product.custom.styleVariant : '';
            var imageUrl = !empty(styleVariant) ? (scene7Host + styleVariant + scene7Postfix.main) : '';

            var usInventory = ProductInventoryMgr.getInventoryList(customPreferenceObj.usSiteInventoryID);
            var caInventory = ProductInventoryMgr.getInventoryList(customPreferenceObj.caSiteInventoryID);

            var productFeed = getGoDataProductFeed(product, productName, siteURL, imageUrl, customPreferenceObj, usInventory, caInventory);
            var productFeedStringWithDevider = cronjobHelper.convertArrayValuesToStringWithDevider(productFeed, '\t');

            fileWriter.writeLine(productFeedStringWithDevider);
        }

        fileWriter.close();
    } catch (e) {
        if (e) throw e;
        return new Status(Status.ERROR);
    } finally {
        // check all readers are closed in case the catch block is hit
        if (!empty(fileWriter)) {
            fileWriter.close();
        }
    }
    return new Status(Status.OK, 'OK', 'Export GoData Product Feed by Date was successful.');
}

module.exports = {
    exportProductFeeds: exportProductFeeds
};
