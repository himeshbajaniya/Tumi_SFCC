'use strict';

var Logger = require('dw/system/Logger').getLogger('emarsys');
var emarsysHelper = new (require('int_emarsys/cartridge/scripts/helpers/emarsysHelper'))();

/**
 * @description return mapped form
 * @return {Object} return null for error
 */
function mapFieldsSignup() {
    var map = {};
    var forms = session.forms;

    try {
        if (forms.emarsyssignup) {
            var signupFields = forms.emarsyssignup;
            emarsysHelper.addDataToMap(signupFields, map);
        }
        // return the mapped form
        return map;
    } catch (err) {
        Logger.error('[Emarsys newsletterHelper.js - mapFieldsSignup()] - ***Emarsys map signup fields data error message:' + err.message + '\n' + err.stack);
        return null;
    }
}

/**
 * @description check basket and add address to map
 * @param {Object} args with email
 * @return {void} return new args
 */
function getCustomerData(args) {
    var Args = args;
    var customer = session.customer;
    var map = {};

    try {
        if (Args.basket) {
            if (Args.basket.billingAddress) {
                emarsysHelper.addDataToMap(Args.basket.billingAddress, map);
            } else if (Args.basket.shipments[0].shippingAddress) {
                emarsysHelper.addDataToMap(Args.basket.shipments[0].shippingAddress, map);
            }
        } else if (customer.authenticated) {
            var customerAddressData = customer.addressBook;

            for (var i = 0; i < customerAddressData.addresses.length; i++) {
                if (i === 0) {
                    emarsysHelper.addDataToMap(customerAddressData.addresses[i], map);
                } else {
                    emarsysHelper.addAddressDataToMap(customerAddressData.addresses[i], map, i);
                }
            }
        }

        /* If customer decides to subscribe from 'Edit Account' page
            in the middle of checkout process add updated data to the map object
        */
        if (Args.SubscriptionType === 'account' && customer.authenticated) {
            emarsysHelper.addDataToMap(customer.profile, map);
        }

        if (!empty(map)) {
            Args.Map = map;
        }
    } catch (err) {
        Logger.error('[Emarsys newsletterHelper.js - getCustomerData()] - ***Get data error message:' + err.message + '\n' + err.stack);
        return Args;
    }

    return Args;
}

/**
 * @description triggers subscribe doubleOptIn
 * @param {Object} args args with email
 * @return {Object} new args
 */
function doubleOptInSubscribe(args) {
    var Args = args;
    var updateData;
    var triggerEvent;
    var updateRequest = {};
    var triggerRequest = {};
    var uid = request.httpParameterMap.uid.stringValue;

    try {
        // get data request
        var getDataRequest = {};
        getDataRequest.keyId = 'uid';
        getDataRequest.keyValues = [uid];

        var getData = emarsysHelper.triggerAPICall('contact/getdata', getDataRequest, 'POST');
        var dataObj;

        // parse getData response to get email
        var email = null;
        if (getData.status === 'OK') {
            dataObj = JSON.parse(getData.object);
            var dataResults = dataObj.data.result;
            if (dataResults) {
                var results = dataResults[0];
                email = results['3'];
            }
        }

        if (email) {
            // request body to update a contact with optIn value set to true
            updateRequest.keyId = 'uid';
            updateRequest.uid = uid;
            updateRequest['31'] = '1';
            updateRequest['3'] = email;
        } else {
            var errors = dataObj.data.errors;
            var errorMsg = null;	// error message to display on a storefront

            if (errors && errors.length > 0) {
                if (uid) {
                    errorMsg = errors[0].errorMsg;
                } else {
                    errorMsg = dw.web.Resource.msg('subscription.no.uid', 'emarsys', null);
                }
            }

            Args.ErrorMsg = errorMsg;
            Logger.error('[Emarsys newsletterHelper.js - doubleOptInSubscribe()] - ***Error message:' + errorMsg);
            return Args;
        }

        if (!empty(updateRequest)) {
            // if source id value exists add it to request
            emarsysHelper.addSourceIdToRequest(updateRequest);

            updateData = emarsysHelper.triggerAPICall('contact', updateRequest, 'PUT');

            if (updateData.status !== 'OK') {
                Logger.error('[Emarsys newsletterHelper.js - doubleOptInSubscribe(); Update data error:' + updateData.error + '] - ***Data error message:' + updateData.errorMessage);
                Args.ErrorMsg = dw.web.Resource.msg('subscription.update.error', 'emarsys', null);
                Args.errors = true;
                return Args;
            }
        }

        // external event id that will be triggered after updating a contact
        var externalEventId = Args.ExternalEventAfterConfirmation;

        if (externalEventId) {
            var endpoint = 'event/' + externalEventId + '/trigger';

            triggerRequest.key_id = 'uid';
            triggerRequest.external_id = uid;
            triggerEvent = emarsysHelper.triggerAPICall(endpoint, triggerRequest, 'POST');

            if (triggerEvent.status !== 'OK') {
                Logger.error('[Emarsys newsletterHelper.js - doubleOptInSubscribe(); Trigger event error:' + triggerEvent.error + '] - ***Error message:' + triggerEvent.errorMessage);
                return null;
            }
        }
    } catch (err) {
        // log error message in case something goes wrong
        Logger.error('[Emarsys newsletterHelper.js - doubleOptInSubscribe()] - ***Subscribe contact data error message:' + err.message + '\n' + err.stack);
        return null;
    }

    return Args;
}

