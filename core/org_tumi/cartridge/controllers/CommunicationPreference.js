/* eslint-disable */
'use strict';

var server = require('server');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.post('Save', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    var customerProfile = customer.getProfile();
    var communicationPreferenceForm = server.forms.getForm('communicationPreference');
    Transaction.wrap(function () {
        customerProfile.custom.optInEmail = req.form.optInEmail ? true : false;
        customerProfile.custom.optInSMS = req.form.optInSMS ?true : false;
    });

    if (isEmarsysEnable && customerProfile) {
        eventsHelper.profileUpdate(customerProfile, {updatePage: 'NewsLetter Preferences', optInEmail: req.form.optInEmail});
    }

    res.json({
        success: true,
        optInEmail: customerProfile.custom.optInEmail,
        optInSMS: customerProfile.custom.optInSMS,
    });
    next();
});

server.get('Show',userLoggedIn.validateLoggedIn, function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var customerProfile = customer.getProfile();
    var communicationPreferenceForm = server.forms.getForm('communicationPreference');
    var viewData = res.getViewData();
    communicationPreferenceForm.emailcheckbox.checked= customerProfile.custom.optInEmail;
    communicationPreferenceForm.smscheckbox.checked= customerProfile.custom.optInSMS;
    viewData.communicationPreferenceForm=communicationPreferenceForm;
    res.setViewData(viewData);

    var responseObject = {
        isError: false,
        returnHTML : ''
    };
    responseObject.returnHTML = renderTemplateHelper.getRenderedHtml(viewData, 'account/communicationPreference');
    res.json(responseObject);
    next();
});
module.exports = server.exports();
