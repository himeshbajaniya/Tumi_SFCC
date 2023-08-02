'use strict';

var Locale = require('dw/util/Locale');
/**
 * Gets the device type of the current user.
 * @return {String} the device type (desktop, mobile or tablet)
 */
 function getDeviceType() {
    var deviceType = 'pc';
    var iPhoneDevice = 'iPhone';
    var iPadDevice = 'iPad';
    var androidDevice = 'Android'; //Mozilla/5.0 (Linux; U; Android 2.3.4; en-us; ADR6300 Build/GRJ22) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1

    var httpUserAgent = request.httpUserAgent;

    if (httpUserAgent.indexOf(iPhoneDevice) > -1) {
        deviceType = 'mobile';

    } else if (httpUserAgent.indexOf(androidDevice) > -1) {
        if (httpUserAgent.toLowerCase().indexOf('mobile') > -1) {
            deviceType = 'mobile';
        }
    } else if (httpUserAgent.indexOf(iPadDevice) > -1) {
        deviceType = 'tablet';
    }

    return deviceType;
}

/**
*Get Request IP Address
*/
function GetIPAddress() {
    var ipAddress = request.httpHeaders['x-is-remote_addr'];
    return ipAddress;
}
function getDomain() {
    var httpHost = request.httpHost;
    return  httpHost;
}
/**
 * Return country code from request
 * @return {string} return current locale country code
 */
function getCountry() {
    var currentLocale = Locale.getLocale(request.locale);
    var rfkCountry = currentLocale.country;
    return rfkCountry;
}
/**
 * Return language from request
 * @return {string} return current locale language code
 */
function getLanguage() {
    var rfkLanguage = '';
    var currentLocale = Locale.getLocale(request.locale);
    rfkLanguage = currentLocale.language;
    return rfkLanguage;
}

module.exports = {
    getLanguage: getLanguage,
    getCountry: getCountry,
    getDomain: getDomain,
    GetIPAddress: GetIPAddress,
    getDeviceType: getDeviceType
}