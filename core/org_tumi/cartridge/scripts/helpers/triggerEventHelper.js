'use strict';

var Site = require('dw/system/Site');
var CustomerMgr = require('dw/customer/CustomerMgr');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var emarsysHelper = new (require('int_emarsys/cartridge/scripts/helpers/emarsysHelper'))();

function createAccountIfNotExist(email, payload) {
    var logger = require('dw/system/Logger');

    var contactData = {};
    contactData.key_id = 3; // search by e-mail
    contactData['3'] = email;// customer e-mail address

    // if source id value exists add it to request
    emarsysHelper.addSourceIdToRequest(contactData);

    if (payload) contactData = payload;

    // Send request to Emarsys. will create an account if doesn't exist, otherwise update the existing one.
    var Contact = emarsysHelper.triggerAPICall('contact/?create_if_not_exists=1', contactData, 'PUT');

    // We couldn't create/update the contact, log the event
    if (!Contact.ok) {
        logger.error('[hook/emails.js] - ***Emarsys order confirmation email error message: Couldn\'t update/create contact for email: ' + order.customerEmail + ', HTTP request (PUT is for updating): ' + contactHTTPRequest);
    }
}

/**
 * @description Set additional parameters into request object
 * @param {Object} context - main context object
 * @param {Object} requestObject - object with request parameters
 * @return {Object} - changed or created request object
 */
function setAdditionalParams(context, requestObject) {
    var requestObj = requestObject || {};
    if (context.profileFields) {
        Object.keys(context.additionalParams).forEach(function (paramName) {
            var param = {};
            param.string_id = paramName;
            param.value = this.additionalParams[paramName];

            var fieldDescription = this.profileFields[param.string_id] || {};
            // get index of field with specified name
            param.id = fieldDescription.id;

            // rewrite specified value by appropriate field option (for single choice fields)
            if (!empty(fieldDescription.isSingleChoice) && !empty(fieldDescription.options)) {
                param.value = fieldDescription.options[param.value];
            }

            // process valid parameters only
            if (!empty(param.id) && !empty(param.value)) {
                this.requestObj[param.id] = param.value;
            }
        }, {
            additionalParams: context.additionalParams,
            requestObj: requestObj,
            profileFields: context.profileFields
        });
    }
    return requestObj;
}

/**
 * @description Triggers specified external event to transmit customer data
 * @param {Object} context - main context object
 * @param {Function} onError - error handler
 * @return {Object} context object
 */
function triggerExternalEvent(context, onError) {
    var response = {};
    var requestObj = {};

    if (!empty(context.externalEventId)) {
        try {
            var endpoint = 'event/' + context.externalEventId + '/trigger';

            // context.additionalParams = { first_name: 'John', last_name: 'Snow', optin: 'True' };
            if (context.additionalParams) {
                requestObj = setAdditionalParams(context);
            }

            requestObj.key_id = context.profileFields.email.id;
            requestObj.external_id = context.email;

            if (context.sfccEventName === 'FORGOT_PASSWORD_SUBMITTED_TESTING') {
                var locale = request.locale;
                var Locale = require('dw/util/Locale');
                var localeObj = Locale.getLocale(locale);
                var resettingCustomer = CustomerMgr.getCustomerByLogin(context.email);
                if (resettingCustomer) {
                    var passwordResetToken;
                    Transaction.wrap(function () {
                        passwordResetToken = resettingCustomer.profile.credentials.createResetPasswordToken();
                    });
                    var resetUrlObj = {};
                    resetUrlObj.Language = localeObj.getLanguage();
                    resetUrlObj.FirstName = resettingCustomer.profile.firstName;
                    resetUrlObj.Country = localeObj.getCountry();
                    resetUrlObj.ORDER_BILLING_ADDRESS_EMAIL = context.email;
                    resetUrlObj.reset_link = URLUtils.https('Account-SetNewPassword', 'Token', passwordResetToken).toString();

                    requestObj.data = resetUrlObj;
                }
            } else if (context.sfccEventName === 'ACCOUNT_VERIFICATION_TESTING') {
                // Send request to Emarsys. will create an account if doesn't exist, otherwise update the existing one.
                createAccountIfNotExist(context.email);

                requestObj.data = {
                    Language: context.language,
                    FirstName: context.firstName,
                    VerificationUrl: context.verificationURL,
                    Country: context.country,
                    LastName: context.lastName,
                    ORDER_BILLING_ADDRESS_EMAIL: context.email
                };
            } else if (context.sfccEventName === 'PROFILE_UPDATE_TESTING') {
                requestObj.data = {
                    Language: context.Language,
                    UpdatePage: context.UpdatePage,
                    FirstName: context.FirstName,
                    Country: context.Country,
                    ORDER_BILLING_ADDRESS_EMAIL: context.ORDER_BILLING_ADDRESS_EMAIL,
                    LastName: context.LastName
                }
            } else if (context.sfccEventName === 'TRACER_REGISTRATION_TESTING') {
                requestObj.data = {
                    ProductName: context.ProductName,
                    FirstName: context.FirstName,
                    LastName: context.LastName,
                    PostalCode: context.PostalCode,
                    Country: context.Country,
                    StateProvince: context.StateProvince,
                    ProductImage: context.ProductImage,
                    City: context.City,
                    StreetAddress1: context.StreetAddress1,
                    StreetAddress2: context.StreetAddress2,
                    TracerNumber: context.TracerNumber,
                    TracerNumber2: context.TracerNumber2,
                    TracerNumber3: context.TracerNumber3,
                    TracerNumber4: context.TracerNumber4,
                    TracerNumber5: context.TracerNumber5,
                    Language: context.Language,
                    PhoneNumber: context.PhoneNumber,
                    ORDER_BILLING_ADDRESS_EMAIL: context.ORDER_BILLING_ADDRESS_EMAIL
                };
            } else if (context.sfccEventName === 'SPECIAL_MARKETS_CUSTOMER_TESTING') {
                createAccountIfNotExist(context.email);
                requestObj.data = {
                    Order: context.Order,
                    Language: context.Language,
                    Country: context.Country,
                    ORDER_BILLING_ADDRESS_EMAIL: context.ORDER_BILLING_ADDRESS_EMAIL,
                };
            } else if (context.sfccEventName === 'SPECIAL_MARKETS_REPRESENTATIVE_TESTING') {
                createAccountIfNotExist(context.email);
                requestObj.external_id = context.email;
                requestObj.data = {
                    Order: context.Order,
                    Language: context.Language,
                    Country: context.Country,
                    ORDER_BILLING_ADDRESS_EMAIL: context.email,
                };
            }

            response = emarsysHelper.triggerAPICall(endpoint, requestObj, 'POST');

            if (response.status !== 'OK') {
                throw new Error(response.errorMessage);
            }
        } catch (err) {
            if (onError) { return onError(err); }
            throw new Error('[Emarsys triggerEventHelper.js triggerExternalEvent()] - ***Emarsys trigger event data error message:' + err.message + '\n' + err.stack);
        }
    }
    return context;
}

