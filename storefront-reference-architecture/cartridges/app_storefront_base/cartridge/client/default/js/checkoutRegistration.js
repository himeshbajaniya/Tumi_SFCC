'use strict';

var formValidation = require('./components/formValidation');

$(document).ready(function () {
    $('form.checkout-registration').submit(function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    formValidation(form, data);
                } else {
                    location.href = data.redirectUrl;
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                form.spinner().stop();
            }
        });
        return false;
    });

    $('#register-form').click(function (e) {
        var parseRegisterForm = $('#getRegisterForm').val();
        var registerForm = JSON.parse(parseRegisterForm);
        var createAccountUrl = $('#createAccountUrl').val();
        if(registerForm) {
            $('#registration-form-fname').val(registerForm.firstName);
            $('#registration-form-lname').val(registerForm.lastName);
            $('#registration-form-email').val(registerForm.email);
            $('#registration-form-password').val('');
            $('.registration').attr('action', createAccountUrl);
        }
    });

    $(".cart-drop-down").click(function(e){
        e.preventDefault();
        $('.order-mobile').toggleClass('d-block');
        $(".cart-drop-down").toggleClass('svg-icon');
    });
});
