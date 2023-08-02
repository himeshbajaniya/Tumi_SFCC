'use strict';

var server = require('server');

var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var BMEmarsysHelper = require('*/cartridge/scripts/helpers/bmEmarsysHelper');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * @description this function is called with bm_extensions
 */
server.get('ShowNewsletterSubscription', server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
    try {
        var tabsAttr = BMEmarsysHelper.getTabsAttr('EmarsysNewsletterSubscription', 'EmarsysSubscriptionType');
        var storedConfigurations = BMEmarsysHelper.getStoredConfigurations('EmarsysNewsletterSubscription');
        var additionalValues = BMEmarsysHelper.getExternalEvents('StoredEvents', 'newsletterSubscriptionResult', true);

        var newsletterSubForm = server.forms.getForm('newsletterSub');
        newsletterSubForm.clear();

        res.render('mainPage', {
            contentTemplate: 'newsletterConfiguration',
            tabsAttr: tabsAttr,
            additionalValues: additionalValues,
            newsletterSubForm: newsletterSubForm,
            storedConfigurations: storedConfigurations
        });
    } catch (err) {
        res.render('components/errorPage', { message: 'Configuration error:', error: err });
    }
    next();
});

server.post('SaveNewsletter', server.middleware.https, csrfProtection.validateRequest, function (req, res, next) {
    var newsletteForm = server.forms.getForm('newsletterSub');
    var newsletteFormObj = newsletteForm.toObject();

    var events = BMEmarsysHelper.getExternalEvents('StoredEvents', 'newsletterSubscriptionResult');
    events.forEach(function (event) {
        if (this.externalEventOptin === event.id) {
            this.externalEventOptinName = event.name;
        }

        if (this.externalEventOptinAfterConfirmation === event.id) {
            this.externalEventOptinAfterConfirmationName = event.name;
        }
    }, newsletteFormObj);

    if (newsletteFormObj.subscriptionType) {
        try {
            Transaction.wrap(function () {
                var currentCustomObject = CustomObjectMgr.getCustomObject('EmarsysNewsletterSubscription', newsletteFormObj.subscriptionType);

                currentCustomObject.custom.optInExternalEvent = empty(newsletteFormObj.externalEventOptinName) ? null : newsletteFormObj.externalEventOptinName;
                currentCustomObject.custom.optInStrategy = newsletteFormObj.subscriptionStrategy;
                currentCustomObject.custom.optInExternalEventAfterConfirmation = empty(newsletteFormObj.externalEventOptinAfterConfirmationName) ? null : newsletteFormObj.externalEventOptinAfterConfirmationName;
            });
            res.json({
                success: true
            });
        } catch (err) {
            res.json({
                success: false,
                responseText: 'An error occurred while transacting a possibly missing custom object or custom fields.' +
                '\nMessege: ' + err.message
            });
        }
    } else {
        res.json({
            success: false,
            responseText: 'Missing parameter "subscriptionType" in form'
        });
    }
    next();
});

module.exports = server.exports();
