'use strict';

var base = require('base/checkout/billing');
var formHelpers = require('base/checkout/formErrors');
var addressHelpers = require('base/checkout/address');
// eslint-disable-next-line
var cleave = require('cybersource/components/cleave');

/**
 * clears the credit card form
 */
function clearCreditCardForm() {
    if ($('li[data-method-id="CREDIT_CARD"]').attr('data-sa-type') !== 'SA_FLEX') {
        $('input[name$="_cardNumber"]').data('cleave').setRawValue('');
    }
    $('select[name$="_expirationMonth"]').val('');
    $('select[name$="_expirationYear"]').val('');
    $('input[name$="_securityCode"]').val('');
    $('input[name$="_email"]').val('');
    $('input[name$="_phone"]').val('');
}

/**
 * function
 * @returns {*} obj
 */
function isPayPalEnabled() {
    return !!($('#paypal_enabled').length > 0 && document.getElementById('paypal_enabled').value === 'true');
}

/**
 * function
 */
function saveBillingAddress() {
    if (isPayPalEnabled()) {
        var paymentForm = $('#dwfrm_billing').serialize();
        var url = $('.billing-information .addressSelector').attr('data-create-shipment-url');
        /* eslint-disable */
        $.ajax({
            method: 'POST',
            async: false,
            data: paymentForm,
            url: url,
            success: function (data) {
            },
            error: function (err) {
            }
        });
        /* eslint-enable */
    }
}

/**
 * function
 * @param {*} methodID methodID
 */
function handlePayPalSelection(methodID) {
    if (methodID === 'PAYPAL') {
        if ($('#billingAgreementCheckbox').length > 0) {
            $('#billingAgreementCheckbox').attr('checked', false);
        }
        if ($('.paypal-address').length > 0) {
            $('.paypal-address div[class$="paypalBillingFields_paypalEmail"]').css('display', 'block');
            $('.paypal-address div[class$="paypalBillingFields_paypalPhone"]').css('display', 'block');
        }
    } else {
        $('.paypal-address div[class$="paypalBillingFields_paypalEmail"]').css('display', 'none');
        $('.paypal-address div[class$="paypalBillingFields_paypalPhone"]').css('display', 'none');
    }
}

/**
 * @function
 * @description function to update payment content and hide fields based on payment method
 */
