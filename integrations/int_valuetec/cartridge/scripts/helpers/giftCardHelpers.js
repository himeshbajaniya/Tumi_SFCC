'use strict';

var Site = require('dw/system/Site');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var currentSite = Site.getCurrent();

var CONSTANTS = {
    DEFAULT_GIFTCARD_VALUE: 25,
    TYPE: {
        DIGITAL: 'DIGITAL',
        PHYSICAL: 'PHYSICAL'
    },
    AMOUNT_RANGE: {
        MIN: 10,
        MAX: 500
    }
};

/* ***************************************************
 * Private Functions
 * ************************************************* */
/**
 * Determines if the basket already contains a gift certificate payment
 * instrument with the given gift certificate ID and removes these existing
 * payment instrument from the basket.
 * @param {dw.order.LineItemCtnr} basket - current basket/order
 * @param {string} giftCardCode - gift card card number
 * @private
 */
function removeDuplicates(basket, giftCardCode) {
    // iterate over the list of payment instruments to check
    // if the gift certificate is already being used as payment instrument
    var gcPaymentInstrs = basket.getGiftCertificatePaymentInstruments(giftCardCode);
    var iter = gcPaymentInstrs.iterator();
    var existingPI = null;

    // remove found gift certificates, since we don't want duplicates
    while (iter && iter.hasNext()) {
        existingPI = iter.next();
        basket.removePaymentInstrument(existingPI);
    }
}

/**
 * Calculates the amount to redeem for this gift certificate by subtracting
 * the amount of all of other gift certificates from the order total.
 * @param {dw.value.Money} amountToRedeem - the amount that is currently on the card
 * @param {dw.value.Money} orderTotal - order total
 * @param {dw.order.LineItemCtnr} basket - current basket/order
 * @returns {dw.value.Money} - total amount to redeem
 * @private
 */
function calculateAmount(amountToRedeem, orderTotal, basket) {
    var Money = require('dw/value/Money');

    // the total redemption amount of all gift certificates for the basket
    var giftCertTotal = new Money(0.0, basket.currencyCode);

    // iterate over the list of gift certificate payment instruments
    // and update the total redemption amount
    var gcPaymentInstrs = basket.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderPI = null;

    while (iter && iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

    // calculate the remaining order balance
    // this is the remaining open order total which has to be paid
    var orderBalance = orderTotal.subtract(giftCertTotal);

    // the redemption amount exceeds the order balance
    // return the order balance as maximum redemption amount
    if (orderBalance < amountToRedeem) {
        // return the remaining order balance
        return orderBalance;
    }

    // just return the redemption amount in case it is lower
    // or equals the order balance
    return amountToRedeem;
}

/**
 * Creates a list of gift certificate ids from gift certificate payment instruments.
 * @param {dw.order.LineItemCtnr} basket - current basket/order
 * @returns {dw.util.HashMap} The list of gift certificate IDs.
 */
function getGiftCardIdList(basket) {
    if (!basket) return null;

    var LinkedHashMap = require('dw/util/LinkedHashMap');
    var StringUtils = require('dw/util/StringUtils');

    var giftCardIdList = new LinkedHashMap();
    var iter = basket.getGiftCertificatePaymentInstruments().iterator();

    while (iter && iter.hasNext()) {
        var giftCard = iter.next();
        var giftCardCode = giftCard.giftCertificateCode;
        var giftCardData = {
            cardNumber: giftCardCode,
            cardPin: 'giftCardPin' in giftCard.custom && giftCard.custom.giftCardPin ? StringUtils.trim(giftCard.custom.giftCardPin) : '',
            balance: 'giftCardBalance' in giftCard.custom && giftCard.custom.giftCardBalance ? giftCard.custom.giftCardBalance : ''
        };
        giftCardIdList.put(giftCardCode, giftCardData);
    }

    return giftCardIdList;
}

/* ***************************************************
 * exports
 * ************************************************* */
/**
 * returns array of possible gift card amounts
 * @returns {Array} gift card amounts
 */
function getGiftCardAmounts() {
    var amountList = Object.hasOwnProperty.call(currentSite.preferences.custom, 'valuetecGiftCardAmounts') ? currentSite.getCustomPreferenceValue('valuetecGiftCardAmounts') : [];
    return amountList;
}

/**
 * Validate form fields
 * @param {Object} form - the form object with pre-validated form fields
 * @returns {Object} the names of the invalid form fields
 */
function validateFields(form) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    return formErrors.getFormErrors(form);
}

