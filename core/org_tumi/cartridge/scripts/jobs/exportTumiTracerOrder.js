'use strict';

var File = require('dw/io/File');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var FileWriter = require('dw/io/FileWriter');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var Transaction = require('dw/system/Transaction');
var DATETIME_FORMAT_PATH = 'yyyy-MM-dd_HH-mm-ss-SSS';

var semicolon = ';';

//Order Columns Headers
var orderColumns = ['rowType', 'code', 'languageIsocode', 'currencyIsocode', 'creationtime', 'deliveryAddressCountryIsocode', 
                    'deliveryAddressRegionIsocode', 'deliveryAddressPostalcode', 'deliveryAddressTown', 'deliveryAddressStreetname', 
                    'deliveryAddressStreetnumber', 'deliveryAddressCellphone', 'deliveryAddressEmail', 'deliveryAddressFirstname', 
                    'deliveryAddressLastname', 'paymentAddressCountryIsocode', 'paymentAddressRegionIsocode', 'paymentAddressPostalcode', 
                    'paymentAddressTown', 'paymentAddressStreetname', 'paymentAddressStreetnumber', 'paymentAddressCellphone', 
                    'paymentAddressEmail', 'paymentAddressFirstname', 'paymentAddressLastname', 'totalPrice', 'totalTax', 'subTotal', 
                    'totalDiscounts', 'shippingTax', 'totalFees', 'totalItems', 'deliveryMode', 'orderType', 'orderChannel', 
                    'consignmentCode', 'hybrisCustomerId', 'promotions', 'warehouseId', 'submittedTime', 'siteId', 'employeeOrder'];

//Payment Columns Headers
var paymentColumns = ['rowType', 'paymentType', 'paymentAmount', 'paymentCurrency'];

//Order Entry & Vas Order Columns Headers
var orderEntryAndVasOrderColumns = ['rowType', 'entryCode', 'parentEntryCode', 'entryNumber', 'productCode', 'quantity', 'unitCode', 'basePrice',
                                    'totalPrice', 'sumTaxValues', 'discountsSumAppliedValues', 'productName', 'manufacturer', 'upc', 'promisedShipDate',
                                    'quantityStatus', 'repairProbDesc', 'repairDmgDesc', 'tumiTracerNumber', 'tumiTracerRegDate',
                                    'vasField1', 'vasField2', 'vasField3', 'vasField4', 'vasField5'];


/**
 * Convert Array of column header strings to a string with semicolons
 * @param {[string]} columnHeaders - array of column header title strings
 * @return {[string]} returns array of a string 
 */
function columnHeaderToString(columnHeaders) {
    var headerString = '';
    for (let col of columnHeaders) {
        headerString  += (col + semicolon);
    }
    return [headerString];
}

/**
 * Convert Array of column header strings to a string with semicolons
 * @param {[string]}columnHeaders - array of column header title strings
 * @param {Object} row - containing keys as column header titles and values as corresponding order data
 * @return {String} returns a concatnated string with semicolons
 */
function rowToString(columnHeaders, row) {
    var columnString = '';
    for (let header of columnHeaders) {
        if (row[header] == undefined) {
            columnString += ('' + semicolon);
        } else {
            columnString += row[header] + semicolon;
        }
    }
    return columnString;
}

/**
 * Generate a creation date
 * @return {String} returns a concatnated string
 */
function getCreationDate() {
    var date = new Date();
    var year = date.getFullYear();
    var month = String(date.getMonth()+1).padStart(2, 0);
    var day = String(date.getDate()).padStart(2, 0);
    var hour = String(date.getHours()).padStart(2, 0);
    var min = String(date.getMinutes()).padStart(2, 0);
    var sec = String(date.getSeconds()).padStart(2, 0);
    var creationDate = [year, month, day, hour, min, sec].join('');
    return creationDate;
}

/**
 * Remove dash from the phone number
 * @param {string} phoneNumber used in this order
 * @returns {string} phone number without dashes
 */
function removeDashPhoneNumber(phoneNumber) {
    var strPhoneNumber = phoneNumber.toString();
    if (strPhoneNumber[0] === '+') {
        strPhoneNumber = strPhoneNumber.substr(1);
    }
    var removedDashPhoneNumber = strPhoneNumber.replace(/-/g, '');
    return removedDashPhoneNumber;
}