base.paymentTabs = function () {
    $('.payment-options .nav-item').on('click', function (e) {
        e.preventDefault();
        if($(this).hasClass('disabled')) {
            return false
        }
        var methodID = $(this).data('method-id');
        if (methodID.indexOf('klarna') > -1) {
            methodID = 'KLARNA_PAYMENTS';
        }
        var paymentMethodIds = ['ALIPAY', 'SOF', 'IDL', 'MCH', 'BANK_TRANSFER', 'WECHAT'];
        var paymentMethod = $.inArray(methodID, paymentMethodIds) > -1;
        $('.payment-information').data('payment-method-id', methodID);
        $('input[name*="billing_paymentMethod"]').val(methodID);
        formHelpers.clearPreviousErrors('.payment-form');

        if (paymentMethod) {
            $('.dwfrm_billing_creditCardFields_cardNumber,.dwfrm_billing_creditCardFields_expirationMonth, .dwfrm_billing_creditCardFields_expirationYear, .dwfrm_billing_creditCardFields_securityCode, .form-group.cardNumber,.bankTransfer').hide();
            $('#credit-card-content .user-payment-instruments.container').addClass('checkout-hidden');
            $('.credit-card-form').removeClass('checkout-hidden');
            $('.btn.btn-block.cancel-new-payment, .save-credit-card.custom-control.custom-checkbox ').hide();
            if (methodID === 'IDL') {
                $('.bankTransfer').show();
                $('.bankTransfer #' + methodID.toLowerCase()).show();
                $('.bankTransfer #' + methodID.toLowerCase()).siblings().hide();
            }
            $('.next-step-button .submit-payment').attr('id', 'showSubmitPayment');
        } else if (methodID === 'CREDIT_CARD') {
            if ($(this).data('sa-type') === 'SA_IFRAME' || $(this).data('sa-type') === 'SA_REDIRECT') {
                $('.dwfrm_billing_creditCardFields_cardNumber,.dwfrm_billing_creditCardFields_expirationMonth, .dwfrm_billing_creditCardFields_expirationYear, .dwfrm_billing_creditCardFields_securityCode, .form-group.cardNumber,.bankTransfer').hide();
            } else {
                $('.dwfrm_billing_creditCardFields_cardNumber,.dwfrm_billing_creditCardFields_expirationMonth, .dwfrm_billing_creditCardFields_expirationYear, .dwfrm_billing_creditCardFields_securityCode, .form-group.cardNumber').show();
                base.methods.clearBillingAddressFormValues();
                if ($('.isBasketHavingOnlyStorePickupitems').val() === 'true' && $('.saved-payment-instrument').length < 1) {
                    $('.billing-address-block').removeClass('checkout-hidden');
                } else {
                    billingAddressSameAsShipping();
                }
            }
            if ($('.data-checkout-stage').data('customer-type') === 'guest') {
                $('#credit-card-content .user-payment-instruments.container').addClass('checkout-hidden');
                $('.btn.btn-block.cancel-new-payment, .save-credit-card.custom-control.custom-checkbox ').hide();
            } else if ($('.data-checkout-stage').data('customer-type') === 'registered') {
                $('#credit-card-content .user-payment-instruments.container').removeClass('checkout-hidden');
                $('.btn.btn-block.cancel-new-payment, .save-credit-card.custom-control.custom-checkbox ').show();
            }
            $('.bankTransfer').hide();
            $('.continue-billing-btn, .continue-billing').removeClass('d-none');
            $('.continue-billing-klarna').addClass('d-none');
            $('.next-step-button .submit-payment').attr('id', 'showSubmitPayment');
        } else if (methodID === 'VISA_CHECKOUT' || methodID === 'KLARNA_PAYMENTS' || methodID === 'DW_GOOGLE_PAY' || (methodID === 'PAYPAL' && $(this).attr('data-auth') === 're-auth') || methodID === 'DW_APPLE_PAY') {
            $('.next-step-button .submit-payment').attr('id', 'hideSubmitPayment');
            $('.continue-billing,.continue-billing-klarna').addClass('d-none');
        } else {
            $('.next-step-button .submit-payment').attr('id', 'showSubmitPayment');
            $('.continue-billing, .continue-billing-btn').removeClass('d-none');
            $('.continue-billing-klarna').addClass('d-none');
        } 

        if(methodID.toLowerCase() === 'paypal') {
            $('#paypalAccountsDropdown').addClass('d-none')
            $('.billing-address-block').addClass('checkout-hidden');
            var paypalSelectEle = $('#restPaypalAccountsList');
            if(paypalSelectEle.val() === '' || paypalSelectEle.val() === 'newaccount') {
                $('.continue-billing-btn').addClass('d-none');
            }
        }

        if(methodID === 'KLARNA_PAYMENTS') {
            $('.continue-billing-klarna').removeClass('d-none');
        }
        
        handlePayPalSelection(methodID);
        var paymentMethodIdsNotAllowedWithGC = ['DW_APPLE_PAY', 'KLARNA_PAYMENTS'];
        var isNotAllowedMethod = $.inArray(methodID, paymentMethodIdsNotAllowedWithGC) > -1;
        if(isNotAllowedMethod) {
            $('#pay-with-giftcard').prop('checked', false).prop('disabled', true);
            $('#valuetec-content').removeClass('d-block');
            $('.giftcard-not-allowed').removeClass('d-none');
        } else {
            $('#pay-with-giftcard').removeAttr('disabled');
            $('.giftcard-not-allowed').addClass('d-none');
        }
    });
};

base.editBillingSummary = function () {
    $('.payment-summary .edit-button').on('click', function () {
        $('a.summary-submit-payment').text('Place Order');
        var liPaypal = $('#checkout-main[data-checkout-stage="payment"] li[data-method-id="PayPal"]');
        if ($(liPaypal).find('a').hasClass('active')) {
            $(liPaypal).trigger('click');
        }
    });
};

/**
 * @function
 * @description function to update saved selected card details for sesure acceptance silent post
 */
