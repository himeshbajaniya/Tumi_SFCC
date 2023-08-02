'use strict';

var base = module.superModule;

var collections = require('*/cartridge/scripts/util/collections');
var ShippingMgr = require('dw/order/ShippingMgr');
var ShippingModel = require('*/cartridge/models/shipping');
var ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');

function sortShipments(shipments) {
    var shipmentsArray = shipments.toArray();
    var shippingshipment;
    var shippingshipmentIndex;
    // Sort (shift shipping shipment at 1st position) only when there are more than one shipment and store pickup shipment is at 1st position, otherwise sorting not needed.
    if (shipmentsArray.length > 1 && !empty(shipmentsArray[0].custom.fromStoreId)) {
        for (var i = 0; i <= shipmentsArray.length - 1; i++) {
            var shipment = shipmentsArray[i];
            if (empty(shipment.custom.fromStoreId)) {
                shippingshipment = shipment;
                shippingshipmentIndex = i;
                break;
            }
        }
        if (shippingshipment) {
            shipmentsArray.splice(i, 1);
            shipmentsArray.unshift(shippingshipment);
        }
    }
    return shipmentsArray;
}
/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {Object} customer - the associated Customer Model object
 * @param {string} containerView - view of the shipping models (order or basket)
 * @returns {dw.util.ArrayList} an array of ShippingModels
 */
function getShippingModels(currentBasket, customer, containerView) {
    var shipments = currentBasket ? currentBasket.getShipments() : null;
    if (!shipments) return [];

    var sortedShipments = sortShipments(shipments);
    var sortedShippingModel = [];
    for (var i = 0; i <= sortedShipments.length - 1; i++) {
        sortedShippingModel.push(new ShippingModel(sortedShipments[i], null, customer, containerView));
    }
    return sortedShippingModel;
}

/**
 * Returns the first shipping method (and maybe prevent in store pickup)
 * @param {dw.util.Collection} methods - Applicable methods from ShippingShipmentModel
 * @param {boolean} filterPickupInStore - whether to exclude PUIS method
 * @returns {dw.order.ShippingMethod} - the first shipping method (maybe non-PUIS)
 */
 function getFirstApplicableShippingMethod(methods, filterPickupInStore) {
    return collections.find(methods, (shippingMethod) => filterPickupInStore ? !shippingMethod.custom.storePickupEnabled : shippingMethod) || null;
}

function selectShippingMethod(shipment, shippingMethodID, shippingMethods, address) {
    var applicableShippingMethods;
    var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
    var shippingAddress;

    if (address && shipment) {
        shippingAddress = shipment.shippingAddress;

        if (shippingAddress) {
            if (address.stateCode && shippingAddress.stateCode !== address.stateCode) {
                shippingAddress.stateCode = address.stateCode;
            }
            if (address.postalCode && shippingAddress.postalCode !== address.postalCode) {
                shippingAddress.postalCode = address.postalCode;
            }
        }
    }

    var isShipmentSet = false;

    if (shippingMethods) {
        applicableShippingMethods = shippingMethods;
    } else {
        var shipmentModel = ShippingMgr.getShipmentShippingModel(shipment);
        applicableShippingMethods = address ? shipmentModel.getApplicableShippingMethods(address) :
            shipmentModel.applicableShippingMethods;
    }

    if (shippingMethodID) {
        // loop through the shipping methods to get shipping method
        var iterator = applicableShippingMethods.iterator();
        while (iterator.hasNext()) {
            var shippingMethod = iterator.next();
            if (shippingMethod.ID === shippingMethodID) {
                shipment.setShippingMethod(shippingMethod);
                isShipmentSet = true;
                break;
            }
        }
    }

    if (!isShipmentSet) {
        if (collections.find(applicableShippingMethods, function (sMethod) {
            return sMethod.ID === defaultShippingMethod.ID;
        })) {
            shipment.setShippingMethod(defaultShippingMethod);
        } else if (applicableShippingMethods.length > 0) {
            var firstMethod = getFirstApplicableShippingMethod(applicableShippingMethods, true);
            shipment.setShippingMethod(firstMethod);
        } else {
            shipment.setShippingMethod(null);
        }
    }
}

base.selectShippingMethod = selectShippingMethod;
module.exports = {
    getShippingModels: getShippingModels
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});