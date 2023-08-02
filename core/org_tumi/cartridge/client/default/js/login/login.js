'use strict';

var formValidation = require('../components/formValidation');
var createErrorNotification = require('base/components/errorNotification');
var bookmark = require('../components/bookmark');
require('../plugins/pwstrength-bootstrap');

function generateCSRFToken () {
    $.ajax({
        url: $('.login-page').data('csrf-url'),
        type: 'post',
        dataType: 'json',
        success: function (data) {
            if (data.csrf) {
                var selector = 'input[name="' + data.csrf.tokenName + '"]';
                $(selector).val(data.csrf.token);
            } else {
                location.reload();
            }
        },
        error: function (data) {
            location.reload();
        }
    });
}

var passwordCriteria = {
    MinLength: 8,
    MinSpecialCharacters: 1,
    MinNumber: 1,
    MinCharacters: 1
}

function checkPasswordValidation(id) {
    var hasError = false;
    $('#password-error').addClass('d-none');
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

    var charRegex = new RegExp('[a-z]{' + passwordCriteria.MinCharacters + '}'); 
    if (!charRegex.test(passVaule)) {
        errorMessage += ' contain at least ' + passwordCriteria.MinCharacters + ' lower case letter';
    }

    var charRegex = new RegExp('[A-Z]{' + passwordCriteria.MinCharacters + '}'); 
    if (!charRegex.test(passVaule)) {
        errorMessage += ' contain at least ' + passwordCriteria.MinCharacters + ' upper case letter';
    }

    var format = /[`!@#$%*()_+\-=\[\]{}\\|,.\/?~]/;
    var specialCharRegex = new RegExp(format); 
    if (!specialCharRegex.test(passVaule)) {
        errorMessage += ' contain at least ' + passwordCriteria.MinSpecialCharacters + ' special Character';
    }

    if (errorMessage != 'Password must') {
        hasError = true;
        $('#password-error').text(errorMessage);
        $('#password-error').removeClass('d-none');
    }

    return hasError;
}

/**
 * Generate GTM cart data using responce data
 * @param {Object} data Collection of attribute level info such as url, container and tracking information
 * @returns dataLayerJson object
 */
 function generateLoginDataLayerJson(data) {
    window.dataLayer = window.dataLayer || [];
    var dataLayerJson = window.dataLayer[0]

    try {   
        var customerEmail = $('#login-form-email').val() || '';

        dataLayerJson.customerID = customerEmail;
        dataLayerJson.customer_email = customerEmail;
        dataLayerJson.customerName = ''; // name
        dataLayerJson.customerDisplayUID = customerEmail;
        dataLayerJson.customerPrefLanguage = 'en';
        dataLayerJson.visitorLoginState = 'registered';

    } catch(e) {
        return;
    }

}

module.exports = {


    login: function () {
        $('form.login').submit(function (e) {
            var form = $(this);
            e.preventDefault();
            var url = form.attr('action');
            window.trigger = 'GLOBAL';
            if($('.service-repairs').length > 0) {
                url = url.replace('rurl=1', 'rurl=3');
                window.trigger = 'SERVICEREPAIR';
            }

            if($('.tumi-tracer .signin a[data-login="sign-in"]').length > 0) {
                url = url.replace('rurl=1', 'rurl=4');
                window.trigger = 'TRACERREG';
                var paramString = location.href.split('?')[1];
                var tracerID = '';
                if (paramString) {
                    var queryString = new URLSearchParams(paramString);
                    tracerID = queryString.get('tracerID');
                }
            }

            if(!$('#requestLoginModal').find('.bookmark-info').hasClass('d-none')){
                window.trigger = 'WISHLIST';
            }
            if(localStorage.getItem('currentStoreID') && $("[for=store_" + localStorage.getItem('currentStoreID') + "]").attr("checked",'true')) {
                window.trigger = 'STORELOCATOR';
            }
            var isCartPage = $('div.cart-page').length > 0;
            if (isCartPage) {
                window.trigger = 'CARTUPDATE';
            }
            form.spinner().start();
            $('form.login').trigger('login:submit', e);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (data) {
                    $.spinner().stop();
                    if (!data.success) {
                        formValidation(form, data);
                        $('form.login').trigger('login:error', data);
                    } else {
                        // Checking weather the account has verified
                        if ('accountVerified' in data && !data.accountVerified) {
                            if ('linkExpired' in data && data.linkExpired) {
                                $('.account-verification-notification.login').html(`${data.message} <br/><a href='${data.link}'>${data.linkName}</a>`);
                            } else {
                                $('.account-verification-notification.login').html(data.message);
                            }
                            // regenerating csrf as token expired after creating the account.
                            generateCSRFToken();
                            return false;
                        }

                        var wishlistPidArray = data.wishlistPidArray;
                        sessionStorage.setItem('wishlistPidArray', wishlistPidArray);
                        bookmark.getWishlistItem();
                        var queryString = data.queryString || '' ;
                        var redirectUrl = data.redirectUrl || '';
                        $('form.login').trigger('login:success', data);
                        $.get($(".accountheader").data('actionurl')).done(function (data) {
                            $('.accountheader').html();
                            $('.accountheader').html(data);
                            // location.href = location.href;
                            $('#requestLoginModal').modal('hide');

                            if (window.trigger === 'TRACERREG') {
                                var tracerURL = redirectUrl;
                                if (tracerID) {
                                    var tracerURL = redirectUrl + '?tracerID=' + tracerID;
                                }
                                location.href = tracerURL;
                            } else if (window.trigger==='SERVICEREPAIR') {
                                location.href = redirectUrl;
                            } else if (window.trigger==='STORELOCATOR') {
                                $(document).trigger('storelocator:add');
                            }else if (window.trigger==='CARTUPDATE') {
                                $(document).trigger('cart:loginUpdate');
                            } else {
                                if (window.trigger=='WISHLIST') {
                                    $(document).trigger('wishlist:add');
                                }
                                if (window.trigger !== 'WISHLIST' && queryString.indexOf('1') > -1) {
                                    $('#signedInModal').modal('show');
                                    setTimeout(() => {
                                        $('body').addClass('modal-open');                                        
                                    }, 300);
                                }
                                if (window.trigger !== 'WISHLIST' && queryString.indexOf('2') > -1) {
                                    location.href = redirectUrl;
                                }
                            }
                            generateLoginDataLayerJson(data);
                            if ($('.container.tumi-tracer').length) window.location.reload();
                        });
                        // location.href = data.redirectUrl;
                    }
                },
                error: function (data) {
                    if (data.responseJSON.redirectUrl) {
                        window.location.href = data.responseJSON.redirectUrl;
                    } else {
                        $('form.login').trigger('login:error', data);
                        form.spinner().stop();
                    }
                    // regenerating csrf as token expired after creating the account.
                    generateCSRFToken();
                }
            });
            return false;
        });
        
    },

    validateRegisterEmail: function () {
        $('body').on('focusout', '#registration-form-email', function () {
            var errorDiv = $(this).closest('div').find('.invalid-feedback-us');
            if (!errorDiv.hasClass('d-none')) errorDiv.addClass('d-none');
            if ($(this).val().match(/([a-z0-9]+@[united]+\.[a-z]{2,3})$/g)) errorDiv.removeClass('d-none');
        });
    },

    register: function () {
        $('form.registration').submit(function (e) {
            if(checkPasswordValidation('#registration-form-password')) {
                return false;
            }

            if ($('.invalid-feedback-us').is(':visible')) return false;

            var form = $(this);
            e.preventDefault();
            var url = form.attr('action');
            form.spinner().start();
            $('form.registration').trigger('login:register', e);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (data) {
                    form.spinner().stop();
                    if (!data.success) {
                        $('form.registration').trigger('login:register:error', data);
                        formValidation(form, data);
                    } else {
                        $('form.registration').trigger('login:register:success', data);
                        if (data.orderID) {
                            location.href = data.redirectUrl;
                        }
                        $('.account-verification-notification.registration').html(data.message);
                    }
                    // regenerating csrf as token expired after creating the account.
                    generateCSRFToken();
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification($('.error-messaging'), err.responseJSON.errorMessage);
                    }
                    // regenerating csrf as token expired after creating the account.
                    generateCSRFToken();

                    form.spinner().stop();
                }
            });
            return false;
        });
    },

    resetPassword: function () {
        $('.reset-password-form').submit(function (e) {
            var form = $(this);
            e.preventDefault();
            var url = form.attr('action');
            form.spinner().start();
            $('.reset-password-form').trigger('login:register', e);
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
                        var confirmationTitle = $('.reset-password-form').attr('data-confirmation');
                        var confirmationDesc = $('.reset-password-form').attr('data-confirmationdesc');
                        var resetPasswordForm = $('.reset-password-form').attr('data-backtologin');
                        $('.request-password-title').text(data.receivedMsgHeading);
                        $('.request-password-body').addClass('d-none');
                        $('.confirmation-password-body').empty()
                        .append('<h6>'+confirmationTitle+'</h6><p>'+confirmationDesc+'</p>');
                        $('.reset-password-form').addClass('active');
                        if (!data.mobile) {
                            var resetPasswordForm = $('.reset-password-form').attr('data-backtologin');
                            $('#submitEmailButton').text(resetPasswordForm);
                        } else {
                            $('.send-email-btn').empty()
                                .html('<a href="'
                                    + data.returnUrl
                                    + '" class="btn btn-primary btn-block">'
                                    + data.buttonText + '</a>'
                                );
                        }
                    }
                },
                error: function () {
                    form.spinner().stop();
                }
            });
            return false;
        });
    },

    clearResetForm: function () {
        $('#login .modal').on('hidden.bs.modal', function () {
            $('#reset-password-email').val('');
            $('.modal-dialog .form-control.is-invalid').removeClass('is-invalid');
        });
    },

    togglePassword: function () {
        var togglePassword = $(".toggle-password");
        
        togglePassword.on('keypress click', function(e) {
            if (e.which === 13 || e.type === 'click') {
                var _this = $(this);
                _this.toggleClass("active");
                var temp = _this.closest('.form-group').find('input');
                var type = (temp.attr("type") === "password") ? "text" : "password";
                temp.attr("type", type);
            }
        });
    },
    
    toggleCheckbox: function() {
        $('input:checkbox').on('keypress', function (event) {
            if (event.which === 13 || event.key === ' ' || event.key === 'spacebar') {
                $(this).prop('checked', !$(this).prop('checked'));
            }
        });
    },

    backtoLogin: function () {
        let passwordReset = document.querySelector('#password-reset');
        let returnToLogin = document.querySelector('.return-to-login');
        let backToLogin = document.querySelector('#backtologin');

        passwordReset.addEventListener('click', (e)=>{
            e.preventDefault();
            document.querySelector('#requestLoginModal .modal-body').classList.add('mlogin');
        });

        returnToLogin.addEventListener('click', (e)=>{
            e.preventDefault();
            document.querySelector('#requestLoginModal .modal-body').classList.remove('mlogin');
        });
        backToLogin.addEventListener('click', (e)=>{
            e.preventDefault();
            $('.reset-password-form').removeClass('active');
            $('.request-password-body').removeClass('d-none');
            $('#reset-password-email').val('');
            $('.confirmation-password-body').empty();
            document.querySelector('#requestLoginModal .modal-body').classList.remove('mlogin');
        });
    },

    resetValidation: function(){
        let loginTab = document.querySelector('.login-tab');
        let registerTab = document.querySelector('.register-tab'); 

        let loginForm = document.querySelector('form.login');
        let registerForm = document.querySelector('form.registration');

        let registerInput = document.querySelectorAll('form.registration input');
        let loginInput = document.querySelectorAll('form.login input');

        loginTab.addEventListener('click', () => {
            registerForm.reset();
            registerInput.forEach( classNames => classNames.classList.remove('is-invalid'))
        })
        
        registerTab.addEventListener('click', () => {
            loginForm.reset();
            loginInput.forEach( classNames => classNames.classList.remove('is-invalid'))
        })
    },

    initPasswordPluginForRegistration: function () {
        if (typeof $.fn.pwstrength === "undefined") {
            methods.log("initPasswordPluginForRegistration: plugin missing.");
            return false;
        }

        var $target = $("#registration-form-password");
        if (!$target.length) {
            methods.log("initPasswordPluginForRegistration: target not found.");
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

    initiallPageLoadUpAccountVerification: function () {
        var url = window.location.href;
        var urlObj = new URL(url);
        var searchParams = urlObj.searchParams;
        if (searchParams.has('page')) {
            var page = searchParams.get('page');
            var message = searchParams.has('message') ? searchParams.get('message') : false;
            var link = searchParams.has('link') ? searchParams.get('link') : false;
            var linkName = searchParams.has('linkName') ? searchParams.get('linkName') : false;
            if (page === 'login') {
                $('#requestLoginModal').modal('show');
            }
            if (message && page === 'login') {
                $('.account-verification-notification.login').html(message);
            }
            if (link && linkName && page === 'login') {
                $('.account-verification-notification.login').html(`${message} <br/><a href='${link}'>${linkName}</a>`);
            }
        }
    },

    validatePassword: function () {
        $('#registration-form-password').keyup(function(e) {
            checkPasswordValidation("#registration-form-password");
        });
    }
};

