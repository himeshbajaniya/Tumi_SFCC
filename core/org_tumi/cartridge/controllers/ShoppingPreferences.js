/* eslint-disable */
'use strict';

var server = require('server');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.post('Save', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var customerProfile = customer.getProfile();
    var shoppingPreferencesForm = server.forms.getForm('shoppingPreferences');
    Transaction.wrap(function () {
    customerProfile.custom.luggagecheckbox = req.form.luggagecheckbox ? true : false;
    customerProfile.custom.womensbackpackscheckbox = req.form.womensbackpackscheckbox ? true : false;
    customerProfile.custom.mensbackpackscheckbox = req.form.mensbackpackscheckbox ? true : false;
    customerProfile.custom.accessoriescheckbox = req.form.accessoriescheckbox ? true : false;
});
    res.json({
        success: true,
        luggagecheckbox: customerProfile.custom.luggagecheckbox,
        womensbackpackscheckbox: customerProfile.custom.womensbackpackscheckbox,
        mensbackpackscheckbox: customerProfile.custom.mensbackpackscheckbox,
        accessoriescheckbox : customerProfile.custom.accessoriescheckbox
    });
    next();
});

server.get('Show',userLoggedIn.validateLoggedIn, function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var customerProfile = customer.getProfile();
    var shoppingPreferencesForm = server.forms.getForm('shoppingPreferences');
    var viewData = res.getViewData();
    shoppingPreferencesForm.luggagecheckbox.checked= customerProfile.custom.luggagecheckbox;
    shoppingPreferencesForm.womensbackpackscheckbox.checked= customerProfile.custom.womensbackpackscheckbox;
    shoppingPreferencesForm.mensbackpackscheckbox.checked= customerProfile.custom.mensbackpackscheckbox;
    shoppingPreferencesForm.accessoriescheckbox.checked= customerProfile.custom.accessoriescheckbox;
    viewData.shoppingPreferencesForm=shoppingPreferencesForm;
    res.setViewData(viewData);
    var responseObject = {
        isError: false,
        returnHTML : ''
    };

    responseObject.returnHTML = renderTemplateHelper.getRenderedHtml(viewData, 'account/shoppingPreferences');
    res.json(responseObject);
    next();
});
module.exports = server.exports();