/**
 * @description to read subscription type data from CO
 * @param {string} SubscriptionType - type subscription
 * @return {Object} data optInStrategy
 */
function subscriptionTypeData(SubscriptionType) {
    var args = {};

    try {
        var type = SubscriptionType;
        var co = require('dw/object/CustomObjectMgr').getCustomObject('EmarsysNewsletterSubscription', type);

        if (co.custom.optInStrategy) {
            args.Strategy = co.custom.optInStrategy;
            args.ExternalEventName = co.custom.optInExternalEvent; // name
            args.ExternalEventAfterConfirmationName = co.custom.optInExternalEventAfterConfirmation;
        } else {
            args.Strategy = null;
            args.ExternalEventName = null;
            args.ExternalEventAfterConfirmationName = null;
        }
        // commit the CO modifications and return the processed args
        return args;
    } catch (err) {
        // log error message in case something goes wrong
        Logger.error('[Emarsys newsletterHelper.js - subscriptionTypeData()] - ***Emarsys subscrition type data error message: ' + err.message + '\n' + err.stack);
        return null;
    }
}

/**
 * @description Sends contact data and define if external event should be triggered or not
 * @param {Object} args with email params
 * @return {Object} return Args with new params
 */
function sendDataForDoubleOptIn(args) {
    var Args = args;
    var contactData;
    var sendData;
    var requestObj = {};
    var map = Args.Map;
    try {
        // request body to check if contact already exists
        requestObj.keyId = '3';
        requestObj.keyValues = [Args.Email];
        // send request to check if contact already exists
        contactData = emarsysHelper.triggerAPICall('contact/getdata', requestObj, 'POST');

        // parse response
        var dataObj = JSON.parse(contactData.object);
        var errors = dataObj.data.errors;
        var method = 'PUT';
        var results = null;
        // check for errors
        if (errors.length > 0) {
            var error = errors[0];
            // account does not exist
            if (error.errorCode === 2008) {
                method = 'POST';
            } else {
                Logger.error('[Emarsys newsletterHelper.js sendDataForDoubleOptIn(); Get data error:' + contactData.error + '] - ***Emarsys error message: ' + contactData.errorMessage);
                return null;
            }
        } else {
            var dataResults = dataObj.data.result;
            results = dataResults[0];
        }

        // the value depends on field 31 value in response
        var optIn = results ? results['31'] : null;

        // event will be triggered if optIn status set to false or doesn't set at all
        Args.TriggerEvent = optIn !== '1';
        if (!optIn) {
            if (!map) {
                map = {};
            }
            if (Args.SubscribeToEmails) {
                map['31'] = 2;
            }
        }

        if (map) {
            // this is a new request body that will be sent in case if account doen't exists or it's status for optin is false (null)
            var requestNew = {};
            requestNew.keyId = '3';
            requestNew['3'] = Args.Email;

            // if source id value exists add it to request
            emarsysHelper.addSourceIdToRequest(requestNew);

            // if subscription is called from checkout or signup page addFields function will add fields to request
            emarsysHelper.addFields(map, requestNew);

            sendData = emarsysHelper.triggerAPICall('contact', requestNew, method);

            if (sendData.status !== 'OK') {
                Logger.error('[Emarsys newsletterHelper.js - sendDataForDoubleOptIn(); Update data error:' + sendData.error + '] - ***Emarsys error message: ' + sendData.errorMessage);
                return null;
            }
        }
    } catch (err) {
        // log error message in case something goes wrong
        Logger.error('[Emarsys newsletterHelper.js - sendDataForDoubleOptIn()] - ***Emarsys send contact data error message:' + err.message + '\n' + err.stack);
        return null;
    }

    return Args;
}

/**
 * @description triggers external event
 * @param {Object} args with email params
 * @return {Object} return Args with new params
 */