/**
 * Validate form fields
 * @param {Object} form - the form object with pre-validated form fields
 * @returns {Object} the names of the invalid form fields
 */
function validateForm(form) {
    return validateFields(form);
}

/**
 * Prepares the Check Balance form
 * @returns {Object} processed form object
 */
function prepareCheckBalanceForm() {
    var server = require('server');
    var form = server.forms.getForm('giftCard');
    form.clear();
    return form;
}

/**
 * validates gift card check balance form
 * @param {Object} form - the form object with pre-validated form fields
 * @param {Object} req - The local instance of the request object
 * @param {boolean} skipReCaptcha - optional param to skip reCaptcha Check
 * @returns {Object} javascript result object
 */
function validateGiftCardCheckBalanceForm(form) {
    var server = require('server');
    var Resource = require('dw/web/Resource');
    var StringUtils = require('dw/util/StringUtils');
    var GiftCardModel = require('*/cartridge/scripts/valuetec/models/GiftCardModel');

    if (!form) {
        form = server.forms.getForm('giftCard').balance; // eslint-disable-line no-param-reassign
    }
    var giftCardFormErrors = validateForm(form);

    if (Object.keys(giftCardFormErrors).length > 0) {
        return {
            success: false,
            fieldErrors: [giftCardFormErrors],
            error: [Resource.msg('error.message.checkbalance.form', 'giftcard', null)]
        };
    }
    if (form.accountNumber.value && form.pinNumber.value) {
        var accountNumber = StringUtils.trim(form.accountNumber.value);
        var pinNumber = StringUtils.trim(form.pinNumber.value);
        return GiftCardModel.giftCardBalance(accountNumber, pinNumber);
    }

    return {};
}

/**
 * validates gift card purchase form
 * @param {Object} form - the form object with pre-validated form fields
 * @returns {Object} javascript result object
 */
function validateGiftCardPurchaseForm(form) {
    var server = require('server');

    if (!form) {
        form = server.forms.getForm('giftCard').purchase; // eslint-disable-line no-param-reassign
    }
    var giftCardFormErrors = validateForm(form);
    var customErrors = {};

    // custom validation
    var giftCardAmount = form.amount.value;
    var errors = [];

    if (Object.keys(giftCardFormErrors).length > 0) {
        return {
            success: false,
            fieldErrors: [giftCardFormErrors, customErrors],
            error: errors
        };
    }

    return {
        success: true,
        fieldErrors: [],
        giftCardAmount: giftCardAmount
    };
}

/**
 * validates gift card form
 * @param {Object} args - object containing gift card info
 * @returns {dw.order.PaymentInstrument} - payment Instrument
 */
