'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('JanrainOAuthReentry', function (req, res, next) {
    var viewData = res.getViewData();
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var janrainloginservice = require('*/cartridge/scripts/janrainLoginService');
    var token = req.querystring.token;
    var JanrainAuthInfoService = janrainloginservice.JanrainAuthInfoService;
    var apiKey = JanrainAuthInfoService.configuration.credential.user;
    var requestContainer = { token: token, apiKey: apiKey };
    var serviceResult = JanrainAuthInfoService.call(requestContainer);
    var jsonparse = JSON.parse(serviceResult.object);
    var providerId = jsonparse.profile.providerName;
    var userId = jsonparse.profile.provider_id;
    var externalProfile = jsonparse.profile;
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var querystring = req.querystring;
    var destination = accountHelpers.getJanRainRedirectURL(querystring);
    var authenticatedCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(
        providerId,
        userId
    );
    if (!authenticatedCustomerProfile) {
        // Create new profile
        Transaction.wrap(function () {
            var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(
                providerId,
                userId
            );

            authenticatedCustomerProfile = newCustomer.getProfile();
            var firstName;
            var lastName;
            var email;

            // Google comes with a 'name' property that holds first and last name.
            if (typeof externalProfile.name === 'object') {
                firstName = externalProfile.name.givenName;
                lastName = externalProfile.name.familyName;
            } else {
                // The other providers use one of these, GitHub has just a 'name'.
                firstName = externalProfile['first-name']
                    || externalProfile.first_name
                    || externalProfile.name;

                lastName = externalProfile['last-name']
                    || externalProfile.last_name
                    || externalProfile.name;
            }

            email = externalProfile['email-address'] || externalProfile.email;

            if (!email) {
                var emails = externalProfile.emails;

                if (emails && emails.length) {
                    email = externalProfile.emails[0].value;
                }
            }

            authenticatedCustomerProfile.setFirstName(firstName);
            authenticatedCustomerProfile.setLastName(lastName);
            authenticatedCustomerProfile.setEmail(email);
        });
    }

    var credentials = authenticatedCustomerProfile.getCredentials();
    var customerLoginResult;
    if (credentials.isEnabled()) {
        Transaction.wrap(function () {
            customerLoginResult = CustomerMgr.loginExternallyAuthenticatedCustomer(providerId, userId, false);
        });
    } else {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }
    if (customerLoginResult) {
        var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
        productHelper.mergeBasket();
    }

    req.session.privacyCache.clear();
    res.redirect(destination);
    res.setViewData(viewData);
    return next();
});
module.exports = server.exports();
