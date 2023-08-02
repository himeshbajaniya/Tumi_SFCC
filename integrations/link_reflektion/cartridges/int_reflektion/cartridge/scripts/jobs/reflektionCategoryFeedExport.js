'use strict';

/**
 *  This script generates a CSV category feed for Reflektion
 */

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var CatalogMgr = require('dw/catalog/CatalogMgr');

/* Script Modules */
var reflektionHelper = require('~/cartridge/scripts/reflektionHelper');
var reflektionFeedUpload = require('~/cartridge/scripts/jobs/reflektionFeedUpload');
var cronjobHelper = require('org_tumi/cartridge/scripts/helpers/cronjobHelper');

/* Custom Logger */
var logger = Logger.getLogger('reflektion', 'CategoryFeedExport');

function getCategoryPathForRfk(cgid ,breadcrumbs) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var category;

    if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (category) {
        breadcrumbs.push({
            ID: category.ID
        });

        if (category.parent && category.parent.ID !== 'root') {
            return getCategoryPathForRfk(category.parent.ID, breadcrumbs);
        }
        if (category.parent.ID === 'root') {
            breadcrumbs.push({
                ID: 'c'
            });
        }
    }
    breadcrumbs = breadcrumbs.reverse();

    var categoryPath = '';
    for (var i in breadcrumbs) {
        categoryPath = categoryPath + '/' + breadcrumbs[i].ID;
    }

    return categoryPath;
}


/**
 * Write a category record for each online category to outputFile
 * @param {Object} category the category object
 * @param {Object} writer the CSVStreamWriter object
 */
function processCat(category, writer) {
    var locales = Site.current.allowedLocales;
    var excludedLocals = reflektionHelper.getLocalExcludeList();
    var catIterator = category.onlineSubCategories.iterator();
    while (catIterator.hasNext()) {
        var cat = catIterator.next();
        var categoryRecord = [];
        // Reset locale to default
        request.setLocale('default'); // eslint-disable-line no-undef
        categoryRecord.push(cat.ID);
        categoryRecord.push(cat.displayName);
        var categoryUrl = '';
        try {
            var catSplitId = Site.getCurrent().getCustomPreferenceValue('categorySplitId');
            var catUrl = URLUtils.https('Search-Show', 'cgid', cat.ID).toString();
            if (catUrl.indexOf(catSplitId) !== -1) {
                var catUrlArr = catUrl.split(catSplitId);
                categoryUrl += catSplitId + catUrlArr[1];
            }
        } catch (e) {
            var error = e;
            logger.error('Error in script reflektionCategoryFeedExport.js - Error message: ' + error);
            return new Status(Status.OK, null, error.message);
        }
        categoryRecord.push(categoryUrl || '');
        categoryRecord.push(cat.parent.ID || '');
        categoryRecord.push(cat.pageTitle || '');
        categoryRecord.push(cat.description || '');
        categoryRecord.push(cat.root || '');
        categoryRecord.push(reflektionHelper.getBreadcrumb(cat) || '');
        var categoryFeedStringWithDevider = cronjobHelper.convertArrayValuesToStringWithDevider(categoryRecord, '\t');
        writer.writeLine(categoryFeedStringWithDevider);
        processCat(cat, writer);
    }
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
            logger.info('ReflektionCategoryFeedExport job finished, reflektion site preference not enabled');
            return new Status(Status.OK, null, 'ReflektionCategoryFeedExport job finished, reflektion site preference not enabled');
        }
        var sp = File.SEPARATOR;
        // Set file path from site preference
        var filePath = reflektionHelper.getRFKFeedExportPath();
        var fileDir = File.IMPEX + sp + filePath;
        // Set file name from site preference
        var fileName = reflektionHelper.getRFKCategoryFeedFilename();
        var outputFile = new File(fileDir + sp + fileName);
        if (!outputFile.exists()) {
            new File(fileDir).mkdirs();
            outputFile.createNewFile();
        }

        var writer = new FileWriter(outputFile, 'UTF-8');
        // var writer = new CSVStreamWriter(fw);

        var locales = Site.current.allowedLocales;
        var excludedLocals = reflektionHelper.getLocalExcludeList();
        // Write header labels
        var headerRecord = [];
        headerRecord.push('ccid');
        headerRecord.push('name');
        headerRecord.push('cat_url_path');
        headerRecord.push('parent_ccid');
        headerRecord.push('title');
        headerRecord.push('desc');
        headerRecord.push('is_primary');
        headerRecord.push('cat_breadcrumbs');
        var categoryFeedStringWithDevider = cronjobHelper.convertArrayValuesToStringWithDevider(headerRecord, '\t');
        writer.writeLine(categoryFeedStringWithDevider);

        var root = CatalogMgr.siteCatalog.root;
        processCat(root, writer);

        writer.close();

        // If true, then upload the category feed after it is exported.
        var rfkCategoryFeedUploadEnabled = reflektionHelper.getRFKCategoryFeedUploadEnabled();
        if (rfkCategoryFeedUploadEnabled) {
            // Service Call
            var responseObj = reflektionFeedUpload.upload(fileName);
            if (responseObj.code === 'ERROR') {
                return new Status(Status.ERROR, null, 'Error in script reflektionCategoryFeedExport.js - Feed upload service error - Message: ' + responseObj.message);
            }
            if (responseObj.code === 'OK') {
                return new Status(Status.OK, null, 'ReflektionCategoryFeedExport job finished, product feed upload successful');
            }
        }
    } catch (e) {
        var error = e;
        logger.error('Error in script reflektionCategoryFeedExport.js - Error message: ' + error);
        return new Status(Status.ERROR, null, e.message);
    }
    return new Status(Status.OK, null, 'ReflektionCategoryFeedExport job finished, category upload feed not enabled');
}
module.exports = {
    execute: execute
};
