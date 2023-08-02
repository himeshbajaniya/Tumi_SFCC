'use strict';

var customObjectMgr = require('dw/object/CustomObjectMgr');
var logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
/**
 * @description order confirmation
 * @param {Object} args args
 * @returns {void}
 */
function orderConfirmation(args) {
    var emarsysHelper = new (require('*/cartridge/scripts/helpers/emarsysHelper'))();
    var Args = args;
    var order = args.Order;
    var config = customObjectMgr.getCustomObject('EmarsysTransactionalEmailsConfig', 'orderconf');
    var countryCodes = require('dw/system').Site.getCurrent().getCustomPreferenceValue('emarsysCountryCodes');
    var contactHTTPRequest = 'PUT'; // defaults to update
    var sendData = {};
    var billing = session.forms.billing;
    var isSubscribe = false;

    if (Object.hasOwnProperty.call(billing, 'subscribe')) {
        isSubscribe = billing.subscribe.value;
    } else if (Object.hasOwnProperty.call(billing, 'billingAddress')) {
        isSubscribe = billing.billingAddress.addToEmailList.checked;
    }

    try {
        Transaction.wrap(function () {
            // mark the order for Emarsys shipping transactional emails
            order.custom.sendEmarsysShippingEmail = true;
        });
        // If we can get the order on the configuration, start to process the e-mail
        if (!empty(order) && !empty(config)) {
            // parse country codes
            if (!empty(countryCodes)) {
                countryCodes = JSON.parse(countryCodes);
            }

            sendData.key_id = '3'; // search by e-mail
            sendData.external_id = order.customerEmail; // add customer e-mail
            sendData.data = {}; // object for storing mapped fields

            // store external event
            var externalEvent = config.custom.externalEvent;

            /*
            * System field IDs reference
            * http://documentation.emarsys.com/resource/b2c-cloud/contacts/fields/system-fields/
            */
            var contactData = {};
            contactData.key_id = 3; // search by e-mail
            contactData['3'] = order.customerEmail;// customer e-mail address
            if (isSubscribe) {
                contactData['31'] = 1;
            }

            // if source id value exists add it to request
            emarsysHelper.addSourceIdToRequest(contactData);

            // define an object to store data retrieved from order.billingAddress object
            var map = {};
            // add data map object
            emarsysHelper.addDataToMap(order.billingAddress, map);
            // add data to request body
            emarsysHelper.addFields(map, contactData);

            // Send request to Emarsys. will create an account if doesn't exist, otherwise update the existing one.
            var Contact = emarsysHelper.triggerAPICall('contact/?create_if_not_exists=1', contactData, 'PUT');

            // We couldn't create/update the contact, log the event
            if (!Contact.ok) {
                logger.error('[hook/emails.js] - ***Emarsys order confirmation email error message: Couldn\'t update/create contact for email: ' + order.customerEmail + ', HTTP request (PUT is for updating): ' + contactHTTPRequest);
            }

            // populate placeholders with values
            var mappedFields = JSON.parse(config.custom.mappedFields);
            sendData.data.global = {};
            emarsysHelper.appendGlobalMappedFieldsObject(mappedFields, sendData.data.global, order);

            // Add products
            sendData.data.products = [];
            emarsysHelper.appendProductInfo(mappedFields, order, sendData.data.products);

            // Triggering the event
            var triggerEvent = emarsysHelper.triggerAPICall('event/' + externalEvent + '/trigger', sendData, 'POST');

            Args.OrderData = sendData;

            // External event triggering failed
            if (!triggerEvent.ok) {
                logger.warn('hook/emails.js - Emarsys order confirmation email message: Could not trigger the external event - externalEvent: {0} - sendData: {1} - serverMessage: {2}', externalEvent, JSON.stringify(sendData), triggerEvent.errorMessage);
            }
        }
    } catch (err) {
        logger.error('[hook/emails.js] - ***Emarsys order confirmation email error message: ' + err.message + '\n' + err.stack);
    }
}

module.exports = {
    beforeHandlePayment: orderConfirmation,
    afterOrderSubmit: orderConfirmation,
    orderConfirmation: orderConfirmation
};
