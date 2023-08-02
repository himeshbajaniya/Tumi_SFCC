'use strict';

/**
 * @namespace RedirectURL
 */

var server = require('server');
server.extend(module.superModule);
var rfkSitePreferences = require('*/cartridge/scripts/middleware/rfkSitePreferences');

/**
 * RedirectURL-Start : The RedirectURL-Start endpoint handles URL redirects
 * @name Base/RedirectURL-Start
 * @function
 * @memberof RedirectURL
 * @param {category} - non-sensitive
 * @param {serverfunction} - append
 */
server.append('Start', function (req, res, next) {
    next();
}, rfkSitePreferences.getRfkSitePreferences);

module.exports = server.exports();
