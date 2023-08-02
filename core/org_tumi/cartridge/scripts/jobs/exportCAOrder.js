'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var UUIDUtils = require('dw/util/UUIDUtils');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Site = require('dw/system/Site');
var File = require('dw/io/File');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var FileWriter = require('dw/io/FileWriter');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger').getLogger('TumiCA-OrderExport', 'TumiCA-OrderExport');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var Transaction = require('dw/system/Transaction');
var invalidOrderFileNameList = [];
var invalidOrderNumberList = [];
var semicolon = ';';

//Order Columns Headers
var orderColumns = ['rowType', 'code', 'languageIsocode', 'currencyIsocode', 'creationtime', 'deliveryAddressCountryIsocode',
    'deliveryAddressRegionIsocode', 'deliveryAddressPostalcode', 'deliveryAddressTown', 'deliveryAddressStreetname',
    'deliveryAddressStreetnumber', 'deliveryAddressCellphone', 'deliveryAddressEmail', 'deliveryAddressFirstname',
    'deliveryAddressLastname', 'paymentAddressCountryIsocode', 'paymentAddressRegionIsocode', 'paymentAddressPostalcode',
    'paymentAddressTown', 'paymentAddressStreetname', 'paymentAddressStreetnumber', 'paymentAddressCellphone',
    'paymentAddressEmail', 'paymentAddressFirstname', 'paymentAddressLastname', 'totalPrice', 'totalTax', 'subTotal',
    'totalDiscounts', 'shippingTax', 'totalFees', 'totalItems', 'deliveryMode', 'orderType', 'orderChannel',
    'consignmentCode', 'hybrisCustomerId', 'promotions', 'warehouseId', 'submittedTime', 'siteId', 'employeeOrder'
];

//Payment Columns Headers
var paymentColumns = ['rowType', 'paymentType', 'paymentAmount', 'paymentCurrency'];

//Order Entry & Vas Order Columns Headers
var orderEntryAndVasOrderColumns = ['rowType', 'entryCode', 'parentEntryCode', 'entryNumber', 'productCode', 'quantity', 'unitCode', 'basePrice',
    'totalPrice', 'sumTaxValues', 'discountsSumAppliedValues', 'productName', 'manufacturer', 'upc', 'promisedShipDate',
    'quantityStatus', 'repairProbDesc', 'repairDmgDesc', 'tumiTracerNumber', 'tumiTracerRegDate',
    'vasField1', 'vasField2', 'vasField3', 'vasField4', 'vasField5'
];


/**
 * Convert Array of column header strings to a string with semicolons
 * @param {[string]} columnHeaders - array of column header title strings
 * @return {[string]} returns array of a string 
 */
