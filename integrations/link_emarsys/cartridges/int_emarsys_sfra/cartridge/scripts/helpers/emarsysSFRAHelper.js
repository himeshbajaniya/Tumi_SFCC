'use strict';

var Logger = require('dw/system/Logger').getLogger('emarsys');
var newsletterHelper = require('~/cartridge/scripts/helpers/newsletterHelper');
var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
var Site = require('dw/system/Site');

/**
 * @description Renders the error page
 * @param {Object} e - error data to display
 * @param {Object} res - response
 * @returns {void}
 */
function errorPage(e, res) {
    if (!empty(e)) {
        Logger.error('[Error page redirect:' + e.error + '] - ***Emarsys error message: ' + e.errorMessage);
    }
    res.render('subscription/emarsys_error');
}

/**
 * @description Renders the account overview.
 * @param {Object} res - response
 * @returns {void}
 */
function thankYouPage(res) {
    res.render('subscription/emarsys_thankyou');
}

/**
 * @description Renders the account overview
 * @param {Object} res - response
 * @returns {void}
 */
function alreadyRegisteredPage(res) {
    res.render('subscription/emarsys_alreadyregistered');
}

/**
 * @description Renders the account overview
 * @param {Object} res - response
 * @returns {void}
 */
function dataSubmittedPage(res) {
    res.render('subscription/emarsys_datasubmitted');
}

/**
 * @description renders the disabled template
 * @param {Object} res - response
 * @returns {void}
 */
function emarsysDisabledTemplate(res) {
    res.render('subscription/emarsys_disabled');
}

/**
 * @description renders the disabled template
 * @param {Object} server server
 * @param {Object} URLUtils dw/web/URLUtils
 * @param {Object} res - response
 * @returns {void} renders
 */
function signup(server, URLUtils, res) {
    try {
        if (!Site.getCurrent().getCustomPreferenceValue('emarsysEnabled')) {
            emarsysDisabledTemplate(res);
            return;
        }
        // clear form
        server.forms.getForm('emarsyssignup').clear();
        // render the Submit Form
        res.render('subscription/emarsyssignup', {
            ContinueURL: URLUtils.https('NewsletterHelper-SubmitForm')
        });
    } catch (e) {
        errorPage(e, res);
    }
}

/**
 * @description Data validation
 * @param {Object} args - object data
 * @param {Object} res - response
 * @returns {Object|void} - returns submit contact data
 */
function submitData(args, res) {
    var Args = args;
    Args = newsletterHelper.submitContactData(Args, res);

    if (!empty(Args.ExternalEvent) && Args.ExternalEvent) {
        newsletterHelper.triggerExternalEvent(Args);
        if (!empty(Args.Error) && Args.Error) {
            if (Args.SubscriptionType === 'checkout' || Args.Action === 'create') {
                return Args;
            } else if (empty(Args.Error)) {
                res.render('subscription/emarsys_error');
            }
        } else {
            res.render('subscription/emarsys_error');
        }
        return Args;
    }
    return Args;
}

/**
 * @description Process subscription for redirect route
 * @param {Object} args - details subscription
 * @returns {string}  - value redirect
 */
function redirect(args) {
    var answer = null;
    // process subscription for redirect route
    if (!empty(args.SubscriptionType) && args.SubscriptionType !== 'checkout') {
        if (empty(args.EmarsysSignupPage) || (!empty(args.EmarsysSignupPage) && !args.EmarsysSignupPage)) {
            if (!empty(args.SubscriptionType) && args.SubscriptionType === 'footer') {
                answer = 'noAjax';
            } else if (!empty(args.SubscriptionType) && args.SubscriptionType !== 'account') {
                answer = 'ajax';
            } else {
                answer = 'noRedirect';
            }
        } else {
            answer = 'noAjax';
        }
    } else {
        answer = 'noRedirect';
    }
    return answer;
}

/**
 * @description - Redirects to dataSubmittedPage
 * @param {Object} args - data value
 * @param {Object} res - response
 * @returns {void}
 */
function redirectToDataSubmittedPage(args, res) {
    try {
        var redirectValue = redirect(args);
        if (redirectValue === 'ajax') {
            var accountStatus = 'submitted';
            // respond with ajax
            res.json({
                success: true,
                accountStatus: accountStatus
            });
        } else if (redirectValue === 'noAjax') {
            dataSubmittedPage(res);
        } else {
            return;
        }
    } catch (e) {
        errorPage(e, res);
    }
}