/**
 * @description Set external events data to the passed object
 * @param {string} sfccEventName - name of event on sfcc side
 * @param {string} fieldKey - key of field to read in CustomObject
 * @return {Object} specified external event description (mapping)
 */
function getExternalEventData(sfccEventName, fieldKey) {
    var context = {};
    var fieldKeyCO = fieldKey || '';
    try {
        if (empty(sfccEventName)) {
            var eventDesc = {
                emarsysId: null,
                emarsysName: null,
                sfccName: null
            };
            return eventDesc;
        }

        // read other external events description
        var custom = emarsysHelper.readEventsCustomObject('StoredEvents', [fieldKeyCO]);

        context = {
            sfccEventName: sfccEventName,
            result: custom.fields[fieldKeyCO]
        };

        // get emarsys side event name and it's id for Forgot password submitted
        Object.keys(custom.fields[fieldKeyCO]).forEach(function (id) {
            if (this.result[id].sfccName === this.sfccEventName) {
                this.eventDescription = this.result[id];
            }
        }, context);

        if (empty(context.eventDescription) || empty(context.eventDescription.emarsysId)) {
            throw new Error('Event "' + sfccEventName + '" is not mapped. Check "otherResult" fild of "EmarsysExternalEvents" custom object');
        }
    } catch (err) {
        throw new Error('[Emarsys triggerEventHelper.js getExternalEventData()] - ***Get external event description error message:' + err.message + '\n' + err.stack);
    }

    // return description of specified event
    return context.eventDescription;
}

/**
 * @description Collect additional data and run trigger function
 * @param {string} sfccEventName - Emarsys external event
 * @param {Function} extendFunc - extend or assign function to rewrite all properties from incomming object
 * @param {Object} initialData - initial data to set in context object
 */
function processEventTriggering(sfccEventName, extendFunc, initialData) {
    var logger = require('dw/system/Logger').getLogger('emarsys');
    var isEmarsysEnable = Site.getCurrent().getCustomPreferenceValue('emarsysEnabled');
    if (isEmarsysEnable) {
        try {
            var context = extendFunc({}, initialData);

            // get emarsys side external event name and it's id
            context.externalEventId = getExternalEventData(sfccEventName, 'otherResult').emarsysId;
            context.sfccEventName = sfccEventName;

            // get Emarsys profile fields descriptions
            context.profileFields = emarsysHelper.prepareFieldsDescriptions();

            if (!empty(context.externalEventId)) {
                triggerExternalEvent(context);
            }
        } catch (err) {
            logger.error(err.errorMessage);
        }
    }
}