function createGiftCertificatePaymentInstrument(args) {
    var Logger = require('dw/system/Logger');
    var Money = require('dw/value/Money');
    var StringUtils = require('dw/util/StringUtils');

    var basket = args.Basket;
    var giftCardCode = args.GiftCardCode ? StringUtils.trim(args.GiftCardCode) : null;
    var giftCardPin = args.GiftCardPin ? StringUtils.trim(args.GiftCardPin) : null;
    var balance = args.Balance ? args.Balance : null;
    var balanceMoney = new Money(balance, basket.currencyCode);

    if (!basket || !giftCardCode) {
        Logger.error('could not create gift cert payment instrument, missing data');
        return null;
    }

    // remove other payment instruments
    require('*/cartridge/scripts/util/collections').forEach(basket.paymentInstruments, (paymentInstrument) => {
        if (paymentInstrument.paymentMethod !== (require('dw/order/OrderPaymentInstrument').METHOD_GIFT_CERTIFICATE)) basket.removePaymentInstrument(paymentInstrument);
    });

    // remove any duplicates
    removeDuplicates(basket, giftCardCode);

    // fetch the order total
    var orderTotal = basket.getTotalGrossPrice();

    // assume to redeem the remaining balance
    var amountToRedeem = balanceMoney;

    // because there may be multiple gift certificates, we adjust the amount being applied to the current
    // gift certificate based on the order total minus the aggregate amount of the current gift certificates.
    amountToRedeem = calculateAmount(amountToRedeem, orderTotal, basket);
    if (amountToRedeem && amountToRedeem <= 0) {
        return null;
    }

    // create a payment instrument from this gift certificate
    if (!amountToRedeem) {
        Logger.error('could not create gift cert payment instrument, missing giftCardCode {0} or amount {1}', giftCardCode, amountToRedeem);
        return null;
    }

    var paymentInstrument = basket.createGiftCertificatePaymentInstrument(giftCardCode, amountToRedeem);
    paymentInstrument.setGiftCertificateCode(StringUtils.trim(giftCardCode));
    paymentInstrument.custom.giftCardBalance = String(balanceMoney.getValueOrNull());
    paymentInstrument.custom.giftCardPin = StringUtils.trim(giftCardPin);

    return paymentInstrument;
}

/**
 * Removes a gift certificate payment instrument with the given gift certificate ID from the basket.
 * @param {dw.order.LineItemCtnr} basket - current basket/order
 * @param {string} giftCardCode - The ID of the gift certificate to remove
 */
function removeGiftCertificatePaymentInstrument(basket, giftCardCode) {
    if (!basket || !giftCardCode) return;

    // Iterates over the list of payment instruments.
    var iter = basket.getGiftCertificatePaymentInstruments(giftCardCode).iterator();
    var existingPI = null;

    // Remove (one or more) gift certificate payment instruments for this gift certificate ID.
    while (iter && iter.hasNext()) {
        existingPI = iter.next();
        basket.removePaymentInstrument(existingPI);
    }
}

/**
 * Sums the gift certificate payment instruments applied to the current basket
 *
 * @param {dw.order.LineItemCtnr} basket - current basket/order
 * @returns {dw.value.Money} - the amount to charge for the payment instrument
 */
function calculateGiftCertificateAmount(basket) {
    if (!basket) return null;

    var Money = require('dw/value/Money');

    var giftCertTotal = new Money(0.0, basket.currencyCode);
    var iter = basket.getGiftCertificatePaymentInstruments().iterator();
    while (iter && iter.hasNext()) {
        var paymentInstrument = iter.next();
        giftCertTotal = giftCertTotal.add(paymentInstrument.getPaymentTransaction().getAmount());
    }

    return giftCertTotal;
}

/**
 * Calculates the amount to be payed by a non-gift certificate payment instrument based
 * on the given basket. The method subtracts the amount of all redeemed gift certificates
 * from the order total and returns this value.
 *
 * @param {dw.order.LineItemCtnr} basket - current basket/order
 * @returns {dw.value.Money} - the amount to charge for the payment instrument
 */
function calculateNonGiftCertificateAmount(basket) {
    if (!basket) return null;

    // the total redemption amount of all gift certificate payment instruments in the basket
    var giftCertTotal = calculateGiftCertificateAmount(basket);

    // get the order total
    var orderTotal = basket.totalGrossPrice;

    // calculate the amount to charge for the payment instrument
    // this is the remaining open order total which has to be paid
    var amountOpen = orderTotal.subtract(giftCertTotal);

    // return the open amount
    return amountOpen;
}

/**
 * Sets the payment transaction amount
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an error object
 */
