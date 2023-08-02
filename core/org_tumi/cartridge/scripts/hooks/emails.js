'use strict';

var base = module.superModule;

var customObjectMgr = require('dw/object/CustomObjectMgr');
var logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var emarsysHelper = new (require('*/cartridge/scripts/helpers/emarsysHelper'))();

function orderStatusChangeNotification(args, co, orderCustomAttr, statusObj) {
    var getContactData;
    var submitContactData;
    var triggerEvent;

    var method = 'PUT';
    var genderCodes = JSON.parse(Site.getCurrent().getCustomPreferenceValue('emarsysGenderCodes'));
    var mappedFields = JSON.parse(co.custom.mappedFields);
    var externalEventId = co.custom.externalEvent;

    try {
        var order = args.Order;
        var email = order.customerEmail;

        // object to store emarsys fields codes and billingAddress attributes
        var billingAddressMap = {};

        emarsysHelper.addDataToMap(order.billingAddress, billingAddressMap);

        // base request to check if contact already exists
        var baseRequest = {
            keyId: '3',
            keyValues: [email]
        };

        // call to check if contact already exists
        getContactData = emarsysHelper.triggerAPICall('contact/getdata', baseRequest, 'POST');
        if (getContactData.status !== 'OK') {
            logger.error('[Emarsys email.js - Get data error:' + getContactData.error + '] - ***Emarsys error message: ' + getContactData.errorMessage);
        }

        // parse response and check for errors
        var dataObj = JSON.parse(getContactData.object);
        var errors = dataObj.data.errors;

        if (errors.length > 0) {
            var error = errors[0];
            // check if account exists and change request method depending on that
            // error code 2008 means that account wasn't created yet
            if (error.errorCode === 2008) {
                method = 'POST';
            }
        }

        // request object to update/create contact data
        var contactDataToSubmit = {
            keyId: '3',
            3: email // '3'
        };

        // if source id value exists add it to request
        emarsysHelper.addSourceIdToRequest(contactDataToSubmit);

        // add billing address fields
        emarsysHelper.addFields(billingAddressMap, contactDataToSubmit);

        // map gender string value to a scalar
        if (order.customer.profile && order.customer.profile.gender.value !== 0) {
            var code = genderCodes[order.customer.profile.gender.value];
            contactDataToSubmit['5'] = code;
        }

        // call to Emarsys to update/create contact data
        submitContactData = emarsysHelper.triggerAPICall('contact', contactDataToSubmit, method);
        if (submitContactData.status !== 'OK') {
            logger.error('[Emarsys email.js - Submit data error:' + submitContactData.error + '] - ***Emarsys error message: ' + submitContactData.errorMessage);
        }

        // order change data to send
        var requestData = {
            key_id: '3',
            external_id: email,
            data: {}
        };

        // add order fields to global object
        emarsysHelper.appendGlobalMappedFieldsObject(mappedFields, requestData.data, order);
        if (orderCustomAttr && orderCustomAttr.indexOf('CancelledOrder') > -1) {
            requestData.data.CancelReason = 'Tumi customer declined';
            requestData.data.Language = order.customerLocaleID ? String(order.customerLocaleID).split('_')[0] : 'en';
        } else if (orderCustomAttr && orderCustomAttr === 'orderReturn') {
            var address = order.billingAddress;
            requestData.data = {
                CreditedFlag: args.isPaid ? true : false,
                Language: order.customerLocaleID ? String(order.customerLocaleID).split('_')[0] : 'en',
                CreditedToNumber: args.cardNumber ? args.cardNumber : '',
                CreditedTo: args.cardHolder ? args.cardHolder : '',
                FirstName: address && address.firstName ? address.firstName : '',
                Country: address && address.countryCode && address.countryCode.displayValue ? address.countryCode.displayValue : '',
                CreditAmount: args.price ? args.price : 0,
                OrderNumber: args.orderNumber ? args.orderNumber: '0',
                ORDER_BILLING_ADDRESS_EMAIL: order.customerEmail,
                LastName: address && address.lastName ? address.lastName : ''
            };
        } else {
            requestData.data = emarsysHelper.populateShippingConfirmData(args);
        }

        if (externalEventId) {
            var endpoint = 'event/' + externalEventId + '/trigger';
            triggerEvent = emarsysHelper.triggerAPICall(endpoint, requestData, 'POST');

            if (triggerEvent.status !== 'OK') {
                logger.error('[Emarsys email.js - Trigger event error:' + triggerEvent.error + '] - ***Emarsys error message: ' + triggerEvent.errorMessage);
            } else if (orderCustomAttr !== 'orderReturn') {
                order.custom[orderCustomAttr] = true;
            }
        }
    } catch (err) {
        statusObj = { status: false, msg: err.message };
        logger.error('[Emarsys email.js] - ***Submit data error message: ' + err.message + '\n' + err.stack);
    }
}

/**
 * @description order confirmation
 * @param {Object} args args
 * @returns {void}
 */
base.orderConfirmation = function (args) {
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
            // sendData.data.global = {};
            // emarsysHelper.appendGlobalMappedFieldsObject(mappedFields, sendData.data.global, order);

            // Add products
            // sendData.data.products = [];
            // emarsysHelper.appendProductInfo(mappedFields, order, sendData.data.products);

            // populate the order details.
            sendData.data = {};
            emarsysHelper.appendGlobalMappedFieldsObject(mappedFields, sendData.data, order);

            // Triggering the event
            var triggerEvent = emarsysHelper.triggerAPICall('event/' + externalEvent + '/trigger', sendData, 'POST');
            if (triggerEvent.status === 'OK') {
                Transaction.wrap(function () {
                    // mark the order for Emarsys confirmation email
                    order.custom.sendEmarsysConfirmationEmail = true;
                });
            }
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

base.orderCancellation = function (args) {
    var co = customObjectMgr.getCustomObject('EmarsysTransactionalEmailsConfig', 'orderCancelledConf'); // custom object that stores config for cancelled order emails
    var orderCustomAttr = 'emarsysCancelledOrderEmailSent';
    orderStatusChangeNotification(args, co, orderCustomAttr);
};

base.shippingConfirm = function (args) {
    var co = customObjectMgr.getCustomObject('EmarsysTransactionalEmailsConfig', 'shipping');
    var orderCustomAttr = 'emarsysShippingEmailSent';
    orderStatusChangeNotification(args, co, orderCustomAttr);
};

base.orderReturn = function (args) {
    var statusObj = {
        status: true,
        msg: null
    };
    var co = customObjectMgr.getCustomObject('EmarsysTransactionalEmailsConfig', 'orderReturn');
    orderStatusChangeNotification(args, co, 'orderReturn', statusObj);
    return statusObj;
}

module.exports = base;
