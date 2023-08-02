/* eslint-disable */
'use strict';

var page = module.superModule;
var server = require('server');

var Site = require('dw/system/Site');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var IsCartridgeEnabled = Site.getCurrent().getCustomPreferenceValue('IsCartridgeEnabled');

server.extend(page);

function verifyCard(card, form) {
    var collections = require('*/cartridge/scripts/util/collections');
    var Resource = require('dw/web/Resource');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');

    var paymentCard = PaymentMgr.getPaymentCard(card.cardType);
    var error = false;
    var cardNumber = card.cardNumber;
    var creditCardStatus;
    var formCardNumber = form.cardNumber;

    if (paymentCard) {
        creditCardStatus = paymentCard.verify(
            card.expirationMonth,
            card.expirationYear,
            cardNumber
        );
    } else {
        formCardNumber.valid = false;
        formCardNumber.error = Resource.msg('error.message.creditnumber.invalid', 'forms', null);
        error = true;
    }
    if (creditCardStatus && creditCardStatus.error) {
        collections.forEach(creditCardStatus.items, function (item) {
            switch (item.code) {
                case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                    formCardNumber.valid = false;
                    formCardNumber.error = Resource.msg('error.message.creditnumber.invalid', 'forms', null);
                    error = true;
                    break;

                case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                    var expirationMonth = form.expirationMonth;
                    var expirationYear = form.expirationYear;
                    expirationMonth.valid = false;
                    expirationMonth.error = Resource.msg('error.message.creditexpiration.expired', 'forms', null);
                    expirationYear.valid = false;
                    error = true;
                    break;
                default:
                    error = true;
            }
        });
    }
    return error;
}

server.get('SetDefaultPaymentInstrument', userLoggedIn.validateLoggedIn, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var array = require('*/cartridge/scripts/util/array');
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var UUID = req.querystring.UUID;
    this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
        var wallet = customer.getProfile().getWallet();
        var payments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).toArray().sort(function (a, b) {
            return b.getCreationDate() - a.getCreationDate();
        });
        var paymentToSetDefault = array.find(payments, function (item) {
            return UUID === item.UUID;
        });
        var ccNumber = req.querystring.cardNumber;
        for (var i = 0; i < payments.length; i += 1) {
            Transaction.wrap(function () {
                payments[i].custom.defaultPaymentCard = false;
            });
        }
        Transaction.wrap(function () {
            paymentToSetDefault.custom.defaultPaymentCard = true;
        });

        var returnObj = {
            success: true
        }

        res.json(returnObj);
    });
    next();
});

/**
 * Creates an object from form values
 * @param {Object} paymentForm - form object
 * @returns {Object} a plain object of payment instrument
 */
function getDetailsObject(paymentForm) {
    var firstName;
    var lastName;
    var counter = paymentForm.cardOwner.value.indexOf(' ');
    if (counter == -1) {
        firstName = paymentForm.cardOwner.value;
        lastName = ' ';
    } else {
        firstName = paymentForm.cardOwner.value.substr(0, counter);
        lastName = paymentForm.cardOwner.value.substr(counter + 1);
    }
    return {
        name: paymentForm.cardOwner.value,
        cardNumber: paymentForm.cardNumber.value,
        cardType: paymentForm.cardType.value,
        expirationMonth: paymentForm.expirationMonth.value,
        expirationYear: paymentForm.expirationYear.value,
        paymentForm: paymentForm,
        address1: paymentForm.addressFields.address1.value,
        firstName: firstName,
        lastName: lastName,
        city: paymentForm.addressFields.city.value,
        stateCode: paymentForm.addressFields.states.stateCode.value,
        postalCode: paymentForm.addressFields.postalCode.value
    };
}

/**
 * reset an object from form values
 * @param {Object} paymentForm - form object
 * @returns {Object} a plain object of payment instrument
 */
