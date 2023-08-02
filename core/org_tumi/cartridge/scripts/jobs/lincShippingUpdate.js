'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Site = require('dw/system/Site');
var Logger = dw.system.Logger.getLogger('Linc', 'fulfillment');
var Transaction = require('dw/system/Transaction');

var svcFulfillment;
var svcCancellation;
var svcReadyForPickup;

/**
 * @function
 * @name sendFulfillmentToLinc
 * @param {Object} order input order to create the export JSON
 */
function sendFulfillmentToLinc(order) {
    Logger.info('Processing order {0}', order.orderNo);

    // grab all unsent tracking numbers
    var trackingNumbers = [];

    order.productLineItems.toArray().forEach(function (pli) {
        if (pli.custom.shipSentToLinc || ignore(pli)) {
            return;
        }

        if (!empty(pli.custom.packageTrackingId) && (pli.custom.shippingstatus == 'SHIPPED') && !trackingNumbers.includes(pli.custom.packageTrackingId)) {
            trackingNumbers.push(pli.custom.packageTrackingId);
        }
    });

    if (empty(trackingNumbers)) {
        Logger.debug('Nothing to send for fulfillment for order {0}', order.orderNo);
        return;
    }
    trackingNumbers.forEach(function (trackingNumber) {
        try {
            var orderJSON = {};
            orderJSON.order_id = order.orderNo;
            var fulfillDate = order.creationDate;
            var lineItems = [];
            var shipAddress = null;
            var recipient = null;
            var pliToUpdate = [];
            var carrierName = null;
            order.productLineItems.toArray().forEach(function (pli) {
                // send actually all pli for this tracking for Linc has all history data
                if (ignore(pli) || trackingNumber !== pli.custom.packageTrackingId) {
                    return;
                }

                var lineItem = {};
                if (empty(shipAddress)) {
                    shipAddress = getShippingAddress(pli.getShipment(), 'shopper_address');
                }

                if (empty(recipient)) {
                    recipient = getRecipient(order, pli.getShipment());
                }

                if (empty(carrierName)) {
                    carrierName = getCarrierName(pli);
                }

                lineItem.product_id = pli.productID;
                lineItem.variant_id = pli.product ? (pli.product.variationModel ? (pli.product.variationModel.selectedVariant ? pli.product.variationModel.selectedVariant.ID : '') : '') : '';
                lineItem.line_item_id = pli.UUID;
                lineItem.quantity = pli.quantity.value;

                lineItems.push(lineItem);

                if (!empty(pli.custom.shipDate) && fulfillDate.getTime() < pli.custom.shipDate.getTime()) {
                    fulfillDate = pli.custom.shipDate;
                }

                pliToUpdate.push(pli);
            });

            orderJSON.carrier = carrierName;
            orderJSON.destination_address = shipAddress;
            orderJSON.recipient = recipient;
            orderJSON.fulfill_date = fulfillDate.toISOString();
            orderJSON.tracking_number = trackingNumber;
            orderJSON.products = lineItems;

            var data = [orderJSON];

            Logger.info('orderJSON: {0}', JSON.stringify(data));

            var args = {};
            args.data = data;

            var result = svcFulfillment.call(args);

            if (result.ok || result.error == 409) {
                Transaction.wrap(function () {
                    pliToUpdate.forEach(function (pliToUpdt) {
                        pliToUpdt.custom.shipSentToLinc = true;
                    });
                });
            } else {
                Logger.error('Error in Linc sendFulfillmentToLinc: ', result.errorMessage);
            }
        } catch (e) {
            Logger.error(e.message);
            Logger.error(e.stack);
        }
    });
}

/**
 * @function
 * @name sendCancellationToLinc
 * @param {Object} order input order to create the export JSON
 */
