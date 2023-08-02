'use strict';

var server = require('server');

/* API includes */
var URLUtils = require('dw/web/URLUtils');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var Site = require('dw/system/Site');
/* Script Modules */
var emarsysSFRAHelper = require('~/cartridge/scripts/helpers/emarsysSFRAHelper');
var NewsletterHelper = require('~/cartridge/scripts/helpers/newsletterHelper');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var tumiHelpers = require('*/cartridge/scripts/helpers/tumiHelpers');

/**
 * @description Renders the Newsletter form page
 * @returns {void}
 */
server.get(
    'Signup',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        try {
            if (!Site.getCurrent().getCustomPreferenceValue('emarsysEnabled')) {
                emarsysSFRAHelper.emarsysDisabledTemplate(res);
                return;
            }
            var signupForm = server.forms.getForm('emarsyssignup');
            // clear form
            signupForm.clear();
            response.setExpires(new Date().setHours(23));
            // render the Submit Form
            res.render('subscription/emarsyssignup', {
                signupForm: signupForm,
                ContinueURL: URLUtils.https('EmarsysNewsletter-SubmitForm')   // EmailSettingsHandleForm
            });
        } catch (e) {
            emarsysSFRAHelper.errorPage(e, res);
        }
        next();
    }
);

/**
 * @description Handles for form submission
 * @returns {void}
 */
server.post(
    'SubmitForm',
    server.middleware.https,
    function (req, res, next) {
        var args = {};
        args.Email = session.forms.emarsyssignup.emailAddress.value;
        args.EmarsysSignupPage = true;
        args.SubscriptionType = 'account';
        args.SubscribeToEmails = true;

        // map the form fields
        args.Map = NewsletterHelper.mapFieldsSignup();
        // send form to processing
        emarsysSFRAHelper.processor(args, res);
        return next();
    }
);

/**
 * @description Renders the error page
 * @param {Object} e - error data to display
 * @returns {void}
 */
server.get(
    'ErrorPage',
    server.middleware.https,
    function (req, res, next) {
        response.setExpires(new Date().setHours(23));
        emarsysSFRAHelper.errorPage({}, res);
        next();
    }
);

/**
 * @description Renders the account overview.
 * @returns {void}
 */
server.get(
    'ThankYouPage',
    server.middleware.https,
    function (req, res, next) {
        response.setExpires(new Date().setHours(23));
        emarsysSFRAHelper.thankYouPage(res);
        next();
    }
);

/**
 * @description Renders the account overview
 * @returns {void}
 */
server.get(
    'AlreadyRegisteredPage',
    server.middleware.https,
    function (req, res, next) {
        response.setExpires(new Date().setHours(23));
        emarsysSFRAHelper.alreadyRegisteredPage(res);
        next();
    }
);

/**
 * @description Renders the account overview
 * @returns {void}
 */
server.get(
    'DataSubmittedPage',
    server.middleware.https,
    function (req, res, next) {
        response.setExpires(new Date().setHours(23));
        emarsysSFRAHelper.dataSubmittedPage(res);
        next();
    }
);

/**
 * @description renders the disabled template
 * @returns {void}
 */
server.get(
    'EmarsysDisabledTemplate',
    server.middleware.https,
    function (req, res, next) {
        response.setExpires(new Date().setHours(23));
        emarsysSFRAHelper.emarsysDisabledTemplate(res);
        next();
    }
);

/**
 * @description -  Subscription with footer
 * @returns {void}
 */
server.post(
    'FooterSubscription',
    function (req, res, next) {
        var args = {};
        if (Site.getCurrent().getCustomPreferenceValue('emarsysEnabled')) {
            args.Email = request.httpParameterMap.emailAddress.value;
            
            if (args.Email && tumiHelpers.validateEmail(args.Email)) {
            	args.SubscriptionType = 'footer';
                args.SubscribeToEmails = true;
                
                // map the form fields
                args.Map = NewsletterHelper.mapFieldsSignup();
                // send form to processing
                emarsysSFRAHelper.processor(args, res);
            } else {
            	res.json({
                    invalidemail: true
                });
            }
        } else {
        	res.json({
                subscriptionDisabled: true
            });
        }
        next();
    }
);

