'use strict';

function capture(authorizationId, reqBody) {
    var paypalRestService = require('*/cartridge/scripts/service/paypalCaptureRestService');
    return paypalRestService().call({
        path: 'v2/payments/authorizations/' + authorizationId + '/capture',
        body: reqBody
    })
}

function voidCall(authorizationId) {
    var paypalRestService = require('*/cartridge/scripts/service/paypalCaptureRestService');
    return paypalRestService().call({
        path: 'v2/payments/authorizations/' + authorizationId + '/void',
        method: 'POST',
        body: {}
    });
}

function refundCall(transactionid, reqBody) {
    var paypalRestService = require('*/cartridge/scripts/service/paypalCaptureRestService');
    return paypalRestService().call({
        path: 'v2/payments/captures/' + transactionid + '/refund',
        method: 'POST',
        body: reqBody
    });
}

module.exports = {
    capture: capture,
    void: voidCall,
    refund: refundCall
};