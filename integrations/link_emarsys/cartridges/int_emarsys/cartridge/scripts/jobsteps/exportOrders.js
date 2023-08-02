'use strict';

var File = require('dw/io/File');
var Status = require('dw/system/Status');
var ProductLineItem = require('dw/order/ProductLineItem');
var GiftCertificateLineItem = require('dw/order/GiftCertificateLineItem');
var Variant = require('dw/catalog/Variant');

var EmarsysOrderTracking = {
    logger: require('dw/system/Logger').getLogger('emarsysOrderTracking', 'emarsysOrderTracking'),

    /**
     * @description Process Orders and send orders data to emarsys
     * @param {Object} args input parametr
     * @returns {dw.system.Status} - return status 'Ok' or 'Error'
     */
    execute: function (args) {
        try {
            this.enableCustomTimeFrame = args.enableCustomTimeFrame;
            this.timeframeStart = args.timeframeStart;
            this.timeframeEnd = args.timeframeEnd;
            this.destinationFolder = args.destinationFolder;
            this.currencyToConvert = args.smartInsightCurrency;
            this.defaultRequestCurrency = session.currency.currencyCode;
            this.queryString = args.queryString;

            this.jobHelper = require('int_emarsys/cartridge/scripts/helpers/jobHelper');
            this.fileName = this.jobHelper.createSmartInsightFeedName();
            this.exportFile = this.jobHelper.createSmartInsightExportFile(this.destinationFolder);

            this.day = 24 * 60 * 60 * 1000;// 24hrs in millis
            this.today = new Date();
            this.yesterday = new Date(this.today);
            // subtract number of milliseconds in 24h from today presentation im millis as well and create a new date with it
            this.yesterday = new Date(this.yesterday.setTime(this.yesterday.getTime() - this.day));

            this.prepareOrders();
            this.prepareCsvStreamWriter();
            this.processOrders();
            this.cleanUp();
        } catch (err) {
            this.logger.error('[Emarsys ExportOrders.js] - ***Error message: ' + err.message + '\n' + err.stack);

            return new Status(Status.ERROR, 'ERROR');
        }

        return new Status(Status.OK, 'OK');
    },

    /**
     * @description Search for orders updated with emarsys status
     * @returns {void} prepare orders
     */
    prepareOrders: function () {
        var OrderMgr = require('dw/order/OrderMgr');

        // start date for export timeframe
        var startDate = this.enableCustomTimeFrame ? this.timeframeStart : this.yesterday;
        // end date for export timeframe
        var endDate = this.enableCustomTimeFrame ? this.timeframeEnd : this.today;

        var ORDER_BY = 'creationDate desc';
        var query = 'creationDate >= {0} AND creationDate <= {1}';

        if (!this.enableCustomTimeFrame) {
            query += ' AND (custom.exported = NULL OR custom.exported = false)';
        }

        if (this.queryString !== null) {
            query += this.queryString;
        }

        try {
            this.orders = OrderMgr.searchOrders(query, ORDER_BY, startDate, endDate);
        } catch (err) {
            this.logger.error('[Emarsys ExportOrders.js] - ***Error message: ' + err.message + '\n' + err.stack + 'check the step parameters');

            return new Status(Status.ERROR, 'ERROR');
        }
        this.needExportData = this.orders.hasNext();

        return new Status(Status.OK, 'OK');
    },

    /**
     * @description Prepare csv stream writer
     * @returns {void} prepare header
     */
    prepareCsvStreamWriter: function () {
        if (!this.needExportData) {
            return;
        }

        var FileWriter = require('dw/io/FileWriter');
        var CSVStreamWriter = require('dw/io/CSVStreamWriter');

        var targetFolder = this.destinationFolder || 'src/emarsys-orders/outbound';
        var targetFolderPath = [File.IMPEX, targetFolder].join(File.SEPARATOR);
        var folder = new File(targetFolderPath);

        if (!folder.exists()) {
            folder.mkdirs();
        }

        this.csvStreamWriter = new CSVStreamWriter(new FileWriter(this.exportFile, 'UTF-8'), ',');

        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var co = CustomObjectMgr.getCustomObject('EmarsysSmartInsightConfiguration', 'emarsysSmartInsight');

        this.columnNames = [];    // names of columns in created feed
        this.attributes = [];    // attributes to read values from

        // throw error when can't load config
        if (!co) {
            this.logger.error('[Emarsys ExportOrders.js] - ***Error occurred during reading SmartInsight stored fields mapping.');
        }

        // parse mapped fields
        var mappedFields = JSON.parse(co.custom.mappedFields);

        if (mappedFields.length > 0) {
            for (var i = 0; i < mappedFields.length; i++) {
                var placeholder = mappedFields[i].placeholder;
                var columnName = this.jobHelper.escapeCSVField(placeholder);

                this.columnNames.push(columnName);
                this.attributes.push(mappedFields[i].field);
            }
        }

        this.csvStreamWriter.writeNext(this.columnNames);
    },

    /**
     * @description Takes the next order and puts the export status true
     */
    processOrders: function () {
        if (!this.needExportData) {
            return;
        }

        while (this.orders.hasNext()) {
            var order = this.orders.next();
            var plis = order.getAllProductLineItems().iterator();

            while (plis.hasNext()) {
                var pli = plis.next();
                var csvItem = this.getCsvItem(order, pli);

                this.csvStreamWriter.writeNext(csvItem);

                order.custom.exported = true;
            }
        }
    },

    /**
     * @description Takes the next order and puts the export status true
     */
    cleanUp: function () {
        if (this.orders) {
            this.orders.close();
        }

        if (this.csvStreamWriter) {
            this.csvStreamWriter.close();
        }
    },

    /**
     * @description Returns data line for CSV.
     * @param {dw.order.Order} order current order
     * @param {dw.order.ProductLineItem} pli ProductLineItem
     * @returns {Array} new feedLine
     */
    getCsvItem: function (order, pli) {
        var feedLine = [];

        this.attributes.forEach(function (attribute) {
            var origValue = this.renderAttributeValue(attribute, order, pli);
            var value = this.jobHelper.escapeCSVField(origValue);

            feedLine.push(value);
        }, this);

        return feedLine;
    },

    /**
     * @description Renders attribute value
     * @param {string} attributesChain - attributes chain (ex: attr1.attr2.attr3.attr4)
     * @param {Object} order current order
     * @param {Object} lineItem current lineItem
     * @returns {*} value
     */
    renderAttributeValue: function (attributesChain, order, lineItem) {
        var Calendar = require('dw/util/Calendar');
        var StringUtils = require('dw/util/StringUtils');

        var attributes = attributesChain.split('.');
        switch (attributes[0]) {
            /*
             Render order number
             */
            case 'order':
                return order.currentOrderNo;
            /*
             Render order creation date
             */
            case 'date':
                return StringUtils.formatCalendar(new Calendar(order.creationDate), 'YYYY-MM-dd');
            /*
             Render customer email
             */
            case 'customer':
                return order.customerEmail;
            /*
             Render item ID
             */
            case 'item':
                return this.getItemId(lineItem);
            /*
            Render variant ID
            */
            case 'variantid':
                return this.getItemId(lineItem);
            /*
            Render master ID
            */
            case 'masterid':
                return this.getMasterId(lineItem);
            /*
             Render item quantity
            */
            case 'quantity':
                return this.getQuantity(lineItem);
            /*
             Render item price
             */
            case 'price':
                var price = this.getPrice(lineItem, order, this.currencyToConvert, this.defaultRequestCurrency);
                this.checkOrderStatus(order, price);
                return price || '0';
            /*
             Render other object attributes
             */
            case 'custom':
                attributes.shift();
                return this.getCustom(attributes, order, lineItem);
            default:
                return null;
        }
    },
    /**
     * @description check order status
     * @param {objcet} order current order
     * @param {number} price value price
     * @returns {number} price
     */
    checkOrderStatus: function (order, price) {
        var priceNew;
        if (order.status.value === order.ORDER_STATUS_CANCELLED) {
            priceNew = -price;
        }
        return priceNew;
    },
    /**
     * @description Helper method to render master ID
     * @param {Object} lineItem object of type ProductLineItem or GiftCertificateLineItem
     * @returns {string} return master id
     */
    getMasterId: function (lineItem) {
        switch (true) {
            case lineItem instanceof ProductLineItem && !empty(lineItem.product) && lineItem.product instanceof Variant:
                return lineItem.product.masterProduct.ID;
            /*
            Render product ID if lineItem is ProductLineItem
            */
            case lineItem instanceof ProductLineItem:
                return lineItem.productID;
            /*
            Render gift certificate ID if lineItem is GiftCertificateLineItem
            */
            case lineItem instanceof GiftCertificateLineItem:
                return lineItem.getUUID();
            default:
                return null;
        }
    },

    /**
     * @description Helper method to render item ID
     * @param {Object} lineItem object of type ProductLineItem or GiftCertificateLineItem
     * @returns {string} return id
     */
    getItemId: function (lineItem) {
        switch (true) {
            /*
            Render product ID if lineItem is ProductLineItem
            */
            case lineItem instanceof ProductLineItem:
                return lineItem.productID;
            /*
            Render gift certificate ID if lineItem is GiftCertificateLineItem
            */
            case lineItem instanceof GiftCertificateLineItem:
                return lineItem.getUUID();
            default:
                return null;
        }
    },

    /**
     * @description Helper method to render item quantity
     * @param {Object} lineItem object of type ProductLineItem or GiftCertificateLineItem
     * @returns {number} value quantity
     */
    getQuantity: function (lineItem) {
        if (lineItem instanceof GiftCertificateLineItem) {
            return 1;
        }
        return lineItem.getQuantity().getValue();
    },

    /**
     * @description Helper method to render item price
     * @param {Object} lineItem object product line item
     * @param {Object} order current order
     * @param {string} currencyToConvert mnemonic currency code
     * @param {string} defaultRequestCurrency mnemonic code of the currency
     * @returns {*} return item GiftCertificateLineItem or ProductLineItem
     */
    getPrice: function (lineItem, order, currencyToConvert, defaultRequestCurrency) {
        var Currency = require('dw/util/Currency');
        var priceValue;

        switch (true) {
            case lineItem instanceof ProductLineItem:

                var orderCurrencyCode = order.getCurrencyCode();
                var currency;

                if (currencyToConvert === orderCurrencyCode) {
                    priceValue = lineItem.getProratedPrice().getValueOrNull();

                    if (!empty(priceValue)) {
                        return priceValue.toFixed(2);
                    }

                    return null;
                }

                priceValue = lineItem.getProratedPrice().getValueOrNull();
                currency = Currency.getCurrency(orderCurrencyCode);
                session.setCurrency(currency);
                var priceInOrderCurrency = lineItem.getProduct().getPriceModel().getPrice();

                currency = Currency.getCurrency(currencyToConvert);
                session.setCurrency(currency);

                var priceInCurrencyToConvert = lineItem.getProduct().getPriceModel().getPrice();
                var ratio = priceInCurrencyToConvert.getValue() / priceInOrderCurrency.getValue();
                var convertedPrice = (priceValue * ratio).toFixed(2);

                if (!empty(priceValue)) {
                    currency = Currency.getCurrency(defaultRequestCurrency);
                    session.setCurrency(currency);
                    return convertedPrice;
                }
                currency = Currency.getCurrency(defaultRequestCurrency);
                session.setCurrency(currency);
                return null;

            case lineItem instanceof GiftCertificateLineItem:
                priceValue = lineItem.getPrice().getValueOrNull();

                if (!empty(priceValue)) {
                    return priceValue.toFixed(2);
                }

                return null;

            default:
                return null;
        }
    },

    /**
     * @description Helper method to render custom fields
     * @param {Array} attributes current attributes
     * @param {Object} order current order
     * @param {Object} lineItem object of type ProductLineItem or GiftCertificateLineItem
     * @returns {*} values
     */
    getCustom: function (attributes, order, lineItem) {
        var firstAttr = attributes[0];
        attributes.shift();
        switch (firstAttr) {
            case 'order':
                return this.jobHelper.getOrderValues(order, attributes);
            case 'lineItem':
                return this.jobHelper.getLineItemValues(lineItem, attributes);
            case 'product':
                try {
                    return this.jobHelper.getProductValues(lineItem, attributes);
                } catch (e) {
                    return null;
                }
            default:
                return null;
        }
    }
};

module.exports.execute = EmarsysOrderTracking.execute.bind(EmarsysOrderTracking);
