'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
var jobHelpers = require('org_tumi/cartridge/scripts/helpers/cronjobHelper');
var Order = require('dw/order/Order');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var svc;
var Transaction = require('dw/system/Transaction');

/**
 * @function
 * @name createOrderJSON
 * @param {Object} order input order to create the export JSON
 * @return {JOSN} returns the JSON of the input order
 */
function createOrderJSON(order) {

    var orderJSON = {};
    orderJSON.order_id = order.orderNo;
    orderJSON.locale = order.customerLocaleID;
    orderJSON.purchase_date = order.creationDate;
    orderJSON.subtotal_price = order.totalNetPrice.value;
    orderJSON.total_shipping = order.shippingTotalPrice.value;
    orderJSON.total_tax = order.totalTax.value;
    orderJSON.total_discounts = 0;
    orderJSON.total_price = order.totalGrossPrice.value;
    orderJSON.currency = order.currencyCode;

    var shopper = {};
    shopper.first_name = order.billingAddress.firstName;
    shopper.last_name = order.billingAddress.lastName;
    shopper.email = order.customerEmail;

    orderJSON.shopper = shopper;

    var billingAddress = {};
    billingAddress.address1 = order.billingAddress.address1;
    billingAddress.address2 = order.billingAddress.address2;
    billingAddress.city = order.billingAddress.city;
    billingAddress.province = order.billingAddress.stateCode;
    billingAddress.country = order.billingAddress.countryCode.value;
    billingAddress.postal_code = order.billingAddress.postalCode;

    orderJSON.billing_address = billingAddress;

    var deliveries = [];

    var delivery = {};

    for each (var ship in order.shipments) {
        var recipient = {};
        recipient.first_name = ship.shippingAddress.firstName;
        recipient.last_name = ship.shippingAddress.lastName;
        recipient.email = order.customerEmail;

        var destination_address = {};
        destination_address.address1 = ship.shippingAddress.address1;
        destination_address.address2 = ship.shippingAddress.address2;
        destination_address.city = ship.shippingAddress.city;
        destination_address.province = ship.shippingAddress.stateCode;
        destination_address.postal_code = ship.shippingAddress.postalCode;
        destination_address.country = ship.shippingAddress.countryCode.value;
        destination_address.phone = ship.shippingAddress.phone;
        destination_address.address_type = 'shopper_address'; // Get confirmation

        var line_item_quantities = {};

        for each (var li in ship.productLineItems) {
            let productID = li.productID;
            line_item_quantities[productID] = li.quantity.value;
        }

        delivery.recipient = recipient;
        delivery.destination_address = destination_address;
        delivery.line_item_quantities = line_item_quantities;

        deliveries.push(delivery);

    }

    orderJSON.deliveries = deliveries;

    var line_items = [];

    var hostName = Site.getCurrent().getCustomPreferenceValue('siteHostName');

    for each (var li in order.productLineItems) {
        if ('isPremiumMonogramLetter' in li.custom && !!li.custom.isPremiumMonogramLetter) continue;
        var pli = {};
        pli.product_id = li.productID
        pli.variant_id = li.product ? (li.product.variationModel ? (li.product.variationModel.selectedVariant ? li.product.variationModel.selectedVariant.ID : '') : '') : '';
        pli.line_item_id = li.UUID;
        pli.upc = li.product ? li.product.UPC : '';
        pli.product_name = li.productName;
        pli.description = li.product ? (li.product.shortDescription ? li.product.shortDescription.source : '') : '';

        var styleVariant = '';
        if ( !empty( li.product ) ) {
            styleVariant = Object.hasOwnProperty.call(li.product.custom, 'styleVariant') && li.product.custom.styleVariant ? li.product.custom.styleVariant : '';
        }
        pli.image = OrderHelpers.getImageURL(styleVariant);
        pli.link = '';
        if (!empty(li.product)) {
            pli.link = jobHelpers.generateUSandCAPdpUrls(li.product, hostName);
        }
        pli.price = li.basePrice.value;

        var categoryArray = [];

        if (li.product) {
            for each(var newCategory in li.product.categories) {
                var category = {};
                category.name = newCategory.displayName;
                category.id = newCategory.ID;

                categoryArray.push(category);
            }
        }
        
        pli.categories = categoryArray;

        line_items.push(pli);
    }
    orderJSON.line_items=line_items;

    return orderJSON;
}

function init() {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var token = Site.getCurrent().getCustomPreferenceValue('lincToken');
    // Create a service object

    try {
        svc = LocalServiceRegistry.createService('lincOrderService', {
            createRequest: function (_svc, args) {
                if (args) {
                    return JSON.stringify(args);
                }
                return null;
            },
            parseResponse: function (_svc, client) {
                return client.text;
            }
        });
        // Configure the service related parameters
        var config = svc.getConfiguration();
        var credential = config.getCredential();
        var url = !empty(credential.getURL()) ? credential.getURL() : '';
        
        svc.addHeader('Authorization', 'Bearer ' + token);
        svc.setRequestMethod('POST');
        svc.setURL(url);
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('version', 5);

    } catch(e) {
        Logger.error('Error in creating Linc service: ', e.message);
    }
}

/**
 * @function
 * @name execute
 */
function execute() {

    var orders = OrderMgr.queryOrders(
        'status!={0} AND status!={1} AND status!={2} AND exportStatus = {3} AND custom.lincReadyForExport = {4}',
        'creationDate desc',
        Order.ORDER_STATUS_REPLACED,
        Order.ORDER_STATUS_CANCELLED,
        Order.ORDER_STATUS_FAILED,
        Order.EXPORT_STATUS_EXPORTED,
        true
    );

    var token = Site.getCurrent().getCustomPreferenceValue('lincToken');
    init();

    while (orders.hasNext()) {
        var order = orders.next();
        var orderJSON = createOrderJSON(order);

        var result = svc.call(orderJSON);

        if (result.ok || result.error == 409) {
            Transaction.wrap(function () {
                order.custom.lincReadyForExport = false;
            });
        }
        else {
            Logger.error('Error in Linc order Processing: ', result.errorMessage);
        }
    }
}

module.exports = {
    execute: execute
};