function calculatePaymentTransaction(currentBasket) {
    var result = {
        error: false
    };
    var Money = require('dw/value/Money');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Transaction = require('dw/system/Transaction');

    try {
        Transaction.wrap(function () {
            // get all payment instruments for the basket
            var iter = currentBasket.getPaymentInstruments().iterator();
            var nonGCPaymentInstrument = null;
            var giftCertTotal = new Money(0.0, currentBasket.currencyCode);

            while (iter && iter.hasNext()) {
                var paymentInstrument = iter.next();
                if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod)) {
                    giftCertTotal = giftCertTotal.add(paymentInstrument.getPaymentTransaction().getAmount());
                    continue; // eslint-disable-line no-continue
                }

                // locate any non-gift certificate payment instrument
                nonGCPaymentInstrument = paymentInstrument;
            }

            // if we found gift certificate payment and non-gift certificate payment instrument we are done
            if (!nonGCPaymentInstrument) {
                return;
            }

            // calculate the amount to be charged for the non-gift certificate payment instrument
            var amount = calculateNonGiftCertificateAmount(currentBasket);

            // now set the non-gift certificate payment instrument total.
            if (amount.value <= 0.0) {
                var zero = new Money(0, amount.getCurrencyCode());
                nonGCPaymentInstrument.paymentTransaction.setAmount(zero);
                if (giftCertTotal.value > 0) {
                    currentBasket.removePaymentInstrument(nonGCPaymentInstrument);
                }
            } else {
                nonGCPaymentInstrument.paymentTransaction.setAmount(amount);
            }
        });
    } catch (e) {
        result.error = true;
    }

    return result;
}

/**
 * creates a gift card amount list to fill drop down
 * @returns {dw.util.ArrayList} the gift card amounts
 */
function getGiftCardAmountList() {
    var ArrayList = require('dw/util/ArrayList');
    var Resource = require('dw/web/Resource');
    
    var giftCardProductPrefix = Site.getCurrent().getCustomPreferenceValue('valuetecGiftCardProductID');
    var amounts = new ArrayList();

    var giftCardAmounts = getGiftCardAmounts();
    for (var i = 0; i < giftCardAmounts.length; i += 1) {
        amounts.push({
            value: giftCardProductPrefix + giftCardAmounts[i],
            label: '$' + giftCardAmounts[i]
        });
    }

    return amounts;
}

/**
 * calculates the total sum of all gift cards in the basket
 * @param {dw.order.LineItemCtnr} basket - current basket/order
 * @param {string|number} giftCardAmount - current gift card amount. if passed in, add to total
 * @returns {dw.value.Money} - total amount of all gift cards in the basket
 */
function calculateGiftCardProductAmount(basket, giftCardAmount) {
    var Money = require('dw/value/Money');
    var collections = require('*/cartridge/scripts/util/collections');
    var giftCardTotal = new Money(0.0, basket.currencyCode);

    collections.forEach(basket.getAllProductLineItems(), function (productLineItem) {
        if (isGiftCard(productLineItem)) {
            var gcAmount = productLineItem.basePrice;
            if (!gcAmount && Object.hasOwnProperty.call(productLineItem.custom, 'giftCardAmount') && productLineItem.custom.giftCardAmount) {
                gcAmount = new Money(productLineItem.custom.giftCardAmount, basket.currencyCode);
            }
            if (gcAmount) {
                giftCardTotal = giftCardTotal.add(gcAmount);
            }
        }
    });

    if (giftCardAmount) {
        var giftCardMoney = new Money(parseInt(giftCardAmount, 10), basket.currencyCode);
        giftCardTotal = giftCardTotal.add(giftCardMoney);
    }

    return giftCardTotal;
}

/**
 * Returns gift card amount array
 * @returns {array} array of gift card amount
 */
function getGiftCardAmountsArray() {
    var Resource = require('dw/web/Resource');

    var amounts = [];

    var giftCardAmounts = getGiftCardAmounts();
    for (var i = 0; i < giftCardAmounts.length; i += 1) {
        amounts.push({
            value: giftCardAmounts[i],
            label: '$ ' + giftCardAmounts[i]
        });
    }

    // add other selection to the end of the list
    if (amounts && amounts.length > 0) {
        amounts.push({
            value: 'other',
            label: Resource.msg('giftcard.purchase.amount.other', 'forms', 'Other')
        });
    }

    return amounts;
}

