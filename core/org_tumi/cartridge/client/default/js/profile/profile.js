'use strict';

var formValidation = require('../components/formValidation');
require('pwstrength-bootstrap/dist/pwstrength-bootstrap');

$('.profile-edit,.profile-cancel').on('click', function() {
    $('.my-settings').toggleClass('profile-view');
});

$('.password-edit,.password-cancel').on('click', function() {
    $('.my-settings').toggleClass('password-view');
});

if($('html').hasClass('d-mobile')) {
  $('.mobile-redirect').on('click', function(e) {
    e.preventDefault();
    window.location = $(this).attr('data-mhref');
  })
}

var passwordCriteria = {
    MinLength: 8,
    MinSpecialCharacters: 1,
    MinNumber: 1,
    MinCharacters: 1
}


function checkPasswordValidation(id) {
    var hasError = false;
    $('#password-error-msg').addClass('d-none');
    var passVaule = $(id).val();
    var errorMessage = 'Password must';
    if(!passVaule) {
        return;
    }

    if (passVaule.length < passwordCriteria.MinLength) {
        errorMessage += ' be at least ' + passwordCriteria.MinLength + ' characters';
    }

    var numRegex = new RegExp('[0-9]{'+ passwordCriteria.MinNumber +'}'); 
    if (!numRegex.test(passVaule)) {
        errorMessage += ' contain at least ' + passwordCriteria.MinNumber + ' number';
    }

    var charRegex = new RegExp('[a-zA-Z]{' + passwordCriteria.MinCharacters + '}'); 
    if (!charRegex.test(passVaule)) {
        errorMessage += ' contain at least ' + passwordCriteria.MinCharacters + ' letter';
    }

    var format = /[`!@#$%*()_+\-=\[\]{}\\|,.\/?~]/;
    var specialCharRegex = new RegExp(format); 
    if (!specialCharRegex.test(passVaule)) {
        errorMessage += ' contain at least ' + passwordCriteria.MinSpecialCharacters + ' special Character';
    }

    if (errorMessage != 'Password must') {
        hasError = true;
        $('#password-error-msg').text(errorMessage);
        $('#password-error-msg').removeClass('d-none');
    }

    return hasError;
}

module.exports = {
    submitProfile: function () {
        $('form.edit-profile-form').submit(function (e) {
            var $form = $(this);
            e.preventDefault();
            var url = $form.attr('action');
            $form.spinner().start();
            $('form.edit-profile-form').trigger('profile:edit', e);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    $form.spinner().stop();
                    if (!data.success) {
                        formValidation($form, data);
                    } else {
                        location.href = data.redirectUrl;
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

    submitPassword: function () {
        $('form.change-password-form').submit(function (e) {
            if(checkPasswordValidation('#newPassword')) {
                return false;
            }
            var $form = $(this);
            e.preventDefault();
            var url = $form.attr('action');
            $form.spinner().start();
            $('form.change-password-form').trigger('password:edit', e);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    $form.spinner().stop();
                    if (!data.success) {
                        formValidation($form, data);
                    } else {
                        location.href = data.redirectUrl;
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

    initPasswordPluginForChangePassword: function () {
        if (typeof $.fn.pwstrength === "undefined") {
            methods.log("initPasswordPluginForChangePassword: plugin missing.");
            return false;
        }

        var $target = $("#newPassword");
        if (!$target.length) {
            return false;
        }

        var options = {};
        options = {
            ui : {
                progressBarEmptyPercentage : 0,
                useVerdictCssClass : true,
                colorClasses : ['danger', 'danger', 'warning', 'warning', 'success', 'success'],
                viewports : {
                    progress: ".pwstrength_progress"
                },
                showVerdictsInsideProgressBar: true
            },
            rules : {
                wordUppercase : true,
                wordThreeNumbers : true,
                wordOneSpecialChar : true,
                wordTwoSpecialChar : true
            },
            common : {
                debug: false,
                minChar : 6
            }
        };
        $target.pwstrength(options);
    },

    validatePassword: function () {
        $(document).on('keyup', '#newPassword', function(e) {
            checkPasswordValidation("#newPassword");
        });
    }
};