base.selectSavedPaymentInstrument = function () {
    $(document).on('click', '.saved-payment-instrument', function (e) {
        e.preventDefault();
        $('.saved-payment-security-code').val('');
        $('.saved-payment-instrument').removeClass('selected-payment');
        $(this).addClass('selected-payment');
        $('.saved-payment-instrument .card-image').removeClass('checkout-hidden');
        $('.saved-payment-instrument .security-code-input').addClass('checkout-hidden');
        // $('.saved-payment-instrument.selected-payment'
        //     + ' .card-image').addClass('checkout-hidden');
        $('.saved-payment-instrument.selected-payment '
            + '.security-code-input').removeClass('checkout-hidden');
        $('#selectedCardID').val($('.saved-payment-instrument.selected-payment').data('uuid'));
        $('input[name="dwfrm_billing_creditCardFields_cardNumber"]').val($.trim($('.saved-payment-instrument.selected-payment .saved-credit-card-number').text()));
        var cardType = $.trim($('.saved-payment-instrument.selected-payment .saved-credit-card-type').text()).replace(/\s{2,}/g, ' ').split(' ');
        $('input[name="dwfrm_billing_creditCardFields_cardType"]').val(cardType[1]);
        var expiryDate = $.trim($('.saved-payment-instrument.selected-payment .saved-credit-card-expiration-date').text()).replace(/[a-zA-Z\s]+/, '').split('/');
        $('input[name="dwfrm_billing_creditCardFields_securityCode"]').val($.trim($('.saved-payment-instrument.selected-payment #saved-payment-security-code').val()));
        $('#expirationMonth').val(expiryDate[0]);
        $('#expirationYear').val(expiryDate[1]);
        // Each saved card is associated with an address. Populate billing address form with selected card address
        if ($('.isBasketHavingOnlyStorePickupitems').val() !== 'true') {
            $('input[name="dwfrm_billing_addressFields_firstName"]').val($.trim($(e.currentTarget).find('.firstName').text()));
            $('input[name="dwfrm_billing_addressFields_lastName"]').val($.trim($(e.currentTarget).find('.lastName').text()));
        }
        $('input[name="dwfrm_billing_addressFields_address1"]').val($.trim($(e.currentTarget).find('.address1').text()));
        if ($('.saved-payment-instrument.selected-payment .saved-credit-card-address .address2').length) {
            $('input[name="dwfrm_billing_addressFields_address2"]').val($.trim($(e.currentTarget).find('.address2').text()));
        }
        $('input[name="dwfrm_billing_addressFields_city"]').val($.trim($(e.currentTarget).find('.city').text()));
        $('input[name="dwfrm_billing_addressFields_postalCode"]').val($.trim($(e.currentTarget).find('.postalCode').text()));
        $('select[name$=_billing_addressFields_states_stateCode]').val($.trim($(e.currentTarget).find('.stateCode').text()));
    });
};

base.addNewPaymentInstrument = function () {
    $(document).on('click', '.btn.add-payment', function (e) {
        e.preventDefault();
        $('.payment-information').data('is-new-payment', true);
        clearCreditCardForm();
        $('.credit-card-form').removeClass('checkout-hidden');
        $('.user-payment-instruments').addClass('checkout-hidden');
        $('.payment-information').removeClass('checkout-hidden');
        $('.billing-address-block').removeClass('checkout-hidden');
        $('.continue-billing').addClass('new-ccard');
        base.methods.clearBillingAddressFormValues();
        billingAddressSameAsShipping();
    });
};

base.useShippingAsBilling = function () {
    $('#use-shipping-address').on('click', function () {
        if ($(this).is(":checked")) {
            billingAddressSameAsShipping();
        } else {
            $('.billing-address-block').removeClass('checkout-hidden');
            $('input[name="dwfrm_billing_addressFields_firstName"]').val('');
            $('input[name="dwfrm_billing_addressFields_lastName"]').val('');
            $('input[name="dwfrm_billing_addressFields_address1"]').val('');
            if ($('.saved-payment-instrument.selected-payment .saved-credit-card-address .address2').length) {
                $('input[name="dwfrm_billing_addressFields_address2"]').val('');
            }
            $('input[name="dwfrm_billing_addressFields_city"]').val('');
            $('input[name="dwfrm_billing_addressFields_postalCode"]').val('');
            $('select[name$=_billing_addressFields_states_stateCode]').val('');
        }
    });
};

/* base.flipPayment = function () {
    $('.btn.add-payment').on('click', function (e) {
        e.preventDefault();
        $('.payment-information').data('is-new-payment', true);
        clearCreditCardForm();
        $('.credit-card-form').removeClass('checkout-hidden');
        $('.user-payment-instruments').addClass('checkout-hidden');
    });
}; */

