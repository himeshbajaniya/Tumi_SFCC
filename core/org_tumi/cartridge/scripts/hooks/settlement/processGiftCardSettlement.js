'use strict';

function processVoid(orderNo, currencyCode, paymentInstr, amount) {
    var statusObj = {
        status: true,
        msg: null
    };
    var GiftCardFactory = require('*/cartridge/scripts/valuetec/util/GiftCardFactory');
    var requestContainer = {
        action: GiftCardFactory.ACTIONS.VOID_GIFTCARD,
        data: {
            card: {
                cardNumber: paymentInstr.giftCertificateCode,
                pinNumber: paymentInstr.custom.giftCardPin
            },
            invoiceNumber: orderNo,
            amount: amount,
            clientKey: GiftCardFactory.getClientKey(),
            terminalId: GiftCardFactory.getTerminalId(),
            authorizationCode: paymentInstr.paymentTransaction.transactionID
        }
    };
    var result = require('*/cartridge/scripts/valuetec/service/GiftCardService').VALUETEC.call(requestContainer);
    if (!result.ok || !result.object || !result.object.success) {
        statusObj.status = false;
        statusObj.msg = {
            paylaod: requestContainer,
            errorMsg: 'Failed to void GC'
        };
    }
    return statusObj;
}

module.exports = {
    processVoid: processVoid
};