// eslint-disable-next-line
function setDetailsObject(paymentForm) {
    return {
        name: '',
        cardNumber: '',
        cardType: '',
        expirationMonth: '',
        expirationYear: '',
        paymentForm: ''
    };
}

/**
 * Saves a  customer credit card payment instrument.
 * @param {Object} params
 * @param {dw.customer.CustomerPaymentInstrument} params.PaymentInstrument - credit card object.
 * @param {dw.web.FormGroup} params.CreditCardFormFields - new credit card form.
 */
function savePaymentInstrument(params) {
    var paymentInstrument = params.PaymentInstrument;
    var creditCardFields = params.CreditCardFields;
    paymentInstrument.setCreditCardHolder(creditCardFields.name);
    paymentInstrument.setCreditCardNumber(creditCardFields.cardNumber);
    paymentInstrument.setCreditCardType(creditCardFields.cardType);
    paymentInstrument.setCreditCardExpirationMonth(creditCardFields.expirationMonth);
    paymentInstrument.setCreditCardExpirationYear(creditCardFields.expirationYear);
}

function cardSaveLimit(Profile) {
    var profile = Profile;
    var addCardLimit = false;
    var savedCCTimeNew = false;
    var savedCCTime = false;
    var addCardLimitError = false;
    // var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger');
    var cyberSourceHelper = require('*/cartridge/scripts/cybersource/libCybersource').getCybersourceHelper();

    var LimitSavedCardRateEnabled = !empty(cyberSourceHelper.getLimitSavedCardRate()) ? cyberSourceHelper.getLimitSavedCardRate() : false;

    if (!LimitSavedCardRateEnabled) {
        addCardLimit = true;
    } else {
        try {
            var SavedCardLimitTimeFrame = !empty(cyberSourceHelper.getSavedCardLimitTimeFrame()) ? cyberSourceHelper.getSavedCardLimitTimeFrame() : 0;
            var SavedCardLimitCount = !empty(cyberSourceHelper.getSavedCardLimitFrame()) ? cyberSourceHelper.getSavedCardLimitFrame() : 0;

            if ('savedCCRateLookBack' in profile.custom && !empty(profile.custom.savedCCRateLookBack)) {
                var customerTime = profile.custom.savedCCRateLookBack;
                var currentTime = new Date();
                var difference = new Date().setTime(Math.abs(currentTime - customerTime));
                var differenceInSec = Math.floor(difference / 1000);
                if (differenceInSec < SavedCardLimitTimeFrame * 60 * 60) {
                    if ('savedCCRateCount' in profile.custom && (profile.custom.savedCCRateCount < SavedCardLimitCount)) {
                        Transaction.wrap(function () {
                            profile.custom.savedCCRateCount += 1;
                        });
                    } else {
                        addCardLimitError = true;
                    }
                } else {
                    addCardLimit = true;
                    savedCCTimeNew = true;
                }
            } else {
                addCardLimit = true;
                savedCCTimeNew = true;
            }
        } catch (e) {
            Logger.error('Error Processed while adding card: ', e.message);
        }
    }
    var result = {
        addCardLimit: addCardLimit,
        savedCCTimeNew: savedCCTimeNew,
        savedCCTime: savedCCTime,
        addCardLimitError: addCardLimitError
    };
    return result;
}

/**
 * Creates a list of expiration years from the current year
 * @returns {List} a plain list of expiration years from current year
 */
function getExpirationYears() {
    var currentYear = new Date().getFullYear();
    var creditCardExpirationYears = [];

    for (var i = 0; i < 10; i++) {
        creditCardExpirationYears.push((currentYear + i).toString());
    }

    return creditCardExpirationYears;
}

