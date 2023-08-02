'use strict';
/**
 * @description Checks if contact exists and updates/creates a contact with order billngAddress object details.
 * Sends a call to emarsys with shipping details in request for each shipped order
 */

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');

var OrderStatusChangeNotification = {
    /** @type {dw.system.Log} */
    logger: require('dw/system/Logger').getLogger('OrderStatusChange', 'OrderStatusChange'),

    execute: function (args) {
        this.jobStatus = 'OK';

        if (args.isDisabled) {
            return new Status(Status[this.jobStatus], 'OK', 'Step disabled, skip it...');
        }

        try {
            this.emarsysHelper = new (require('int_emarsys/cartridge/scripts/helpers/emarsysHelper'))();

            switch (args.stepFunctional) {
                case 0:
                    // get all orders with status 'SHIPPED', that are marked for shipping confirmation emails and the email has not been sent yet
                    this.orders = OrderMgr.searchOrders('shippingStatus = {0} AND custom.sendEmarsysShippingEmail = {1} AND NOT custom.emarsysShippingEmailSent = {2}', null, Order.SHIPPING_STATUS_SHIPPED, true, true);
                    this.co = CustomObjectMgr.getCustomObject('EmarsysTransactionalEmailsConfig', 'shipping'); // custom object that stores config for shipping emails
                    this.orderCustomAttr = 'emarsysShippingEmailSent';
                    break;
                case 1:
                    // get all orders with status 'CANCELLED', that are marked for cancelled order confirmation emails and the email has not been sent yet
                    this.orders = OrderMgr.searchOrders('status = {0} AND NOT custom.emarsysCancelledOrderEmailSent = {1}', null, Order.ORDER_STATUS_CANCELLED, true);
                    this.co = CustomObjectMgr.getCustomObject('EmarsysTransactionalEmailsConfig', 'orderCancelledConf'); // custom object that stores config for cancelled order emails
                    this.orderCustomAttr = 'emarsysCancelledOrderEmailSent';
                    break;
                default:
                    this.logger.error('[Emarsys OrderStatusСhangeNotification.js] - ***OrderStatusСhangeNotification error message: wrong stepFunctional');
                    this.jobStatus = 'ERROR';
                    break;
            }

            if (this.jobStatus === 'OK') {
                this.sendOrderChange();
            }
        } catch (err) {
            this.logger.error('[Emarsys OrderStatusСhangeNotification.js] - ***OrderStatusСhangeNotification error message: ' + err.message + '\n' + err.stack);
            return new Status(Status.ERROR, 'ERROR');
        }

        return new Status(Status[this.jobStatus], this.jobStatus);
    },
    /**
     * @description Checks a contact with order billngAddress object details. Sends a call to emarsys
     * @returns {void}
     */
    sendOrderChange: function () {
        if (!Object.prototype.hasOwnProperty.call(this.co.custom, 'mappedFields')
        || !Object.prototype.hasOwnProperty.call(this.co.custom, 'externalEvent')) {
            this.logger.error('[Emarsys OrderStatusСhangeNotification.js] - ***OrderStatusСhangeNotification error message: mappedFields or externalEvent is empty, must check custom object "EmarsysTransactionalEmailsConfig"');
            this.jobStatus = 'ERROR';

            return new Status(Status.ERROR, 'ERROR');
        }

        var getContactData;
        var submitContactData;
        var triggerEvent;

        var method = 'PUT';
        var genderCodes = JSON.parse(Site.getCurrent().getCustomPreferenceValue('emarsysGenderCodes'));
        var mappedFields = JSON.parse(this.co.custom.mappedFields);
        var externalEventId = this.co.custom.externalEvent;

        while (this.orders.hasNext()) {
            try {
                var order = this.orders.next();
                var email = order.customerEmail;

                // object to store emarsys fields codes and billingAddress attributes
                var billingAddressMap = {};

                this.emarsysHelper.addDataToMap(order.billingAddress, billingAddressMap);

                // base request to check if contact already exists
                var baseRequest = {
                    keyId: '3',
                    keyValues: [email]
                };

                // call to check if contact already exists
                getContactData = this.emarsysHelper.triggerAPICall('contact/getdata', baseRequest, 'POST');
                if (getContactData.status !== 'OK') {
                    this.logger.error('[Emarsys OrderStatusСhangeNotification.js - Get data error:' + getContactData.error + '] - ***Emarsys error message: ' + getContactData.errorMessage);
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
                this.emarsysHelper.addSourceIdToRequest(contactDataToSubmit);

                // add billing address fields
                this.emarsysHelper.addFields(billingAddressMap, contactDataToSubmit);

                // map gender string value to a scalar
                if (order.customer.profile && order.customer.profile.gender.value !== 0) {
                    var code = genderCodes[order.customer.profile.gender.value];
                    contactDataToSubmit['5'] = code;
                }

                // call to Emarsys to update/create contact data
                submitContactData = this.emarsysHelper.triggerAPICall('contact', contactDataToSubmit, method);
                if (submitContactData.status !== 'OK') {
                    this.logger.error('[Emarsys OrderStatusСhangeNotification.js - Submit data error:' + submitContactData.error + '] - ***Emarsys error message: ' + submitContactData.errorMessage);
                }

                // order change data to send
                var requestData = {
                    key_id: '3',
                    external_id: email,
                    data: {
                        global: {},
                        products: []
                    }
                };

                // add order fields to global object
                this.emarsysHelper.appendGlobalMappedFieldsObject(mappedFields, requestData.data.global, order);

                // add products info
                this.emarsysHelper.appendProductInfo(mappedFields, order, requestData.data.products);

                if (externalEventId) {
                    var endpoint = 'event/' + externalEventId + '/trigger';
                    triggerEvent = this.emarsysHelper.triggerAPICall(endpoint, requestData, 'POST');

                    if (triggerEvent.status !== 'OK') {
                        this.jobStatus = 'ERROR';
                        this.logger.error('[Emarsys OrderStatusСhangeNotification.js - Trigger event error:' + triggerEvent.error + '] - ***Emarsys error message: ' + triggerEvent.errorMessage);
                    } else {
                        order.custom[this.orderCustomAttr] = true;
                    }
                }
            } catch (err) {
                this.logger.error('[Emarsys OrderStatusСhangeNotification.js] - ***Submit data error message: ' + err.message + '\n' + err.stack);
                return new Status(Status.ERROR, 'ERROR');
            }
        }
        return new Status(Status[this.jobStatus], this.jobStatus);
    }
};

exports.execute = OrderStatusChangeNotification.execute.bind(OrderStatusChangeNotification);
