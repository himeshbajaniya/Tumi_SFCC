'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var File = require('dw/io/File');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var FileWriter = require('dw/io/FileWriter');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');

var customAttributes = ['OrderID', 'Blank', 'DateEntered', 'DateTransactionCompleted', 'SKUNumber', 'Quantity', 'Amount', 'Currency',
    "Blank", "Blank", "Blank", "ProductName"];

function getCreationDate(orderDate) {
    var date = new Date(orderDate);
    var year = date.getFullYear();
    var month = String(date.getMonth()+1).padStart(2, 0); 
    var day = String(date.getDate()).padStart(2, 0);
    var creationDate = [year, month, day].join(' ');
    return creationDate;
};

function getProduct(order, productLineItem) {
    return {
        OrderID: order.orderNo,
        Blank: '',
        DateEntered: getCreationDate(order.creationDate),
        DateTransactionCompleted: getCreationDate(order.lastModified),
        SKUNumber: productLineItem.productID,
        Quantity: productLineItem.quantityValue,
        Amount: productLineItem.netPrice,
        Currency:order.currencyCode,
        Blank: '',
        Blank: '',
        Blank: '',
        ProductName: productLineItem.productName,
    }
};

function addFeedsIntoArray(productFeeds) {
    var feeds = [];
    for (let attribute of customAttributes) {
        if (productFeeds[attribute] == undefined) {
            feeds.push(''); 
        } else {
            feeds.push(productFeeds[attribute]);
        }
    }
    return feeds;
};

function getCompleteOrderDetails(args) {
    var targetFolder = args.TargetFolder;
    var targetFolderPath = File.IMPEX + File.SEPARATOR + targetFolder;
    var targetFileName = 'rekuten' + '.csv';
    var targetFile = new File(targetFolderPath + File.SEPARATOR + targetFileName);
    var csv = new CSVStreamWriter(new FileWriter(targetFile, 'UTF-8'));
    
    csv.writeNext(customAttributes);
    var Calendar = require('dw/util/Calendar');
    var query = 'exportStatus = {0} AND lastModified >= {1} AND lastModified <= {2} AND shippingStatus = {3}';
    var fromRange = new Calendar();
    fromRange.add(Calendar.DAY_OF_MONTH, -(args.days_before));
    var ordersIterators = OrderMgr.searchOrders(query, null, Order.EXPORT_STATUS_READY, fromRange.time, new Date(), Order.SHIPPING_STATUS_SHIPPED).asList();
    
    if (ordersIterators.length > 0) {
        for (var l = 0; l < ordersIterators.length; l++) {
            var ordersIterator = ordersIterators[l];
            for (var i = 0; i < ordersIterator.productLineItems.length; i++) {
               var productFeeds = getProduct(ordersIterator, ordersIterator.productLineItems[i]);
               var convertedOrderFeed = addFeedsIntoArray(productFeeds);

                csv.writeNext(convertedOrderFeed);
            }
            //getProduct(ordersIterator,ordersIterator.productLineItems);
        }
    }
    csv.close();
};

module.exports = {
    getCompleteOrderDetails: getCompleteOrderDetails
};