/**
 * PaymentInstruments-AddPayment : The endpoint PaymentInstruments-AddPayment endpoint renders the page that allows a shopper to save a payment instrument to their account
 * @name Base/PaymentInstruments-AddPayment
 * @function
 * @memberof PaymentInstruments
 * @param {middleware} - csrfProtection.generateToken
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace(
    'AddPayment',
    csrfProtection.generateToken,
    consentTracking.consent,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var Resource = require('dw/web/Resource');
        var AccountModel = require('*/cartridge/models/account');

        var creditCardExpirationYears = getExpirationYears();
        var paymentForm = server.forms.getForm('creditCard');
        paymentForm.clear();
        var months = paymentForm.expirationMonth.options;
        for (var j = 0, k = months.length; j < k; j++) {
            months[j].selected = false;
        }
        var paymentInstruments = AccountModel.getCustomerPaymentInstrumentsWithAddress(
            req.currentCustomer.wallet.paymentInstruments, req.currentCustomer.profile.customerNo
        );
        res.render('account/payment/addPayment', {
            paymentForm: paymentForm,
            paymentInstruments: paymentInstruments,
            expirationYears: creditCardExpirationYears,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                },
                {
                    htmlValue: Resource.msg('page.heading.payments', 'payment', null),
                    url: URLUtils.url('PaymentInstruments-List').toString()
                }
            ]
        });

        next();
    }
);
server.replace('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    var subscriptionError = null;
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var AccountModel = require('*/cartridge/models/account');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var enableTokenization = dw.system.Site.getCurrent().getCustomPreferenceValue('CsTokenizationEnable').value;
    if (enableTokenization.equals('YES')) {
        var wallet = customer.getProfile().getWallet();
        var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
        if (('SubscriptionError' in session.privacy) && !empty(session.privacy.SubscriptionError)) {
            subscriptionError = session.privacy.SubscriptionError;
            session.privacy.SubscriptionError = null;
        }
        var migrateCard = require('*/cartridge/scripts/helper/migrateOldCardToken');
        migrateCard.MigrateOldCardToken(paymentInstruments);
    }
    res.CONTENT_SECURITY_POLICY = "default-src 'self'";
    var paymentInstruments = AccountModel.getCustomerPaymentInstrumentsWithAddress(
        req.currentCustomer.wallet.paymentInstruments, req.currentCustomer.profile.customerNo
    );
    
    var responseObject = {
        isError: false,
        returnHTML : ''
    };
    responseObject.returnHTML = renderTemplateHelper.getRenderedHtml({
        paymentInstruments: paymentInstruments,
        SubscriptionError: subscriptionError,
        actionUrl: URLUtils.url('PaymentInstruments-DeletePayment').toString(),
        breadcrumbs: [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            }
        ]
    },'account/payment/payment');
    res.json(responseObject);
    next();
});

