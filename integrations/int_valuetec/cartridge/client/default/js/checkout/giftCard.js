'use strict';

function handleResonse(response) {
    var payment = response.payment;
    var gcDiv = $('div.pay-with-giftcard');
    var form = $('#dwfrm_billing');
    if (gcDiv.hasClass('is-gc')) gcDiv.removeClass('is-gc');
    if (form.hasClass('is-only-gc')) form.removeClass('is-only-gc');
    if (payment.isContainsGc && !gcDiv.hasClass('is-gc')) gcDiv.addClass('is-gc');
    if (payment.isOnlyGC && !form.hasClass('is-only-gc')) form.addClass('is-only-gc');
    if (response.savedpaymentscontent) $('div.existing-gc').html(response.savedpaymentscontent);
    $('.giftcard-balancecheck input[type="text"]').val('');
}

function checkbalance() {
    $('.check-balance-cta').on('click', (e) => {
        e.preventDefault();
        var gcDiv = $(e.target).closest('div.giftcard-balancecheck');
        var url = e.currentTarget.href;
        gcDiv.spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: gcDiv.find('input').serialize(),
            success: function success(data) {
                gcDiv.spinner().stop();
                if (!$('.check-balance-details').hasClass('d-none')) $('.check-balance-details').addClass('d-none');
                if ($('.check-balance-details').hasClass('d-block')) $('.check-balance-details').removeClass('d-block');
                if (data.success && data.balanceMessage) {
                    $('div.check-balance-details p').text(data.balanceMessage);
                    $('.check-balance-details').addClass('d-block');
                }
            },
            error: function error(data) {
                console.log(data)
            }
        });
        return false;
    });
    $('body').on('submit', 'form.giftcard-balancecheck', function (e) {
        e.preventDefault();
        var form = $(this);
        var url = form.attr('action');
        form.spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function success(data) {
                form.spinner().stop();
                if (data.balanceMessage) {
                    $('.alert', form).remove();
                    var successElement = $(form);
                    successElement.prepend('<div class="alert alert-success">' + data.balanceMessage + '</div>');
                }
            },
            error: function error(data) {
                console.log(data); // eslint-disable-line no-console
            }
        });
        return false;
    });
}

function authorize() {
    $('body').on('click', '.authorize', function (e) {
        e.preventDefault();
        var form = $('.giftcard-balancecheck');
        var url = $('#authorize').val();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function success(data) {
                $('.alert', form).remove();
                var successElement = $(form);
                successElement.prepend('<div class="alert alert-success">' + data.authMessage + '</div>');
            },
            error: function error(data) {
                console.log(data); // eslint-disable-line no-console
            }
        });
        return false;
    });
}

function voidAuth() {
    $('body').on('click', 'div.gc-remove a', function (e) {
        e.preventDefault();
        var form = $(this).closest('.gc-details-card');;
        var url = e.currentTarget.href;
        var data = {
            puuid: $(this).closest('div.gc-details-card').data('puuid')
        };
        form.spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: data,
            success: function success(data) {
                form.spinner().stop();
                handleResonse(data);
                checkKlarnaApplePaymentButton(false);
            },
            error: function error(data) {
                form.spinner().stop();
                console.log(data); // eslint-disable-line no-console
            }
        });
        return false;
    });
}

function addGiftCard() {
    $('form.giftcard-purchase-form').submit(function (e) {
        e.preventDefault();
        var form = $(this);

        form.spinner().start();
        var url = form.attr('action');
        if (url) {
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function () {
                    form.spinner().stop();
                    alert('Giftcard Added successfult'); // eslint-disable-line no-alert
                },
                error: function () {
                    form.spinner().stop();
                }
            });
        }
    });
}

function redeemGC() {
    $('body').on('click', 'div.giftcard-balancecheck .btn-giftcard-redeem', function (e) {
        e.preventDefault();
        var parentDiv = $('div.giftcard-balancecheck');
        var url = $(this).data('url');
        parentDiv.spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: $('div.giftcard-balancecheck :input').serialize(),
            success: function success(data) {
                parentDiv.spinner().stop();
                if (data.success) {
                    handleResonse(data);
                    $('#pay-with-giftcard').prop('checked', false);
                    $('.valuetec-content').removeClass('d-block');
                    if(data.onlyGC) {
                        $('.continue-billing-btn, .continue-billing').removeClass('d-none');
                        $('.continue-billing-klarna').addClass('d-none');
                        $('.next-step-button .submit-payment').attr('disabled');
                        $('input[name*="billing_paymentMethod"]').val('GIFT_CERTIFICATE');
                    } else {
                        checkKlarnaApplePaymentButton(true);
                    }
                } else {
                    if (data.fieldErrors.length) {
                        data.fieldErrors.forEach(function (error) {
                            if (Object.keys(error).length) {
                                var formHelpers = require('base/checkout/formErrors');
                                formHelpers.loadFormErrors(parentDiv, error);
                            }
                        });
                    }
                }
            },
            error: function error(data) {
                parentDiv.spinner().stop();
                console.log(data); // eslint-disable-line no-console
            }
        });
        return false;
    });
}

function checkKlarnaApplePaymentButton(isAddedGC) {
    if(isAddedGC) {
        if($('#applepay').length > 0) {
            if($('a.applepay-tab').hasClass('active')){
                $('.payment-options li > a.credit-card-tab').trigger('click')
            }
            $('.payment-options li > a.applepay-tab').addClass('disabled');
            $('.payment-options li > a.applepay-tab').closest('li').addClass('disabled');
        }
        if($('#klarna-input').length > 0) {
            if($('a[class^=klarna-payments-]').hasClass('active')){
                $('.payment-options li > a.credit-card-tab').trigger('click')
            }
            $('.payment-options li > a[class^=klarna-payments-]').addClass('disabled');
            $('.payment-options li > a[class^=klarna-payments-]').closest('li').addClass('disabled');
        }
    } else {
        if($('#applepay').length > 0) {
            $('.payment-options li > a.applepay-tab').removeClass('disabled');
            $('.payment-options li > a.applepay-tab').closest('li').removeClass('disabled');
        }
        if($('#klarna-input').length > 0) {
            $('.payment-options li > a[class^=klarna-payments-]').removeClass('disabled');
            $('.payment-options li > a[class^=klarna-payments-]').closest('li').removeClass('disabled');
        }
    }
}

function paymentSelection() {

}

function giftCardCommon() {
    $('#pay-with-giftcard, .pay-giftcard-existing').on('click', function() {
        $('#valuetec-content').toggleClass('d-block');
    });
}

module.exports = {
    checkbalance: checkbalance,
    authorize: authorize,
    voidAuth: voidAuth,
    addGiftCard: addGiftCard,
    redeemGC: redeemGC,
    giftCardCommon: giftCardCommon,
    paymentSelection: paymentSelection
};
