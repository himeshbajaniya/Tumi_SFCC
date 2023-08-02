'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var UUIDUtils = require('dw/util/UUIDUtils');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var File = require('dw/io/File');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var FileWriter = require('dw/io/FileWriter');
var Status = require('dw/system/Status');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var Transaction = require('dw/system/Transaction');
var DATETIME_FORMAT_PATH = 'yyyy-MM-dd_HH-mm-ss-SSS';
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger').getLogger('TumiUS-OrderExport', 'TumiUS-OrderExport');
var isOrderExportSuccessWithoutIssue;
/**
 * 
 * @param {string} str string to convert capitalize
 * @returns {string} capitalized string
 */
function capitalize(str) {
    var arr = str.split(" ");
    var i;
    for (i = 0; i < arr.length; i++) {
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    }
    var capitalizeStr = arr.join(" ");
    return capitalizeStr;
}

function writeXmlElementNode(xsw, elementId, value, orderId) {
    try {
        xsw.writeStartElement(elementId);
        if (typeof value !== 'undefined') {
            xsw.writeCharacters(value);
            xsw.writeEndElement();
        } else {
            var error = {
                elementId: value
            };
            throw error;
        }
    } catch (e) {
        isOrderExportSuccessWithoutIssue = false;
        xsw.writeEndElement();
        Logger.error('[exportOrder.js] writeXmlElementNode() method crashed for the Node: <{0}>. for the OrderID: {1}', elementId, orderId);
    }
}

/**
 * Generate a creation date
 * @param {Object} order - OrderMgr.getOrder(orderId)
 * @return {String} returns a concatnated string
 */
