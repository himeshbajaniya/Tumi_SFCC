'use strict';

/**
 * The onSession hook is called for every new session in a site. This hook can be used for initializations,
 * like to prepare promotions or pricebooks based on source codes or affiliate information in
 * the initial URL. For performance reasons the hook function should be kept short.
 *
 * @module  request/OnSession
 */

var Status = require('dw/system/Status');
var sessionHelper = require('*/cartridge/scripts/helpers/sessionHelpers');

/**
 * The onSession hook function.
 */
exports.onSession = function () {
    session.custom.sessionID = request.session.sessionID;
    session.custom.ipAddress = sessionHelper.GetIPAddress();
    session.custom.device = sessionHelper.getDeviceType();
    var language = sessionHelper.getLanguage();
    session.custom.rfkLanguage = language;
    var country = sessionHelper.getCountry();
    session.custom.rfkCountry = country;
    var domain = sessionHelper.getDomain();
    session.custom.rfkDomain = domain;
    var rfkCurrency = session.currency.currencyCode;
    session.custom.rfkCurrency = rfkCurrency;
    var uri = request.httpPath;
    session.custom.rfkUri = uri;
    return new Status(Status.OK);
};
