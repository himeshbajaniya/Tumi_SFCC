'use strict';

function buildRefundTransactionModel(orderNo, rmaOrderNumber, amount, position) {
    return {
        refundTransactionCode: rmaOrderNumber,
        refundDate: new Date(),
        refundType: 'Partial',
        referenceCode: orderNo,
        amount: amount,
        refundLines: [position]
    };
}

function refundTax(order, rmaOrderNumber, amount, position) {
    var statusObj = {
        status: true,
        msg: null
    };
    try {
        if (!order) throw new Error('Order is Null');
        var settingsObject = JSON.parse(require('dw/system/Site').getCurrent().getCustomPreferenceValue('ATSettings'));
        if (!settingsObject.taxCalculation) throw new Error('Avalara tax calculation is disabled');
        var svcResponse = require('*/cartridge/scripts/avaTaxClient').refundTransaction(settingsObject.companyCode || '', order.orderNo, buildRefundTransactionModel(order.orderNo, rmaOrderNumber, amount, position));
        if (svcResponse.statusCode === 'ERROR') throw new Error('Avalara Tax service error');
    } catch (e) {
        require('dw/system/Logger').getLogger('Avalara').error('\n Message: {0} \n stack: {1}', e.message, e.stack);
        statusObj.status = false;
        statusObj.msg = e.message;
    }
    return statusObj;
}

module.exports = {
    refundTax: refundTax
};