'use strict';

/**
 * Validate whole form. Requires `this` to be set to form object
 * @param {jQuery.event} event - Event to be canceled if form is invalid.
 * @returns {boolean} - Flag to indicate if form is valid
 */
function validateForm(event) {
    var valid = true;
    if (this.checkValidity && !this.checkValidity()) {
        // safari
        valid = false;
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
        $(this).find('input, select').each(function () {
            if (!this.validity.valid) {
                $(this).trigger('invalid', this.validity);
            }
        });
    }
    return valid;
}

/**
 * Remove all validation. Should be called every time before revalidating form
 * @param {element} form - Form to be cleared
 * @returns {void}
 */
function clearForm(form) {
    $(form).find('.form-control.is-invalid').removeClass('is-invalid');
}

function validatePhone(e) {
    var currEle = $(this);
    setTimeout(function () {
        var temp = currEle.val().replace(/[a-zA-Z .\-()]/g, '').slice(0, 10);
        if (temp.length > 6) {
            currEle.val(temp.slice(0, 3) + '-' + temp.slice(3, 6) + '-' + temp.slice(6));
        } else if (temp.length > 3) {
            currEle.val(temp.slice(0, 3) + '-' + temp.slice(3, 6));
        } else {
            currEle.val(temp).focus();
        }
        validateForm.call(this, e);
    }, 500);
}

module.exports = {
    invalid: function () {
        $('form input, form select').on('invalid', function (e) {
            e.preventDefault();
            this.setCustomValidity('');
            if (!this.validity.valid) {
                var validationMessage = this.validationMessage;
                $(this).addClass('is-invalid');
                if (this.validity.patternMismatch && $(this).data('pattern-mismatch')) {
                    validationMessage = $(this).data('pattern-mismatch');
                }
                if ((this.validity.rangeOverflow || this.validity.rangeUnderflow)
                    && $(this).data('range-error')) {
                    validationMessage = $(this).data('range-error');
                }
                if ((this.validity.tooLong || this.validity.tooShort)
                    && $(this).data('range-error')) {
                    validationMessage = $(this).data('range-error');
                }
                if (this.validity.valueMissing && $(this).data('missing-error')) {
                    validationMessage = $(this).data('missing-error');
                }
                $(this).parents('.form-group').find('.invalid-feedback')
                    .text(validationMessage);
            }
        });
    },

    submit: function () {
        $('form').on('submit', function (e) {
            return validateForm.call(this, e);
        });
    },

    buttonClick: function () {
        $('form button[type="submit"], form input[type="submit"]').on('click', function () {
            // clear all errors when trying to submit the form
            clearForm($(this).parents('form'));
        });
    },

    onBlur: function () {
        $('form input[type="text"]:not([name*="_phone"]), form input[type="email"], form input[type="password"], form select').on('blur', function (e) {
            $(this).removeClass('is-invalid');
            return validateForm.call(this, e);
        });

        $('form [name*="_phone"]').on('blur', function (e) {
            $(this).removeClass('is-invalid');
            var currEle = $(this);
            if (currEle.val() != '') {
                validatePhone.call(this, e)
            } else {
                return validateForm.call(this, e);
            }
        });
    },

    keyPress: function () {
        $('[name*="_phone"]').on('keydown', function (e) {
            var key = e.charCode || e.keyCode || 0;
            var $text = $(this);
            if (key !== 8 && key !== 9) {
                if ($text.val().length === 3) {
                    $text.val($text.val() + '-');
                }
                if ($text.val().length === 7) {
                    $text.val($text.val() + '-');
                }
            }
            if (e.shiftKey) {
                key = 106;
            }
            return (key === 8 || key === 9 || key === 46 || (key >= 48 && key <= 57) || (key >= 96 && key <= 105) || key === 86);
        });

        $('[name*="_phone"]').on('change paste', function () {
            var currEle = $(this);
            setTimeout(function () {
                var temp = currEle.val().replace(/[a-zA-Z .\-()]/g, '').slice(0, 10);
                if (temp.length > 6) {
                    currEle.val(temp.slice(0, 3) + '-' + temp.slice(3, 6) + '-' + temp.slice(6));
                } else if (temp.length > 3) {
                    currEle.val(temp.slice(0, 3) + '-' + temp.slice(3, 6));
                } else {
                    currEle.val(temp).focus();
                }
            }, 500);
        });

        $('#birthday').on('keydown', function (e) {
            var key = e.charCode || e.keyCode || 0;
            var $text = $(this);
            if (key !== 8 && key !== 9) {
                if ($text.val().length === 2) {
                    $text.val($text.val() + '/');
                }
            }
            if (e.shiftKey) {
                key = 106;
            }
            return (key === 8 || key === 9 || key === 46 || (key >= 48 && key <= 57) || (key >= 96 && key <= 105));
        });

        var newInput = document.getElementById("inquiry-date");
        if(newInput) {
            newInput.addEventListener('keydown', function (e) {
                if (e.which !== 8) {
                    var numChars = e.target.value.length;
                    if (numChars === 2 || numChars === 5) {
                        var thisVal = e.target.value;
                        thisVal += '/';
                            e.target.value = thisVal;
                    }
                }
            });
        }

        $('#securityCode').on('keypress', function (evt) {
            var charCode = (evt.which) ? evt.which : evt.keyCode;
            if (charCode == 46 || charCode > 31 && (charCode < 48 || charCode > 57)) {
                evt.preventDefault();
                return false;
            }
            return true;
        });
    },

    functions: {
        validateForm: function (form, event) {
            validateForm.call($(form), event || null);
        },
        clearForm: clearForm
    }
};