function sendCancellationToLinc(order) {
    Logger.info('Processing order {0}', order.orderNo);
    var cancelledPLI = [];
    order.productLineItems.toArray().forEach(function (pli) {
        if (pli.custom.shipSentToLinc || ignore(pli)) {
            return;
        }

        if ((pli.custom.shippingstatus == 'CANCELLED') && !pli.custom.shipSentToLinc) {
            cancelledPLI.push(pli);
        }
    });

    if (empty(cancelledPLI)) {
        Logger.debug('Nothing to send for cancellation for order {0}', order.orderNo);
        return;
    }

    try {
        var orderJSON = {};
        orderJSON.order_id = order.orderNo;
        var lineItems = [];
        var shipAddress = null;
        var recipient = null;
        var pliToUpdate = [];
        cancelledPLI.forEach(function (pli) {
            var lineItem = {};
            if (empty(shipAddress)) {
                shipAddress = getShippingAddress(pli.getShipment(), 'shopper_address');
            }

            if (empty(recipient)) {
                recipient = getRecipient(order, pli.getShipment());
            }

            lineItem.product_id = pli.productID;
            lineItem.variant_id = pli.product ? (pli.product.variationModel ? (pli.product.variationModel.selectedVariant ? pli.product.variationModel.selectedVariant.ID : '') : '') : '';
            lineItem.line_item_id = pli.UUID;
            lineItem.cancelled_quantity = pli.quantity.value;

            lineItems.push(lineItem);

            pliToUpdate.push(pli);
        });

        orderJSON.destination_address = shipAddress;
        orderJSON.recipient = recipient;
        orderJSON.products = lineItems;

        var data = [orderJSON];

        Logger.info('orderJSON: {0}', JSON.stringify(data));

        var args = {};
        args.data = data;

        var result = svcCancellation.call(args);

        if (result.ok || result.error == 409) {
            Transaction.wrap(function () {
                pliToUpdate.forEach(function (pliToUpdt) {
                    pliToUpdt.custom.shipSentToLinc = true;
                });
            });
        } else {
            Logger.error('Error in Linc sendCancellationToLinc: ', result.errorMessage);
        }
    } catch (e) {
        Logger.error(e.message);
        Logger.error(e.stack);
    }
}

/**
 * @function
 * @name sendCancellationToLinc
 * @param {Object} order input order to create the export JSON
 */
function sendReadyForPickupToLinc(order) {
    Logger.info('Processing order {0}', order.orderNo);
    var readyPickupPLI = [];
    order.productLineItems.toArray().forEach(function (pli) {
        if (pli.custom.shipSentToLinc || ignore(pli)) {
            return;
        }

        if ((pli.custom.shippingstatus == 'READY_FOR_PICKUP') && !pli.custom.shipSentToLinc) {
            readyPickupPLI.push(pli);
        }
    });

    if (empty(readyPickupPLI)) {
        Logger.debug('Nothing to send for sendReadyForPickupToLinc for order {0}', order.orderNo);
        return;
    }

    try {
        var orderJSON = {};
        orderJSON.order_id = order.orderNo;
        var lineItems = [];
        var pliToUpdate = [];
        readyPickupPLI.forEach(function (pli) {
            var lineItem = {};

            lineItem.product_id = pli.productID;
            lineItem.variant_id = pli.product ? (pli.product.variationModel ? (pli.product.variationModel.selectedVariant ? pli.product.variationModel.selectedVariant.ID : '') : '') : '';
            lineItem.line_item_id = pli.UUID;
            lineItem.cancelled_quantity = pli.quantity.value;
            orderJSON.store_id = pli.getShipment().custom.fromStoreId;

            lineItems.push(lineItem);

            pliToUpdate.push(pli);
        });

        orderJSON.products = lineItems;
        orderJSON.ready_for_pickup_id = '1';
        orderJSON.pickup_method = 'walk_in';

        var data = [orderJSON];

        Logger.info('orderJSON: {0}', JSON.stringify(data));

        var args = {};
        args.data = data;

        var result = svcReadyForPickup.call(args);

        if (result.ok || result.error == 409) {
            Transaction.wrap(function () {
                pliToUpdate.forEach(function (pliToUpdt) {
                    pliToUpdt.custom.shipSentToLinc = true;
                });
            });
        } else {
            Logger.error('Error in Linc sendReadyForPickupToLinc: ', result.errorMessage);
        }
    } catch (e) {
        Logger.error(e.message);
        Logger.error(e.stack);
    }
}