/**
 * Render Template HTML
 *
 * @param {dw.util.HashMap} context - Context object that will fill template placeholders
 * @param {string} [templatePath] - Optional template path to override default
 * @return {string} - Rendered HTML
 */
 function renderHtml(object, templatePath) {
    var Template = require('dw/util/Template');
    var HashMap = require('dw/util/HashMap');
    var context = new HashMap();
    Object.keys(object  ).forEach(function (key) {
        context.put(key, object[key]);
    });
    return new Template(templatePath).render(context).text;
}

function getPaymentModel(currentBasket, currCustomer) {
    var Payment = require('*/cartridge/models/payment');
    var locale = require('dw/util/Locale').getLocale(request.locale);
    return new Payment(currentBasket, currCustomer, locale.country);
}

/**
 * Checking if Current Oreder contains Gift Card
 *
 * @param {dw.order.LineItemCtnr} basket - current basket/order
 * @return {boolean} - true -> contains GC, false-> Not contains Gift Card
 */

function checkOrderContainsGiftCard(basket) {
    var products = basket.productLineItems;
    var giftCardProductPrefix = Site.getCurrent().getCustomPreferenceValue('valuetecGiftCardProductID');
    for (let i = 0; i < products.length; i +=1) {
        if (products[i].productID.indexOf(giftCardProductPrefix) > -1) {
            return true;
        }
    }
    return false;
}

/**
 * Check if Gift card Payment Method is enabled
 * Gift card payment method will be disabled for Canada site, so this check is required.
 */
function isGiftCardPaymentMethodEnabled() {
    var giftCardPaymentMethodEnabled = false;
    var giftCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_GIFT_CERTIFICATE);
    if (giftCardPaymentMethod && giftCardPaymentMethod.active) {
        giftCardPaymentMethodEnabled = true;
    }
    return giftCardPaymentMethodEnabled;
}

function ensureGC(basket) {
    if (!basket || !basket.paymentInstruments || !basket.paymentInstruments.length) return;
    var total = 0;
    require('*/cartridge/scripts/util/collections').forEach(basket.paymentInstruments, (paymentInstrument) => total + paymentInstrument.paymentTransaction.amount.value);
    if (total === basket.totalGrossPrice) return;
    if (basket.paymentInstruments.length === 1 && basket.paymentInstruments[0].giftCertificateCode) {
        require('dw/system/Transaction').wrap(() => basket.paymentInstruments[0].getPaymentTransaction().setAmount(basket.totalGrossPrice));
    }
}

module.exports = {
    giftCardConstants: CONSTANTS,
    createGiftCertificatePaymentInstrument: createGiftCertificatePaymentInstrument,
    prepareCheckBalanceForm: prepareCheckBalanceForm,
    removeGiftCertificatePaymentInstrument: removeGiftCertificatePaymentInstrument,
    validateFields: validateFields,
    validateForm: validateForm,
    validateGiftCardCheckBalanceForm: validateGiftCardCheckBalanceForm,
    validateGiftCardPurchaseForm: validateGiftCardPurchaseForm,
    getGiftCardAmountList: getGiftCardAmountList,
    calculateGiftCardProductAmount: calculateGiftCardProductAmount,
    calculateGiftCertificateAmount: calculateGiftCertificateAmount,
    calculateNonGiftCertificateAmount: calculateNonGiftCertificateAmount,
    getGiftCardAmountsArray: getGiftCardAmountsArray,
    renderHtml: renderHtml,
    getGiftCardIdList: getGiftCardIdList,
    calculatePaymentTransaction: calculatePaymentTransaction,
    getPaymentModel: getPaymentModel,
    checkOrderContainsGiftCard: checkOrderContainsGiftCard,
    isGiftCardPaymentMethodEnabled: isGiftCardPaymentMethodEnabled,
    ensureGC: ensureGC
};