base.cancelNewPayment = function () {
    $('.cancel-new-payment').on('click', function (e) {
        e.preventDefault();
        $('.payment-information').data('is-new-payment', false);
        clearCreditCardForm();
        $('.user-payment-instruments').removeClass('checkout-hidden');
        $('.credit-card-form').addClass('checkout-hidden');
    });
};

base.removePaypalButton = function () {
    $('.payment-summary .edit-button').on('click', function () {
        if ($('.payment-details span:contains(Credit)')) {
            if ($('#checkout-main[data-checkout-stage="payment"] a.paypal-tab').hasClass('active')) {
                $('#checkout-main[data-checkout-stage="payment"]').find('button.submit-payment').attr('id', 'hideSubmitPayment');
            }
        }
        if ($('.payment-details span:contains(PAYPAL)')) {
            if ($('#checkout-main[data-checkout-stage="payment"] a.paypal-tab').hasClass('active')) {
                $('#checkout-main[data-checkout-stage="payment"]').find('button.submit-payment').attr('id', 'showSubmitPayment');
            }
        }
        var liPaypal = $('#checkout-main[data-checkout-stage="payment"] li[data-method-id="PAYPAL"]');
        if (!$(liPaypal).hasClass('activepaypal') && $(liPaypal).find('a').hasClass('active')) {
            $('#checkout-main[data-checkout-stage="payment"]').find('button.submit-payment').attr('id', 'hideSubmitPayment');
        }
    });
};

base.onpaypalClick = function () {
    $('li[data-method-id="PAYPAL"] a').on('click', function () {
        if (!$('li[data-method-id="PAYPAL"]').hasClass('activepaypal')) {
            $('#checkout-main[data-checkout-stage="payment"]').find('button.submit-payment').attr('id', 'hideSubmitPayment');
        }
    });
};

base.onAddressSelection = function () {
    $('.address-selector-block .addressSelector').change(function () {
        saveBillingAddress();
    });
};

base.onContinueClick = function () {
    $('.continue-billing-btn, .save-continue-billing').on('click', function () {
        $('.submit-payment').click();
    });
    $('.continue-billing-klarna button').on('click', function () {
        $('.klarna-submit-payment').click();
    });
    
    $('.new-card-add .button--secondary').on('click', function () {
        $('.payment-information').data('is-new-payment', false);
        clearCreditCardForm();
        $('.credit-card-form').addClass('checkout-hidden');
        $('.billing-address-block').addClass('checkout-hidden');
        $('.user-payment-instruments').removeClass('checkout-hidden');
        $('.continue-billing').removeClass('new-ccard');
        base.methods.clearBillingAddressFormValues();
        billingAddressSameAsShipping();
    });
}

base.onBillingAddressUpdate = function () {
    $('.billing-information').on('change', function () {
        if (isPayPalEnabled()) {
            var firstName = $('input[name$=_billing_addressFields_firstName]').val();
            var lastName = $('input[name$=_billing_addressFields_lastName]').val();
            var add1 = $('input[name$=_billing_addressFields_address1]').val();
            // var add2 = $('input[name$=_billing_addressFields_address2]').val();
            var city = $('input[name$=_billing_addressFields_city]').val();
            var postalCode = $('input[name$=_billing_addressFields_postalCode]').val();
            var state = $('select[name$=_billing_addressFields_states_stateCode]').val();
            var country = $('select[name$=_billing_addressFields_country]').val();

            firstName = $.trim(firstName);
            lastName = $.trim(lastName);
            add1 = $.trim(add1);
            // add2 = $.trim(add2);
            city = $.trim(city);
            postalCode = $.trim(postalCode);
            state = $.trim(state);
            country = $.trim(country);
            if (firstName && lastName && add1 && city && postalCode && state && country) {
                saveBillingAddress();
            }
        }
    });
};

$('.remove-payment').on('click', function (e) {
    e.preventDefault();
    var url = $(this).data('url') + '?UUID=' + $(this).data('id') + '&source=checkout';
    $('.payment-to-remove').empty().append($(this).data('card'));

    $('.delete-confirmation-btn').click(function (f) {
        f.preventDefault();
        $('.remove-payment').trigger('payment:remove', f);
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('#uuid-' + data.UUID).remove();
                location.reload()
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $.spinner().stop();
            }
        });
    });
});


