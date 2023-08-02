'use strict';

var ProductManager = require('dw/catalog/ProductMgr');
var Money = require('dw/value/Money');

/**
 * Generate an Object which contains US and CA Cron Job Configuration custom preference data
 * @return {Object} - returns Object
 */
function generateCronJobConfigObj() {
    var allSites = dw.system.Site.getAllSites();
    var cronJobConfigObj = {};

    // US custom preference variables
    var usSiteHostName = null;
    var usSiteInventoryID = null;
    var usSiteListPriceBookID = null;
    var usSiteSalePriceBookID = null;

    // CA custom preference variables
    var caSiteHostName = null;
    var caSiteInventoryID = null;
    var caSiteListPriceBookID = null;
    var caSiteSalePriceBookID = null;

    // Map through custom preference and assign values into valuables
    Object.keys(allSites).forEach(function (siteId) {
        var site = allSites.get(siteId);
        if (site.getID() === 'tumi-us') {
            usSiteHostName = site.getCustomPreferenceValue('siteHostName');
            usSiteInventoryID = site.getCustomPreferenceValue('siteInventoryID');
            usSiteListPriceBookID = site.getCustomPreferenceValue('siteListPriceBookID');
            usSiteSalePriceBookID = site.getCustomPreferenceValue('siteSalePriceBookID');
        } else if (site.getID() === 'tumi-ca') {
            caSiteHostName = site.getCustomPreferenceValue('siteHostName');
            caSiteInventoryID = site.getCustomPreferenceValue('siteInventoryID');
            caSiteListPriceBookID = site.getCustomPreferenceValue('siteListPriceBookID');
            caSiteSalePriceBookID = site.getCustomPreferenceValue('siteSalePriceBookID');
        }
    });

    // Generate an Object with fetched data from Cron Job Configuration custom preferences
    cronJobConfigObj = {
        usSiteHostName: usSiteHostName,
        usSiteInventoryID: usSiteInventoryID,
        usSiteListPriceBookID: usSiteListPriceBookID,
        usSiteSalePriceBookID: usSiteSalePriceBookID,
        caSiteHostName: caSiteHostName,
        caSiteInventoryID: caSiteInventoryID,
        caSiteListPriceBookID: caSiteListPriceBookID,
        caSiteSalePriceBookID: caSiteSalePriceBookID
    };
    return cronJobConfigObj;
}

/**
 * Generate both US and CA PDP urls
 * @param {Object} product the product object
 * @param {string} hostName either 'us' or 'ca'
 * @return {string} - return site specific url
 */
function generateUSandCAPdpUrls(product, hostName) {
    var URLUtils = require('dw/web/URLUtils');
    var url = '';
    var productID = product.getID();

    url = hostName + URLUtils.url('Product-Show', 'pid', productID).toString();
    var pdpURL = url.replace('.html', '/');

    return pdpURL;
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
     var lastIndex = arrayOfHeaders.length-1;
    for (let i = 0; i < arrayOfHeaders.length-1; i +=1) {
        outputString += (arrayOfHeaders[i] + devider);
    }
    outputString += arrayOfHeaders[lastIndex];
    return outputString;
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

module.exports = {
    generateCronJobConfigObj: generateCronJobConfigObj,
    generateUSandCAPdpUrls: generateUSandCAPdpUrls,
    convertArrayValuesToStringWithDevider: convertArrayValuesToStringWithDevider,
    getProductListPrice: getProductListPrice
};
