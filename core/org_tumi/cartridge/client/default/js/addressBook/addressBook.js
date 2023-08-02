'use strict';

var formValidation = require('../components/formValidation');

var url;
var isDefault;

/**
 * Create an alert to display the error message
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.error-messaging').append(errorHtml);
}

if ($('.saved-adr-heading ').hasClass('hide-saved-heading')) {
    $('.hide-saved-info').css('display', 'none');
}

function settingAddressUrl() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
      });
    if(params.tab) {
        location.href = $('#setting-overview-left').data('url').split('?')[0]+'?tab=address';
    } else {
        location.href = $('#setting-overview-left').data('url')+'?tab=address';
    }
}

module.exports = {
    removeAddress: function () {
        $(document).on('click','.remove-address', function (e) {
            e.preventDefault();
            isDefault = $(this).data('default');
            if (isDefault) {
                url = $(this).data('url')
                    + '?addressId='
                    + $(this).data('id')
                    + '&isDefault='
                    + isDefault;
            } else {
                url = $(this).data('url') + '?addressId=' + $(this).data('id');
            }
            $('.product-to-remove').empty().append($(this).data('id'));
        });
    },

    removeAddressConfirmation: function () {
        $(document).on('click', '#deleteAddressModal .delete-confirmation-btn', function (e) {
            e.preventDefault();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    // $('#uuid-' + data.UUID).remove();
                    if (isDefault) {
                        $('.card .card-make-default-link').first().remove();
                        $('.remove-address').data('default', true);
                        if (data.message) {
                            var toInsert = '<div><h3>' +
                                data.message +
                                '</h3><div>';
                            $('.addressList').after(toInsert);
                        }
                    }
                    $.spinner().start();
                    $('body').trigger('address:GetaddressData');
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.responseJSON.errorMessage);
                    }
                    $.spinner().stop();
                }
            });
        });
    },

    submitAddress: function () {
        $('form.address-form').submit(function (e) {
            var $form = $(this);
            e.preventDefault();
            url = $form.attr('action');
            $form.spinner().start();
            $('form.address-form').trigger('address:submit', e);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    $form.spinner().stop();
                    if (!data.success) {
                        formValidation($form, data);
                        $('.duplicate-error-msg').addClass('d-block');
                        $('.addressAlreadyExists h3').html(data.message);
                    } else {
                        settingAddressUrl();
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
    },

    cancelAddress: function() {
        $(document).on('click', '.address-cancel-button', function (e) {
            settingAddressUrl();
        });
    },

    setDefaultAddress: function() {
        $(document).on('click', '.address-default-link', function (e) {
            var url = $(this).data('url');
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    if(data.success) {
                        $('body').trigger('address:GetaddressData');
                    }
                }
            });
        });
    }
};
