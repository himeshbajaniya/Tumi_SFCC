'use strict';

var FileWriter = require('dw/io/FileWriter');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
var JobHelpers = require('org_tumi/cartridge/scripts/helpers/cronjobHelper');
var PriceMgr = require('dw/catalog/PriceBookMgr');
var InventoryMgr = require('dw/catalog/ProductInventoryMgr');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var jobHelper = require('*/cartridge/scripts/helpers/jobHelper');

/* Custom Logger */
var logger = Logger.getLogger('Linc', 'ProductFeedExport');

/**
 * Create header record array
 * @param {Array} customAttributes list of custom product attributes
 * @return {Array} the header record labels
 */
function createHeaderRecord(customAttributes) {
    // Write header labels
    var headerRecord = [];
    for each (var attributeID in customAttributes) {
        headerRecord.push(attributeID);
    }
    return headerRecord;
}

/**
 * @function
 * @name execute
 * @param {Object} jobParams Job parameters
 * @returns {dw.system.Status} Status object
 */
function execute(jobParams) { // eslint-disable-line no-unused-vars
    try {
        var sp = File.SEPARATOR;
        // Set file path from site preference
        var filePath = 'src/product/linc';
        var fileDir = File.IMPEX + sp + filePath;
        var directory = new File(fileDir);
        if (!empty(directory) && !directory.isDirectory()) {
            fileDir = File.IMPEX + sp + filePath + sp;
            jobHelper.createDirectory(fileDir);
        }

        var fileDirArchieve = File.IMPEX + sp + filePath + sp + 'archive';
        directory = new File(fileDirArchieve);
        if (!empty(directory) && !directory.isDirectory()) {
            fileDirArchieve = File.IMPEX + sp + filePath + sp + 'archive';
            jobHelper.createDirectory(fileDirArchieve);
        }
        
        var date = StringUtils.formatCalendar(new Calendar(), 'MMddyyyy');
        // Set file name from site preference
        var fileName = 'lincProductFeed_'+ date +'.csv';
        var outputFile = new File(fileDir + sp + fileName);
        if (!outputFile.exists()) {
            outputFile.createNewFile();
        }

        var fw = new FileWriter(outputFile, 'UTF-8');
        var writer = new CSVStreamWriter(fw);
        var customAttributes = ['id', 'title', 'description', 'google_product_category', 'product_type', 'link', 'link_ca', 'image_link', 'availability', 'availability_ca', 'price', 'price_ca', 'brand', 'item_group_id', 'gender', 'color', 'size', 'material'];

        // Write header labels
        var headerRecord = createHeaderRecord(customAttributes);
        writer.writeNext(headerRecord);
        var preferenceValues = JobHelpers.generateCronJobConfigObj();

        // Loop through the products and write to file
        var productIter = ProductMgr.queryAllSiteProducts();
        while (productIter.hasNext()) {
            var product = productIter.next();
            if (product.bundle || product.productSet) {
                continue; // eslint-disable-line no-continue
            }

            var sites = Site.getAllSites();
            var hostUS = preferenceValues.usSiteHostName;
            var hostCA = preferenceValues.caSiteHostName;
            var availabilityCA = false;
            var inventoryModelCA = InventoryMgr.getInventoryList(preferenceValues.caSiteInventoryID);
            var inventoryModelUS = InventoryMgr.getInventoryList(preferenceValues.usSiteInventoryID);
            var productURLUS = (!empty(product) && !empty(product.getName())) ? JobHelpers.generateUSandCAPdpUrls(product, hostUS) : '';
            var productURLCA = (!empty(product) && !empty(product.getName())) ? JobHelpers.generateUSandCAPdpUrls(product, hostCA) : '';
           
            var productRecordArray = [];
            var styleVariant = Object.hasOwnProperty.call(product.custom, 'styleVariant') && product.custom.styleVariant ? product.custom.styleVariant : '';
            productRecordArray.push(product.getID()); // product id
            productRecordArray.push(product.getName()); // product name
            productRecordArray.push(product.getShortDescription()); // product short description
            productRecordArray.push(''); // Google Product Category - Needs Mapping
            productRecordArray.push(product.custom.levelThreeType); // product type
            productRecordArray.push(productURLUS); // locale specific product url
            productRecordArray.push(productURLCA); // Link CA
            productRecordArray.push(OrderHelpers.getImageURL(styleVariant)); // image url
            productRecordArray.push(inventoryModelUS.getRecord(product) ? (inventoryModelUS.getRecord(product).getATS() > 0 ? true : false) : false); // product availability stock
            productRecordArray.push(inventoryModelCA.getRecord(product) ? (inventoryModelCA.getRecord(product).getATS() > 0 ? true : false) : false); // Availability CA
            productRecordArray.push(JobHelpers.getProductListPrice(product.getID(), preferenceValues.usSiteListPriceBookID)); // product list price
            productRecordArray.push(JobHelpers.getProductListPrice(product.getID(), preferenceValues.caSiteListPriceBookID)); // Price CA
            productRecordArray.push(product.getBrand()); // product brand
            productRecordArray.push(product.variant || product.variationGroup ? product.masterProduct.ID : product.ID); // product group
            productRecordArray.push(product.custom.gender); // product gender
            productRecordArray.push(product.custom.color); // product color
            productRecordArray.push(product.custom.size); // product size
            productRecordArray.push(product.custom.primaryMaterial); // product material - Not final. Could be reviewed

            writer.writeNext(productRecordArray);
        }

        writer.close();
        fw.close();

    } catch (e) {
        var error = e;
        logger.error('Error in script lincProductExport.js - Error message: ' + error);
        return new Status(Status.ERROR, null, e.message);
    }
    return new Status(Status.OK, null, 'LincProductExport job finished, product upload feed not enabled');
}

module.exports = {
    execute: execute
};
