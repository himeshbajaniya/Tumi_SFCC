'use strict';

var Log = require('~/cartridge/scripts/logger/log');
var log = new Log('ReturnHelpers');
var cohelper = new (require('~/cartridge/scripts/helpers/coHelpers'))();

function defineModelValue(headerArray, contentArray) {
    var obj = {};
    headerArray.forEach(function (head, index) {
        if (head) {
            Object.defineProperty(obj, head, {
                value: contentArray[index],
                enumerable: true
            });
        }
    });
    return obj;
}

function getModel(csvStreamReader) {
    var orderProperyArray = csvStreamReader.readNext();
    return orderProperyArray && orderProperyArray.length > 0 ? defineModelValue(orderProperyArray, csvStreamReader.readNext()) : null;
}

function saveItInCO(data) {
    return cohelper.save(data);
}

function fetchAll() {
    return cohelper.fetch();
}

function removeCO(co) {
    return cohelper.remove(co);
}

function fetchReturnCostAndPosition(co) {
    if (!co || !('entryCode' in co.custom) || !co.custom.entryCode || !('orderCode' in co.custom) || !co.custom.orderCode) return 0;
    var order = require('dw/order/OrderMgr').getOrder(co.custom.orderCode);
    if (!order) {
        log.debug('Order No: {0} not found in instance', co.custom.orderCode);
        return 0;
    }
    var lineItemsItr = order.productLineItems ? order.productLineItems.toArray() : [];
    var productLineItem = lineItemsItr.find((pli) => pli.custom.entryCode === co.custom.entryCode);
    if (!productLineItem) {
        log.debug('Entry code {0} not found in order {1}', co.custom.entryCode, co.custom.orderCode);
        return 0;
    }
    return {
        price: productLineItem.proratedPrice.value,
        position: productLineItem.position
    };
}

function isValidResponse(list) {
    var iter = list.iterator();
    var isValid = false;
    while (iter.hasNext()) {
        var resp = iter.next();
        isValid = resp.data.find((item) => !item.serviceStatus.status);
        if (!isValid) break;
    }
    return isValid;
}

module.exports = {
    getModel: getModel,
    saveItInCO: saveItInCO,
    fetchAll: fetchAll,
    removeCO: removeCO,
    fetchReturnCostAndPosition: fetchReturnCostAndPosition,
    isValidResponse: isValidResponse
};