/**
 * Generate Order Rows (Line 2 - 6 in CA_Order_Mapping)
 * @param {Object} tracerProduct - CustomObjectMgr.getCustomObject(customObjectName, primaryKey)
 * @return {Object} return containing keys as column header titles and values as corresponding order data
 */
 function orderGeneralInfo(tracerProduct, consignmentID) {
    return {
        rowType: 'O',
        code: consignmentID.split('_')[0],
        languageIsocode: tracerProduct.custom.languageIsocode,
        currencyIsocode: tracerProduct.custom.currencyIsocode,
        creationtime: getCreationDate(),
    }
}

/**
 * Generate Order Row (Line 7 - 16 in CA_Order_Mapping)
 * @param {Object} tracerProduct - CustomObjectMgr.getCustomObject(customObjectName, primaryKey)
 * @return {Object} return containing keys as column header titles and values as corresponding order data
 */
function orderShipmentsInfo(tracerProduct) {
    return {
        deliveryAddressRegionIsocode: tracerProduct.custom.deliveryAddressRegionIsocode ? tracerProduct.custom.deliveryAddressRegionIsocode : '',
        deliveryAddressCountryIsocode: tracerProduct.custom.deliveryAddressCountryIsocode ? tracerProduct.custom.deliveryAddressCountryIsocode : '',
        deliveryAddressPostalcode: tracerProduct.custom.deliveryAddressPostalcode ? tracerProduct.custom.deliveryAddressPostalcode : '',
        deliveryAddressTown: tracerProduct.custom.deliveryAddressTown ? tracerProduct.custom.deliveryAddressTown : '',
        deliveryAddressStreetname: tracerProduct.custom.deliveryAddressStreetname ? tracerProduct.custom.deliveryAddressStreetname : '',
        deliveryAddressStreetnumber: tracerProduct.custom.deliveryAddressStreetnumber ? tracerProduct.custom.deliveryAddressStreetnumber : '',
        deliveryAddressCellphone: tracerProduct.custom.deliveryAddressCellphone ? tracerProduct.custom.deliveryAddressCellphone : '',
        deliveryAddressEmail: tracerProduct.custom.deliveryAddressEmail ? tracerProduct.custom.deliveryAddressEmail : '',
        deliveryAddressFirstname: tracerProduct.custom.deliveryAddressFirstname ? tracerProduct.custom.deliveryAddressFirstname : '',
        deliveryAddressLastname: tracerProduct.custom.deliveryAddressLastname ? tracerProduct.custom.deliveryAddressLastname : '',
    }
};

/**
 * Generate Order Row (Line 17 - 33 in CA_Order_Mapping)
 * @param {Object} tracerProduct - CustomObjectMgr.getCustomObject(customObjectName, primaryKey)
 * @param {Number} totalPrice - Sum of Entry Row's totalPrice and sumTaxValues per consignment
 * @param {Number} totalDiscounts - Sum of Entry Row's DiscountsSumAppliedValues per consignment
 * @param {Number} subTotal - Sum of Entry Row's basePrice per consignment
 * * @param {Number} shippingFee - devided total shipping fee by number of consignments
 * @param {Number} shippingTax - devided total shipping tax by number of consignments
 * @return {Object} return containing keys as column header titles and values as corresponding order data
 */
function orderBillingInfo(tracerProduct, totalPrice, totalDiscounts, subTotal, shippingFee, shippingTax, totalItems) {
    return {
        paymentAddressCountryIsocode : tracerProduct.custom.deliveryAddressCountryIsocode ? tracerProduct.custom.deliveryAddressCountryIsocode : '',
        paymentAddressRegionIsocode : tracerProduct.custom.deliveryAddressRegionIsocode ? tracerProduct.custom.deliveryAddressRegionIsocode : '',
        paymentAddressPostalcode : tracerProduct.custom.deliveryAddressPostalcode ? tracerProduct.custom.deliveryAddressPostalcode : '',
        paymentAddressTown : tracerProduct.custom.deliveryAddressTown ? tracerProduct.custom.deliveryAddressTown : '',
        paymentAddressStreetname : tracerProduct.custom.deliveryAddressStreetname ? tracerProduct.custom.deliveryAddressStreetname : '',
        paymentAddressStreetnumber : tracerProduct.custom.deliveryAddressStreetnumber ? tracerProduct.custom.deliveryAddressStreetnumber : '',
        paymentAddressCellphone : tracerProduct.custom.deliveryAddressCellphone ? tracerProduct.custom.deliveryAddressCellphone : '',
        paymentAddressEmail : tracerProduct.custom.deliveryAddressEmail ? tracerProduct.custom.deliveryAddressEmail : '',
        paymentAddressFirstname : tracerProduct.custom.deliveryAddressFirstname ? tracerProduct.custom.deliveryAddressFirstname : '',
        paymentAddressLastname : tracerProduct.custom.deliveryAddressLastname ? tracerProduct.custom.deliveryAddressLastname : '',
        totalPrice: totalPrice,
        totalTax : 0,
        subTotal: subTotal,
        totalDiscounts: totalDiscounts,
        shippingTax : shippingTax,
        totalFees : shippingFee,
        totalItems : totalItems
    }
};

