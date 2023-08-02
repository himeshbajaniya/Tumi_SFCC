'use strict';

var FileWriter = require('dw/io/FileWriter');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var inventoryHelper = require('org_tumi/cartridge/scripts/helpers/inventoryHelper.js');

/* Custom Logger */
var logger = Logger.getLogger('Google', 'InventoryFeed');


importPackage(dw.catalog);
importPackage(dw.system);
importPackage(dw.io);
importPackage(dw.util);

/**
 * @function
 * @name execute
 * @param {Object} jobParams Job parameters
 * @returns {dw.system.Status} Status object
 */
exports.execute = function(jobParams, jobStepExecution) { // eslint-disable-line no-unused-vars

    var fileDir = File.IMPEX + "/src/inventory/";
    var exportedDate = StringUtils.formatCalendar(new Calendar(), 'yyyy-MM-dd_HH-mm-ss-SSS');
    // Set file name from site preference
    var fileName = 'GDF_InventoryFeed' + exportedDate + '.txt';
    var outputFile = new File(fileDir + fileName);
    if (!outputFile.exists()) {
        new File(fileDir).mkdirs();
        outputFile.createNewFile();
    }

    var fileWriter : FileWriter = new FileWriter(outputFile, "UTF-8");
    var streamWriter = new CSVStreamWriter(fileWriter, '\t', '"');
	
    try {
    	streamWriter.writeNext(["store code", "itemid", "price", "quantity", "sale price"]);
    
    	// Loop through the products and write to file
    	var productIter = ProductMgr.queryAllSiteProducts();
    	var invListIds = inventoryHelper.getInventoryLists();
    
    	while (productIter.hasNext()) {
    		var product = productIter.next();
    		if (product.bundle || product.productSet) {
    			continue; // eslint-disable-line no-continue
    		}
    		
    		Logger.debug("Product {0}", product.ID);
    		
    		var listPrice = product.getPriceModel().getPriceBookPrice("usd-list-prices").getValue();
    		var salePrice = product.getPriceModel().getPriceBookPrice("usd-sale-prices").getValue();
    		
    		// 	loop through all inventory lists
    		for each (var invListId in invListIds) {        
    			var productInventoryList = ProductInventoryMgr.getInventoryList(invListId.id);
    			Logger.debug("invListId.id {0}", invListId.id);
    			var productInventoryRecord = productInventoryList.getRecord(product);
    			
    			if (productInventoryRecord != null) {
    				streamWriter.writeNext([invListId.id, product.ID, listPrice, productInventoryRecord.getStockLevel(), salePrice]);
    			}
    		}
    		
    		fileWriter.flush();	
    	}

    	fileWriter.flush();

    } catch (e) {
    	logger.error('Error in script googleInventoryFeedJob - Error message: ' + e.message);
    	logger.error(e.stack);
    	
    	return new Status(Status.ERROR, null, e.message);
    } finally {
    	// 	check all readers are closed in case the catch block is hit
    	if (!empty(streamWriter)) {
    		streamWriter.close();
    	}
    	if (!empty(fileWriter)) {
    		fileWriter.close();
    	}
    }
    
    return new Status(Status.OK, null, 'googleInventoryFeedJob job finished');
    
}

