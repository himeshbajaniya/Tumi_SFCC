'use strict';
/* globals session */

/**
 * This module can be used to provide a set of validation methods for addresses
 */

/**
 * checks for a match of country code in the form country list
 * @param {dw.web.FormFieldOptions} countryOptions - form field options for country
 * @param {string} countryCode - the country code to match
 * @returns {boolean} if the provided country was found in the form field options
 */
function foundCountryMatch(countryOptions, countryCode) {
    var foundMatch = false;
    if (!countryOptions) return foundMatch;

    Object.keys(countryOptions).forEach(function (key) {
        var countryOption = countryOptions[key];
        if (countryOption.value && countryOption.value.trim() !== '' && countryCode.equalsIgnoreCase(countryOption.value)) {
            foundMatch = true;
            return;
        }
    });

    return foundMatch;
}

/**
 * sets state settings from countries.json object
 * @param {Object} addressDetails - the address details for a specific country code
 * @returns {Object} the state settings
 */
function getStateSettings(addressDetails) {
    var stateRequired = false;
    var stateOptions = null;

    if (addressDetails && Object.hasOwnProperty.call(addressDetails, 'states') && addressDetails.states.length === 1) {
        var stateSettings = addressDetails.states[0];
        if (stateSettings.mandatory) {
            stateRequired = true;
        }
        if (Object.hasOwnProperty.call(stateSettings, 'type') && stateSettings.type === 'select' && Object.hasOwnProperty.call(stateSettings, 'stateCodeOptions')) {
            stateOptions = stateSettings.stateCodeOptions;
        }
    }

    return {
        stateRequired: stateRequired,
        stateOptions: stateOptions
    };
}

/**
 * RegExp to parse Address form Name fields
 * Only printable characters
 * @returns {string} regEx string
 */
function getAddressFormNameRegExp() {
    return /^[\x20-\x7E]+$/;
}

/**
 * RegExp to parse Address form Address1 and Address2 fields
 * Only printable characters
 * @returns {string} regEx string
 */
function getAddressFormAddressRegExp() {
    return /^[\x20-\x7E]+$/;
}