/**
 * Generate Order Row (Line 34 - 43 in CA_Order_Mapping)
 * @param {Object} tracerProduct - CustomObjectMgr.getCustomObject(customObjectName, primaryKey)
 * @param {String} promoID - Name of Promos
 * @param {String} consignmentID - custom attribute consignmentID
 * @return {Object} return containing keys as column header titles and values as corresponding order data
 */
function orderCreatedInfo(tracerProduct, promoID, consignmentID) {
    return {
        deliveryMode: '',
        orderType: 'TRACER',
        orderChannel: '',
        consignmentCode: 'a' + consignmentID,
        hybrisCustomerId: tracerProduct.custom.deliveryAddressEmail ? tracerProduct.custom.deliveryAddressEmail : '',
        promotions: promoID,
        warehouseId: tracerProduct.custom.deliveryAddressCountryIsocode + '10',
        submittedTime: getCreationDate(),
        siteId: 'tumi_' + tracerProduct.custom.deliveryAddressCountryIsocode,
        employeeOrder: false,
    }
}

/**
 * Generate Order Entry Row
 * @param {Object} productLineItem - order.productLineItems
 * @param {Number} totalItemDiscount - Each product's discount value order level and promotion level
 * @return {Object} - containing keys as column header titles and values as corresponding order data
 */
function getProduct(tracerProduct, consignmentID) {
    var entryCode = consignmentID;
    var tumiTracerRegDate = new Date().getTime().toString();
    return {
        rowType: 'E',
        entryCode: entryCode,
        parentEntryCode: '',
        entryNumber: parseInt(entryCode.substr(entryCode.indexOf('_') + 1)),
        productCode: '',
        quantity: 1,
        unitCode: 'pieces',
        basePrice: 0.0,
        totalPrice: 0.0,
        sumTaxValues: 0.00,
        discountsSumAppliedValues: 0.0,
        productName: '',
        manufacturer: 'TUMI',
        upc: '',
        promisedShipDate: '',
        quantityStatus: '',
        repairProbDesc: '',
        repairDmgDesc: '',
        tumiTracerNumber: tracerProduct.custom.tumiTracerNumber,
        tumiTracerRegDate: tumiTracerRegDate
    }
}

/**
 * Extract productItems from order.productLineItems
 * @param {Object} tracerProduct - CustomObjectMgr.getCustomObject(customObjectName, primaryKey)
 * @param {Array} consignmentID - consignmentID
 * @return {Object} - Array of Object(s) - Each Object is a row
 */
function generateTracerProductItems(tracerProduct, consignmentID) {
    var orderedProductItems = [];
    var totalItemDiscounts = 0;

    var productItem = getProduct(tracerProduct, consignmentID);
    orderedProductItems.push(productItem);

    return orderedProductItems;
}