/**
 * Update Billing address as shipping address
 */
function billingAddressSameAsShipping() {
    var url = $('#use-shipping-address').data('url');
    $.ajax({
        method: 'POST',
        url: url,
        success: function (data) {
            $('.billing-address-block').addClass('checkout-hidden');
            $('input[name="dwfrm_billing_addressFields_firstName"]').val(data.shipToMeShipmentAddress.firstName);
            $('input[name="dwfrm_billing_addressFields_lastName"]').val(data.shipToMeShipmentAddress.lastName);
            $('input[name="dwfrm_billing_addressFields_address1"]').val(data.shipToMeShipmentAddress.address1);
            if ($('.saved-payment-instrument.selected-payment .saved-credit-card-address .address2').length) {
                $('input[name="dwfrm_billing_addressFields_address2"]').val(data.shipToMeShipmentAddress.address2);
            }
            $('input[name="dwfrm_billing_addressFields_city"]').val(data.shipToMeShipmentAddress.city);
            $('input[name="dwfrm_billing_addressFields_postalCode"]').val(data.shipToMeShipmentAddress.postalCode);
            $('input[name="dwfrm_billing_contactInfoFields_phone"]').val(data.shipToMeShipmentAddress.phone);
            $('select[name$=_billing_addressFields_states_stateCode]').val(data.shipToMeShipmentAddress.stateCode);
            $('select[name$=_billing_addressFields_country]').val(data.shipToMeShipmentAddress.countryCode);
            $('input[name="dwfrm_billing_contactInfoFields_email"]').val(data.shipToMeShipmentAddress.email);
        }
    });
}
/**
 * function
 */
function removeactivepaypal() {
    $('.nav-item.activepaypal').attr('data-auth', 're-auth');
    var liPaypal = $('li[data-method-id="PAYPAL"]');
    liPaypal.removeClass('activepaypal');
}

/**
 * function
 * @param {*} options options
 */
function updatePaypal(options) {
    if (undefined !== options && undefined !== options.selectedPayment && options.selectedPayment === 'PAYPAL'
        && undefined !== options.paidWithPayPal && !options.paidWithPayPal) {
        $('.paypalDetails').addClass('show');
        $('.next-step-button .submit-payment').attr('id', 'showSubmitPayment');
        $('.nav-item.activepaypal').attr('data-auth', 're-auth');
    }
    var liPaypal = $('li[data-method-id="PAYPAL"]');
    if ($(liPaypal).hasClass('activepaypal')) {
        $('.payment-options a.paypal-tab')[0].click();
        $('.payment-information').data('payment-method-id', 'PAYPAL');
    }
}

/**
 * function
 * @param {*} order order
 * @param {*} options options
 */
