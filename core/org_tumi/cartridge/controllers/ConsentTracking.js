'use strict';

/**
 * @namespace ConsentTracking
 */

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * ConsentTracking-Check : This endpoint is called every time a storefront page is rendered
 * @name Base/ConsentTracking-Check
 * @function
 * @memberof ConsentTracking
 * @param {middleware} - consentTracking.consent
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('Check', consentTracking.consent, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var content = ContentMgr.getContent('tracking_hint');
    if (content) {
        res.render('/common/consent', {
            consentApi: Object.prototype.hasOwnProperty.call(req.session.raw, 'setTrackingAllowed'),
            caOnline: content.online
        });
    } else {
        res.render('/common/consent', {
            consentApi: Object.prototype.hasOwnProperty.call(req.session.raw, 'setTrackingAllowed')
        });
    }
    next();
});

module.exports = server.exports();
