'use strict';

var processInclude = require('base/util');
var scrollAnimate = require('base/components/scrollAnimate');

function validateTracerInputs() {
    var tracerIdCount = $('#tracerIdCount').val();
    var tracerInputs = $('.tracerId');
    var i;
    for (i = 0; i < tracerIdCount; i++) {
        var tracerId = $(tracerInputs[i]);
        var tracerIdVal = tracerId.val();
        var tracerLen = tracerIdVal.length;
        var isValid = true;
        var invalidFeedback = tracerId.parent().children('.invalid-feedback');
        var regexCheck = /^[0-9]*$/.test(tracerIdVal);
        if (tracerLen === 0 || tracerIdVal === '') {
            invalidFeedback.html($('#required').val());
            isValid = false;
            invalidFeedback.css('display','block');
        } else if (tracerLen !== 20) {
            invalidFeedback.html($('#range').val());
            isValid = false;
            invalidFeedback.css('display','block');
        } else if (!regexCheck) {
            invalidFeedback.html($('#unexpected').val());
            isValid = false;
            invalidFeedback.css('display','block');
        }else {
            invalidFeedback.css('display','none');
            invalidFeedback.html('');
        }
    }
    return isValid;
}

$(document).ready(function () {
    $('#tracerIdCount').on('change', function () {
        var tracerIdCount = $('#tracerIdCount').val();
        var tracerInputs = $('.tracer-id-container');
        var tracerInput;
        var i;
        for (i = 0; i < tracerIdCount; i++) {
            tracerInput = $(tracerInputs[i]);
            tracerInput.removeClass('d-none');
            tracerInput.next('.invalid-feedback').css('display', 'block');
        }
        for (i = tracerIdCount; i < tracerInputs.length; i++) {
            tracerInput = $(tracerInputs[i]);
            tracerInput.addClass('d-none');
            tracerInput.next('.invalid-feedback').css('display', 'none');
        }
    });


    $('form #tracerIdsSubmit').on('click', function (e) {
        e.preventDefault();
        var isInputsValid = validateTracerInputs();
        if (isInputsValid) {
            var form = $('#tracerIdForm');
            var url = form.attr('action');
            var method = form.attr('method');
            $('body').spinner().start();
            $.ajax({
                url: url,
                data: form.serialize(),
                type: method,
                dataType: 'json',
                success: function (data) {
                    form.spinner().stop();
                    if (data.isValid && data.validIds.length > 0) {
                        $('#tracerAddressForm').css('display', 'block');
                        $('#tracerAddressForm #validTracerId').val(data.validIds.toString());
                        var addressRandomId = parseInt(Math.random() * 100000, 10);
                        $('#tracerAddressForm #addressId').val(addressRandomId);
                        scrollAnimate($(".checkout-heading"));
                    } else {
                        $('.tracer-id-container .invalid-feedback').html(data.errorMessage).css('display', 'block');
                        $('#tracerAddressForm').css('display', 'none');
                    }
                },
                error: function (error) {
                    form.spinner().stop();
                }
            });
        }
        return false;
    });

    $('form#tracerAddressForm').on('submit', function (e) {
        e.preventDefault();
        var isInputsValid = validateTracerInputs();
        if (isInputsValid) {
            var form = $(this);
            var url = form.attr('action');
            var method = form.attr('method');
            form.spinner().start();
            $.ajax({
                url: url,
                data: form.serialize(),
                type: method,
                dataType: 'json',
                success: function (data) {
                    form.spinner().stop();
                    if (!data.error) {
                        $('body').find('.container.tumi-tracer').html(data.renderedTemplate);
                    } else if (data.error && data.errMessages) {
                        $('.tracer-reg .tracer-id-container').not('.d-none').each(function (index, item) {
                            $(item).find('.invalid-feedback').css('display', 'block').text(data.errMessages[index]);
                        });
                    } else {
                        $('.tracer-id-container .invalid-feedback').html(data.errorMessage).css('display', 'block');
                    }
                },
                error: function (e) {
                    form.spinner().stop();
                    $('.tracer-id-container .invalid-feedback').html(e.msg).css('display', 'block');
                }
            });
            window.scrollTo(0, 0);
        }
        return false;
    });

    $('#country').on('change', function() {
        if($(this).val() === 'US') {
            $('.state-label').removeClass('d-none');
            $('.state-label option:first').val('');
        } else {
            $('.state-label').addClass('d-none');
            $('.state-label option:first').val('none');
        }
    });

    $('body').on('change', '.items-size', function () {
        var url = $(this).find(":selected").data('url');
        $.ajax({
            data: {'ajaxcall': true},
            url: url,
            success: function(data) {
                $('.tracer-products').html(data);
            },
            error: function(err) {
                // console.log(err);
            }
        });
    });

    $('body').on('click', '.load-more', function () {
        var url = $(this).data('url');
        $.ajax({
            data: {'ajaxcall': true},
            url: url,
            success: function(data) {
                $('.tracer-products').replaceWith(data);
            },
            error: function(err) {
                // console.log(err);
            }
        });
    })

    $('body').on('click', '.tracer-registre-btn', function (e) {
        e.preventDefault();
        var inputField =  $('input[name="tracerID"]');
        var errorMsg = $(inputField).data('parse-error');
        var tracerID = $(inputField).val();
        if (tracerID.length === 20) {
            $(this).parent('form').find('.invalid-feedback').css('display', 'none');
            $(this).parent('form').submit();
        } else {
            $(this).parent('form').find('.invalid-feedback').text(errorMsg).css('display', 'block');
        }
    });

    $(document).on('click', '.print-page', function(e) {
        e.preventDefault();
        window.print();
    });

    $('form input, form select').on('invalid', function () {
        var currForm = $(this).closest('form');
        currForm.find('.is-invalid:eq(0)').focus();
    });
});