function triggerExternalEvent(args) {
    var Args = args;
    var triggerEvent;
    var requestObj = {};

    try {
        var externalEventId = Args.ExternalEvent;

        if (externalEventId) {
            var endpoint = 'event/' + externalEventId + '/trigger';

            requestObj.key_id = '3';
            requestObj.external_id = Args.Email;
            triggerEvent = emarsysHelper.triggerAPICall(endpoint, requestObj, 'POST');

            if (triggerEvent.status !== 'OK') {
                Logger.error('[Emarsys newsletterHelper.js triggerExternalEvent(); Trigger event error:' + triggerEvent.error + '] - ***Emarsys error message:' + triggerEvent.errorMessage);
                response.redirect('EmarsysNewsletter-RedirectToErrorPage');
                return Args;
            }
        }
    } catch (err) {
        // log error message in case something goes wrong
        Logger.error('[Emarsys newsletterHelper.js triggerExternalEvent()] - ***Emarsys trigger event data error message:' + err.message + '\n' + err.stack);
        // return null and the redirect for error will be handled externally
        Args.Error = true;
        return Args;
    }
    return Args;
}

/**
 * @description call to get contact data and set corresponding status
 * @param {Object} args with params
 * @param {Object} res the response is transmitted from the controller
 * @return {Object} Args or render error page
 */
function getAccountStatus(args, res) {
    var Args = args;
    var contactData;
    var requestObj = {};

    try {
        requestObj.keyId = '3';
        requestObj.keyValues = [Args.Email];
        requestObj.fields = ['31'];
        // call to get contact data on Emarsys
        contactData = emarsysHelper.triggerAPICall('contact/getdata', requestObj, 'POST');

        if (contactData.status !== 'OK') {
            Logger.error('[Emarsys newsletterHelper.js - getAccountStatus(); Get data error:' + contactData.error + '] - ***Emarsys error message:' + contactData.errorMessage);
            if (Args.SubscriptionType === 'checkout' || !(Args.SubscriptionType === 'account' && Args.EmarsysSignupPage)) {
                return Args;
            }
            res.render('subscription/emarsys_error');
        }

        var dataObj = JSON.parse(contactData.object);
        var errors = dataObj.data.errors;

        if (errors.length > 0) {
            var error = errors[0];
            // check if account exists, error code 2008 means that account wasn't created yet
            if (error.errorCode === 2008) {
                Args.Status = 'NOT REGISTERED';
            }
        } else {
            var dataResults = dataObj.data.result;
            var results = dataResults[0];

            // depending on optIn value (2 = false) set corresponding status
            if (results['31'] === '2') {
                Args.Status = 'NOT FILLED';
            } else {
                Args.Status = 'FILLED';
            }
        }
    } catch (err) {
        // log error message in case something goes wrong
        Logger.error('[Emarsys newsletterHelper.js - getAccountStatus()] - ***Emarsys get contact data error message: ' + err.message + '\n' + err.stack);
        if (Args.SubscriptionType === 'checkout' || !(Args.SubscriptionType === 'account' && Args.EmarsysSignupPage)) {
            return Args;
        }
        res.render('subscription/emarsys_error');
    }
    return Args;
}

/**
 * @description call to create contact data
 * @param {Object} args with params
 * @param {Object} res the response is transmitted from the controller
 * @return {Object} Args or render error page
 */
function submitContactData(args, res) {
    var Args = args;
    var submitData;
    var requestObj = {};
    var map = args.Map;
    var method = args.Method;

    try {
        requestObj.keyId = '3';
        requestObj['3'] = Args.Email;
        // if source id value exists add it to request
        emarsysHelper.addSourceIdToRequest(requestObj);

        // check subscription type before assign value to field 31
        if ((Args.SubscriptionType === 'checkout' && Args.SubscribeToEmails) || (Args.SubscriptionType === 'account' && Args.SubscribeToEmails) || Args.SubscriptionType === 'footer') {
           // if customer checked corresponding checkbox on billing page filed 31 with value 1 (true) added to request
            requestObj['31'] = 1;
        }

        // if subscription is acalled from checkout or signup page addFields function will add fields to request
        emarsysHelper.addFields(map, requestObj);

        // call to create contact data on Emarsys
        submitData = emarsysHelper.triggerAPICall('contact', requestObj, method);

        if (submitData.status !== 'OK') {
            Logger.error('[Emarsys newsletterHelper.js - submitContactData(); Submit data error:' + submitData.error + '] - ***Emarsys error message:' + submitData.errorMessage);
            if (Args.SubscriptionType === 'checkout' || Args.Action === 'create') {
                return Args;
            }
            res.render('subscription/emarsys_error');
        }
    } catch (err) {
        // log error message in case something goes wrong
        Logger.error('[Emarsys newsletterHelper.js - submitContactData()] - ***Emarsys submit contact data error message: ' + err.message + '\n' + err.stack);
        if (Args.SubscriptionType === 'checkout' || Args.Action === 'create') {
            return Args;
        }
        res.render('subscription/emarsys_error');
    }
    return Args;
}

