'use strict';

var server = require('server');
server.post('JanrainOAuthReentry', server.middleware.https, function (req, res, next) {
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
    var URLUtils = require('dw/web/URLUtils');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var destination = URLUtils.https('Home-Show');
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
    if (credentials.isEnabled()) {
        Transaction.wrap(function () {
            CustomerMgr.loginExternallyAuthenticatedCustomer(providerId, userId, false);
        });
    } else {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }
    req.session.privacyCache.clear();
    res.redirect(destination);
    return next();
});
module.exports = server.exports();