server.replace('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var HookMgr = require('dw/system/HookMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');
    var verifyDuplicates = false;
    var tokenizationResult = { subscriptionID: '', error: '' };
    var PaymentInstrumentUtils = require('*/cartridge/scripts/utils/PaymentInstrumentUtils');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var paymentForm = server.forms.getForm('creditCard');
    var result = getDetailsObject(paymentForm);
    var firstName;
    var lastName;

    if (paymentForm.valid && !verifyCard(result, paymentForm)) {
        res.setViewData(result);
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var URLUtils = require('dw/web/URLUtils');
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var Transaction = require('dw/system/Transaction');

            var formInfo = res.getViewData();
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );

            var cardOwnerNamesplit = formInfo.paymentForm.cardOwner.value.split(' ');
            if (cardOwnerNamesplit.length > 1) {
                firstName = cardOwnerNamesplit[0];
                lastName = cardOwnerNamesplit[cardOwnerNamesplit.length - 1];
            } else {
                firstName = formInfo.paymentForm.cardOwner.value;
                lastName = formInfo.paymentForm.cardOwner.value;
            }
            session.forms.creditCard.addressFields.firstName.value = firstName;
            session.forms.creditCard.addressFields.lastName.value = lastName;
            formInfo.lastName = lastName;

            var processor = PaymentMgr.getPaymentMethod(dwOrderPaymentInstrument.METHOD_CREDIT_CARD).getPaymentProcessor();
            var enableTokenization = dw.system.Site.getCurrent().getCustomPreferenceValue('CsTokenizationEnable').value;
            if (enableTokenization.equals('YES') && HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
                verifyDuplicates = true;
                tokenizationResult = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(), 'CreatePaymentToken', 'account');
            }
            var firstPaymentInstrument = false;
            var payments = customer.getProfile().getWallet().getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).toArray().sort(function (a, b) {
                return b.getCreationDate() - a.getCreationDate();
            });
            if (!payments[0]) {
                firstPaymentInstrument = true;
            }
            var ccNumber = formInfo.cardNumber;
            var isDuplicateCard = false;
            var oldCard;

            for (var i = 0; i < payments.length; i += 1) {
                var card = payments[i];
                if (card.creditCardExpirationMonth === formInfo.expirationMonth && card.creditCardExpirationYear === formInfo.expirationYear
                    && card.creditCardType === formInfo.cardType && (card.getCreditCardNumber().indexOf(ccNumber.substring(ccNumber.length - 4)) > 0)) {
                    isDuplicateCard = true;
                    oldCard = card;
                    break;
                }
            }
            PaymentInstrumentUtils.removeDuplicates(formInfo);
            if (!isDuplicateCard) {
                if (!tokenizationResult.error) {
                    var wallet = customer.getProfile().getWallet();
                    Transaction.begin();
                    if (verifyDuplicates) {
                        PaymentInstrumentUtils.removeDuplicates(formInfo);
                    }
                    var paymentInstrument = wallet.createPaymentInstrument(dwOrderPaymentInstrument.METHOD_CREDIT_CARD);
                    var addressBook = customer.getProfile().getAddressBook();
                    var addressId = formInfo.address1 + ' - ' + formInfo.city + ' - ' + formInfo.postalCode;
                    var cardAddress = addressBook.getAddress(addressId);
                    if (!cardAddress) {
                        cardAddress = addressBook.createAddress(addressId);
                        if (cardAddress) {
                            cardAddress.setID(addressId);
                            addressHelpers.updateAddressFields(cardAddress, formInfo);
                            cardAddress.custom.isAddressAssociatedWithSavedCard = true;
                            cardAddress.setID(addressId);
                            cardAddress.setPhone(formInfo.paymentForm.addressFields.phone.value || '');
                            cardAddress.setStateCode(formInfo.stateCode);
                            cardAddress.setCountryCode(formInfo.paymentForm.addressFields.country.value);
                            paymentInstrument.custom.cardAddressReference = addressId;

                            if (firstPaymentInstrument == true) {
                                paymentInstrument.custom.defaultPaymentCard = true;
                            } else if(formInfo.paymentForm.makeDefaultCard.checked) {
                                for (var i = 0; i < payments.length; i += 1) {
                                    payments[i].custom.defaultPaymentCard = false;
                                }
                                paymentInstrument.custom.defaultPaymentCard = true;
                            } else {
                                paymentInstrument.custom.defaultPaymentCard = false;
                            }
                        }
                    } else {
                        addressHelpers.updateAddressFields(cardAddress, formInfo);
                        cardAddress.setStateCode(formInfo.stateCode);
                        cardAddress.setPhone(formInfo.paymentForm.addressFields.phone.value || '');
                        cardAddress.custom.isAddressAssociatedWithSavedCard = true;
                        paymentInstrument.custom.cardAddressReference = addressId;

                        if (firstPaymentInstrument == true) {
                            paymentInstrument.custom.defaultPaymentCard = true;
                        } else if(formInfo.paymentForm.makeDefaultCard.checked) {
                            for (var i = 0; i < payments.length; i += 1) {
                                payments[i].custom.defaultPaymentCard = false;
                            }
                            paymentInstrument.custom.defaultPaymentCard = true;
                        } else {
                            paymentInstrument.custom.defaultPaymentCard = false;
                        }
                    }
                    savePaymentInstrument({ PaymentInstrument: paymentInstrument, CreditCardFields: formInfo });

                    if (!empty(tokenizationResult.subscriptionID)) {
                        paymentInstrument.custom.isCSToken = true;
                        paymentInstrument.setCreditCardToken(tokenizationResult.subscriptionID);
                    }

                    Transaction.commit();
                    // Reseting the formData because response had CC#
                    res.setViewData(setDetailsObject(paymentForm));

                    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
                    var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
                    if (isEmarsysEnable) {
                        eventsHelper.profileUpdate(customer.profile, {updatePage: 'Payment Information'});
                    }

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
                    });
                } else {
                    res.json({
                        success: false,
                        message: tokenizationResult.subscriptionError,
                        fields: formErrors.getFormErrors(paymentForm)
                    });
                }
            } else {
                res.json({
                    success: false,
                    message: 'Card Already Exists',
                    fields: formErrors.getFormErrors(paymentForm)
                });
            }
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(paymentForm)
        });
    }
    return next();
});

