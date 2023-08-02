'use strict';

$(document).ready(function () {
    var creditCardItem = $('li[data-method-id="CREDIT_CARD"]');
    var CsSaType = $(creditCardItem).attr('data-sa-type');
    if (CsSaType === 'SA_FLEX' && $('#flextokenObj').length !== 0) {
        var jwk = JSON.parse($('#flextokenObj').val());
        var cardNumberplaceholder = $('#credit-card-content .cardNumber').attr('data-cardNumber');

        // SETUP MICROFORM
        // eslint-disable-next-line
        FLEX.microform(
            {
                keyId: jwk.kid,
                keystore: jwk,
                container: '#cardNumber-container',
                label: '#cardNumber',
                placeholder: cardNumberplaceholder,
                styles: {
                    input: {
                        'font-family': '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
                        'font-size': '15px',
                        'line-height': '20px',
                        'font-weight': '400',
                        color: '#1b1c1e'
                    },
                    ':focus': { color: '#1b1c1e' },
                    ':disabled': { cursor: 'not-allowed' },
                    valid: { color: '#3c763d' },
                    invalid: { color: '#a94442' }
                },
                encryptionType: 'rsaoaep256'
            },

            function (setupError, microformInstance) {
                if (setupError) {
                    // handle error
                    return;
                }
                var cardSecurityCode = document.querySelector('#securityCode');
                // update UI with the detected card info
                microformInstance.on('cardTypeChange', function (data) {
                    if (data.card.length === 1) {
                        var cardType = data.card[0].name;
                        var cybsCardType = data.card[0].cybsCardType;
                        $('.card-number-wrapper').attr('data-type', cardType);
                        $('#cardType').val(cybsCardType);
                        cardSecurityCode.setAttribute('minlength', data.card[0].code.length);
                        cardSecurityCode.setAttribute('maxlength', data.card[0].code.length);
                        cardSecurityCode.classList.remove('is-invalid');
                    } else {
                        $('.card-number-wrapper').attr('data-type', 'unknown');
                        $('#cardType').val('unknown');
                        $('#cardNumber').val('');
                    }
                    $('#cardNumber-container').removeClass('is-invalid');
                });

                /**
                 * function
                 * @returns {*} obj
                 */
                function flexTokenCreation() {
                    var expMonth = $('#expirationMonth').val();
                    var expYear = $('#expirationYear').val();
                    if (expMonth === '' || expYear === '') {
                        return false;
                    }

                    // Send in optional parameters from other parts of your payment form
                    var options = {
                        cardExpirationMonth: expMonth.length === 1 ? '0' + expMonth : expMonth,
                        cardExpirationYear: expYear.length === 2 ? '20' + expYear : expYear
                        // cardType: /* ... */
                    };
                    // validation
                    // look for field validation errors

                    // eslint-disable-next-line
                    microformInstance.createToken(options, function (err, response) {
                        // At this point the token may be added to the form
                        // as hidden fields and the submission continued
                        if (err) {
                            // eslint-disable-next-line
                            err.details.responseStatus.details.forEach(function (detail) {
                                if (detail.location === 'cardInfo.cardNumber') {
                                    var msg = '';
                                    if (detail.message === 'Invalid card number format') {
                                        msg = 'Please enter a valid card number';
                                    }
                                    if (detail.message === 'cardInfo.cardNumber is null') {
                                        msg = 'Please enter the card number';
                                    }
                                    if (msg) {
                                        $('.card-number-wrapper .invalid-feedback').text(msg);
                                        $('#cardNumber-container').addClass('is-invalid');
                                    }
                                }
                            });

                            if(err.details.responseStatus.message.indexOf('card is expired') > -1) {
                                var cardExpMsg = 'This Credit Card has expired';
                                $('.expirationMonth ~ .invalid-feedback, .expirationYear ~ .invalid-feedback').text(cardExpMsg);
                                $('.expirationMonth, .expirationYear').addClass('is-invalid');
                            }
                            if (err.details.responseStatus.status === 429 || err.details.responseStatus.status === 400) {
                                var locationObject = new URL(window.location.href);
                                locationObject.searchParams.append('error', 429);
                                $.spinner().stop();
                                window.location.replace(locationObject)
                            }
                            $.spinner().stop();
                            return true;
                        }
                        $('#flex-response').val(JSON.stringify(response));
                        var getFlexVal = JSON.parse($('#flex-response').val());
                        $('#cardNumber').val(getFlexVal.maskedPan);
                        $('#cardType').val(getFlexVal.cardType);
                        $('.submit-payment').trigger('click');
                    });
                    return true;
                }

                $('.payment-summary .edit-button').on('click', function () {
                    $('#flex-response').val('');
                });

                // intercept the form submission and make a tokenize request instead
                $('.submit-payment').on('click', function (event) {
                    if(!$('#cardNumber-container').hasClass('flex-microform-valid') && $('.payment-information').data('is-new-payment')) {
                        $('#cardNumber').val('');
                    }
                    var cvvEle = $('#securityCode');
                    if (cvvEle.hasClass('is-invalid')) {
                        return false;
                    }
                    if((cvvEle.val() !== "") && (cvvEle.val().length !== parseInt(cvvEle.attr('minlength')))) {
                        cvvEle.addClass('is-invalid').trigger('blur');
                        return false;
                    }
                    if ($('#fullName').val() !== '' && $('#expirationMonth').val() !== ''
                             && $('#expirationYear').val() !== ''
                             && $('#securityCode').val() !== ''
                             && $('#flex-response').val() === ''
                             && ($('.data-checkout-stage').data('customer-type') === 'guest'
                             || ($('.data-checkout-stage').data('customer-type') === 'registered'
                             && $('.payment-information').data('is-new-payment')))) {
                        flexTokenCreation();
                        event.stopImmediatePropagation();
                    }
                });
            }
        );
    }
});