base.methods.updatePaymentInformation = function (order, options) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';
    var isCSType = false;
    updatePaypal(options);
    var creditCardItem = $('li[data-method-id="CREDIT_CARD"]');
    var saType = $(creditCardItem).attr('data-sa-type');
    $('.alert-danger.payerAuth').hide();
    var isCC = false;
    var isPaypal = false;
    if (($('#is_Cartridge_Enabled').length > 0 && document.getElementById('is_Cartridge_Enabled').value === 'true')) {
        if (order.billing.payment &&
            order.billing.payment.selectedPaymentInstruments &&
            order.billing.payment.selectedPaymentInstruments.length > 0) {
            order.billing.payment.selectedPaymentInstruments.forEach((selectedPaymentInstrument) => {
                if (selectedPaymentInstrument.paymentMethod === 'CREDIT_CARD' &&
                    saType != null) {
                    document.getElementById('submit-order').className = 'button button-primary btn-block submit-order ' + saType.toLowerCase();
                } else if (selectedPaymentInstrument.paymentMethod === 'KLARNA_PAYMENTS') {
                    document.getElementById('submit-order').className = 'button button-primary btn-block submit-order place-order';
                } else if (selectedPaymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
                    document.getElementById('submit-order').className = 'button button-primary btn-block submit-order place-order';
                } else if (order.billing.payment &&
                    order.billing.payment.selectedPaymentInstruments &&
                    order.billing.payment.selectedPaymentInstruments.length > 0 &&
                    selectedPaymentInstrument.paymentMethod !== 'VISA_CHECKOUT' &&
                    selectedPaymentInstrument.paymentMethod !== 'DW_GOOGLE_PAY' &&
                    selectedPaymentInstrument.paymentMethod !== 'PAYPAL' &&
                    selectedPaymentInstrument.paymentMethod !== 'CREDIT_CARD') {
                    document.getElementById('submit-order').className = 'button button-primary btn-block submit-order ' + selectedPaymentInstrument.paymentMethod.toLowerCase();
                } else if (selectedPaymentInstrument.paymentMethod === 'PAYPAL') {
                    document.getElementById('submit-order').className = 'button button-primary btn-block submit-order ' + selectedPaymentInstrument.paymentMethod.toLowerCase();
                } else if (selectedPaymentInstrument.paymentMethod === 'CREDIT_CARD') {
                    document.getElementById('submit-order').className = 'button button-primary btn-block submit-order credit_card';
                } else if (!$('.next-step-button .submit-order').hasClass('.place-order')) {
                    document.getElementById('submit-order').className = 'button button-primary btn-block submit-order place-order';
                }
            });
        }
    }

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments && order.billing.payment.selectedPaymentInstruments.length > 0) {
        order.billing.payment.selectedPaymentInstruments.forEach((selectedPaymentInstrument) => {
            if (!isCC) isCC = selectedPaymentInstrument.paymentMethod === 'CREDIT_CARD';
            if (!isPaypal) isPaypal = selectedPaymentInstrument.paymentMethod === 'PayPal';
            if (selectedPaymentInstrument.paymentMethod === 'CREDIT_CARD' && saType && saType !== 'SA_SILENTPOST' && saType !== 'SA_FLEX') {
                isCSType = true;
            }
            if (isCSType) {
                if (order.billing.payment && order.billing.payment.selectedPaymentInstruments &&
                    order.billing.payment.selectedPaymentInstruments.length > 0) {
                    htmlToAppend = htmlToAppend + '<span>Secure Acceptance ' + selectedPaymentInstrument.paymentMethod.replace('_', ' ') + '</span>';
                }
            } else if (order.billing.payment && order.billing.payment.selectedPaymentInstruments &&
                order.billing.payment.selectedPaymentInstruments.length > 0 && (order.billing.payment.selectedPaymentInstruments[0].paymentMethod === 'PAYPAL' || order.billing.payment.selectedPaymentInstruments[0].paymentMethod === 'PAYPAL_CREDIT')) {
                htmlToAppend = htmlToAppend + '<span>' + selectedPaymentInstrument.paymentMethod +
                    '</span><div><span>' + selectedPaymentInstrument.amount + '</span></div>';
            } else if (order.billing.payment && order.billing.payment.selectedPaymentInstruments &&
                order.billing.payment.selectedPaymentInstruments.length > 0 && selectedPaymentInstrument.paymentMethod === 'CREDIT_CARD') {
                htmlToAppend += '<span>' + order.resources.cardType + ' ' +
                selectedPaymentInstrument.type +
                    '</span><div>' +
                    selectedPaymentInstrument.maskedCreditCardNumber +
                    '</div><div><span>' +
                    order.resources.cardEnding + ' ' +
                    selectedPaymentInstrument.expirationMonth +
                    '/' + selectedPaymentInstrument.expirationYear +
                    '</span></div>';
            } else if (order.billing.payment && order.billing.payment.selectedPaymentInstruments &&
                order.billing.payment.selectedPaymentInstruments.length > 0 && selectedPaymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
                htmlToAppend += '<span>' + order.resources.cardType + ' ' +
                selectedPaymentInstrument.paymentMethod +
                    '</span><div>' +
                    selectedPaymentInstrument.maskedGiftCertificateCode +
                    '</div>';
            }   else if (order.billing.payment && order.billing.payment.selectedPaymentInstruments &&
                order.billing.payment.selectedPaymentInstruments.length > 0) {
                $('.paypalDetails').addClass('show');
                removeactivepaypal();
                htmlToAppend += selectedPaymentInstrument.paymentMethod + '</span>';
            }
        });
    }

    if (order.billing.payment.isOnlyGC) $('.card.payment-form').find('form:not(.is-only-gc)').addClass('is-only-gc');
    if (!order.billing.payment.isOnlyGC) $('.card.payment-form').find('form.is-only-gc').removeClass('is-only-gc');

    $paymentSummary.empty().append(htmlToAppend);

    var checkoutStage = $('#checkout-main').attr('data-checkout-stage');
    var placeOrderflag = $('#submit-order').hasClass('place-order');
    if (checkoutStage === 'payment' && !placeOrderflag && (isCC || isPaypal)) {
        var placeOrderBtn = $('#checkout-main').find('#submit-order');
        $(placeOrderBtn).closest('.row').find('.next-step-button').removeClass('next-step-button');
    }
};