/**
 * Take relevant info and write/generate a new CSV
 * @param {Object} tracerProduct - CustomObjectMgr.getCustomObject(customObjectName, primaryKey)
 * @param {[Object]} orderedItems - Extracted data from order.productLineItems
 * @param {String} targetFolderPath - target folder path
 * @param {String} exportDate - the Date and time exporting file
 * @param {String} consignmentID - custom attribute consignmentID
 * @param {String} promoID - applied promo name/ID
 * @param {number} shippiingFee - devided shipping fee by consignment
 * @param {number} shippingTax - devided shipping tax by consignment
 */
 function generateCSVfiles(tracerProduct, orderedItems, targetFolderPath, exportDate, consignmentID, promoID, shippiingFee, shippingTax) {
    // Generate a new file
    var targetFileName = 'TUMI_Tracer_' + tracerProduct.custom.tumiTracerNumber + '_' + exportDate + '.csv';
    var targetFile = new File(targetFolderPath + File.SEPARATOR + targetFileName);
    var csv = new CSVStreamWriter(new FileWriter(targetFile, 'UTF-8'));

    var totalPrice = 0;
    var sumTaxValues = 0;
    var discountsSumAppliedValues = 0;
    var subTotal = 0;

    var eachConsignmentTotalItems = 1;

    //order specific info
    var orderInfoObj = orderGeneralInfo(tracerProduct, consignmentID);
    var shipmentInfoObj = orderShipmentsInfo(tracerProduct);
    var billingInfoObj = orderBillingInfo(tracerProduct, totalPrice + sumTaxValues, discountsSumAppliedValues, subTotal, shippiingFee, shippingTax, eachConsignmentTotalItems);
    var generatedInfoObj = orderCreatedInfo(tracerProduct, promoID, consignmentID);

    var orderRowsJoin = Object.assign(orderInfoObj, shipmentInfoObj, billingInfoObj, generatedInfoObj);
    var generalOrderInfo = rowToString(orderColumns, orderRowsJoin);

    // write generic headers
    csv.writeNext(columnHeaderToString(orderColumns));
    csv.writeNext();
    csv.writeNext(columnHeaderToString(paymentColumns));
    csv.writeNext();
    csv.writeNext(columnHeaderToString(orderEntryAndVasOrderColumns));
    csv.writeNext();

    // write order specific info
    csv.writeNext([generalOrderInfo]);
    csv.writeNext();

    // item specific info
    for (let row of orderedItems) {
        var strRow = rowToString(orderEntryAndVasOrderColumns, row)
        csv.writeNext([strRow]);
        csv.writeNext();
    }

    csv.close();
}

/**
 * Invoke functions to correct order infomation and call generateCSVfiles function
 * @param {String} targetFolderPath - target folder path
 */
function QueryTumiTracer(targetFolderPath) {
    const CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var tracerProducts = CustomObjectMgr.getAllCustomObjects('TumiTracer');

    Logger.debug('Total {0} tumi tracer products are ready for export.', tracerProducts.count);

    if (!tracerProducts) {
        Logger.error('Tumi Tracer Products are unavailable');
    }

    // Iterate over Tumi Tracer Registration
    while (tracerProducts.hasNext()) {
        var exportDate = StringUtils.formatCalendar(new Calendar(), 'yyyyMMddHHmmssSSS');
        var tracerProduct = tracerProducts.next();
        var currentTotalConsignment = 0;
        var promoID = '';

        var arrayOfDevidedShippingFees = 0;
        var arrayOfDevidedShippingTax = 0;

        if (tracerProduct) {
            var consignmentWithMultiItems = [];
            var consignmentID = '33437243_0'; // TODO: create dummy order
            var multiOrderedItems = generateTracerProductItems(tracerProduct, consignmentID);

            // Call function to generate CSV
            generateCSVfiles(tracerProduct, multiOrderedItems, targetFolderPath, exportDate, consignmentID, promoID, arrayOfDevidedShippingFees, arrayOfDevidedShippingTax);

            Transaction.wrap(function () {
                CustomObjectMgr.remove(tracerProduct);
            });
        }
    }
}

/**
 * Main function - Setup CSV and Excecuting a Test Order Or Query Orders
 * @param {Object} jobParameters - Contains all order details
 * @return {Object} - Job Status
 */

function execute(jobParameters) {
    //* *** Export CSV ***
    var targetFolder = jobParameters.TargetFolder;
    var targetFolderPath = File.IMPEX + File.SEPARATOR + targetFolder;
    try {

        QueryTumiTracer(targetFolderPath);

        Logger.info('[exportTumiTracerOrder.js] Tracer xml export done successfully');
        return new Status(Status.OK);

    } catch(e) {
        //error handling
        Logger.error('Error in exportTumiTracerOrder.js | Error {0}', e.message);
        return new Status(Status.ERROR);
    }
}


module.exports = {
    execute: execute
};