server.prepend('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    // var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    // var Logger = require('dw/system/Logger');
    var customerProfile = customer.getProfile();
    var saveCard = cardSaveLimit(customerProfile);
    if (saveCard.addCardLimitError) {
        res.json({
            success: false,
            message: Resource.msg('error.message.addcard.fail', 'cybersource', null)
        });
        this.emit('route:Complete', req, res);
    } else {
        if (saveCard.addCardLimit && saveCard.savedCCTimeNew) {
            Transaction.wrap(function () {
                customerProfile.custom.savedCCRateLookBack = new Date();
                customerProfile.custom.savedCCRateCount = 1;
            });
        }
        next();
    }
});

server.append('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var array = require('*/cartridge/scripts/util/array');
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var UUID = req.querystring.UUID;
    var paymentToDelete = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });

    this.removeListener('route:BeforeComplete');
    this.on('route:BeforeComplete', function () {
        var subscriptionError;
        var subscriptionID;
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Transaction = require('dw/system/Transaction');
        var Resource = require('dw/web/Resource');
        var payment = res.getViewData();

        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );

        var wallet = customer.getProfile().getWallet();
        var enableTokenization = dw.system.Site.getCurrent().getCustomPreferenceValue('CsTokenizationEnable').value;

        if (!empty(paymentToDelete)) {
            subscriptionID = paymentToDelete.raw.creditCardToken;
        }

        //  Will make delete token call even if tokenization has been turned off since card was saved.
        if (!empty(paymentToDelete) && (enableTokenization.equals('YES') || !empty(subscriptionID))) {
            //  If a card was saved while tokenization was disabled it will not have a token.  No need to make delete call.
            if (!empty(subscriptionID) && 'custom' in paymentToDelete.raw && 'isCSToken' in paymentToDelete.raw.custom
                && paymentToDelete.raw.custom.isCSToken) {
                var CybersourceSubscription = require('*/cartridge/scripts/Cybersource');
                var deleteSubscriptionBillingResult = CybersourceSubscription.DeleteSubscriptionAccount(subscriptionID);
                if (deleteSubscriptionBillingResult.error) {
                    subscriptionError = deleteSubscriptionBillingResult.reasonCode + '-' + deleteSubscriptionBillingResult.decision;
                    session.privacy.SubscriptionError = subscriptionError;
                }
            }
        }

        if (empty(subscriptionError)) {
            Transaction.wrap(function () {
                wallet.removePaymentInstrument(payment.raw);
            });
            if (req.querystring.source === 'checkout') {
                server.forms.getForm('billing').clear();
            }
        }
        paymentInstruments = wallet.getPaymentInstruments();
        if (paymentInstruments.length === 0) {
            res.json({
                UUID: UUID,
                message: Resource.msg('msg.no.saved.payments', 'payment', null)
            });
        } else if (!empty(subscriptionError)) {
            res.json({
                UUID: UUID,
                message: subscriptionError
            });
        } else {
            res.json({ UUID: UUID });
        }
    });
    return next();
});

module.exports = server.exports();