function checkLincStatus(order) {
    var allSent = true;
    order.productLineItems.toArray().forEach(function (pli) {
        if (ignore(pli) || pli.custom.shipSentToLinc) {
            return;
        }

        allSent = false;
    });

    if (allSent) {
        Transaction.wrap(function () {
            order.custom.shipSentToLinc = true;
        });
    }
}

function getCarrierName(pli) {
    return pli.getShipment().getShippingMethod().custom.lincCarrier.value;
}

function init(serviceName) {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var token = Site.getCurrent().getCustomPreferenceValue('lincToken');
    // Create a service object
    var service = null;
    try {
        service = LocalServiceRegistry.createService(serviceName, {
            createRequest: function (_svc, args) {
                if (args) {
                    return JSON.stringify(args.data);
                }
                return null;
            },
            parseResponse: function (_svc, client) {
                return client.text;
            }
        });
        // Configure the service related parameters
        var config = service.getConfiguration();
        var credential = config.getCredential();
        var url = !empty(credential.getURL()) ? credential.getURL() : '';

        service.addHeader('Authorization', 'Bearer ' + token);
        service.setRequestMethod('POST');
        service.setURL(url);
        service.addHeader('Content-Type', 'application/json');
        service.addHeader('version', 5);
    } catch (e) {
        Logger.error('Error in creating Linc service: {0} - {1}', serviceName, e.message);
    }

    return service;
}

function getShippingAddress(ship, addressType) {
    var destinationAddress = {};
    destinationAddress.address1 = ship.shippingAddress.address1;
    destinationAddress.address2 = ship.shippingAddress.address2;
    destinationAddress.city = ship.shippingAddress.city;
    destinationAddress.province = ship.shippingAddress.stateCode;
    destinationAddress.postal_code = ship.shippingAddress.postalCode;
    destinationAddress.country = ship.shippingAddress.countryCode.value;
    destinationAddress.phone = ship.shippingAddress.phone;
    destinationAddress.address_type = addressType;

    return destinationAddress;
}

function getRecipient(order, ship) {
    var recipient = {};
    recipient.first_name = ship.shippingAddress.firstName;
    recipient.last_name = ship.shippingAddress.lastName;
    recipient.email = order.customerEmail;

    return recipient;
}

function ignore(pli) {
    return !empty(pli.custom.isPremiumMonogramLetter) && pli.custom.isPremiumMonogramLetter;
}

function execute(params) {
    var startDate = new Date();
    if (!empty(params.DaystoLookBack)) {
        startDate.setHours(params.DaystoLookBack * -24);
    } else {
        startDate = params.StartDate;
    }

    var query = 'creationDate > {0} AND status!={1} AND status!={2} AND status!={3} AND exportStatus = {4} AND shippingStatus = {5} AND custom.shipSentToLinc != {6}';
    var count = 0;

    svcFulfillment = init('lincFulfillment');
    svcCancellation = init('lincCancellation');
    svcReadyForPickup = init('lincReadyForPickup');

    /**
     * Callback to upodate order
     * @param {Object} order to be updated
     */
    function callback(order) {
        try {
            sendFulfillmentToLinc(order);
            sendCancellationToLinc(order);
            // sendReadyForPickupToLinc(order);
            checkLincStatus(order);
            count += 1;
        } catch (e) {
            Logger.error(e.message);
            Logger.error(e.stack);
        }
    }

    if (empty(params.OrdersToProcess)) {
        OrderMgr.processOrders(
            callback,
            query,
            startDate,
            Order.ORDER_STATUS_REPLACED,
            Order.ORDER_STATUS_CANCELLED,
            Order.ORDER_STATUS_FAILED,
            Order.EXPORT_STATUS_EXPORTED,
            Order.SHIPPING_STATUS_SHIPPED,
            true
        );
    } else {
        var orders = params.OrdersToProcess.split(',');
        orders.forEach(function (orderId) {
            var order = OrderMgr.getOrder(orderId);
            if (order != null) {
                callback(order);
            }
        });
    }

    Logger.info('Processed {0} orders', count);
}

module.exports = {
    execute: execute
};