/**
 * @description - Redirects to dataSubmittedPage
 * @param {Object} args - data value
 * @returns {void}
 */
server.get(
    'RedirectToDataSubmittedPage',
    server.middleware.https,
    function (req, res, next) {
        response.setExpires(new Date().setHours(23));
        emarsysSFRAHelper.dataSubmittedPage(res);
        next();
    }
);

/**
 * @description - Redirects to thankYouPage
 * @param {Object} args - data value
 * @returns {void}
 */
server.get(
    'RedirectToThankYouPage',
    server.middleware.https,
    function (req, res, next) {
        response.setExpires(new Date().setHours(23));
        emarsysSFRAHelper.thankYouPage(res);
        next();
    }
);

/**
 * @description Redirects to alreadyRegisteredPage
 * @param {Object} args - data redirect
 * @returns {void}
 */
server.get(
    'RedirectToAlreadyRegisteredPage',
    server.middleware.https,
    function (req, res, next) {
        response.setExpires(new Date().setHours(23));
        emarsysSFRAHelper.alreadyRegisteredPage(res);
        next();
    }
);

/**
 * @description Redirects to error page
 * @param {Object} args - details subscription
 * @returns {void}
 */
server.get(
    'RedirectToErrorPage',
    function (req, res, next) {
        response.setExpires(new Date().setHours(23));
        emarsysSFRAHelper.errorPage({}, res);
        next();
    }
 );

/**
 * @description - Redirects to disabledPage
 * @returns {void}
 */
server.get(
    'RedirectToDisabledPage',
    server.middleware.https,
    function (req, res, next) {
        response.setExpires(new Date().setHours(23));
        emarsysSFRAHelper.emarsysDisabledTemplate(res);
        next();
    }
);

/**
 * @description Renders the unsubscribe page
 * @returns {void}
 */
server.get(
    'Unsubscribe',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var args = {};
        var queryParams = req.querystring;
        response.setExpires(new Date().setHours(23));

        try {
            if (!empty(args.UnsubscribeParams) || (
                    !empty(queryParams.uid) &&
                    !empty(queryParams.cid) &&
                    !empty(queryParams.lid) &&
                    !empty(queryParams.direct))) {
                // construct arguments
                args.cid = queryParams.cid;
                args.confirmation = request.httpParameterMap.triggeredForm;
                args.direct = queryParams.direct;
                args.lid = queryParams.lid;
                args.uid = queryParams.uid;
                // call unsubscribe function
                args = NewsletterHelper.newsletterUnsubscribe(args);

                res.render('unsubscribe/landing_unsubscribe', {
                    ContinueURL: URLUtils.https('NewsletterHelper-Unsubscribe'),
                    ShowConfirmation: args.showConfirmation,
                    Errors: args.errors,
                    params: args.params
                });
            } else {
                res.render('unsubscribe/landing_unsubscribe', {
                    ContinueURL: URLUtils.https('NewsletterHelper-Unsubscribe')
                });
            }
        } catch (e) {
            // log error and redirect to error page
            emarsysSFRAHelper.errorPage(e, res);
        }
        next();
    }
);

/**
 * @description Renders the emailsettings page
 * @returns {void}
 */
server.post(
    'EmailSettings',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var CustomerModel = require('*/cartridge/models/customerModel');
        var signupForm = server.forms.getForm('emarsyssignup');
        try {
            signupForm.clear();
            // update form with account data
            CustomerModel.updateAccountFormWithCustomerData(signupForm);
            response.setExpires(new Date().setHours(23));
            res.render('subscription/emarsys_emailsettings', {
                isSFRA: true,
                signupForm: signupForm,
                ContinueURL: URLUtils.https('EmarsysNewsletter-EmailSettingsHandleForm')
            });
        } catch (e) {
            emarsysSFRAHelper.errorPage(e, res);
        }
        next();
    }
);

