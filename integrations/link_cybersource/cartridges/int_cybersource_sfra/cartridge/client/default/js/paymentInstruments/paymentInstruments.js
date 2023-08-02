'use strict';

var formValidation = require('base/components/formValidation');
var base = require('base/paymentInstruments/paymentInstruments');
var cleave = require('../components/cleave');

var url;

function settingUrl() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
      });
    if(params.tab) {
        location.href = $('#setting-overview-left').data('url').split('?')[0]+'?tab=payment';
    } else {
        location.href = $('#setting-overview-left').data('url')+'?tab=payment';
    }
}

base.setDefaultPaymentInstrument = function () {
    $(document).on('click','.set-default-paymentInstrument', function (e) {
        var url = $(this).data('url');;
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if(data.success) {
                    $('body').trigger('paymentInstrument:refreshData');
                }
            }
        });
    });
}

base.paymentCancelButton = function () {
    $(document).on('click','.btn-paymentInstrument-cancel', function (e) {
        settingUrl();
    });
}

base.removePayment = function () {
    $(document).on('click','.remove-payment', function (e) {
        e.preventDefault();
        url = $(this).data('url') + '?UUID=' + $(this).data('id');
        $('.payment-to-remove').empty().append($(this).data('card'));

        $(document).off('click','#deletePaymentModal .delete-confirmation-btn').on('click','.delete-confirmation-btn', function (f) {
            f.preventDefault();
            $('.remove-payment').trigger('payment:remove', f);
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    $('#uuid-' + data.UUID).remove();
                    if (data.message) {
                        var toInsert = '<div><h3>'
                            + data.message
                            + '</h3><div>';
                        $('.paymentInstruments').html(toInsert);
                    }
                    $('body').trigger('paymentInstrument:refreshData');
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
};

base.submitPayment = function () {
    $('form.payment-form').submit(function (e) {
        var $form = $(this);
        e.preventDefault();
        url = $form.attr('action');
        $form.spinner().start();
        $('form.payment-form').trigger('payment:submit', e);

        var formData = cleave.serializeData($form);

        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: formData,
            success: function (data) {
                $form.spinner().stop();
                if (!data.success) {
                    formValidation($form, data);
                    if (data.message) {
                        var toInsert = '<div class="invalid-input">'
                            + data.message
                            + '<div>';
                        $('.paymentInstruments').html(toInsert);
                    }
                } else {
                    // eslint-disable-next-line
                    settingUrl();
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $form.spinner().stop();
            }
        });
        return false;
    });
};

module.exports = base;
