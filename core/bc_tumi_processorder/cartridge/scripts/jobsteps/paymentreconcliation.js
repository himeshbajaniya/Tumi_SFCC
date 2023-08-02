'use strict';

var Order = require('dw/order/Order');
var Site = require('dw/system/Site');
var ordersIterator;

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

function read() {
    if (ordersIterator) {
        while (ordersIterator.hasNext()) {
            return ordersIterator.next();
        }
    }
    return null;
}

function process(order) {
    var paymentInstrumentsItr = order.paymentInstruments.iterator();
    var paymentMethods = [];
    while (paymentInstrumentsItr.hasNext()) {
        paymentMethods.push(paymentInstrumentsItr.next().paymentMethod);
    }
    return {
        orderNo: order.orderNo,
        paymentMethods: paymentMethods,
        createdOn: order.creationDate.toLocaleTimeString()
    };
}

function write(obj, args) {
    var emailObj = {
        to: args.mailTo,
        subject: 'Settlement reconcillation mail',
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com'
    };
    send(emailObj, 'mail/reconcilation', {
        data: obj.toArray()
    });
}

function beforeStep(params) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Calendar = require('dw/util/Calendar');
    var query = 'exportStatus = {0} AND paymentStatus = {1} AND creationDate >= {2} AND creationDate <= {3}';
    var fromRange = new Calendar();
    fromRange.add(Calendar.DAY_OF_MONTH, -(params.days_before));
    ordersIterator = OrderMgr.queryOrders(query, null, Order.EXPORT_STATUS_EXPORTED, Order.PAYMENT_STATUS_NOTPAID, fromRange.time, new Date());
}

module.exports = {
    read: read,
    process: process,
    write: write,
    beforeStep: beforeStep
};