function columnHeaderToString(columnHeaders) {
    var headerString = '';
    for (let col of columnHeaders) {
        headerString += (col + semicolon);
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
 * @param {Object} order - OrderMgr.getOrder(orderId)
 * @return {String} returns a concatnated string
 */
function getCreationDate(order) {
    var date = new Date(order.creationDate);
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, 0);
    var day = String(date.getDate()).padStart(2, 0);
    var hour = String(date.getHours()).padStart(2, 0);
    var min = String(date.getMinutes()).padStart(2, 0);
    var sec = String(date.getSeconds()).padStart(2, 0);
    var creationDate = [year, month, day, hour, min, sec].join('');
    return creationDate;
}

/**
 * Split shipping fee and shipping tax equally when order has multiple consignments
 * @param {Number} fee - total shipping fee or shipping tax fee of this order
 * @param {Number} totalConsignment - number of total consignments of this order 
 * @return {Array} return array of splited shipping fee by consignment
 * EX: total shipping fee: $19.00, total consignments: 3 -> returns devidedFee: [6.34, 6.33, 6.33] 
 */
function divideShippingFee(fee, totalConsignment) {
    var remainder = (fee * 100) % (totalConsignment) / 100;
    var floorFee = (fee - remainder) / totalConsignment;
    var dividedFee = new Array(totalConsignment).fill(floorFee);

    for (let i = 0; i < remainder * 100; i += 1) {
        dividedFee[i] += 0.01;
    }
    return dividedFee;
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
 * Generate Order Payment Row
 * @param {Object} order - OrderMgr.getOrder(orderId)
 * @return {[String]} returns a concatnated string with semicolons
 */
function orderPaymentInfo(order) {
    var paymentColumns = '';
    var creditCardType;
    if (order.paymentInstrument.paymentMethod == 'PayPal') {
        creditCardType = 'PayPal'
    } else {
        creditCardType = order.paymentInstrument.creditCardType;
    }
    var amount = order.paymentTransaction.amount;
    var paymentCol = ['P', creditCardType, amount, amount.currencyCode];

    for (let col of paymentCol) {
        paymentColumns += (col + semicolon);
    }
    return [paymentColumns]
};

function deleteInvalidOrderCSV(invalidOrderFileNameList, targetFolderPath) {
    var targetFileName;
    var targetFile;
    for (var i = 0; i <= invalidOrderFileNameList.length - 1; i++) {
        targetFileName = invalidOrderFileNameList[i];
        targetFile = new File(targetFolderPath + File.SEPARATOR + targetFileName);
        if (targetFile) {
            targetFile.remove();
        }
    }
}
/**
 * Calculate item level discount
 * @param {Object} order - OrderMgr.getOrder(orderId)
 * @param {Object} item - productLineItem (each item)
 * @return {Number} - Each item's discount value
 */
function getItemDiscountTotal(order, item) {
    var itemDiscounts = 0;
    var itemProratedPricesSet = item.priceAdjustments[0].proratedPrices.entrySet();
    var itemLevelDiscountSet = itemProratedPricesSet[0].key.proratedPriceAdjustmentPrices.entrySet();
    for (let i = 0; i < itemLevelDiscountSet.length; i += 1) {
        itemDiscounts += itemLevelDiscountSet[i].value;
    }
    return itemDiscounts;
}

/**
 * Generate an array of target numbers
 * @param {[Object]} orderedItems - objects were generated by getProduct function
 * @param {string} string - Header name
 * @return {[Number]} - Array of target numbers
 */
function getNumberColumn(orderedItems, string) {
    var column = [];
    for (let row of orderedItems) {
        if (row[string] !== undefined && row[string]) {
            column.push(row[string] instanceof require('dw/value/Money') ? row[string].value : row[string]);
        } else {
            column.push(0);
        }
    }
    return column;
}

/**
 * Find promotion name
 * @param {[Object]} adjustmentPrices - item level proratedPriceAdjustmentPrices
 * @param {Object} item - productLineItems.productLineItem
 * @return {String} - Promotion name (order level + item level)
 */
function getPromo(adjustmentPrices, item) {
    var promoID = '';
    var appendItemPromo = false;
    for (var j = 0; j < adjustmentPrices.length; j++) {
        var promotion = adjustmentPrices.entrySet();
        var promo = promotion[j];
        promoID = promo.key.promotionID;

        if (item.priceAdjustments && item.priceAdjustments.length && item.priceAdjustments[0].promotionID !== null && item.priceAdjustments[0].UUID !== promo.key.UUID) {
            appendItemPromo = true;
        }
    }
    if (appendItemPromo) {
        promoID += ('|' + item.priceAdjustments[0].promotionID);
    }
    return promoID;
}



/**
 * Create a space between Premium and classic monogram letters
 * @param {[Object]} vasField1 - premium or classic monogram vasField1 object
 * @return {String} - letters with space
 */
function createSpaceForMono(vasField1) {
    var vasField1String = '';
    var tempMonogramArray = vasField1.replace(/ /g, '').split('');
    for (var i = 0; i < tempMonogramArray.length; i++) {
        if ((tempMonogramArray[i] === '(') || (tempMonogramArray[i] === ')')) {
            continue;
        } else if ((tempMonogramArray[i] !== '(') && (tempMonogramArray[i] !== ')') && (tempMonogramArray[i + 1] === ')')) {
            continue;
        } else if ((tempMonogramArray[i] !== '(') && (tempMonogramArray[i] !== ')') && (tempMonogramArray[i] !== ')  ')) {
            tempMonogramArray[i] += '  ';
        }
    }
    vasField1String = tempMonogramArray.join('');
    return vasField1String;
}

/**
 * Generate Object which has withOption and withOutOption keys, values as arrays coontaining-
 * Monogramed/premium giftbox and Non_Monogramed/No premium giftbox indexes 
 * @param {Object} productLineItems - order.productLineItems
 * @return {Object} - Object with 2 keys and 2 arrays as values
 * // - indexes of monogramed items or premium giftbox
 * // - indexes of non-monogramed items / No premium giftbox
 */
function splitOrdersBySingleOrMultiConsignments(productLineItems) {
    var tempSingle = new Array();
    var multipleItems = new Array();
    var splitItemsbyConsignmentsIDKeys = {};

    // Create an object contains key as consignmentID, value is array of index in PLI
    // EX. { a123: [ 0, 3, 4 ], b123: [ 1 ], c123: [ 2 ], d123: [ 5 ] }
    for (let i = 0; i < productLineItems.length; i += 1) {

        if (!productLineItems[i].custom.parentProductLineItemID && !productLineItems[i].custom.isPremiumMonogramLetter) {
            if (splitItemsbyConsignmentsIDKeys[productLineItems[i].custom.consignmentID]) {
                splitItemsbyConsignmentsIDKeys[productLineItems[i].custom.consignmentID].push(i)
            } else {
                splitItemsbyConsignmentsIDKeys[productLineItems[i].custom.consignmentID] = new Array();
                splitItemsbyConsignmentsIDKeys[productLineItems[i].custom.consignmentID].push(i)
            }
        }
    }
    // iterate over splitItemsbyConsignmentsIDs object
    for (let consignment in splitItemsbyConsignmentsIDKeys) {
        // If there are more than 1 items that has same consignmentID, assign to multipleItems
        if (splitItemsbyConsignmentsIDKeys[consignment].length > 1) {
            multipleItems = splitItemsbyConsignmentsIDKeys[consignment];
        }
        // If the consignmentID is unique, assign to tempSingle array
        if (splitItemsbyConsignmentsIDKeys[consignment].length === 1) {
            tempSingle.push(splitItemsbyConsignmentsIDKeys[consignment])
        }
    }
    // Flattern Array
    var singleItem = [].concat.apply([], tempSingle);
    // Ex { single: [ 1, 2, 5 ], multiple: [ 0, 3, 4 ] }
    return {
        singleItem: singleItem,
        multipleItems: multipleItems
    }
}

function writeCSVElementValue(elementId, value, orderId) {
    try {
        if (typeof value !== 'undefined') {
            return value;
        } else {
            var error = {
                elementId: value
            };
            throw error;
        }
    } catch (e) {
        Logger.error('[exportCAOrder.js] writeCSVElementValue() method crashed for the Node: <{0}>. for the OrderID: {1}', elementId, orderId);
        throw e;
    }
}

/**
 * Generate Order Rows
 * @param {Object} order - OrderMgr.getOrder(orderId)
 * @return {Object} return containing keys as column header titles and values as corresponding order data
 */
function orderGeneralInfo(order) {
    return {
        rowType: 'O',
        code: writeCSVElementValue('code', order.orderNo, order.orderNo),
        languageIsocode: writeCSVElementValue('languageIsocode', order.customerLocaleID, order.orderNo),
        currencyIsocode: writeCSVElementValue('currencyIsocode', order.currencyCode, order.orderNo),
        creationtime: writeCSVElementValue('creationtime', getCreationDate(order), order.orderNo),
    }
}

/**
 * Generate Order Row
 * @param {Object} shipments - OrderMgr.getOrder(orderId).shipments
 * @param {Object} order - OrderMgr.getOrder(orderId)
 * @return {Object} return containing keys as column header titles and values as corresponding order data
 */
function orderShipmentsInfo(shipments, order, orderID) {
    for (let i = 0; i < shipments.length; i += 1) {
        var shipmentAddress = shipments[i].shippingAddress;
        return {
            deliveryAddressRegionIsocode: writeCSVElementValue('deliveryAddressRegionIsocode', shipmentAddress.stateCode, orderID),
            deliveryAddressCountryIsocode: writeCSVElementValue('deliveryAddressCountryIsocode', (shipmentAddress.countryCode.value).toUpperCase(), orderID),
            deliveryAddressPostalcode: writeCSVElementValue('deliveryAddressPostalcode', shipmentAddress.postalCode, orderID),
            deliveryAddressTown: writeCSVElementValue('deliveryAddressTown', shipmentAddress.city, orderID),
            deliveryAddressStreetname: writeCSVElementValue('deliveryAddressStreetname', shipmentAddress.address1, orderID),
            deliveryAddressStreetnumber: !empty(shipmentAddress.address2) ? writeCSVElementValue('deliveryAddressStreetnumber', shipmentAddress.address2, orderID) : '',
            deliveryAddressCellphone: !empty(shipmentAddress.phone) ? writeCSVElementValue('deliveryAddressCellphone', removeDashPhoneNumber(shipmentAddress.phone), orderID) : '',
            deliveryAddressEmail: writeCSVElementValue('deliveryAddressEmail', order.customerEmail.trim(), orderID),
            deliveryAddressFirstname: writeCSVElementValue('deliveryAddressFirstname', shipmentAddress.firstName, orderID),
            deliveryAddressLastname: writeCSVElementValue('deliveryAddressLastname', shipmentAddress.lastName, orderID),
        }
    }
};

/**
 * Generate Order Row
 * @param {Object} order - OrderMgr.getOrder(orderId)
 * @param {Number} totalPrice - Sum of Entry Row's totalPrice and sumTaxValues per consignment
 * @param {Number} totalDiscounts - Sum of Entry Row's DiscountsSumAppliedValues per consignment
 * @param {Number} subTotal - Sum of Entry Row's basePrice per consignment
 * * @param {Number} shippingFee - devided total shipping fee by number of consignments
 * @param {Number} shippingTax - devided total shipping tax by number of consignments
 * @return {Object} return containing keys as column header titles and values as corresponding order data
 */
function orderBillingInfo(order, totalPrice, totalTax, totalDiscounts, subTotal, shippingFee, shippingTax, totalItems, orderID) {
    var billingAddress = order.billingAddress;
    return {
        paymentAddressCountryIsocode: writeCSVElementValue('paymentAddressCountryIsocode', (billingAddress.countryCode.value).toUpperCase(), orderID),
        paymentAddressRegionIsocode: !empty(billingAddress.stateCode) ? writeCSVElementValue('paymentAddressRegionIsocode', billingAddress.stateCode, orderID) : '',
        paymentAddressPostalcode: !empty(billingAddress.postalCode) ? writeCSVElementValue('paymentAddressPostalcode', billingAddress.postalCode, orderID) : '',
        paymentAddressTown: !empty(billingAddress.city) ? writeCSVElementValue('paymentAddressTown', billingAddress.city, orderID) : '',
        paymentAddressStreetname: !empty(billingAddress.address1) ? writeCSVElementValue('paymentAddressStreetname', billingAddress.address1, orderID) : '',
        paymentAddressStreetnumber: !empty(billingAddress.address2) ? writeCSVElementValue('paymentAddressStreetnumber', billingAddress.address2, orderID) : '',
        paymentAddressCellphone: !empty(billingAddress.phone) ? writeCSVElementValue('paymentAddressCellphone', removeDashPhoneNumber(billingAddress.phone), orderID) : '',
        paymentAddressEmail: writeCSVElementValue('paymentAddressEmail', order.customerEmail.trim(), orderID),
        paymentAddressFirstname: writeCSVElementValue('paymentAddressFirstname', billingAddress.firstName, orderID),
        paymentAddressLastname: writeCSVElementValue('paymentAddressLastname', billingAddress.lastName, orderID),
        totalPrice: writeCSVElementValue('totalPrice', totalPrice, orderID),
        totalTax: writeCSVElementValue('totalTax', totalTax, orderID),
        subTotal: writeCSVElementValue('subTotal', subTotal, orderID),
        totalDiscounts: writeCSVElementValue('totalDiscounts', totalDiscounts, orderID),
        shippingTax: writeCSVElementValue('shippingTax', shippingTax, orderID),
        totalFees: writeCSVElementValue('totalFees', (shippingFee - shippingTax).toFixed(2), orderID),
        totalItems: writeCSVElementValue('totalItems', totalItems, orderID),
    }
};

/**
 * Generate Order Row
 * @param {Object} order - OrderMgr.getOrder(orderId).shipments
 * @param {String} promoID - Name of Promos
 * @param {String} consignmentID - custom attribute consignmentID
 * @return {Object} return containing keys as column header titles and values as corresponding order data
 */
function orderCreatedInfo(order, promoID, consignmentID, orderID) {
    var orderType = Site.getCurrent().getCustomPreferenceValue("orderType");
    var orderChannel = Site.getCurrent().getCustomPreferenceValue("orderChannel");
    var warehouseId = Site.getCurrent().getCustomPreferenceValue("WarehouseID");
    var siteID = Site.getCurrent().getID();
    return {
        deliveryMode: writeCSVElementValue('totalItems', order.shipments[0].shippingLineItems[0].ID, orderID),
        orderType: writeCSVElementValue('totalItems', orderType, orderID),
        orderChannel: writeCSVElementValue('totalItems', orderChannel, orderID),
        consignmentCode: writeCSVElementValue('totalItems', consignmentID, orderID),
        hybrisCustomerId: writeCSVElementValue('totalItems', order.customer.ID, orderID),
        promotions: writeCSVElementValue('totalItems', promoID, orderID),
        warehouseId: writeCSVElementValue('totalItems', warehouseId, orderID),
        submittedTime: writeCSVElementValue('totalItems', getCreationDate(order), orderID),
        siteId: writeCSVElementValue('totalItems', siteID, orderID),
        employeeOrder: !empty(order.custom.isEmployeeOrder) ? writeCSVElementValue('totalItems', order.custom.isEmployeeOrder, orderID) : false,
    }
}

/**
 * Generate Order Entry Row
 * @param {Object} productLineItem - order.productLineItems
 * @param {Number} totalItemDiscount - Each product's discount value order level and promotion level
 * @return {Object} - containing keys as column header titles and values as corresponding order data
 */
function getProduct(productLineItem, totalItemDiscount, orderID) {
    var entryCode = productLineItem.custom.entryCode;
    //var promisedShipDate = Site.getCurrent().getCustomPreferenceValue("PromisedShipDate");
    var unitCode = 'pieces';
    return {
        rowType: 'E',
        entryCode: writeCSVElementValue('productCode', entryCode, orderID),
        parentEntryCode: '',
        entryNumber: entryCode ? writeCSVElementValue('entryCode', parseInt(entryCode.substr(entryCode.indexOf('_') + 1)), orderID) : '',
        productCode: writeCSVElementValue('productCode', productLineItem.productID, orderID),
        quantity: writeCSVElementValue('quantity', productLineItem.quantity, orderID),
        unitCode: writeCSVElementValue('unitCode', unitCode, orderID),
        basePrice: writeCSVElementValue('basePrice', productLineItem.basePrice, orderID),
        totalPrice: writeCSVElementValue('totalPrice', productLineItem.basePrice + totalItemDiscount, orderID),
        sumTaxValues: writeCSVElementValue('sumTaxValues', productLineItem.tax, orderID),
        discountsSumAppliedValues: writeCSVElementValue('discountsSumAppliedValues', totalItemDiscount, orderID),
        productName: writeCSVElementValue('productName', productLineItem.productName, orderID),
        manufacturer: !empty(productLineItem.manufacturerName) ? writeCSVElementValue('manufacturer', productLineItem.manufacturerName, orderID) : '',
        upc: !empty(productLineItem.product.UPC) ? writeCSVElementValue('upc', productLineItem.product.UPC, orderID) : '',
        promisedShipDate: '',
        quantityStatus: writeCSVElementValue('quantityStatus', productLineItem.product.availabilityModel.availabilityStatus, orderID),
        repairProbDesc: '',
        repairDmgDesc: '',
        tumiTracerNumber: '',
        tumiTracerRegDate: '',
    }
}

/**
 * Generate Vas Order Row - this function is used for Monogram and Giftbox
 * @param {Object} vasAttribute - vasAttribute
 * @param {Object} parentEntryCode - parentEntryCode
 * @return {Object} - containing keys as column header titles and values as corresponding order data
 */
function getVasProduct(vasAttribute, parentEntryCode, orderID) {
    return {
        rowType: 'V',
        entryCode: !empty(vasAttribute.vasEntryCode) ? writeCSVElementValue('entryCode', vasAttribute.vasEntryCode, orderID) : '',
        parentEntryCode: writeCSVElementValue('parentEntryCode', parentEntryCode, orderID),
        entryNumber: vasAttribute.vasEntryCode ? writeCSVElementValue('entryNumber', parseInt(vasAttribute.vasEntryCode.substr(vasAttribute.vasEntryCode.indexOf('_') + 1)), orderID) : '',
        productCode: writeCSVElementValue('productCode', vasAttribute.productCode, orderID),
        quantity: writeCSVElementValue('quantity', vasAttribute.quantity, orderID),
        unitCode: '',
        basePrice: !empty(vasAttribute.basePrice) ? writeCSVElementValue('basePrice', vasAttribute.basePrice, orderID) : '',
        totalPrice: !empty(vasAttribute.totalPrice) ? writeCSVElementValue('totalPrice', vasAttribute.totalPrice, orderID) : '',
        sumTaxValues: !empty(vasAttribute.sumTaxValues) ? writeCSVElementValue('sumTaxValues', vasAttribute.sumTaxValues, orderID) : '',
        discountSumAppliedVal: writeCSVElementValue('discountSumAppliedVal', '0', orderID),
        productName: !empty(vasAttribute.productName) ? writeCSVElementValue('productName', vasAttribute.productName, orderID) : '',
        manufacturer: '',
        upc: '',
        promisedShipDate: '',
        quantityStatus: '',
        repairProbDesc: '',
        repairDmgDesc: '',
        tumiTracerNumber: '',
        tumiTracerRegDate: '',
        vasField1: !empty(vasAttribute.vasField1) && vasAttribute.productType !== 'GIFTMSG' ? writeCSVElementValue('vasField1', createSpaceForMono(vasAttribute.vasField1), orderID) : vasAttribute.vasField1,
        vasField2: !empty(vasAttribute.vasField2) ? writeCSVElementValue('vasField2', vasAttribute.vasField2, orderID) : '',
        vasField3: !empty(vasAttribute.vasField3) ? writeCSVElementValue('vasField3', vasAttribute.vasField3, orderID) : '',
        vasField4: !empty(vasAttribute.vasField4) ? writeCSVElementValue('vasField4', vasAttribute.vasField4, orderID) : '',
        vasField5: !empty(vasAttribute.vasField5) ? writeCSVElementValue('vasField5', vasAttribute.vasField5, orderID) : '',
    }
}

/**
 * Extract productItems from order.productLineItems 
 * @param {Object} order - OrderMgr.getOrder(orderId)
 * @param {Array} IndexOfSplitedPLIByConsignment - Array of index(es) 
 * @param {Object} productLineItems - order.productLineItems
 * @return {Object} - Array of Object(s) - Each Object is a row
 */
function generateOrderedProductItems(order, IndexOfSplitedPLIByConsignment, productLineItems) {
    var orderedProductItems = [];
    var totalItemDiscounts = 0;
    //This condition only pass if the order contains multiple items and no options(monogram or/and premium giftbox)
    if (IndexOfSplitedPLIByConsignment.length > 1) {
        for (let i = 0; i < IndexOfSplitedPLIByConsignment.length; i +=1) {
            if (!empty(productLineItems[IndexOfSplitedPLIByConsignment[i]].priceAdjustments)) {
                totalItemDiscounts = getItemDiscountTotal(order, productLineItems[IndexOfSplitedPLIByConsignment[i]]);
            } else if (!empty(order.priceAdjustments)) {
                var orderDiscountSet = order.priceAdjustments[0].proratedPrices.entrySet();
                totalItemDiscounts = orderDiscountSet[IndexOfSplitedPLIByConsignment[i]].value;
            }   
            var productItem = getProduct(productLineItems[IndexOfSplitedPLIByConsignment[i]], totalItemDiscounts, order.orderNo);
            orderedProductItems.push(productItem);
        }
    } else {
        //This condition only pass if the order contains only 1 item OR contains monogram OR premium giftbox
        if (!empty(productLineItems[IndexOfSplitedPLIByConsignment].priceAdjustments)) {
                totalItemDiscounts = getItemDiscountTotal(order, productLineItems[IndexOfSplitedPLIByConsignment]);
            } else if (!empty(order.priceAdjustments)) {
                var orderDiscountSet = order.priceAdjustments[0].proratedPrices.entrySet();
                totalItemDiscounts = orderDiscountSet[IndexOfSplitedPLIByConsignment].value;
            } 
            var productItem = getProduct(productLineItems[IndexOfSplitedPLIByConsignment], totalItemDiscounts, order.orderNo);
            orderedProductItems.push(productItem);
            //VAS fields conditions
        if (!empty(productLineItems[IndexOfSplitedPLIByConsignment].custom.vasTotalAttributes)){
            var vasJson = JSON.parse(productLineItems[IndexOfSplitedPLIByConsignment].custom.vasTotalAttributes);
            var parentEntryCode = productLineItems[IndexOfSplitedPLIByConsignment].custom.entryCode;
            for each(var vasAttribute in vasJson){
                orderedProductItems.push(getVasProduct(vasAttribute, parentEntryCode, order.orderNo));
            }
        }
    }
    return orderedProductItems;
}

/**
 * Take relevant info and write/generate a new CSV 
 * @param {Object} order - OrderMgr.getOrder(orderId)
 * @param {[Object]} orderedItems - Extracted data from order.productLineItems
 * @param {String} targetFolderPath - target folder path
 * @param {String} consignmentID - custom attribute consignmentID
 * @param {String} promoID - applied promo name/ID
 * @param {number} shippiingFee - devided shipping fee by consignment
 * @param {number} shippingTax - devided shipping tax by consignment
 */
function generateCSVfiles(order, orderedItems, targetFolderPath, consignmentID, promoID, shippiingFee, shippingTax) {
    try {
    var exportDate = StringUtils.formatCalendar(new Calendar(), 'yyyyMMddHHmmssSSS');
    // Generate a new file
    var targetFileName = 'consignments_' + consignmentID + '_' + exportDate + '.csv';
    var targetFile = new File(targetFolderPath + File.SEPARATOR + targetFileName);
    var csv = new CSVStreamWriter(new FileWriter(targetFile, 'UTF-8'));

    //Iterate array of object and get total price and totalDiscount 
    var totalPrice = getNumberColumn(orderedItems, 'totalPrice').reduce((a, b) => a + b, 0);
    var sumTaxValues = getNumberColumn(orderedItems, 'sumTaxValues').reduce((a, b) => a + b, 0);
    var discountsSumAppliedValues = getNumberColumn(orderedItems, 'discountsSumAppliedValues').reduce((a, b) => a + b, 0);
    var subTotal = getNumberColumn(orderedItems, 'basePrice').reduce((a, b) => a + b, 0);
    var totalTax = order.totalTax.available ? order.totalTax.value : '0';
    //Convert to Numbers
    totalPrice = Number(totalPrice);
    sumTaxValues = Number(sumTaxValues);
    discountsSumAppliedValues = Number(discountsSumAppliedValues);
    subTotal = Number(subTotal);

    var eachConsignmentTotalItems = orderedItems.length;

    //order specific info
    var orderInfoObj = orderGeneralInfo(order);
    var shipmentInfoObj = orderShipmentsInfo(order.shipments, order, order.orderNo);
    var billingInfoObj = orderBillingInfo(order, totalPrice + sumTaxValues, totalTax, discountsSumAppliedValues, subTotal, shippiingFee, shippingTax, eachConsignmentTotalItems, order.orderNo);
    var generatedInfoObj = orderCreatedInfo(order, promoID, consignmentID, order.orderNo);

    var orderRowsJoin = Object.assign(orderInfoObj, shipmentInfoObj, billingInfoObj, generatedInfoObj);
    var generalOrderInfo = rowToString(orderColumns, orderRowsJoin);

    // write generic headers
    csv.writeNext(columnHeaderToString(orderColumns));
    csv.writeNext(columnHeaderToString(paymentColumns));
    csv.writeNext(columnHeaderToString(orderEntryAndVasOrderColumns));

    // write order specific info
    csv.writeNext([generalOrderInfo]);
    csv.writeNext(orderPaymentInfo(order));

    // item specific info
    for (let row of orderedItems) {
        var strRow = rowToString(orderEntryAndVasOrderColumns, row)
        csv.writeNext([strRow]);
    }

    csv.close();
    return targetFileName;
    } catch (e) {
        Logger.error('[exportCAOrder.js] generateCSVfiles() method crashed for the OrderID: {0}', order.orderNo);
        invalidOrderFileNameList.push(targetFileName);
    }
}

/**
 * Invoke functions to correct order infomation and call generateCSVfiles function
 * @param {String} targetFolderPath - target folder path
 */
function QueryOrdersExcecute(targetFolderPath, jobParameters) {
    var Order = require('dw/order/Order');
    // Query all orders filtered by args' values
    var queryString = 'exportStatus = {0} AND (status = {1} OR status = {2})';
    var args = [
        Order.EXPORT_STATUS_READY,
        Order.ORDER_STATUS_NEW,
        Order.ORDER_STATUS_OPEN
    ];
    Logger.info('[exportCAOrder.js] Logging starts from here for each fresh Job run...');
    var orders = OrderMgr.searchOrders(queryString, null, args);

    if (!orders) {
        Logger.info('[exportCAOrder.js] No Order was found to be exported.');
    }
    var listOfNotExportedOrdersObj;
    Transaction.wrap(function () {
        listOfNotExportedOrdersObj = CustomObjectMgr.createCustomObject("CANotExportedOrders", UUIDUtils.createUUID())
    });
    // Iterate over Orders and
    while (orders.hasNext()) {
        var order = orders.next();
        var fileNameArray = [];
        try {
            var currentTotalConsignment = 0;
            var promoID = '';
            var productLineItems = order.productLineItems;

            // Create an object which contains withOption and withOutOption arrays
            var splitedOrderByConsignments = splitOrdersBySingleOrMultiConsignments(productLineItems);
            var consignmentWithMultiItems = splitedOrderByConsignments["multipleItems"];
            var consignmentWithSingleItem = splitedOrderByConsignments["singleItem"];
            //Get total consignments of this order
            var totalConsignment = consignmentWithMultiItems.length === 0 ? consignmentWithSingleItem.length : consignmentWithSingleItem.length + 1;

            //Get Total Shipping Fee and ddividing up to number of consignments 
            var shippingTax = order.shippingTotalTax.value;
            var totalFees = order.shippingTotalGrossPrice.value;
            var arrayOfDevidedShippingFees = divideShippingFee(totalFees, totalConsignment);
            var arrayOfDevidedShippingTax = divideShippingFee(shippingTax, totalConsignment);

            // This conditon passes if order contains item(s) without any options(monogram or/and premium giftbox)
            if (consignmentWithMultiItems.length !== 0) {
                var consignmentID = productLineItems[consignmentWithMultiItems[0]].custom.consignmentID;
                var multiOrderedItems = generateOrderedProductItems(order, consignmentWithMultiItems, productLineItems, jobParameters);

                //Get promotions
                if (productLineItems[consignmentWithMultiItems[0]].proratedPriceAdjustmentPrices.length != 0) {
                    var adjustmentPrices = productLineItems[consignmentWithMultiItems[0]].proratedPriceAdjustmentPrices;
                    promoID = getPromo(adjustmentPrices, productLineItems[consignmentWithMultiItems[0]]);
                }
                // Call function to generate CSV 
                var generatedFilename = generateCSVfiles(order, multiOrderedItems, targetFolderPath, consignmentID, promoID, arrayOfDevidedShippingFees[currentTotalConsignment], arrayOfDevidedShippingTax[currentTotalConsignment]);
                fileNameArray.push(generatedFilename);
                currentTotalConsignment += 1;

            }
            //This condition passes if order contains monogram or/and premium mongram item
            if (consignmentWithSingleItem.length !== 0) {
                for (let i = 0; i < consignmentWithSingleItem.length; i += 1) {
                    var consignmentID = productLineItems[consignmentWithSingleItem[i]].custom.consignmentID;
                    //iterate over with option items and pass each item into generateOrdeedProductItems function
                    var singleOrderedItems = generateOrderedProductItems(order, consignmentWithSingleItem[i], productLineItems, jobParameters);

                    //Get promotions
                    if (productLineItems[consignmentWithSingleItem[i]].proratedPriceAdjustmentPrices.length != 0) {
                        var adjustmentPrices = productLineItems[consignmentWithSingleItem[i]].proratedPriceAdjustmentPrices;
                        promoID = getPromo(adjustmentPrices, productLineItems[consignmentWithSingleItem[i]]);
                    }

                    // Call function to generate CSV 
                    var generatedFilename = generateCSVfiles(order, singleOrderedItems, targetFolderPath, consignmentID, promoID, arrayOfDevidedShippingFees[currentTotalConsignment], arrayOfDevidedShippingTax[currentTotalConsignment]);
                    fileNameArray.push(generatedFilename);
                    currentTotalConsignment += 1;
                }
            }
            // No error. Set Order export status as EXPORTED
            Transaction.wrap(function () {
                order.setExportStatus(1);
            });
            Logger.info('[exportCAOrder.js] Order CSV export done successfully for Order no {0}', order.orderNo);
        } catch (e) {
            Logger.error('[exportCAOrder.js] QueryOrdersExcecute method crashed on Order ID:{0}, line:{1}. ERROR: {2} ', order.orderNo, e.lineNumber, e.message);
            invalidOrderFileNameList = invalidOrderFileNameList.concat(fileNameArray);
            // An error occured. Set order export status as NOT EXPORTED
            Transaction.wrap(function () {
                order.setExportStatus(3);
            });
            invalidOrderNumberList.push(order.orderNo);
        }
    }
    deleteInvalidOrderCSV(invalidOrderFileNameList, targetFolderPath);
    if(invalidOrderNumberList.length > 0) {
        Transaction.wrap(function () {
            listOfNotExportedOrdersObj.custom.listOfNotExportedOrders = invalidOrderNumberList.toString();
        });
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
        QueryOrdersExcecute(targetFolderPath, jobParameters);
    } catch (e) {
        //error handling
        Logger.error('ERROR in [exportCAOrder.js] execute() method | Error {0}', e.message);
        return new Status(Status.ERROR);
    }
}

module.exports = {
    execute: execute
};