'use strict';

/**
 * @description create Subscription
 * @returns {void}
 */

module.exports = {
    createSubscription: function () {
        $(document).ready(function () {
            /**
             * @description Handles the result of the subscription call
             * @param {Object} response, result of the subscription call
             */
            function handleSubscriptionResponse(response) {
                if (response && response.success) {
                    switch (response.accountStatus) {
                        case 'accountexists':
                        	$('.email-subscription-response').empty().html('<p class="error">'+ window.EmarsysResources.alreadyRegistered +'</p>');
                            break;
                        case 'accountcreated':
                            $('#email-alert-address').parent().addClass('d-none');
                            $('.email-subscription-response').empty().html(window.EmarsysResources.thankYouWeWillBeInTouch);
                            break;
                        case 'submitted':
                        	$('.email-subscription-response').empty().html(window.EmarsysResources.dataSubmitted);
                            break;
                        case 'error':
                        	$('.email-subscription-response').empty().html('<p class="error">'+ window.EmarsysResources.error +'</p>');
                            break;
                        case 'disabled':
                        	$('.email-subscription-response').empty().html(window.EmarsysResources.thanksForSubscribing);
                            break;
                        case 'signup':
                            window.location.href = EmarsysUrls.emarsysSignup;
                            break;
                        default:
                            break;
                    }
                } else {
                    window.location.href = EmarsysUrls.errorPage;
                }
            }

            /**
             * @description Does a subscription call
             * @param {Strin} email , subscriber email
             */
            function sendSubscriptionRequest(email) {
                $.ajax({
                    type: 'POST',
                    url: EmarsysUrls.footerSubscription,
                    data: { emailAddress: email, formatajax: true },
                    success: function (response) {
                        if (response.invalidemail) {
                            $('.email-subscription-response').empty().html('<p class="error">'+ window.EmarsysResources.invalidFormat + '</p>');
                        } else if (response.subscriptionDisabled) {
                            $('.email-subscription-response').empty().html('<p class="error">'+window.EmarsysResources.disabled+ '</p>');
                        } else {
                            handleSubscriptionResponse(response);
                        }
                    },
                    error: function () {
                        $('.email-subscription-response').empty().html('<p class="error">'+ window.EmarsysResources.invalidFormat + '</p>');
                    }
                });
            }

            $('#emarsys-newsletter-subscription button').on('click', function (e) {
                e.preventDefault();
                if ($('.isEmarsysEnabled').val() === 'true') {
                    var email = $('#emarsys-newsletter-subscription #email-alert-address').val();
                    if (email.length > 0) {
                        sendSubscriptionRequest(email);
                    } else {
                        $('.email-subscription-response').empty().html('<p class="error">'+ window.EmarsysResources.invalidFormat + '</p>');
                    }
                } else {
                    $('.email-subscription-response').empty().html('<p class="error">'+window.EmarsysResources.disabled+ '</p>');
                }
            });

            // Add a checkbox for privacy policy if Emarsys is enabled
            if (window.EmarsysPreferences.enabled && window.EmarsysPreferences.enabled !== false) {
                var elementBefore = '<input type="checkbox" class="input-checkbox privacy-checkbox" value="false" /> ' + window.EmarsysResources.privacyBeforeLink + ' ';
                var elementAfter = ' ' + window.EmarsysResources.privacyAfterLink;

                $('a.privacy-policy').parent().prepend(elementBefore).append(elementAfter);

                $('#dwfrm_billing').on('submit', function (event) {
                    if ($(this).find('input.privacy-checkbox').prop('checked') === false) {
                        event.preventDefault();
                        $('input.privacy-checkbox').parent().addClass('error-privacy');
                    } else {
                        $('input.privacy-checkbox').parent().removeClass('error-privacy');
                    }
                });
                $('#account_subscribe').on('click', function (event) {
                    event.preventDefault();
                    $('.email-signup-wrapper').slideDown(800);
                });
            }
        });
    }
};
