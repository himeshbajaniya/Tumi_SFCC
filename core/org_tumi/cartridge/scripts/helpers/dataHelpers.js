'use strict';

/**
 * @description create array of selected enum values
 * @param {Object} enumValues - enum of strings
 * @return {Array} array of enum values
 */
function getEnumValues(enumValues) {
    var enumArray = [];
    if (enumValues) {
        try {
            enumValues.forEach(function (enumValue) {
                if (enumValue.value && enumValue.displayValue) {
                    enumArray.push({
                        value: enumValue.value,
                        displayValue: enumValue.displayValue
                    });
                }
            });
        } catch (ex) {
            enumArray = [];
        }
    }
    return enumArray;
}

function getfeatures(strValue) {
    var featureArray = [];
    if (strValue) {
        try {
            featureArray = strValue.split(',');
        } catch (ex) {
            featureArray = [];
        }
    }
    return featureArray;
}

/**
 * @description create array of set of string values
 * @param {Object} setOfStringValues - set of strings
 * @return {Array} array of set of strings
 */
function getSetOfStringValues(setOfStringValues) {
    var setOfStringArray = [];
    if (setOfStringValues) {
        try {
            setOfStringValues.forEach(function (setOfStringValue) {
                setOfStringArray.push(setOfStringValue);
            });
        } catch (ex) {
            setOfStringArray = [];
        }
    }
    return setOfStringArray;
}

/**
 * @description pad string values
 * @param {string} value - the value to pad
 * @param {number} length - the length of the final string
 * @param {string} padValue - the pad value to use ('0' or '*', etc)
 * @return {string} the padded string
 */
function padString(value, length, padValue) {
    if (!padValue) padValue = '0'; // eslint-disable-line no-param-reassign
    if (!value) value = ''; // eslint-disable-line no-param-reassign
    return (value.toString().length < length) ? padString(padValue + value, length, padValue) : value;
}

/**
 * Returns set of string site preference as an array
 * @param {string} sitePrefID - site preference id to get
 * @returns {Array} site preference values as an array
 */
function getSetOfStringSitePreference(sitePrefID) {
    var Site = require('dw/system/Site');
    if (!sitePrefID) return [];
    var currentSite = Site.getCurrent();
    return Object.hasOwnProperty.call(currentSite.preferences.custom, sitePrefID) && currentSite.getCustomPreferenceValue(sitePrefID).length > 0 ? getSetOfStringValues(currentSite.getCustomPreferenceValue(sitePrefID)) : [];
}

module.exports = {
    getEnumValues: getEnumValues,
    getfeatures: getfeatures,
    getSetOfStringValues: getSetOfStringValues,
    padString: padString,
    getSetOfStringSitePreference: getSetOfStringSitePreference
};
