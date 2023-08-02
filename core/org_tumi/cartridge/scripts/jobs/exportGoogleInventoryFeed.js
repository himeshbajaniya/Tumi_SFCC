'use strict';

var FileWriter = require('dw/io/FileWriter');
var ProductManager = require('dw/catalog/ProductMgr');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var Money = require('dw/value/Money');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var Transaction = require('dw/system/Transaction');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var DATETIME_FORMAT_PATH = 'yyyy-MM-dd_HH-mm-ss-SSS';

var cronjobHelper = require('org_tumi/cartridge/scripts/helpers/cronjobHelper');

/* Custom Logger */
var logger = Logger.getLogger('googleInventoryFeed', 'ProductFeedExport');

/* Headers */
var headers = ['store code', 'itemid', 'price', 'quantity', 'sale price'];

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
 * Generate product inventory feed and push into productInventoryFeed Array
 * @param {Object} product the product object
 * @param {Object} customPreferenceObj object which contains cronJobConfiguration custom preference info
 * @param {Object} usInventory US inventory
 * @return {Array} - return array contains product feeds
 */
function getProductInventoryFeed(product, customPreferenceObj, usInventory) {
    var productInventoryFeed = [];
    var usInventoryRecord = usInventory.getRecord(product.ID) !== null ? usInventory.getRecord(product.ID).ATS.value : 0;

    productInventoryFeed.push('store code'); // store code
    productInventoryFeed.push(product.getID()); // itemid
    productInventoryFeed.push(getProductListPrice(product.ID, customPreferenceObj.usSiteListPriceBookID) || ''); // price
    productInventoryFeed.push(usInventoryRecord); // quantity
    productInventoryFeed.push(getProductListPrice(product.ID, customPreferenceObj.usSiteSalePriceBookID) || ''); // sale price

    return productInventoryFeed;
}

/**
 * Convert Array of column header strings to a string with semicolons
 * @param {Object} - jobParams Master catalog
 * @return {Object} Job status
 */
function exportGoogleInventoryFeeds(jobParams) {
    var fileWriter = null;

    try {
        var sp = File.SEPARATOR;
        // Set file path from site preference
        var filePath = 'src/product';
        var fileDir = File.IMPEX + sp + filePath;
        var exportedDate = StringUtils.formatCalendar(new Calendar(), 'yyyy-MM-dd_HH-mm-ss-SSS');
        // Set file name from site preference
        var fileName = 'googleInventoryFeed_' + exportedDate + '.txt';
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

            // Get Object which contains CronJobConfiguration custom preference values
            var customPreferenceObj = cronjobHelper.generateCronJobConfigObj();

            var usInventory = ProductInventoryMgr.getInventoryList(customPreferenceObj.usSiteInventoryID);

            var productFeed = getProductInventoryFeed(product, customPreferenceObj, usInventory);
            var productFeedStringWithDevider = cronjobHelper.convertArrayValuesToStringWithDevider(productFeed, '\t');

            fileWriter.writeLine(productFeedStringWithDevider);
        }

        Transaction.wrap(function () {
            productIter.setExportStatus(1);
        });

        fileWriter.close();
    } catch (e) {
        if (e) throw e;
        logger.error('Error in script exportGoogleInventoryFeed.js - Error message: ' + e.message);
        return new Status(Status.ERROR);
    } finally {
        // check all readers are closed in case the catch block is hit
        if (!empty(fileWriter)) {
            fileWriter.close();
        }
    }
    return new Status(Status.OK, 'OK', 'Export Product Incentory by Date was successful.');
}

module.exports = {
    exportGoogleInventoryFeeds: exportGoogleInventoryFeeds
};
