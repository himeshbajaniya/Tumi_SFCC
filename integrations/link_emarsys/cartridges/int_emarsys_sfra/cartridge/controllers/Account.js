'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('PasswordResetDialogForm', function (req, res, next) {
    var viewData = res.getViewData();
    var assign = require('modules/server/assign');
    var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    if (viewData.success === true && isEmarsysEnable) {
        var sfccEventName = 'FORGOT_PASSWORD_SUBMITTED_TESTING';
        var email = req.form.loginEmail;
        eventsHelper.processEventTriggering(sfccEventName, assign, { email: email });
    }
    next();
});

server.append('SubmitRegistration', function (req, res, next) {
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    if (isEmarsysEnable) {
        var registrationForm = server.forms.getForm('profile');
        if (registrationForm.valid) {
            this.on('route:Complete', function (req, res) { // eslint-disable-line no-shadow
                var Transaction = require('dw/system/Transaction');
                var CustomerMgr = require('dw/customer/CustomerMgr');
                var emarsysHelper = require('*/cartridge/scripts/helpers/emarsysSFRAHelper');
                var registrationFormObj = res.getViewData();
                if (registrationFormObj.validForm) {
                    var login = registrationForm.customer.email.value;
                    var password = registrationForm.login.password.value;
                    try {
                        Transaction.wrap(function () {
                            var error = {};
                            var authenticatedCustomer;

                            var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
                            if (authenticateCustomerResult.status !== 'AUTH_OK') {
                                error = { authError: true, status: authenticateCustomerResult.status };
                                throw error;
                            }

                            authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);
                            if (authenticatedCustomer) {
                                emarsysHelper.accountSubscription(res, registrationFormObj, false);
                            }
                        });
                    } catch (e) {
                        throw e;
                    }
                }
            });
        }
    }
    next();
});

server.append('SaveProfile', function (req, res, next) {
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    if (isEmarsysEnable) {
        var profileForm = server.forms.getForm('profile');
        if (profileForm.valid) {
            this.on('route:Complete', function (req, res) { // eslint-disable-line no-shadow
                var Transaction = require('dw/system/Transaction');
                var CustomerMgr = require('dw/customer/CustomerMgr');
                var emarsysHelper = require('*/cartridge/scripts/helpers/emarsysSFRAHelper');
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var profile = customer.getProfile();
                var customerLogin;
                var status;

                formInfo.email = profileForm.customer.email.value;
                formInfo.password = profileForm.login.password.value;

                Transaction.wrap(function () {
                    status = profile.credentials.setPassword(
                        formInfo.password,
                        formInfo.password,
                        true
                    );

                    if (status.error) {
                        formInfo.profileForm.login.password.valid = false;
                    } else {
                        customerLogin = profile.credentials.setLogin(
                            formInfo.email,
                            formInfo.password
                        );
                    }
                });
                if (customerLogin) {
                    emarsysHelper.accountSubscription(res, formInfo, true);
                }
            });
        }
    }
    next();
});

module.exports = server.exports();