/**
 * @description newsletter triggers call
 * @param {Object} args with params
 * @return {Object} Args or render error page
 */
function newsletterUnsubscribe(args) {
    var Args = args;
    var uid = !empty(Args.passedParams) ? Args.passedParams.uid : Args.uid; // user id
    var cid = !empty(Args.passedParams) ? Args.passedParams.cid : Args.cid; // campaign id
    var lid = !empty(Args.passedParams) ? Args.passedParams.lid : Args.lid; // launch list id
    var direct = !empty(Args.passedParams) ? Args.passedParams.direct : Args.direct; // y or n
    var confirmation = !empty(Args.passedParams) ? Args.passedParams.confirmation : Args.confirmation;

    try {
        if (direct === 'y' || (!empty(confirmation) && confirmation.triggeredAction.formId === 'newsletter_unsubscribe')) {
            Args.showConfirmation = false;

            // 31 : 2 means optin : false
            var requestObj = {};
            requestObj['31'] = '2';
            requestObj.keyId = 'uid';
            requestObj.uid = uid;
            var unsubscribeContact = emarsysHelper.triggerAPICall('contact', requestObj, 'PUT');
            var unsubscribeContactFromCampaign = emarsysHelper.triggerAPICall('email/unsubscribe', { launch_list_id: lid, email_id: cid, contact_uid: uid }, 'POST');

            if (unsubscribeContact.status === 'OK' && unsubscribeContactFromCampaign.status === 'OK') {
                Args.errors = false; // successfully unsubscribed
            } else {
                var errorMessage = unsubscribeContact.errorMessage ? unsubscribeContact.errorMessage : unsubscribeContactFromCampaign.errorMessage;
                var errorMsg = JSON.parse(errorMessage);
                Args.errorText = errorMsg.replyText;
                Args.errors = true; // an error occurred; unsuccessful unsubscription
            }
        } else {
            Args.showConfirmation = true;
            Args.params = { uid: uid, cid: cid, lid: lid, direct: 'y' };
        }
    } catch (err) {
        Logger.error('[Emarsys newsletterHelper.js - newsletterUnsubscribe()] - ***Emarsys newsletter unsubscription error message: ' + err.message + '\n' + err.stack);
        Args.errors = true;
        return Args;
    }

    return Args;
}

/**
 * @description account triggers call
 * @param {string} email - user email
 * @return {Object} return status
 */
function accountUnsubscribe(email) {
    var contactData;
    var request = {};

    if (empty(email)) {
        return {
            status: 'NO EMAIL'
        };
    }

    try {
        request.keyId = '3';
        request.keyValues = [email];
        request.fields = ['31'];

        // call to get contact data on Emarsys
        contactData = emarsysHelper.triggerAPICall('contact/getdata', request, 'POST');

        if (contactData.status !== 'OK') {
            return {
                status: 'API ERROR',
                contactData: contactData
            };
        }

        var dataObj = JSON.parse(contactData.object);

        var errors = dataObj.data.errors;

        if (errors.length > 0) {
            var error = errors[0];
            // check if account exists, error code 2008 means that account wasn't created yet
            if (error.errorCode === 2008) {
                return {
                    status: 'NOT REGISTERED'
                };
            }
        } else {
            request = {};
            request['3'] = email;
            request['31'] = '2';
            request.key_id = '3';

            // if source id value exists add it to request
            emarsysHelper.addSourceIdToRequest(request);

            contactData = emarsysHelper.triggerAPICall('contact', request, 'PUT');
            if (contactData.status !== 'OK') {
                return {
                    status: 'EMARSYSHELPER ERROR',
                    contactData: contactData
                };
            }

            return {
                status: 'SUCCESS'
            };
        }
    } catch (err) {
        Logger.error('[EmarsysNewsletter.js - accountUnsubscribe()] - ***Emarsys unsubscribe error message: ' + err.message + '\n' + err.stack);
        return {
            status: 'GENERAL ERROR'
        };
    }
    return {
        status: 'SUCCESS'
    };
}

module.exports = {
    mapFieldsSignup: mapFieldsSignup,
    getCustomerData: getCustomerData,
    doubleOptInSubscribe: doubleOptInSubscribe,
    subscriptionTypeData: subscriptionTypeData,
    sendDataForDoubleOptIn: sendDataForDoubleOptIn,
    triggerExternalEvent: triggerExternalEvent,
    getAccountStatus: getAccountStatus,
    submitContactData: submitContactData,
    newsletterUnsubscribe: newsletterUnsubscribe,
    accountUnsubscribe: accountUnsubscribe
};
