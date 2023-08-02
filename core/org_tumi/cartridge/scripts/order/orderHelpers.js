'use strict';

var base = module.superModule;

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Locale = require('dw/util/Locale');
var Site = require('dw/system/Site');

var OrderModel = require('*/cartridge/models/order');

/**
* Returns a list of orders searched by the current customer
* @param {Object} currentCustomer - object with customer properties
* @param {Object} querystring - querystring properties
* @param {string} locale - the current request's locale id
* @returns {Object} - orderModel of the current dw order object
* */
function getSearchedOrders(currentCustomer, querystring, locale) {
    // get all orders for this user
    var customerNo = currentCustomer.profile.customerNo;
    var customerOrders = OrderMgr.queryOrders(
        'customerNo={0} AND status!={1} AND custom.productLineItemNames ILIKE {2} AND status!={3}',
        'creationDate desc',
        customerNo,
        Order.ORDER_STATUS_REPLACED,
        '*' + querystring.q + '*',
        Order.ORDER_STATUS_FAILED
    );

    var orders = [];

    var loadMoreCounter = 1;

    var loadMoreURL = URLUtils.url('Order-Filtered', 'loadMoreCount', loadMoreCounter.toString());
    var customerOrder;
    var orderModel;

    var currentLocale = Locale.getLocale(locale);

    var config = {
        numberOfLineItems: 'single'
    };

    while (customerOrders.hasNext()) {
        customerOrder = customerOrders.next();
        orderModel = new OrderModel(
            customerOrder,
            { config: config, countryCode: currentLocale.country }
        );
        orders.push(orderModel);
    }

    var currentOrders = orders.length;

    return {
        orders: orders,
        loadMoreURL: loadMoreURL,
        currentOrders: currentOrders
    };
}

/**
* Returns a list of orders for the current customer
* @param {Object} currentCustomer - object with customer properties
* @param {Object} querystring - querystring properties
* @param {string} locale - the current request's locale id
* @returns {Object} - orderModel of the current dw order object
* */
function getOrders(currentCustomer, querystring, locale) {
    // get all orders for this user
    var Site = require('dw/system/Site');
    var customerNo = currentCustomer.profile.customerNo;
    var customerOrders = OrderMgr.searchOrders(
        'customerNo={0} AND status!={1} AND status!={2}',
        'creationDate desc',
        customerNo,
        Order.ORDER_STATUS_REPLACED,
        Order.ORDER_STATUS_FAILED
    );

    var orders = [];

    var loadMoreURL = URLUtils.url('Order-Filtered', 'loadMoreCount', (Number(querystring) + 1)).abs().toString();
    var customerOrder;
    var orderModel;

    var currentLocale = Locale.getLocale(locale);

    var config = {
        numberOfLineItems: 'single'
    };

    var orderPageOrderCount = Site.getCurrent().getCustomPreferenceValue('orderListingPageOrderCount');

    var count = 0;
    while (customerOrders.hasNext()) {
        customerOrder = customerOrders.next();
        if (((orderPageOrderCount * (Number(querystring))) <= count) && (count < (orderPageOrderCount * (Number(querystring) + 1)))) {
            orderModel = new OrderModel(
                customerOrder,
                { config: config, countryCode: currentLocale.country }
            );
            orders.push(orderModel);
        }
        count += 1;
    }

    var currentOrders = orders.length + Number(querystring) * orderPageOrderCount;

    return {
        orders: orders,
        loadMoreURL: loadMoreURL,
        currentOrders: currentOrders
    };
}

/**
* Returns a list of orders for the current customer
* @param {string} styleVariant - Product style variant for the image URL
* @returns {string} - Image URL of the corresponding product
* */
function getImageURL(styleVariant) {
    var scene7Host = Site.current.getCustomPreferenceValue('scene7Host');
    var scene7Postfix = JSON.parse(Site.current.getCustomPreferenceValue('scene7Postfix'));
    var imageUrl = !empty(styleVariant) ? (scene7Host + styleVariant + scene7Postfix.main) : '';

    return imageUrl;
}

/**
* Returns a Card type for the order export mapping
* @param {string} paymentCardType - Type of the card used for payment
* @returns {string} - Corrected Card Type in case of different master card scenarios
* */
function getCardType(paymentCardType) {
    var cardType = paymentCardType;

    if (!empty(paymentCardType)) {
        switch (paymentCardType.toLowerCase()) {
            case 'master':
                cardType = 'MasterCard';
                break;

            case 'mastercard':
                cardType = 'MasterCard';
                break;

            case 'master card':
                cardType = 'MasterCard';
                break;

            default:
                cardType = paymentCardType;
                break;
        }
    }

    return cardType;
}

module.exports = {
    getSearchedOrders: getSearchedOrders,
    getOrders: getOrders,
    getImageURL: getImageURL,
    getCardType: getCardType
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});