/**
 * @description - Email settings form
 * @returns {void}
 */
server.post(
    'EmailSettingsHandleForm',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var args = {};
        args.Email = session.forms.emarsyssignup.emailAddress.value;
        args.EmarsysSignupPage = true;
        args.SubscriptionType = 'account';
        args.SubscribeToEmails = true;

        // map the form fields
        args.Map = NewsletterHelper.mapFieldsSignup();
        // send form to processing
        emarsysSFRAHelper.processor(args, res);
        return next();
    }
);

/**
 * @description - Account unsubscribe handle
 * @returns {void}
 */
server.get(
    'AccountUnsubscribe',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var ret = NewsletterHelper.accountUnsubscribe(customer.profile.email);
        response.setExpires(new Date().setHours(23));
        switch (ret.status) {
            case ('NO EMAIL'):
            case ('NOT REGISTERED'):
            case ('SUCCESS'):
                res.render('unsubscribe/account_unsubscribe', {
                    Status: ret.status
                });
                break;
            case ('EMARSYSHELPER ERROR'):
                emarsysSFRAHelper.errorPage(ret.contactData, res);
                break;
            case ('GENERAL ERROR'):
                emarsysSFRAHelper.errorPage({}, res);
                break;
            default:
                break;
        }
        next();
    }
);

/**
 * @description - renders DoubleOptInThankYou page from account
 * @returns {void}
 */
server.get(
    'AccountoutDoubleOptInThankYou',
    server.middleware.https,
    function (req, res, next) {
        var args = {};
        if (Site.getCurrent().getCustomPreferenceValue('emarsysEnabled')) {
            args = NewsletterHelper.subscriptionTypeData('account');
            args = NewsletterHelper.doubleOptInSubscribe(args);
            if (emarsysSFRAHelper.checkNotEmpty(args, res)) {
                response.setExpires(new Date().setHours(23));
                res.render('subscription/double_optin_thank_you_page');
            }
        } else {
            emarsysSFRAHelper.emarsysDisabledTemplate(res);
        }
        next();
    }
);

/**
 * @description - renders DoubleOptInThankYou page from footer
 * @returns {void}
 */
server.post(
    'FooterDoubleOptInThankYou',
    server.middleware.https,
    function (req, res, next) {
        var args = {};
        if (Site.getCurrent().getCustomPreferenceValue('emarsysEnabled')) {
            args = NewsletterHelper.subscriptionTypeData('footer');
            args = NewsletterHelper.doubleOptInSubscribe(args);
            if (emarsysSFRAHelper.checkNotEmpty(args, res)) {
                response.setExpires(new Date().setHours(23));
                res.render('subscription/double_optin_thank_you_page');
            }
        } else {
            emarsysSFRAHelper.emarsysDisabledTemplate(res);
        }
        next();
    }
);

/**
 * @description - renders DoubleOptInThankYou page from checkout
 * @returns {void}
 */
server.get(
    'CheckoutDoubleOptInThankYou',
    server.middleware.https,
    function (req, res, next) {
        var args = {};
        if (Site.getCurrent().getCustomPreferenceValue('emarsysEnabled')) {
            args = NewsletterHelper.subscriptionTypeData('checkout');
            args = NewsletterHelper.doubleOptInSubscribe(args);
            if (emarsysSFRAHelper.checkNotEmpty(args, res)) {
                response.setExpires(new Date().setHours(23));
                res.render('subscription/double_optin_thank_you_page');
            }
        } else {
            emarsysSFRAHelper.emarsysDisabledTemplate(res);
        }
        next();
    }
);

module.exports = server.exports();
