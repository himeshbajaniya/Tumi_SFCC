'use strict';


var Site = require('dw/system/Site');
var siteID = Site.getCurrent().getID();
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var Status = require('dw/system/Status');

/**
 * Helper that sends an email to a customer. This will only get called if hook handler is not registered
 * @param {obj} emailObj - An object that contains information about email that will be sent
 * @param {string} emailObj.to - Email address to send the message to (required)
 * @param {string} emailObj.subject - Subject of the message to be sent (required)
 * @param {string} emailObj.from - Email address to be used as a "from" address in the email (required)
 * @param {int} emailObj.type - Integer that specifies the type of the email being sent out. See export from emailHelpers for values.
 * @param {string} template - Location of the ISML template to be rendered in the email.
 * @param {obj} context - Object with context to be passed as pdict into ISML template.
 */
 function send(emailObj, template, context) {
    var Mail = require('dw/net/Mail');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var email = new Mail();
    email.addTo(emailObj.to);
    email.setSubject(emailObj.subject);
    email.setFrom(emailObj.from);
    email.setContent(renderTemplateHelper.getRenderedHtml(context, template), 'text/html', 'UTF-8');
    email.send();
}


/**
 * @function
 * @name execute
 */
function execute(args) {
    if (empty(args.MailTo)) {
        return new Status(Status.OK);
    }
    var allOrdersObj;
    var emailSubject;
    if (siteID === 'tumi-us') {
        allOrdersObj = CustomObjectMgr.getAllCustomObjects('ListOfNotExportedOrders');
        emailSubject = Resource.msg('emailsubject.tumius.notexportedorder', 'common', null);
    } else if (siteID === 'tumi-ca') {
        allOrdersObj = CustomObjectMgr.getAllCustomObjects('CANotExportedOrders');
        emailSubject = Resource.msg('emailsubject.tumica.notexportedorder', 'common', null);
    }

    var orders =[];
    var orderObj;

    Transaction.wrap(function () {
        while (allOrdersObj.hasNext()) {
            orderObj = allOrdersObj.next();
            if (orderObj && orderObj.custom.listOfNotExportedOrders) {
                orders = orderObj.custom.listOfNotExportedOrders.split(',');
            }
            if (orderObj) {
                CustomObjectMgr.remove(orderObj);
            }
        }
    });
    if (orders.length > 0) {
        var emailObj = {
            to: args.MailTo,
            subject: emailSubject,
            from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com'
        };
        send(emailObj, 'mail/listOfNotExportedOrder', {
            orders: orders
        });
    }
}

module.exports = {
    execute: execute
};
