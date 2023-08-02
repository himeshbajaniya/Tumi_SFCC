'use strict';

/**
 * The onRequest hook is called with every top-level request in a site. This happens both for requests to cached and non-cached pages.
 * For performance reasons the hook function should be kept short.
 *
 * @module  request/OnRequest
 */

var Status = require('dw/system/Status');
var sessionHelper = require('*/cartridge/scripts/helpers/sessionHelpers');

/**
 * The onRequest hook function.
 */
exports.onRequest = function () {
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