function profileUpdate(profile, data) {
    var assign = require('modules/server/assign');
    var locale = request.locale;
    var localeObj = dw.util.Locale.getLocale(locale);

    if (data.updatePage === 'NewsLetter Preferences') {
        var emarsysAccountPayload = {
            "3": profile.email,
            "14": "185",
            "key_id": "3",
            "10168": "NewsletterPref",
            "31": data.optInEmail ? 1 : 2
        };

        createAccountIfNotExist(profile.email, emarsysAccountPayload);
    }

    var emarsysPayload = {
        Language: localeObj.getLanguage(),
        UpdatePage: data.updatePage,
        FirstName: profile.firstName,
        Country: localeObj.getCountry(),
        ORDER_BILLING_ADDRESS_EMAIL: profile.email,
        LastName: profile.lastName,
        email: profile.email
    };

    var sfccEventName = 'PROFILE_UPDATE_TESTING';
    processEventTriggering(sfccEventName, assign, emarsysPayload);
}

function getItemsJSON(itemsArr, items) {
    var scene7Host = Site.current.getCustomPreferenceValue('scene7Host');
    var scene7Postfix = JSON.parse(Site.current.getCustomPreferenceValue('scene7Postfix'));
    items.map(function (item) {
        var styleVariant = Object.hasOwnProperty.call(item, 'styleVariant') && item.styleVariant ? item.styleVariant : '';
        var imageUrl = !empty(styleVariant) ? (scene7Host + styleVariant + scene7Postfix.main) : '';
        var obj = new Object();
        obj.ItemNumber = item.id;
        obj.ProductColor = item.color ? item.color : '';
        obj.ProductName = item.productName ? item.productName : '';
        obj.ProductImage =  imageUrl ? imageUrl: '';
        obj.Currency = item.price && item.price.sales && item.price.sales.currency ? item.price.sales.currency : '';
        obj.Collection = item.collection ? item.collection : '';
        obj.ProductPrice = item.price && item.price.sales && item.price.sales.value ? parseInt(item.price.sales.value): '';
        itemsArr.push(obj);
    })
}

function specialMarketsProductInquiry(args) {
    var logger = require('dw/system/Logger').getLogger('emarsys');
    var isEmarsysEnable = Site.getCurrent().getCustomPreferenceValue('emarsysEnabled');
    if (isEmarsysEnable) {
        try {
            var assign = require('modules/server/assign');
            var locale = request.locale;
            var localeObj = dw.util.Locale.getLocale(locale);
            var items = args.items;
            var myForm = args.form;

            var itemsArr = [];
            getItemsJSON(itemsArr, items);
            var consignments = [];
            var consObj = new Object();
            consObj = {
                NonRetailGolf: '',
                EstimatedQuantity: myForm.inquiryQuantity ? myForm.inquiryQuantity: '',
                repTumiCode: myForm.inquiryRepresentative ? myForm.inquiryRepresentative: '',
                TargetDate: myForm.inquiryDate ? myForm.inquiryDate: '',
                Customization: myForm.inquiryCustomize ? myForm.inquiryCustomize: '',
                PhoneNumber: myForm.inquiry_phone ? myForm.inquiry_phone: '',
                Country: localeObj.country ? localeObj.country: '',
                DesiredPriceRange: myForm.inquiryPrice ? myForm.inquiryPrice: '',
                Representative: myForm.inquiryRepresentative ? myForm.inquiryRepresentative: '',
                EmailAddress: myForm.inquiryEmail ? myForm.inquiryEmail: '',
                Name: myForm.inquiryName ? myForm.inquiryName: '',
                Items : itemsArr
            }

            consignments.push(consObj);
            var today = new Date();
            var Order = {
                Consignments: consignments,
                InquirySubmitDate: today.getDay() + '/' + today.getMonth() + '/' + today.getFullYear()
            }

            var emarsysPayload = {
                Order: Order,
                Language: localeObj.getLanguage(),
                Country: localeObj.getCountry(),
                ORDER_BILLING_ADDRESS_EMAIL: myForm.inquiryEmail,
                email: myForm.inquiryEmail
            };

            var sfccEventName = 'SPECIAL_MARKETS_CUSTOMER_TESTING';
            processEventTriggering(sfccEventName, assign, emarsysPayload);
            var BusinessEmails = Site.getCurrent().getCustomPreferenceValue('specialMarketsToEmail');
            var BusinessEmailsArr = BusinessEmails ? BusinessEmails.split(','): [];
            for (var i in BusinessEmailsArr) {
                emarsysPayload.email = BusinessEmailsArr[i];
                sfccEventName = 'SPECIAL_MARKETS_REPRESENTATIVE_TESTING';
                processEventTriggering(sfccEventName, assign, emarsysPayload);
            }
        } catch (err) {
            logger.error(err.errorMessage);
        }
    }
}

module.exports = {
    triggerExternalEvent: triggerExternalEvent,
    getExternalEventData: getExternalEventData,
    processEventTriggering: processEventTriggering,
    createAccountIfNotExist: createAccountIfNotExist,
    profileUpdate: profileUpdate,
    specialMarketsProductInquiry: specialMarketsProductInquiry
};
