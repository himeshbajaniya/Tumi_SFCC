'use strict';

var base = module.superModule;

// API includes
var Status = require('dw/system/Status');

// script includes
var AvaTax = require('*/cartridge/scripts/avaTax');

// Logger includes
var LOGGER = require('dw/system/Logger').getLogger('Avalara', 'AvaTax');

base.commitDocument = function (orderno) {
    if (empty(orderno)) {
        return new Status(Status.ERROR);
    } else {
        try{
            var svcResponse = AvaTax.commitDocument(orderno);
            if (svcResponse.error || svcResponse.errorMessage) {
                return new Status(Status.ERROR);
            } else {
                return new Status(Status.OK);
            }
        } catch (e) {
            LOGGER.warn('There was a problem commiting the transaction - ' + orderno + '. Error - ' + e.message);
            return new Status(Status.ERROR);
        }
    }
}

base.voidTransaction = function (orderno) {
    var message = '';

    if (empty(orderno)) {
        return new Status(Status.ERROR);
    } else {
        try {
            var validateOrder = dw.order.OrderMgr.getOrder(orderno.toString());

            if (!validateOrder) {
                return new Status(Status.ERROR);
            } else {
                var svcResponse = AvaTax.voidDocument(orderno);

                if (svcResponse.error || svcResponse.message || svcResponse.errorMessage) {
                    return new Status(Status.ERROR);
                } else {
                    return new Status(Status.OK);
                }
            }
        } catch (e) {
            LOGGER.warn('There was a problem voiding the transaction - ' + orderno + '. Error - ' + e.message);
            return new Status(Status.ERROR);
        }
    }
}

module.exports = base;