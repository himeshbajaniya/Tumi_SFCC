'use strict';

/**
 * @namespace Page
 */

var server = require('server');
server.extend(module.superModule);

/**
 * StaticPages-service and repair : This endpoint is called when a shopper navigates to the service and repair page
 * @name StaticPages- Service and Repair
 * @function
 * @param {renders} - isml
 */

server.get('ShowServiceAndRepairs', function (req, res, next) {
    var URLParameter = require('dw/web/URLParameter');
    var from = req.querystring.from;
    // Janrain redirect
    var returnParams = [];
    returnParams.push(new URLParameter('rurl', '8'));
    if (from) {
        returnParams.push(new URLParameter('from', from));
    }
    var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');
    var janrainrUrlData =  accountHelper.getJanrainReturnUrl(returnParams, 0);
    // Janrain redirect

    res.render('staticpages/serviceandrepairs', {
        isFromFooter: req.querystring.from === 'footer',
        janrainrUrlData: janrainrUrlData
    });
    next();
});

server.append('Show', function (req, res, next) {
    var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');
    var URLParameter = require('dw/web/URLParameter');

    var returnParams = [];
    returnParams.push(new URLParameter('rurl', '5'));
    returnParams.push(new URLParameter('cid', req.querystring.cid));
    var janrainrUrlData =  accountHelper.getJanrainReturnUrl(returnParams, 0);
    var viewData = res.getViewData();
    if(viewData) {
        viewData.janrainrUrlData = janrainrUrlData
        res.setViewData(viewData)
    }
    next();
});

server.get('ShowServiceAndRepairsUserDetails', function (req, res, next) {
    var Site = require('dw/system/Site');
    var sitePrefs = Site.getCurrent().getPreferences();
    var repairsAndServicesDetails = {
        requestRepairURL: sitePrefs.custom.requestARepairURL,
        checkRepairSatusURL: sitePrefs.custom.checkRepairStatusURL,
        repairSecretKey: sitePrefs.custom.repairSecretKey
    }
    res.render('staticpages/serviceandrepairscustomerdetails', {
        isRegisterCustomer: req.currentCustomer.raw.registered && req.currentCustomer.raw.authenticated,
        name: req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null,
        repairsAndServicesDetails: repairsAndServicesDetails
    });
    next();
});

module.exports = server.exports();