function getCreationDate(date) {
    //var date = new Date(order.creationDate);
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
 * 
 * @param {dw.io.XMLStreamWriter} xsw XML Stream Writer
 * @param {Object} paymentInstrument payment instrument
 */
function writePaymentTypeDetails(xsw, paymentInstrument, ordersIterator) {
    var paymentMethodStr = paymentInstrument.paymentMethod.toLowerCase();
    var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    // eslint-disable-next-line default-case
    switch (paymentMethodStr) {
        case 'paypal':
            writeXmlElementNode(xsw, 'paymentType', paymentInstrument.paymentMethod, ordersIterator.orderNo);
            writeXmlElementNode(xsw, 'paymentID', paymentInstrument.custom.paypalOrderID, ordersIterator.orderNo);
            break;

        case 'credit_card':
            writeXmlElementNode(xsw, 'paymentType', capitalize(paymentMethodStr.replace('_', ' ').toLowerCase()), ordersIterator.orderNo);
            writeXmlElementNode(xsw, 'paymentCardNumber', paymentInstrument.creditCardNumber, ordersIterator.orderNo);
            writeXmlElementNode(xsw, 'paymentCardExp', paymentInstrument.creditCardExpirationMonth + '/' + paymentInstrument.creditCardExpirationYear, ordersIterator.orderNo);
            writeXmlElementNode(xsw, 'paymentCardType', OrderHelpers.getCardType(paymentInstrument.creditCardType), ordersIterator.orderNo);
            break;

        case 'gift_certificate':
            writeXmlElementNode(xsw, 'paymentType', 'Gift Card', ordersIterator.orderNo);
            writeXmlElementNode(xsw, 'paymentCardNumber', paymentInstrument.giftCertificateCode, ordersIterator.orderNo);
            break;

        case 'klarna_payments':
            writeXmlElementNode(xsw, 'paymentType', 'Klarna', ordersIterator.orderNo);
            writeXmlElementNode(xsw, 'paymentCardNumber', paymentInstrument.creditCardNumber, ordersIterator.orderNo);
            writeXmlElementNode(xsw, 'paymentCardExp', paymentInstrument.creditCardExpirationMonth + '/' + paymentInstrument.creditCardExpirationYear, ordersIterator.orderNo);
            writeXmlElementNode(xsw, 'paymentCardType', OrderHelpers.getCardType(paymentInstrument.creditCardType), ordersIterator.orderNo);
            break;

        case 'dw_apple_pay':
            writeXmlElementNode(xsw, 'paymentType', 'credit', ordersIterator.orderNo);
            writeXmlElementNode(xsw, 'paymentCardType', OrderHelpers.getCardType(paymentInstrument.creditCardType), ordersIterator.orderNo);
            break;
    }
}

/**
 * Render Discounted value by promotions
 * @param {dw.io.XMLStreamWriter} xsw XML Stream Writer
 * @param {Object} shipment Order object contains shipment info
 */
function renderDiscounts(xsw, shipment) {
    var productLineItems = shipment.productLineItems;
    try {
        if (!empty(productLineItems)) {
            var totalDiscounts = 0.0;
            for (var s = 0; s < productLineItems.length; s += 1) {
                var productLineItem = productLineItems[s];
                if (productLineItem.proratedPriceAdjustmentPrices.length !== 0) {
                    for (var j = 0; j < productLineItem.proratedPriceAdjustmentPrices.length; j += 1) {
                        var itemPromo = productLineItem.proratedPriceAdjustmentPrices.entrySet();
                        var promo = itemPromo[j];
                        totalDiscounts += (Math.abs(promo.value));
                    }
                }
            }

            if (totalDiscounts) {
                xsw.writeCharacters(totalDiscounts.toFixed(2));
            } else {
                xsw.writeCharacters(totalDiscounts.toFixed(1));
            }
        }
    } catch (e) {
        Logger.error('[exportOrder.js] renderDiscounts() method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
        return '';
    }
}

/**
 * Render Promotion name and values
 * @param {dw.io.XMLStreamWriter} xsw XML Stream Writer
 * @param {Object} shipment Order object contains shipment info
 */
function renderPromotions(xsw, shipment, ordersIterator) {
    var productLineItems = shipment.productLineItems;
    try {
        if (!empty(productLineItems)) {
            for (var s = 0; s < productLineItems.length; s += 1) {
                var productLineItem = productLineItems[s];
                if (productLineItem.proratedPriceAdjustmentPrices.length !== 0) {
                    for (var j = 0; j < productLineItem.proratedPriceAdjustmentPrices.length; j += 1) {
                        var promotion = productLineItem.proratedPriceAdjustmentPrices.entrySet();
                        var promo = promotion[j];
                        xsw.writeStartElement('promotion');
                        writeXmlElementNode(xsw, 'promotionID', promo.key.promotionID, ordersIterator.orderNo);
                        xsw.writeStartElement('promotionRate');
                        xsw.writeCharacters('');
                        xsw.writeEndElement();
                        writeXmlElementNode(xsw, 'promotionAmount', Math.abs(promo.key.price), ordersIterator.orderNo);
                        xsw.writeEndElement();
                    }
                }
            }
        }
    } catch (e) {
        Logger.error('[exportOrder.js] renderPromotions() method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
        return '';
    }
}

/**
 * Remove dash from the phone number
 * @param {string} phoneNumber used in this order
 * @returns {string} phone number without dashes
 */
function removeDashPhoneNumber(phoneNumber) {
    try {
        if (phoneNumber !== null) {
            var strPhoneNumber = phoneNumber.toString();
            if (strPhoneNumber[0] === '+') {
                strPhoneNumber = strPhoneNumber.substr(1);
            }
            var removedDashPhoneNumber = strPhoneNumber.replace(/-/g, '');
            return removedDashPhoneNumber;
        } else {
            return '';
        }
    } catch (e) {
        Logger.error('[exportOrder.js] removeDashPhoneNumber() method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
        return '';
    }
}

/**
 * 
 * @param {Object} args arguments
 * @returns {dw.system.Status} status OK or ERROR
 */
function getOrderDetails(args) {
    var xsw = null;
    try {
        var vasCount = 0;
        var productLineItems;
        var listOfNotExportedOrdersObj;
        var targeFolder = args.TargetFolder;
        var testOrderId = args.OrderId;
        var allInvalidOrders=[];
        Transaction.wrap(function () {
            listOfNotExportedOrdersObj = CustomObjectMgr.createCustomObject("ListOfNotExportedOrders", UUIDUtils.createUUID())

        });
     	
        var query = 'confirmationStatus={0} AND exportStatus={1}';
        var ordersIterators = OrderMgr.searchOrders(query, 'orderNo DESC', 2, 2).asList();
        if (!empty(testOrderId) || ordersIterators.length > 0) {
            var targetFolderPath = File.IMPEX + File.SEPARATOR + targeFolder;
        }
        if (testOrderId != null) {
            var order = OrderMgr.getOrder(testOrderId);
            if (order) {
                var startdate = StringUtils.formatCalendar(new Calendar(), 'yyyy-MM-dd_HH-mm-ss-SSS');
                var targetFileName = 'orderExport' + startdate + '.xml';
                var targetFile = new File(targetFolderPath + File.SEPARATOR + targetFileName);
                xsw = new XMLStreamWriter(new FileWriter(targetFile, 'UTF-8'));
                xsw.writeStartDocument();
                xsw.writeStartElement('Orders');
                for (var i = 0; i < order.shipments.length; i++) {
                    for (var o = 0; o < order.shipments[i].productLineItems.length; o++) {
                        vasCount += 1;
                    }
                }
                for (var i = 0; i < order.shipments.length; i++) {
                    initialorderXML(xsw, order, order.shipments[i], vasCount);
                }
                xsw.writeEndElement();
                xsw.close();
                return new Status(Status.OK);
            } else {
                Logger.error('[exportOrder.js] order does not exist')
            }
        } else {
            if (ordersIterators.length > 0) {
                Logger.info('[exportOrder.js] Logging starts from here for each fresh Job run...');
                var invalidOrderList = [];
                for (var l = 0; l < ordersIterators.length; l++) {
                    var ordersIterator = ordersIterators[l];
                    for (var i = 0; i < ordersIterator.shipments.length; i++) {
                        for (var o = 0; o < ordersIterator.shipments[i].productLineItems.length; o++) {
                            vasCount += 1;
                        }
                    }

                    var allShipmentsExportedSuccessfully = true;
                    var fileNameArray = [];
                    for (var i = 0; i < ordersIterator.shipments.length; i++) {
                        //var startdate = StringUtils.formatCalendar(new Calendar(), 'MMddyyyyhhmmss');
                        var startdate = StringUtils.formatCalendar(new Calendar(), 'yyyy-MM-dd_HH-mm-ss-SSS');
                        var targetFileName = ordersIterator.orderNo + '_' + startdate + '.xml';
                        var targetFile = new File(targetFolderPath + File.SEPARATOR + targetFileName);
                        var fileWriter : FileWriter = new FileWriter(targetFile);

                        fileNameArray.push(targetFileName);
                        isOrderExportSuccessWithoutIssue = true;
                        xsw = new XMLStreamWriter(fileWriter);
                        xsw.writeStartDocument();

                        xsw.writeStartElement('Orders');
                        initialorderXML(xsw, ordersIterator, ordersIterator.shipments[i], vasCount);
                        xsw.writeEndElement();

                        xsw.writeEndDocument();
                        xsw.close();
                        fileWriter.close();

                        if (!isOrderExportSuccessWithoutIssue) {
                            allShipmentsExportedSuccessfully = false;
                            invalidOrderList = invalidOrderList.concat(fileNameArray);
                            break;
                        }
                    }
                    vasCount = 0;
                    if (allShipmentsExportedSuccessfully) {
                        Transaction.wrap(function () {
                            ordersIterator.setExportStatus(1);
                        });
                        Logger.info('[exportOrder.js] Order xml export done successfully for Order no {0}', ordersIterator.orderNo);
                    } else {
                        Transaction.wrap(function () {
                            ordersIterator.setExportStatus(3);
                            allInvalidOrders.push(ordersIterator.orderNo);

                        });
                        Logger.info('[exportOrder.js] Order xml export had some issue for Order no {0}. Order is marked as NOT EXPORTED in BM. Please review the Order.', ordersIterator.orderNo);
                    }
                }
                if(allInvalidOrders.length > 0) {
                    Transaction.wrap(function () {
                        listOfNotExportedOrdersObj.custom.listOfNotExportedOrders = allInvalidOrders.toString();
        
                    });
                } else {
                    Transaction.wrap(function () {
                        CustomObjectMgr.remove(listOfNotExportedOrdersObj);
                    });
                }
                deleteInvalidOrderXml(invalidOrderList, targetFolderPath);
                return new Status(Status.OK);
            } else {
                Logger.info('[exportOrder.js] No Order was found to be exported.');
            }
        }
    } catch (e) {
        if (xsw) {
            xsw.close();
        }
        Logger.error('[exportOrder.js] getOrderDetails() method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
        return new Status(Status.ERROR);
    }
}

/**
 * This function deletes the XML file generated for invalid orders.
 * @param {Object} buggyorderList Array of invalid files
 * @param {Object} targetFolderPath folder to delete the files from
 */
function deleteInvalidOrderXml(invalidOrderList, targetFolderPath) {
    var targetFileName;
    var targetFile;
    for (var i = 0; i <= invalidOrderList.length - 1; i++ ) {
        targetFileName = invalidOrderList[i];
        targetFile = new File(targetFolderPath + File.SEPARATOR + targetFileName);
        if (targetFile) {
            targetFile.remove();
        }
    }
}

/**
 * Writing initial order informaton into xml
 * @param {Object} xsw XMLStreamWriter
 * @param {Object} ordersIterator order Object
 * @param {Object} shipment Order object contains shipment info
 * @param {Object} vasCount tracking vasCount
 */
function initialorderXML(xsw, ordersIterator, shipment, vasCount) {
    var date = new Date();
    var createDate = ordersIterator.creationDate;
    //var creationDateFormat = getCreationDate(createDate);
    xsw.writeStartElement('Order');
    writeXmlElementNode(xsw, 'OrderID', ordersIterator.orderNo, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'languageISOcode', ordersIterator.customerLocaleID, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'currencyISOcode', ordersIterator.currencyCode, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'siteID', Site.getCurrent().getCustomPreferenceValue('siteID'), ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'creationtime', getCreationDate(createDate), ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'orderType', Site.getCurrent().getCustomPreferenceValue('orderType'), ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'orderChannel', Site.getCurrent().getCustomPreferenceValue('orderChannel'), ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'submittedTime', getCreationDate(date), ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'employeeOrder', ordersIterator.custom.isEmployeeOrder, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'totalPrice', shipment.totalGrossPrice, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'totalTax', ordersIterator.totalTax.subtract(shipment.shippingTotalTax), ordersIterator.orderNo);
    xsw.writeStartElement('totalDiscounts');
    renderDiscounts(xsw, shipment);
    xsw.writeEndElement();
    writeXmlElementNode(xsw, 'shippingTax', shipment.shippingTotalTax, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'totalFees', ordersIterator.shippingTotalNetPrice + '.00', ordersIterator.orderNo);
    xsw.writeStartElement('Promotions');
    renderPromotions(xsw, shipment, ordersIterator);
    xsw.writeEndElement();

    xsw.writeStartElement('BillingCustomer');
    writeXmlElementNode(xsw, 'billingCustomerInternalID', ordersIterator.customer.ID, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'billingAddressCountryIsocode', (ordersIterator.billingAddress.countryCode.value).toUpperCase(), ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'billingAddressRegionIsocode', ordersIterator.billingAddress.stateCode, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'billingAddressPostalcode', ordersIterator.billingAddress.postalCode, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'billingAddressTown', ordersIterator.billingAddress.city, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'billingAddressStreet1', ordersIterator.billingAddress.address1, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'billingAddressStreet2', ordersIterator.billingAddress.address2, ordersIterator.orderNo);
    if (!empty(ordersIterator.billingAddress.phone)) {
        writeXmlElementNode(xsw, 'billingAddressCellphone', removeDashPhoneNumber(ordersIterator.billingAddress.phone), ordersIterator.orderNo);
    }
    writeXmlElementNode(xsw, 'billingAddressEmail', ordersIterator.customerEmail.trim(), ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'billingAddressFirstname', ordersIterator.billingAddress.firstName, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'billingAddressLastname', ordersIterator.billingAddress.lastName, ordersIterator.orderNo);
    writeXmlElementNode(xsw, 'billingCustomerPhone', removeDashPhoneNumber(ordersIterator.billingAddress.phone), ordersIterator.orderNo);
    xsw.writeEndElement();
    xsw.writeStartElement('orderAuthorizations');
    createOrderXML(xsw, ordersIterator);
    xsw.writeEndElement();
    	writeOrderEntries(xsw, ordersIterator, shipment, vasCount);
    xsw.writeEndElement();
}
/**
 * Writing Auth and Payment order informaton into xml
 * @param {dw.io.XMLStreamWriter} xsw XML Stream Writer
 * @param {Object} ordersIterator order object
 */
function createOrderXML(xsw, ordersIterator) {
    for (var i = 0; i < ordersIterator.paymentInstruments.length; i++) {
        var paymentInstrument = ordersIterator.paymentInstruments[i];
        var currentDate = ordersIterator.creationDate;
        xsw.writeStartElement('orderAuth');
        writeXmlElementNode(xsw, 'authDateAuthorized', getCreationDate(currentDate), ordersIterator.orderNo);
        writeXmlElementNode(xsw, 'authOrderNumber', ordersIterator.orderNo, ordersIterator.orderNo);
        writeXmlElementNode(xsw, 'authAmount', paymentInstrument.paymentTransaction.amount.value, ordersIterator.orderNo);
        writeXmlElementNode(xsw, 'authRequestToken', paymentInstrument.paymentTransaction.custom.requestToken, ordersIterator.orderNo);
        writeXmlElementNode(xsw, 'authRequestID', paymentInstrument.paymentTransaction.custom.requestId, ordersIterator.orderNo);
        writeXmlElementNode(xsw, 'authSubscriberID', paymentInstrument.paymentTransaction.transactionID, ordersIterator.orderNo);
        xsw.writeStartElement('paymentTypes');
        xsw.writeStartElement('paymentType');
        writePaymentTypeDetails(xsw, paymentInstrument, ordersIterator);
        xsw.writeEndElement();
        xsw.writeEndElement();
        xsw.writeEndElement();
    }
}

/**
 * Writing order entries informaton into xml
 * @param {Object} xsw XMLStreamWriter
 * @param {Object} ordersIterator order Object
 * @param {Object} shipments Order object contains shipment info
 * @param {Object} vasCount tracking vasCount
 */
function writeOrderEntries(xsw, ordersIterator, shipments, vasCount) {
    try {
        var Money = require('dw/value/Money');
        var Decimal = require('dw/util/Decimal');

        var shipment = shipments;
        var productLineItems = shipment.productLineItems;
        var entryCode;
        var discountsSumAppliedValues = 0.0;
        var vasCounter = vasCount;
        var vasMonogramAttributes;
        var productLineItemCount = 0;
        var loopNumber = 0;
        var currencyCode = ordersIterator.currencyCode.toString();
        for (var i = 0; i < productLineItems.length; i++) {
            if (!productLineItems[i].bonusProductLineItem && !productLineItems[i].custom.isPremiumMonogramLetter) {
                productLineItemCount++;
                loopNumber = i;
            }
        }
   
        var shippingCostForPI = shipment.shippingTotalNetPrice.divide(productLineItemCount);
        var shippingTaxForPI = shipment.shippingTotalTax.divide(productLineItemCount);
        var totalShippingCost = new Money(0, currencyCode);
        var totalShippingTax = new Money(0, currencyCode);

        for (var s = 0; s < productLineItems.length; s++) {
            var productLineItem = productLineItems[s];
            if (!productLineItem.custom.isPremiumMonogramLetter && !productLineItem.custom.parentProductLineItemID) {
                if (!productLineItem.bonusProductLineItem) {
                    totalShippingCost = totalShippingCost.add(shippingCostForPI);
                    totalShippingTax = totalShippingTax.add(shippingTaxForPI);
                    if (s == loopNumber) {
                        if (!shipment.shippingTotalNetPrice.equals(totalShippingCost)) {
                            var differenceForShippingCost = shipment.shippingTotalNetPrice.subtract(new Money(Number(totalShippingCost), currencyCode));
                            shippingCostForPI = shippingCostForPI.add(differenceForShippingCost);
                        }
                        if (!shipment.shippingTotalTax.equals(totalShippingTax)) {
                            var differenceForShippingTax = shipment.shippingTotalTax.subtract(new Money(Number(totalShippingTax), currencyCode));
                            shippingTaxForPI = shippingTaxForPI.add(differenceForShippingTax);
                        }
                    }
                }
                xsw.writeStartElement('OrderEntry');
                xsw.writeStartElement('Entry');
                xsw.writeStartElement('ShipToCustomer');
                if (!empty(productLineItem.custom.fromStoreId)) {
                    var storeId = productLineItem.custom.fromStoreId.replace(/^0+/, ''); // Remove leading 0's from store Id.
                    writeXmlElementNode(xsw, 'shipCustomerInternalID', storeId, ordersIterator.orderNo);
                }
                writeXmlElementNode(xsw, 'shipAddressCountryIsocode', (shipment.shippingAddress.countryCode.value).toUpperCase(), ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shipAddressRegionIsocode', shipment.shippingAddress.stateCode, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shipAddressPostalcode', shipment.shippingAddress.postalCode, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shipAddressTown', shipment.shippingAddress.city, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shipAddressStreet1', shipment.shippingAddress.address1, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shipAddressStreet2', shipment.shippingAddress.address2, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shipAddressCellphone', removeDashPhoneNumber(shipment.shippingAddress.phone), ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shipAddressEmail', ordersIterator.customerEmail.trim(), ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shipAddressFirstname', shipment.shippingAddress.firstName, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shipAddressLastname', shipment.shippingAddress.lastName, ordersIterator.orderNo);
                xsw.writeEndElement();
                xsw.writeStartElement('ShippingService');
                writeXmlElementNode(xsw, 'shippingCode1', shipment.shippingMethod.ID, ordersIterator.orderNo);
                xsw.writeEndElement();
                writeXmlElementNode(xsw, 'entryCode', productLineItem.custom.entryCode, ordersIterator.orderNo);
                entryCode = productLineItem.custom.entryCode;
                xsw.writeStartElement('parentEntryCode');
                xsw.writeCharacters('');
                xsw.writeEndElement();
                if (!empty(entryCode)) {
                    writeXmlElementNode(xsw, 'entryNumber', parseInt(entryCode.substr(entryCode.indexOf('_') + 1)), ordersIterator.orderNo);
                }
                writeXmlElementNode(xsw, 'consignmentID', productLineItem.custom.consignmentID, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'productCode', productLineItem.productID, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'itemQuantity', productLineItem.quantityValue, ordersIterator.orderNo);
                xsw.writeStartElement('unitCode');
                xsw.writeCharacters('pieces');
                xsw.writeEndElement();
                writeXmlElementNode(xsw, 'basePrice', productLineItem.basePrice, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'totalPrice', productLineItem.netPrice, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'sumTaxValues', productLineItem.tax, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shippingCost', productLineItem.bonusProductLineItem ? 0 : shippingCostForPI, ordersIterator.orderNo);
                writeXmlElementNode(xsw, 'shippingTaxCharge', productLineItem.bonusProductLineItem ? 0 : shippingTaxForPI, ordersIterator.orderNo);
                xsw.writeStartElement('discountsSumAppliedValues');
                if (productLineItem.proratedPriceAdjustmentPrices.length != 0) {
                    for (var p = 0; p < productLineItem.proratedPriceAdjustmentPrices.length; p++) {
                        var promotion = productLineItem.proratedPriceAdjustmentPrices.entrySet();
                        var promo = promotion[p];
                        discountsSumAppliedValues = discountsSumAppliedValues + (Math.abs(promo.value));
                    }
                }
                if (discountsSumAppliedValues) {
                    xsw.writeCharacters(discountsSumAppliedValues.toFixed(2));
                } else {
                    xsw.writeCharacters(discountsSumAppliedValues.toFixed(1));
                }
                discountsSumAppliedValues = 0.0;
                xsw.writeCharacters('');
                xsw.writeEndElement();
                writeXmlElementNode(xsw, 'productName', productLineItem.lineItemText, ordersIterator.orderNo);
                var currentProduct = !(productLineItem.product) ? '' : productLineItem.product;
                var upc = (currentProduct && currentProduct.UPC) ? currentProduct.UPC : '';
                writeXmlElementNode(xsw, 'upc', upc, ordersIterator.orderNo);
                xsw.writeStartElement('promisedShipDate');
                xsw.writeCharacters('');
                xsw.writeEndElement();
                var availabilityStatus = (currentProduct && currentProduct.availabilityModel.availabilityStatus) ? currentProduct.availabilityModel.availabilityStatus : '';
                writeXmlElementNode(xsw, 'quantityStatus', availabilityStatus, ordersIterator.orderNo);

                var vasAttributes = JSON.parse(productLineItem.custom.vasGiftBoxAttributes);
                if (!empty(vasAttributes)) {
                    for (var z = 0; z < vasAttributes.length; z += 1) {
                        if (vasAttributes[z].productCode === 'GIFTMSG') {
                            writeXmlElementNode(xsw, 'ItemGiftWrap', true, ordersIterator.orderNo);
                        }
                    }
                } else {
                    writeXmlElementNode(xsw, 'ItemGiftWrap', false, ordersIterator.orderNo);
                }

                xsw.writeStartElement('Promotions');
                if (productLineItem.proratedPriceAdjustmentPrices.length != 0) {
                    for (var j = 0; j < productLineItem.proratedPriceAdjustmentPrices.length; j++) {
                        var promotion = productLineItem.proratedPriceAdjustmentPrices.entrySet();
                        var promo = promotion[j];
                        xsw.writeStartElement('promotion');
                        writeXmlElementNode(xsw, 'promotionID', promo.key.promotionID, ordersIterator.orderNo);
                        xsw.writeStartElement('promotionRate');
                        xsw.writeCharacters('');
                        xsw.writeEndElement();
                        writeXmlElementNode(xsw, 'promotionAmount', Math.abs(promo.value), ordersIterator.orderNo);
                        xsw.writeEndElement();
                    }
                }
                xsw.writeEndElement();
                if (productLineItem.custom.vasTotalAttributes != null) {
                    var vasAttributes = JSON.parse(productLineItem.custom.vasTotalAttributes)
                    for (var z = 0; z < vasAttributes.length; z += 1) {
                        var productType = vasAttributes[z].productType;
                        switch (productType) {
                            case 'MONOPATCH':
                            case 'MONOTAG':
                                var vasField1String = '';
                                if (vasAttributes[z].vasField1) {
                                    var tempMonogramArray = vasAttributes[z].vasField1.replace(/ /g, '').split('');
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
                                    if(vasField1String.length < 9 ){
                                        vasField1String = vasField1String.padEnd(9, ' ');
                                    }
                                }
                                xsw.writeStartElement('VAS');
                                writeXmlElementNode(xsw, 'entryCode', vasAttributes[z].vasEntryCode, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'parentEntryCode', entryCode, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'entryNumber', parseInt(vasAttributes[z].vasEntryCode.substr(vasAttributes[z].vasEntryCode.indexOf('_') + 1)), ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'productCode', vasAttributes[z].productCode, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'quantity', vasAttributes[z].quantity, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'vasField1', vasField1String, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'vasField2', vasAttributes[z].vasField2, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'vasField3', vasAttributes[z].vasField3, ordersIterator.orderNo);
                                xsw.writeEndElement();
                                break;
                            case 'GIFTBOX':
                                xsw.writeStartElement('VAS');
                                writeXmlElementNode(xsw, 'entryCode', vasAttributes[z].vasEntryCode, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'parentEntryCode', entryCode, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'entryNumber', parseInt(vasAttributes[z].vasEntryCode.substr(vasAttributes[z].vasEntryCode.indexOf('_') + 1)), ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'productCode', vasAttributes[z].productCode, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'quantity', vasAttributes[z].quantity, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'basePrice', vasAttributes[z].basePrice, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'totalPrice', vasAttributes[z].totalPrice, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'sumTaxValues', vasAttributes[z].sumTaxValues, ordersIterator.orderNo);
                                xsw.writeEndElement();
                                break;
                            case 'GIFTMSG':
                                xsw.writeStartElement('VAS');
                                writeXmlElementNode(xsw, 'entryCode', vasAttributes[z].vasEntryCode, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'parentEntryCode', entryCode, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'entryNumber', parseInt(vasAttributes[z].vasEntryCode.substr(vasAttributes[z].vasEntryCode.indexOf('_') + 1)), ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'productCode', vasAttributes[z].productCode, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'quantity', vasAttributes[z].quantity, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'vasField1', vasAttributes[z].vasField1, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'vasField2', vasAttributes[z].vasField2, ordersIterator.orderNo);
                                writeXmlElementNode(xsw, 'vasField3', vasAttributes[z].vasField3, ordersIterator.orderNo);
                                xsw.writeEndElement();
                                break;
                            case 'PREMIUMMONOPATCH':
                            case 'PREMIUMMONOTAG':
                                if (!('productName' in vasAttributes[z])) {
                                    var vasField1String = '';
                                    if (vasAttributes[z].vasField1) {
                                        var tempMonogramArray = vasAttributes[z].vasField1.replace(/ /g, '').split('');
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
                                        if(vasField1String.length < 9 ){
                                            vasField1String = vasField1String.padEnd(9, ' ');
                                        }
                                    }
                                    xsw.writeStartElement('VAS');
                                    writeXmlElementNode(xsw, 'entryCode', vasAttributes[z].vasEntryCode, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'parentEntryCode', entryCode, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'entryNumber', parseInt(vasAttributes[z].vasEntryCode.substr(vasAttributes[z].vasEntryCode.indexOf('_') + 1)), ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'productCode', vasAttributes[z].productCode, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'quantity', vasAttributes[z].quantity, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'vasField1', vasField1String, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'vasField2', vasAttributes[z].vasField2, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'vasField3', vasAttributes[z].vasField3, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'vasField4', vasAttributes[z].vasField4, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'vasField5', vasAttributes[z].vasField5, ordersIterator.orderNo);
                                    xsw.writeEndElement();
                                } else {
                                    xsw.writeStartElement('VAS');
                                    writeXmlElementNode(xsw, 'entryCode', vasAttributes[z].vasEntryCode, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'parentEntryCode', entryCode, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'entryNumber', parseInt(vasAttributes[z].vasEntryCode.substr(vasAttributes[z].vasEntryCode.indexOf('_') + 1)), ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'productCode', vasAttributes[z].productCode, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'quantity', vasAttributes[z].quantity, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'basePrice', vasAttributes[z].basePrice, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'totalPrice', vasAttributes[z].totalPrice, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'sumTaxValues', vasAttributes[z].sumTaxValues, ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'discountsSumAppliedValues', '0.00', ordersIterator.orderNo);
                                    writeXmlElementNode(xsw, 'productName', vasAttributes[z].productName, ordersIterator.orderNo);
                                    xsw.writeEndElement();
                                }
                                break;
                        }
                    }
                }
                xsw.writeEndElement();
                xsw.writeEndElement();
            }
        }
        vasCounter = 0;
    } catch (e) {
        isOrderExportSuccessWithoutIssue = false;
        Logger.error('[exportOrder.js] writeOrderEntries() method crashed for OrderID: {0} at line:{1}. ERROR: {2}', ordersIterator.orderNo, e.lineNumber, e.message);
    }
}

module.exports = {
    getOrderDetails: getOrderDetails
};