/**
 * @description Redirects to thankYouPage
 * @param {Object} args - details subscription
 * @param {Object} res - response
 * @returns {void}
 */
function redirectToThankYouPage(args, res) {
    switch (redirect(args)) {
        case 'ajax':
            var accountStatus = 'accountcreated';
            // respond with ajax
            res.json({
                success: true,
                accountStatus: accountStatus
            });
            break;
        case 'noAjax':
            thankYouPage(res);
            break;
        case 'noRedirect':
            return;
        default:
            break;
    }
}

/**
 * @description Redirects to alreadyRegisteredPage
 * @param {Object} args - data redirect
 * @param {Object} res - response
 * @returns {void}
 */
function redirectToAlreadyRegisteredPage(args, res) {
    switch (redirect(args)) {
        case 'ajax':
            var accountStatus = 'accountexists';
            // respond with ajax
            res.json({
                success: true,
                accountStatus: accountStatus
            });
            break;
        case 'noAjax':
            alreadyRegisteredPage(res);
            break;
        case 'noRedirect':
            return;
        default:
            break;
    }
}

/**
 * @description Redirects to error page
 * @param {Object} args  - details subscription
 * @param {Object} res - response
 * @returns {void}
 */
function redirectToErrorPage(args, res) {
    switch (redirect(args)) {
        case 'ajax':
            var accountStatus = 'error';
            // respond with ajax
            res.json({
                success: true,
                accountStatus: accountStatus
            });
            break;
        case 'noAjax':
            errorPage({}, res);
            break;
        case 'noRedirect':
            return;
        default:
            break;
    }
}

/**
 * @description prepare data and call submit data
 * @param {Object} args - initial data
 * @param {Object} res - response
 * @returns {boolean|Object} object or boolean
 */
function handleOptInStrategy1(args, res) {
    var Args = args;
    var accountStatus;
    var newObject = {};
    // get the account status
    Args = newsletterHelper.getAccountStatus(Args, res);
    // check current request is on subscription page and not other pages
    if (Args.SubscriptionType === 'checkout' || (Args.EmarsysSignupPage && (Args.SubscriptionType !== 'account' && Args.SubscriptionType !== 'footer'))) {
        return Args;
    }

    if (Args.Status === 'NOT REGISTERED') {
        Args.Method = 'POST';
        Args = submitData(Args, res);
        // redirect customer
        if (request.httpParameterMap.formatajax.stringValue === 'true') {
            accountStatus = 'accountcreated';
            // respond with ajax
            res.json({
                success: true,
                accountStatus: accountStatus
            });
        } else {
            redirectToThankYouPage(Args, res);
        }
    } else if (Args.Status === 'FILLED') {
        Args.Method = 'PUT';
        Args = submitData(Args, res);
        // redirect customer
        if (request.httpParameterMap.formatajax.stringValue === 'true') {
            accountStatus = 'accountexists';
            // respond with ajax
            res.json({
                success: true,
                accountStatus: accountStatus
            });
        } else {
            redirectToAlreadyRegisteredPage(Args, res);
        }
    } else {
        Args.Method = 'PUT';
        Args = submitData(Args, res);
        // redirect customer
        if (request.httpParameterMap.formatajax.stringValue === 'true') {
            accountStatus = 'accountcreated';
            // respond with ajax
            newObject = {};
            newObject.success = true;
            newObject.accountStatus = accountStatus;
            res.json(newObject);
        } else {
            redirectToThankYouPage(Args, res);
        }
    }
    return false;
}

/**
 * @description Check or empty
 * @param {Object} args - object to check if empty
 * @param {Object} res - response
 * @returns {boolean} - whether object is empty
 */
function checkNotEmpty(args, res) {
    var status = false;
    if (empty(args)) {
        errorPage(args, res);
    } else {
        status = true;
    }
    return status;
}

/**
 * @description - OptInStrategy handle
 * @param {Object} args - detail subscription
 * @param {Object} res - response
 * @returns {void}
 */
