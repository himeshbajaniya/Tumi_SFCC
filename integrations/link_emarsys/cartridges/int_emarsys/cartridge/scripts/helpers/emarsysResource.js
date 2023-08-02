/**
 * Emarsys Resource helper
 *
 */
/**
 * @description function with static methods
 */
function emarsysResourceHelper() {}
/**
    * @description Get the client-side URLs of a given page
    * @returns {Object} An objects key key-value pairs holding the URLs
    */
emarsysResourceHelper.getUrls = function () {
    var URLUtils = require('dw/web/URLUtils');

    // application urls
    var urls = {};
    urls.footerSubscription = URLUtils.url('EmarsysNewsletter-FooterSubscription').toString();
    urls.emarsysSignup = URLUtils.url('EmarsysNewsletter-Signup').toString();
    urls.thankYouPage = URLUtils.url('EmarsysNewsletter-ThankYouPage').toString();
    urls.alreadyRegisteredPage = URLUtils.url('EmarsysNewsletter-AlreadyRegisteredPage').toString();
    urls.dataSubmittedPage = URLUtils.url('EmarsysNewsletter-DataSubmittedPage').toString();
    urls.errorPage = URLUtils.url('EmarsysNewsletter-ErrorPage').toString();
    urls.emarsysDisabledPage = URLUtils.url('EmarsysNewsletter-EmarsysDisabledTemplate').toString();
    urls.emarsysAddToCartAjax = URLUtils.url('Predict-ReturnCartObject').toString();
    return urls;
};

emarsysResourceHelper.getResources = function () {
    var Resource = require('dw/web/Resource');
    var resources = {};

    // Privacy policy resources
    resources.privacyBeforeLink = Resource.msg('global.privacy.beforelink', 'locale', null);
    resources.privacyAfterLink = Resource.msg('global.privacy.afterlink', 'locale', null);
    resources.privacyErrorMessage = Resource.msg('global.privacy.errormessage', 'locale', null);
    // Subecription messages
    resources.thanksForSubscribing = Resource.msg('subscription.thankyou', 'emarsys', null);
    resources.alreadyRegistered = Resource.msg('subscription.registered', 'emarsys', null);
    resources.dataSubmitted = Resource.msg('subscription.data.submitted', 'emarsys', null);
    resources.disabled = Resource.msg('subscription.disabled', 'emarsys', null);
    resources.subscriptionerror = Resource.msg('subscription.error', 'emarsys', null);
    resources.invalidemail = Resource.msg('subscribe.email.invalid', 'emarsys', null);
    resources.thankYouWeWillBeInTouch = Resource.msg('subscribe.thankyouwewillbeintouch', 'emarsys', null);
    resources.invalidFormat = Resource.msg('subscribe.email.invalidFormat', 'emarsys', null);
    return resources;
};

emarsysResourceHelper.getPreferences = function () {
    var customPreferences = require('dw/system/Site').getCurrent();
    return {
        enabled: customPreferences.getCustomPreferenceValue('emarsysEnabled'),
        trackingJsEnabled: customPreferences.getCustomPreferenceValue('emarsysPredictEnableJSTrackingCode')
    };
};

module.exports = emarsysResourceHelper;
