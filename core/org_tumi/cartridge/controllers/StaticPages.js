'use strict';

/**
 * @namespace Staticpage
 */

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * StaticPages-tumilock : This endpoint is called when a shopper navigates to the TumiLock page
 * @name StaticPages-tumilock
 * @function
 * @memberof TumiLock
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - cache.applyDefaultCache
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */

 server.get('tumilock', function (req, res, next) {
    res.render('staticpages/tumiLock');
    next();
});

/**
 * StaticPages-tumidifference : This endpoint is called when a shopper navigates to the Tumi Difference page
 * @name StaticPages-tumidifference
 * @function
 * @memberof Tumi Difference page
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - cache.applyDefaultCache
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */

server.get('tumidifference', function (req, res, next) {
    res.render('staticpages/tumidifference');
    next();
});

/**
 * StaticPages-customerservices : This endpoint is called when a shopper navigates to the Tumi Difference page
 * @name StaticPages-tumidifference
 * @function
 * @memberof Tumi Customer Services page
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - cache.applyDefaultCache
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */

 server.get('customerservices', function (req, res, next) {
    res.render('staticpages/customerservices');
    next();
});

module.exports = server.exports();