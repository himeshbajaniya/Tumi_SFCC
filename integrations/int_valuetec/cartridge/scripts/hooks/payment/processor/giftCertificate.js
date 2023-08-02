'use strict';

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var viewData = viewFormData;
    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };
    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Authorizes a payment using a gift card. Customizations may use other processors and custom
 *      logic to authorize gift card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var authorized = false;
    try {
        var GiftCardModel = require('*/cartridge/scripts/valuetec/models/GiftCardModel');
        var authStatus = GiftCardModel.authorizeGiftCard(paymentInstrument, require('dw/order/OrderMgr').getOrder(orderNumber));
        if (!authStatus.success || !authStatus.authorized) throw new Error(authStatus.errorMessage);
        require('dw/system/Transaction').wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(authStatus.responseObject.transactionID);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        });
        authorized = true;
    } catch (e) {
        error = true;
        serverErrors.push(
            e.message || require('dw/web/Resource').msg('error.technical', 'checkout', null)
        );
    }

    return {
        authorized: authorized,
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: error
    };
}

function handle(currentBasket) {
    var giftCardHelpers = require('*/cartridge/scripts/helpers/giftCardHelpers');
    giftCardHelpers.ensureGC(currentBasket);
    var error = giftCardHelpers.calculateNonGiftCertificateAmount(currentBasket).value !== 0;
    if (error) {
        return {
            error: true,
            fieldErrors: [],
            serverErrors: [require('dw/web/Resource').msg('error.payment.not.valid', 'checkout', null)]
        };
    }
    return {
        error: false
    };
}

module.exports = {
    processForm: processForm,
    Authorize: authorize,
    Handle: handle
};
