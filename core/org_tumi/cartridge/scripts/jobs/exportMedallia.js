'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var File = require('dw/io/File');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var FileWriter = require('dw/io/FileWriter');
var Status = require('dw/system/Status');
var System = require('dw/system/System');
var Logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');

var HEADER_ATTRIBUTES = ['ORDER_ID', 'ORDER_DATETIME', 'FULFILLMENT_CENTER_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL_ADDRESS', 'PHONE_NUMBER', 'CUSTOMER_ID', 'CUSTOMER_TYPE', 'SHIP_DATETIME',
    'SHIP_METHOD', 'SHIP_BY', 'DELIVERY_DATETIME'];

var DATE_FORMAT = 'yyyy-MM-dd HH:mm:ssZ';

/**
 * Use this in case we need to include double quotes
 * @param {Object} orderData array to be updated
 * @param {Object} value value to be added
 */
function pushToArray(orderData, value) {
    var delimiter = '';
    // var delimiter = '"';
    orderData.push(delimiter + value + delimiter);
}

/**
 * Get EST date format
 * @param {Object} date date to be formtted
 * @returns {string} formatted date
 */
function getESTDate(date) {
    var dateCalendar = new Calendar(date);
    dateCalendar.setTimeZone(System.getInstanceTimeZone());
    return StringUtils.formatCalendar(dateCalendar, DATE_FORMAT);
}

/**
 * Convert Array of column header strings to a string with semicolons
 *
 * @param {Object} jobParams - job parameters
 * @return {Object} Job status
 */
function exportMedallia(jobParams) {
    var fileWriter = null;
    var csvWriter = null;
    var success = true;
    var count = 0;
    var outputFile = null;
    try {
        var sp = File.SEPARATOR;
        // Set file path from site preference
        var filePath = jobParams.TargetFolder;
        var fileDir = File.IMPEX + sp + filePath;
        var exportedDate = StringUtils.formatCalendar(new Calendar(), 'yyyyMMdd_HHmmss');
        // Set file name from site preference
        var fileName = jobParams.FileSuffix + exportedDate + '.csv';
        outputFile = new File(fileDir + sp + fileName);
        if (!outputFile.exists()) {
            new File(fileDir).mkdirs();
            outputFile.createNewFile();
        }

        var orderCreatedDateStart = jobParams.OrderCreatedDateStart;
        var orderCreatedDateEnd = jobParams.OrderCreatedDateEnd;
        var exporteAll = jobParams.ExporteAll;
        var markOrdersExported = jobParams.MarkOrdersExported;
        var m = Site.getCurrent().getCustomPreferenceValue('medalliaShipByMap');
        var shipByMap = JSON.parse(m);

        Logger.info('File info: {0}{1}{2}', fileDir, sp, fileName);
        Logger.info('Export order between {0} and {1}', orderCreatedDateStart == null ? 'since beginning' : orderCreatedDateStart, orderCreatedDateEnd == null ? 'until now' : orderCreatedDateEnd);

        var query = '';
        if (orderCreatedDateStart != null) {
            query += 'creationDate >= {0}';
        }

        if (orderCreatedDateEnd != null) {
            if (!empty(query)) {
                query += ' AND ';
            }
            query += 'creationDate < {1}';
        }

        if (!exporteAll) {
            if (!empty(query)) {
                query += ' AND ';
            }

            query += 'custom.exportedMedallia != {2}';
        }

        if (!empty(query)) {
            query += ' AND ';
        }

        query += '(status= {3} or status= {4} or status= {5})';

        Logger.info('query is {0}', query);

        fileWriter = new FileWriter(outputFile, 'UTF-8');
        csvWriter = new CSVStreamWriter(fileWriter, ',', '^');
        csvWriter.writeNext(HEADER_ATTRIBUTES);

        /**
         * Callback to upodate order
         * @param {Object} order to be updated
         */
        function callback(order) {
            try {
                var orderData = [];
                pushToArray(orderData, order.getOrderNo());
                pushToArray(orderData, order.getOrderNo());
                pushToArray(orderData, getESTDate(order.getCreationDate()));

                // Fulfillment centre
                var fulfillment = '';
                var defaultShipment = null;
                order.getShipments().toArray().forEach(function (shipment) {
                    if (empty(shipment.custom.fromStoreId)) {
                        defaultShipment = shipment;
                        if (order.getCurrencyCode() === 'USD') {
                            fulfillment = 'US10';
                        } else {
                            fulfillment = 'CA10';
                        }
                    }
                });

                if (empty(fulfillment)) {
                    defaultShipment = order.getShipments()[0];
                    fulfillment = defaultShipment.custom.fromStoreId;
                }
                pushToArray(orderData, fulfillment);

                pushToArray(orderData, order.getBillingAddress().getFirstName());
                pushToArray(orderData, order.getBillingAddress().getLastName());
                pushToArray(orderData, order.getCustomerEmail());
                pushToArray(orderData, order.getBillingAddress().getPhone());
                pushToArray(orderData, order.getCustomerNo());

                // CUSTOMER_TYPE
                if (order.getCustomerNo()) {
                    pushToArray(orderData, 'REGISTERED');
                } else {
                    pushToArray(orderData, 'GUEST');
                }

                // SHIP_DATETIME
                // pushToArray(orderData, getESTDate(shipment.custom.shipDate));

                // SHIP_METHOD
                pushToArray(orderData, defaultShipment.getShippingMethod().getDisplayName());

                // SHIP_BY
                pushToArray(orderData, shipByMap[defaultShipment.getShippingMethod().ID]);

                // DELIVERY_DATETIME

                csvWriter.writeNext(orderData);

                if (markOrdersExported) {
                    Transaction.begin();
                    order.custom.exportedMedallia = true;
                    Transaction.commit();
                }
                count += 1;
            } catch (e) {
                Logger.error(e.message);
                Logger.error(e.stack);
            }
        }

        // OrderMgr.processOrders(callback, 'custom.exportedMedallia != {0} and
        // (status= {1} or status= {2} or status= {3})', orderCreatedDateStart,
        // orderCreatedDateEnd, true, Order.ORDER_STATUS_NEW,
        // Order.ORDER_STATUS_OPEN, Order.ORDER_STATUS_COMPLETED );
        OrderMgr.processOrders(callback, query, orderCreatedDateStart, orderCreatedDateEnd, true, Order.ORDER_STATUS_NEW, Order.ORDER_STATUS_OPEN, Order.ORDER_STATUS_COMPLETED);

        Logger.info('Exported {0} orders', count);
    } catch (e) {
        success = false;
        Logger.error(e.stack);
        Logger.error('Error in script exportMedallia.js - Error message: ' + e.message);
    } finally {
        // check all readers are closed in case the catch block is hit

        if (!empty(csvWriter)) {
            csvWriter.close();
        }

        if (!empty(fileWriter)) {
            fileWriter.close();
        }
    }

    if (count === 0) {
        Logger.info('Nothing exported, removing file');
        if (outputFile != null) {
            outputFile.remove();
        }
    }
    if (success) {
        return new Status(Status.OK, 'OK', 'Export Medallia was successful.');
    }
    return new Status(Status.ERROR);
}

module.exports = {
    exportMedallia: exportMedallia
};
