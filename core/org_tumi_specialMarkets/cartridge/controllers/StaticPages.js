'use strict';

/**
 * @namespace Staticpage
 */

var server = require('server');
server.extend(module.superModule);
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

 server.append('tumilock', function (req, res, next) {
    res.render('staticpages/tumiLock');
    next();
});

/**
 * StaticPages-customize : This endpoint is called when a shopper navigates to the TumiLock page
 * @name StaticPages-customize
 * @function
 * @memberof TumiLock
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - cache.applyDefaultCache
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */

server.get('customize', function (req, res, next) {
    res.render('staticpages/customize');
    next();
});

module.exports = server.exports();