function processor(args, res, updateProfile) {
    try {
        var Args = args;
        // get subscription data type info
        var TypeData = newsletterHelper.subscriptionTypeData(args.SubscriptionType);
        var accountStatus;
        var fieldKey = 'newsletterSubscriptionResult';

        TypeData.ExternalEvent = eventsHelper.getExternalEventData(TypeData.ExternalEventName, fieldKey).emarsysId;
        TypeData.ExternalEventAfterConfirmation = eventsHelper.getExternalEventData(TypeData.ExternalEventAfterConfirmationName, fieldKey).emarsysId;
        
        if (updateProfile) {
            TypeData.ExternalEvent = eventsHelper.getExternalEventData('PROFILE_UPDATE', fieldKey).emarsysId;
        }

        // redirect in case of error
        if (empty(TypeData) || empty(TypeData.Strategy)) {
            redirectToErrorPage(Args, res);
            return;
        }
        Args.Strategy = TypeData.Strategy;
        Args.ExternalEvent = TypeData.ExternalEvent;
        Args.ExternalEventAfterConfirmation = TypeData.ExternalEventAfterConfirmation;

        if (TypeData.Strategy === '1') {
            handleOptInStrategy1(Args, res);
        } else {
            Args = newsletterHelper.sendDataForDoubleOptIn(Args);
            // check event trigger
            if (checkNotEmpty(Args, res) && Args.TriggerEvent) {
                Args = newsletterHelper.triggerExternalEvent(Args);
                if (!empty(Args.Error) && Args.Error) {
                    redirectToErrorPage(Args, res);
                    return;
                } else if (!empty(Args.Error)) {
                    res.render('subscription/emarsys_error');
                    return;
                }
                // check if Args are constructed
                if (checkNotEmpty(Args, res)) {
                    if (request.httpParameterMap.formatajax.stringValue === 'true') {
                        accountStatus = 'submitted';
                        // respond with ajax
                        res.json({
                            success: true,
                            accountStatus: accountStatus
                        });
                    } else {
                        redirectToDataSubmittedPage(Args, res);
                    }
                    return;
                }
            } else {
                if (request.httpParameterMap.formatajax.stringValue === 'true') {
                    accountStatus = 'accountexists';
                    // respond with ajax
                    res.json({
                        success: true,
                        accountStatus: accountStatus
                    });
                } else {
                    redirectToAlreadyRegisteredPage(Args, res);
                }
                return;
            }
        }
    } catch (e) {
        // catch and log the error
        errorPage(e, res);
    }
}

/**
 * @description - gets current customer data
 * @param {Object} args - object
 * @returns {Object} Args corrected params
 */
function getCustomerData(args) {
    var Args = args;
    Args.basket = require('dw/order/BasketMgr').getCurrentBasket();
    Args = newsletterHelper.getCustomerData(Args);
    return Args;
}

/**
 * @description - Subscription with account
 * @param {Object} res - response
 * @param {Object} profileForm - it is a profile form
 * @returns {void}
 */
function accountSubscription(res, profileForm, updateProfile) {
    var args = {};
    if (Site.getCurrent().getCustomPreferenceValue('emarsysEnabled')) {
        args.SubscriptionType = 'account';
        args.Email = profileForm.email;
        args.SubscribeToEmails = request.httpParameterMap.dwfrm_profile_customer_addtoemaillist.submitted;
        args = getCustomerData(args); // get customer data
        // process the request and form data
        processor(args, res, updateProfile);
    } else {
        emarsysDisabledTemplate(res);
    }
}

/**
 * @description - Subscription with checkout
 * @param {Object} res - response
 * @param {Object} billingData - it is a billing address form
 * @returns {void}
 */
function checkoutSubscription(res, billingData) {
    var args = {};
    if (Site.getCurrent().getCustomPreferenceValue('emarsysEnabled')) {
        args.SubscriptionType = 'checkout';
        args.Email = billingData.email && billingData.email.value;
        args.SubscribeToEmails = true;
        args = newsletterHelper.getCustomerData(args); // get customer data
        // process the request and form data
        processor(args, res);
    } else {
        emarsysDisabledTemplate(res);
    }
}

module.exports = {
    errorPage: errorPage,
    thankYouPage: thankYouPage,
    alreadyRegisteredPage: alreadyRegisteredPage,
    dataSubmittedPage: dataSubmittedPage,
    emarsysDisabledTemplate: emarsysDisabledTemplate,
    signup: signup,
    redirect: redirect,
    processor: processor,
    checkNotEmpty: checkNotEmpty,
    redirectToDataSubmittedPage: redirectToDataSubmittedPage,
    redirectToThankYouPage: redirectToThankYouPage,
    redirectToAlreadyRegisteredPage: redirectToAlreadyRegisteredPage,
    getCustomerData: getCustomerData,
    accountSubscription: accountSubscription,
    checkoutSubscription: checkoutSubscription,
    redirectToErrorPage: redirectToErrorPage
};