module.exports = {
    /**
     * A validation rule to check to make sure
     * a provided shipping address is a valid one.
     * This will also check to ensure that the country is accepted
     * @param {dw.order.OrderAddress} address - current order address (billingAddress or shippingAddress)
     * @param {Array} ignoreFields - any array of fields to ignore if not supplied
     * @returns {Array} an array of error messages of invalid fields
     */
    shippingAddress: function (address, ignoreFields) {
        var Resource = require('dw/web/Resource');

        var errors = [];
        var countrySettings = null;
        var addressDetails = null;

        if (!address) {
            errors.push(this.escapeMessage(Resource.msg('form.error.invalidShippingAddress', 'checkout', null)));
            return errors;
        }

        var countryCode = address.countryCode;
        if (Object.hasOwnProperty.call(countryCode, 'value')) {
            countryCode = countryCode.value;
        }

        if (!ignoreFields) {
            ignoreFields = []; // eslint-disable-line no-param-reassign
        }

        var stateSettings = getStateSettings(addressDetails);
        var stateRequired = stateSettings.stateRequired;
        var stateOptions = stateSettings.stateOptions;
        if (ignoreFields.indexOf('stateCode') === -1) {
            if (!address.stateCode && stateRequired) {
                errors.push(this.escapeMessage(Resource.msg('address.state.missing', 'forms', null)));
            } else if (stateOptions && address.stateCode && !this.isStateValid(stateOptions, address.stateCode)) {
                errors.push(this.escapeMessage(Resource.msgf('form.error.invalidShippingStateCode', 'checkout', null, address.stateCode)));
            }
        }

        var nameRegExp = getAddressFormNameRegExp();
        var addressRegExp = getAddressFormAddressRegExp();
        
        if (ignoreFields.indexOf('firstName') === -1) {
            if (!address.firstName) {
                errors.push(this.escapeMessage(Resource.msg('address.firstname.missing', 'forms', null)));
            }
            if (address.firstName && !nameRegExp.test(address.firstName)) {
                errors.push(this.escapeMessage(Resource.msg('error.message.parse.specialchar', 'forms', null)));
            }
        }

        if (ignoreFields.indexOf('lastName') === -1) {
            if (!address.lastName) {
                errors.push(this.escapeMessage(Resource.msg('address.lastname.missing', 'forms', null)));
            }
            if (address.lastName && !nameRegExp.test(address.lastName)) {
                errors.push(this.escapeMessage(Resource.msg('error.message.parse.specialchar', 'forms', null)));
            }
        }

        if (ignoreFields.indexOf('address1') === -1) {
            if (!address.address1) {
                errors.push(this.escapeMessage(Resource.msg('address.address1.missing', 'forms', null)));
            }
            if (address.address1 && address.address1.length > 35) {
                errors.push(this.escapeMessage(Resource.msg('error.message.35orless', 'forms', null)));
            }
            if (address.address1 && !addressRegExp.test(address.address1)) {
                errors.push(this.escapeMessage(Resource.msg('error.message.parse.specialchar', 'forms', null)));
            }
        }

        if (ignoreFields.indexOf('address2') === -1) {
            if (address.address2 && address.address2.length > 35) {
                errors.push(this.escapeMessage(Resource.msg('message.error.address.linetolong', 'error', null)));
            }
            if (address.address2 && !addressRegExp.test(address.address2)) {
                errors.push(this.escapeMessage(Resource.msg('error.message.parse.specialchar', 'forms', null)));
            }
        }

        if (ignoreFields.indexOf('postalCode') === -1 && (!address.postalCode || !(address.postalCode.length === 5 || address.postalCode.length === 10))) {
            errors.push(this.escapeMessage(Resource.msg('address.postalCode.missing', 'forms', null)));
        }

        if (ignoreFields.indexOf('phone') === -1 && !address.phone) {
            errors.push(this.escapeMessage(Resource.msg('address.phone.missing', 'forms', null)));
        }

        if (ignoreFields.indexOf('city') === -1 && (!address.city || !addressRegExp.test(address.city))) {
            errors.push(this.escapeMessage(Resource.msg('address.city.missing', 'forms', null)));
        }

        return errors;
    },

    /**
     * A validation rule to check to make sure
     * a provided billing address is a valid one.
     * This will also check to ensure that the country is accepted
     * @param {dw.order.OrderAddress} address - current order address (billingAddress or shippingAddress)
     * @param {Array} ignoreFields - any array of fields to ignore if not supplied
     * @returns {Array} an array of error messages of invalid fields
     */
    billingAddress: function (address, ignoreFields) {
        var Resource = require('dw/web/Resource');

        var errors = [];
        var countrySettings = null;
        var addressDetails = null;

        if (!address) {
            errors.push(this.escapeMessage(Resource.msg('form.error.invalidBillingAddress', 'checkout', null)));
            return errors;
        }

        var countryCode = address.countryCode;
        if (Object.hasOwnProperty.call(countryCode, 'value')) {
            countryCode = countryCode.value;
        }

        if (!ignoreFields) {
            ignoreFields = []; // eslint-disable-line no-param-reassign
        }

        var stateSettings = getStateSettings(addressDetails);
        var stateRequired = stateSettings.stateRequired;
        var stateOptions = stateSettings.stateOptions;
        if (ignoreFields.indexOf('stateCode') === -1) {
            if (!address.stateCode && stateRequired) {
                errors.push(this.escapeMessage(Resource.msg('address.state.missing', 'forms', null)));
            } else if (stateOptions && address.stateCode && !this.isStateValid(stateOptions, address.stateCode)) {
                errors.push(this.escapeMessage(Resource.msgf('form.error.invalidBillingStateCode', 'checkout', null, address.stateCode)));
            }
        }

        var nameRegExp = getAddressFormNameRegExp();
        var addressRegExp = getAddressFormAddressRegExp();

        if (ignoreFields.indexOf('firstName') === -1) {
            if (!address.firstName) {
                errors.push(this.escapeMessage(Resource.msg('address.firstname.missing', 'forms', null)));
            }
            if (address.firstName && !nameRegExp.test(address.firstName)) {
                errors.push(this.escapeMessage(Resource.msg('error.message.parse.specialchar', 'forms', null)));
            }
        }

        if (ignoreFields.indexOf('lastName') === -1) {
            if (!address.lastName) {
                errors.push(this.escapeMessage(Resource.msg('address.lastname.missing', 'forms', null)));
            }
            if (address.lastName && !nameRegExp.test(address.lastName)) {
                errors.push(this.escapeMessage(Resource.msg('error.message.parse.specialchar', 'forms', null)));
            }
        }

        if (ignoreFields.indexOf('address1') === -1) {
            if (!address.address1) {
                errors.push(this.escapeMessage(Resource.msg('address.address1.missing', 'forms', null)));
            }
            if (address.address1 && address.address1.length > 35) {
                errors.push(this.escapeMessage(Resource.msg('message.error.address.linetolong', 'error', null)));
            }
            if (address.address1 && !addressRegExp.test(address.address1)) {
                errors.push(this.escapeMessage(Resource.msg('error.message.parse.specialchar', 'forms', null)));
            }
        }

        if (ignoreFields.indexOf('address2') === -1) {
            if (address.address2 && address.address2.length > 35) {
                errors.push(this.escapeMessage(Resource.msg('message.error.address.linetolong', 'error', null)));
            }
            if (address.address2 && !addressRegExp.test(address.address2)) {
                errors.push(this.escapeMessage(Resource.msg('error.message.parse.specialchar', 'forms', null)));
            }
        }

        if (ignoreFields.indexOf('postalCode') === -1 && !address.postalCode) {
            errors.push(this.escapeMessage(Resource.msg('address.postalCode.missing', 'forms', null)));
        }

        if (ignoreFields.indexOf('phone') === -1 && !address.phone) {
            errors.push(this.escapeMessage(Resource.msg('address.phone.missing', 'forms', null)));
        }

        return errors;
    },

    /**
     * check to make sure country is valid
     * @param {string} countryCode - the current country code
     * @param {string} addressType - 'shipping' or 'billing'
     * @returns {boolean} returns true if country code is a valid country code for the provided addressType
     */
    isCountryValid: function (countryCode, addressType) {
        if (!addressType || !countryCode) return false;
        var countryOptions = null;

        if (addressType === 'shipping') {
            countryOptions = session.forms.shipping.shippingAddress.addressFields.country.getOptions();
        } else if (addressType === 'billing') {
            countryOptions = session.forms.billing.addressFields.country.getOptions();
        } else if (addressType === 'account') {
            countryOptions = session.forms.address.country.getOptions();
        }

        return foundCountryMatch(countryOptions, countryCode);
    },

    /**
     * check to make sure state is valid
     * @param {Object} options - the state code options
     * @param {string} formStateCode - the state selected on the form
     * @returns {boolean} returns true if this is a valid state code
     */
    isStateValid: function (options, formStateCode) {
        if (options && formStateCode) {
            return Object.keys(options).some(function (stateCode) {
                var label = Object.hasOwnProperty.call(options, stateCode) ? options[stateCode] : '';
                return formStateCode.equalsIgnoreCase(stateCode) || formStateCode.equalsIgnoreCase(label);
            });
        }

        return false;
    },

    escapeMessage: function (value) {
        return value.replace(/'/g, '\\\'');
    }
};
