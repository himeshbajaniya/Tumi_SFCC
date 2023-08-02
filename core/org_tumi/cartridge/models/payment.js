'use strict';

var base = module.superModule;
var Resource = require('dw/web/Resource');

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments) {
    var collections = require('*/cartridge/scripts/util/collections');
    var paypalConstants = require('*/cartridge/scripts/util/paypalConstants');
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var paymentMethod = (paymentInstrument && paymentInstrument.paymentMethod) ? require('dw/order/PaymentMgr').getPaymentMethod(paymentInstrument.paymentMethod) : null;
        var results = {
            paymentMethod: paymentInstrument.paymentMethod,
            amount: (paymentInstrument && paymentInstrument.paymentTransaction && paymentInstrument.paymentTransaction.amount) ? paymentInstrument.paymentTransaction.amount.value : 0,
            displayName: (paymentMethod && paymentMethod.description) ? paymentMethod.description.markup : Resource.msg('payment.display.name.' + paymentMethod.ID.toLowerCase(), 'checkout', null)
        };

        switch (paymentInstrument.paymentMethod) {
            case 'GIFT_CERTIFICATE':
                results.giftCertificateCode = paymentInstrument.giftCertificateCode;
                results.maskedGiftCertificateCode = paymentInstrument.maskedGiftCertificateCode;
                results.giftpin = paymentInstrument.custom.giftCardPin;
                results.uuid = paymentInstrument.UUID;
                break;
            case 'PayPal':
                results.paypalEmail = paymentInstrument.custom.currentPaypalEmail;
                results.isVenmoUsed = paymentInstrument.custom.paymentId === paypalConstants.PAYMENT_METHOD_ID_VENMO;
                break;
            default:
                results.lastFour = paymentInstrument.creditCardNumberLastDigits;
                results.owner = paymentInstrument.creditCardHolder;
                results.expirationYear = paymentInstrument.creditCardExpirationYear;
                results.type = paymentInstrument.creditCardType;
                results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber;
                results.expirationMonth = paymentInstrument.creditCardExpirationMonth;
        }

        return results;
    });
}

/**
 * @constructor
 * @classdesc Payment class that represents payment information for the current basket
 *
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    base.call(this, currentBasket, currentCustomer, countryCode);

    var paymentInstruments = currentBasket.paymentInstruments;
    this.selectedPaymentInstruments = paymentInstruments ?
        getSelectedPaymentInstruments(paymentInstruments) : null;
    this.isContainsGc = !!(require('*/cartridge/scripts/util/collections').find(paymentInstruments, (paymentIns) => paymentIns.paymentMethod === 'GIFT_CERTIFICATE'));
    var isGc = false;
    var giftCertAmount = require('*/cartridge/scripts/helpers/giftCardHelpers').calculateNonGiftCertificateAmount(currentBasket);
    if (giftCertAmount) {
        isGc = require('*/cartridge/scripts/helpers/giftCardHelpers').calculateNonGiftCertificateAmount(currentBasket).value <= 0;
    }
    this.isOrderContainsGC = require('*/cartridge/scripts/helpers/giftCardHelpers').checkOrderContainsGiftCard(currentBasket);
    this.isOnlyGC = isGc;
    this.btnName = (function (selectedPaymentInstruments) {
        var text = '';
        if(selectedPaymentInstruments && selectedPaymentInstruments.length > 0) {
            if(selectedPaymentInstruments[0].paymentMethod == 'KLARNA_PAYMENTS') {
                var URLUtils = require('dw/web/URLUtils');
                var klarnaIcon = URLUtils.staticURL('/images/klarna_black.png').toString();
                text = Resource.msgf('button.place.order.with.payment', 'checkout', null, '<img class="klarna-order-icon" src='+ klarnaIcon +' alt="Klarna" title="Klarna" />');
            } else if(selectedPaymentInstruments[0].paymentMethod == 'DW_APPLE_PAY') {
                var URLUtils = require('dw/web/URLUtils');
                var applePayIcon = URLUtils.staticURL('/images/apple_pay_logo_white.svg').toString();
                text = Resource.msgf('button.place.order.with.payment', 'checkout', null, '<img class="apple-pay-order-icon" src='+ applePayIcon +' alt="Apple Pay" title="Apple Pay" />');
            } else if(selectedPaymentInstruments[0].paymentMethod == 'CREDIT_CARD') {
                text = Resource.msgf('button.place.order', 'checkout', null );
            } else {
                text = Resource.msgf('button.place.order.with.payment', 'checkout', null, selectedPaymentInstruments[0].displayName);
            }
        }
        return (!selectedPaymentInstruments || !selectedPaymentInstruments.length)
            ? Resource.msg('button.place.order', 'checkout', null)
            : text
    }(this.selectedPaymentInstruments));
}

module.exports = Payment;
