'use strict';

var base = module.superModule;

/**
 *
 * @param {object} querystring - target end pint
 * @returns {string} customerLoginResult
 */
function getJanRainRedirectURL(querystring) {
    var URLUtils = require('dw/web/URLUtils');
    var URLParameter = require('dw/web/URLParameter');
    var URLAction = require('dw/web/URLAction');

    var returnType = querystring.rurl || 1;
    var jainRainendpoints = {
        1: 'Home-Show',
        2: 'Product-Show',
        3: 'Checkout-Begin',
        4: 'Cart-Show',
        5: 'Page-Show',
        6: 'Search-Show',
        7: 'Tracer-Show',
        8: 'Page-ShowServiceAndRepairs'
    };
    var targetEndpoint = '';
    if (returnType) {
        targetEndpoint = jainRainendpoints[returnType];
    }

    var params = [];
    switch (targetEndpoint) {
        case 'Product-Show':
            params.push(new URLParameter('pid', querystring.pid));
            break;
        case 'Page-Show':
            params.push(new URLParameter('cid', querystring.cid));
            break;
        case 'Search-Show':
            params.push(new URLParameter('cgid', querystring.cgid));
            break;
        case 'Tracer-Show':
            var tracerID = querystring.tracerID;
            if (tracerID) {
                params.push(new URLParameter('tracerID', tracerID));
            }
            break;
        case 'Page-ShowServiceAndRepairs':
            var from = querystring.from;
            if (from) {
                params.push(new URLParameter('from', from));
            }
            break;
        default:
            break;
    }

    return URLUtils.url(new URLAction(targetEndpoint), params).toString();
}

/**
 *
 * @param {string} param - target end pint
 * @returns {Object} LoginAuthResult
 */
function getLoginAuthService(param) {
    var LoginAuthServiceInit = require('*/cartridge/scripts/service/LoginAuthServiceInit.js');
    return LoginAuthServiceInit.LoginAuthService(param).call();
}

/**
 *
 * @param {Object} params params
 * @returns {string} return url
 */
function getJanrainReturnUrl(params, returnType) {
    var URLAction = require('dw/web/URLAction');
    var URLUtils = require('dw/web/URLUtils');
    var URLParameter = require('dw/web/URLParameter');
    var action = new URLAction('JanrainLogin-JanrainOAuthReentry');
    if(params == null){
        params = [];
        params.push(new URLParameter('rurl', returnType));
    }
    return URLUtils.https(action, params).toString();
}

/**
 * Gets the password reset token of a customer
 * @param {Object} customer - the customer requesting password reset token
 * @returns {string} password reset token string
 */
function getPasswordResetToken(customer) {
    var Transaction = require('dw/system/Transaction');

    var passwordResetToken;
    Transaction.wrap(function () {
        passwordResetToken = customer.profile.credentials.createResetPasswordToken();
    });
    return passwordResetToken;
}

module.exports = {
    getLoginRedirectURL: base.getLoginRedirectURL,
    sendCreateAccountEmail: base.sendCreateAccountEmail,
    sendPasswordResetEmail: base.sendPasswordResetEmail,
    sendAccountEditedEmail: base.sendAccountEditedEmail,
    loginCustomer: base.loginCustomer,
    getJanRainRedirectURL: getJanRainRedirectURL,
    getLoginAuthService: getLoginAuthService,
    getPasswordResetToken: getPasswordResetToken,
    getJanrainReturnUrl: getJanrainReturnUrl
};