/**
 * updates the billing address form values within payment forms
 * @param {Object} order - the order model
 */
function updateBillingAddressFormValues(order) {
    var billing = order.billing;
    if (!billing.billingAddress || !billing.billingAddress.address) return;

    var form = $('form[name=dwfrm_billing]');
    if (!form) return;

    $('input[name$=_firstName]', form).val(billing.billingAddress.address.firstName);
    $('input[name$=_lastName]', form).val(billing.billingAddress.address.lastName);
    $('input[name$=_address1]', form).val(billing.billingAddress.address.address1);
    $('input[name$=_address2]', form).val(billing.billingAddress.address.address2);
    $('input[name$=_city]', form).val(billing.billingAddress.address.city);
    $('input[name$=_postalCode]', form).val(billing.billingAddress.address.postalCode);
    $('select[name$=_stateCode],input[name$=_stateCode]', form)
        .val(billing.billingAddress.address.stateCode);
    $('select[name$=_country]', form).val(billing.billingAddress.address.countryCode.value);
    $('input[name$=_phone]', form).val(billing.billingAddress.address.phone);
    $('input[name$=_email]', form).val(order.orderEmail);

    if ($('#billing-contact-info').length) {
        form = $('#billing-contact-info');
        $('input[name$=_firstName]', form).val(billing.billingAddress.address.firstName);
        $('input[name$=_lastName]', form).val(billing.billingAddress.address.lastName);
        $('input[name$=_phone]', form).val(billing.billingAddress.address.phone);
        $('input[name$=_email]', form).val(order.orderEmail);
        if (billing.billingAddress.address &&
            billing.billingAddress.address.firstName &&
            billing.billingAddress.address.lastName &&
            billing.billingAddress.address.phone &&
            order.orderEmail) {
            $('.contact-info-section').addClass('d-none');
            var infoSummary = $('.contact-info-summary');
            infoSummary.removeClass('d-none');
            $('.first-name', infoSummary).text(billing.billingAddress.address.firstName);
            $('.last-name', infoSummary).text(billing.billingAddress.address.lastName);
            $('.email', infoSummary).text(billing.billingAddress.address.phone);
            $('.phone', infoSummary).text(order.orderEmail);
        }
    }

    if (billing.payment && billing.payment.selectedPaymentInstruments
        && billing.payment.selectedPaymentInstruments.length > 0) {
        var instrument = billing.payment.selectedPaymentInstruments[0];
        $('select[name$=expirationMonth]', form).val(instrument.expirationMonth);
        $('select[name$=expirationYear]', form).val(instrument.expirationYear);
        // Force security code and card number clear
        $('input[name$=securityCode]', form).val('');
        if ($('li[data-method-id="CREDIT_CARD"]').attr('data-sa-type') !== 'SA_FLEX') {
            $('input[name$=cardNumber]').data('cleave').setRawValue('');
        }
    }
}

base.methods.updateBillingInformation = function (order, customer) {
    base.methods.updateBillingAddressSelector(order, customer);

    // update billing address form
    updateBillingAddressFormValues(order);

    // update billing address summary
    addressHelpers.methods.populateAddressSummary('.billing .address-summary',
        order.billing.billingAddress.address);

    // update billing parts of order summary
    $('.order-summary-email').text(order.orderEmail);

    if (order.billing.billingAddress.address) {
        $('.order-summary-phone').text(order.billing.billingAddress.address.phone);
    }
};

// Enable Apple Pay
if (window.dw
    && window.dw.applepay
    && window.ApplePaySession
    && window.ApplePaySession.canMakePayments()) {
    $('body').addClass('apple-pay-enabled');
}

module.exports = base;
