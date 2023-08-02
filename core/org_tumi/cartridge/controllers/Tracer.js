'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Resource = require('dw/web/Resource');

/**
 *
 * @param {string} tracerId tracer id
 * @returns {boolean} true or false
 */
function treacerIdType(tracerId) {
    var str0To12 = tracerId.substring(0, 12);
    var str12th = str0To12[11];
    var sum = 0;
    var i;
    for (i = 0; i < 11; i += 1) {
        var singleChar = str0To12.substring(i, i + 1);
        sum += parseInt(singleChar, 10) * (3 - ((i % 2) << 1)); // eslint-disable-line no-bitwise
    }
    sum = (10 - (sum % 10)) % 10;
    return parseInt(str12th, 10) === sum;
}

/**
 *
 * @param {string} tracerId tracer id
 * @returns {boolean} true or false
 */
function validateIfTrue(tracerId) {
    var str12To20 = tracerId.substring(12, 20);
    var str20th = str12To20[7];
    var sum = 0;
    var i;
    for (i = 0; i < 7; ++i) {
        var singleChar = str12To20[i];
        sum += parseInt(singleChar, 10) * (3 - (i % 2 << 1)); // eslint-disable-line no-bitwise
    }
    sum = (10 - sum % 10) % 10;
    return parseInt(str20th, 10) != sum || true;
}

/**
 *
 * @param {string} tracerId tracer id
 * @returns {boolean} true or false
 */
function validateIfFalse(tracerId) {
    var a = 42;
    if (tracerId[9] !== '0' && tracerId[9] !== '1') {
        return false;
    }
    var str7To9 = parseInt(tracerId.substring(7, 9), 10);
    var currentYear = new Date().getFullYear();
    var mouduledYear = currentYear % 100;
    if (str7To9 <= mouduledYear && str7To9 >= 6) {
        var str5To7 = parseInt(tracerId.substring(5, 7), 10);
        return str5To7 <= a;
    }
    return false;
}

/**
 *
 * @param {Object} addressData tracer id
 * @param {String} tracerID tracer id
 * @param {dw.customer.Profile} Profile tracer id
 *
 */
function storeDatainCustomObject(tracerID, addressData, profile) {
    var CustomObjectMgr =require("dw/object/CustomObjectMgr");
    var Transaction = require('dw/system/Transaction');

    var tracerProductsData = profile.custom.tracerRegistrationData;
    tracerProductsData = !empty(tracerProductsData) ? JSON.parse(tracerProductsData) : [];
    tracerProductsData.push({
        tracerId: tracerID,
        email: addressData.email,
        phone: addressData.phone,
        registerDate: new Date().getTime().toString(),
        address1: addressData.address1,
        address2: addressData.address2,
        postalCode: addressData.postalCode,
        city: addressData.city,
        state: addressData.country === 'US' ? addressData.states : '',
        country: addressData.country
    });

    Transaction.wrap(function () {
        var co = CustomObjectMgr.createCustomObject('TumiTracer', tracerID);
        co.custom.currencyIsocode = addressData.country;
        co.custom.deliveryAddressCellphone = addressData.phone;
        co.custom.deliveryAddressCountryIsocode = addressData.country;
        co.custom.deliveryAddressRegionIsocode = addressData.states;
        co.custom.deliveryAddressEmail = addressData.email;
        co.custom.deliveryAddressFirstname = addressData.firstName;
        co.custom.deliveryAddressLastname = addressData.lastName;
        co.custom.deliveryAddressPostalcode = addressData.postalCode;
        co.custom.deliveryAddressStreetname = addressData.address1;
        co.custom.deliveryAddressStreetnumber = addressData.address2;
        co.custom.deliveryAddressTown = addressData.city;
        co.custom.languageIsocode = 'en';
        profile.custom.tracerRegistrationData = JSON.stringify(tracerProductsData);
    });
}

server.get(
    'Show',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var URLParameter = require('dw/web/URLParameter');
        var idFormActionUrl = URLUtils.url('Tracer-ValidateTracer');
        var actionUrl = URLUtils.url('Tracer-ComplteRegistration');
        var tumiTracerForm = server.forms.getForm('tumiTracer');
        var Locale = require('dw/util/Locale');
        var currentLocale = Locale.getLocale(req.locale.id);
        var country = currentLocale.country;

        var isGuestUser = !req.currentCustomer.profile;
        var resources = {
            required: Resource.msg('error.tracerId.missing', 'forms', null),
            range: Resource.msg('error.length.should20', 'forms', null),
            unexpected: Resource.msg('error.not.allowed', 'forms', null)
        };

        var tracerID = req.querystring.tracerID;

        // Janrain redirect
        var returnParams = [];
        returnParams.push(new URLParameter('rurl', '7'));
        if (tracerID) {
            returnParams.push(new URLParameter('tracerID', tracerID));
        }
        var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');
        var janrainrUrlData =  accountHelper.getJanrainReturnUrl(returnParams, 0);
        // Janrain redirect

        tumiTracerForm.clear();
        res.render('tracer', {
            isGuestUser: isGuestUser,
            resources: resources,
            form: tumiTracerForm,
            actionUrl: actionUrl,
            idFormActionUrl: idFormActionUrl,
            tracerID: tracerID,
            janrainrUrlData: janrainrUrlData,
            country: country
        });
        next();
    }
);

server.post('ValidateTracer', function (req, res, next) {
    var tracerIdCount = req.form.tracerIdCount;
    var validIds = [];
    var validationResult = false;
    var errorMessage = '';
    var i;
    for (i = 0; i < tracerIdCount; i += 1) {
        var tracerIdName = 'tracerId' + String(i + 1);
        var tracerId = req.form[tracerIdName];
        var validateType = treacerIdType(tracerId);
        validationResult = validateType ? validateIfTrue(tracerId) : validateIfFalse(tracerId);
        if (validationResult) {
            validIds.push(tracerId);
        }
    }
    if (!validationResult) {
        errorMessage = Resource.msg('invalid.tracer.id', 'common', '');
    }
    res.json({
        validIds: validIds,
        isValid: validationResult,
        errorMessage: errorMessage
    });
    next();
});

server.post('ComplteRegistration', function (req, res, next) {
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var Transaction = require('dw/system/Transaction');
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    var tumiTracerForm = server.forms.getForm('tumiTracer');
    var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var addressData = {
        country: tumiTracerForm.tracerDetails.country.selectedOption,
        title: tumiTracerForm.tracerDetails.title.selectedOption,
        states: tumiTracerForm.tracerDetails.states.stateCode.selectedOption,
        firstName: tumiTracerForm.tracerDetails.firstName.htmlValue,
        lastName: tumiTracerForm.tracerDetails.lastName.htmlValue,
        email: tumiTracerForm.tracerDetails.email.htmlValue,
        emailSubscription: tumiTracerForm.tracerDetails.emailSubscription.htmlValue,
        phone: tumiTracerForm.tracerDetails.phone.htmlValue,
        address1: tumiTracerForm.tracerDetails.address1.htmlValue,
        address2: tumiTracerForm.tracerDetails.address2.htmlValue,
        city: tumiTracerForm.tracerDetails.city.htmlValue,
        postalCode: tumiTracerForm.tracerDetails.postalCode.htmlValue,
        tracerIds: tumiTracerForm.tracerDetails.tracerId.htmlValue,
        addressId: tumiTracerForm.tracerDetails.addressId.htmlValue
    };

    try {
        var customer = req.currentCustomer.raw;
        var profile = customer.getProfile();
        var tracerProductsData = profile.custom.tracerRegistrationData;
        tracerProductsData = !empty(tracerProductsData) ? JSON.parse(tracerProductsData) : null;
        var tracerIDs = [];
        if (tracerProductsData) {
            tracerProductsData.forEach(function (tracerProduct) {
                tracerIDs.push(tracerProduct.tracerId);
            });
        }
        var splitTracerID = addressData.tracerIds.split(',');

        // validate
        var isValid = true;
        var errMessages = [];
        var CustomObjectMgr = require("dw/object/CustomObjectMgr");
        splitTracerID.forEach(function (tracerID) {
            var customObject = CustomObjectMgr.getCustomObject('TumiTracer', tracerID);
            if (customObject || tracerIDs.indexOf(tracerID) > -1) {
                isValid = false;
                errMessages.push(Resource.msg('tracer.already.registered', 'common', null));
            } else {
                errMessages.push('');
            }
        });

        if (!isValid) {
            res.json({
                error: true,
                errMessages: errMessages
            });
            return this.emit('route:Complete', req, res);
        }

        splitTracerID.forEach(function (tracerID) {
            storeDatainCustomObject( tracerID, addressData, profile );
        });

        // var address;
        // var customer = req.currentCustomer.raw;
        // var addressBook = customer.getAddressBook();
        // if (addressBook) {
        //     Transaction.wrap(function () {
        //         address = addressBook.createAddress(addressData.addressId);
        //         address.setID(addressData.addressId);
        //         addressHelpers.updateAddressFields(address, addressData);
        //         address.custom.isTracerRegistration = true;
        //         address.custom.tracerRegistrations = addressData.tracerIds;
        //     });
        // }

        if (isEmarsysEnable && addressData) {
            var locale = request.locale;
            var localeObj = dw.util.Locale.getLocale(locale);

            var emarsysPayload = {
                ProductName: 'Tracer Style Product',
                FirstName: addressData.firstName ? addressData.firstName : '',
                LastName: addressData.lastName ? addressData.lastName : '',
                PostalCode: addressData.postalCode ? addressData.postalCode : '',
                Country: addressData.country ? addressData.country : '',
                StateProvince: addressData.states ? addressData.states : '',
                ProductImage: '',
                City: addressData.city ? addressData.city : '',
                StreetAddress1: addressData.address1 ? addressData.address1 : '',
                StreetAddress2: addressData.address2 ? addressData.address2 : '',
                TracerNumber: splitTracerID && splitTracerID[0] ? splitTracerID[0] : '',
                TracerNumber2: splitTracerID && splitTracerID[1] ? splitTracerID[1] : '',
                TracerNumber3: splitTracerID && splitTracerID[2] ? splitTracerID[2] : '',
                TracerNumber4: splitTracerID && splitTracerID[3] ? splitTracerID[3] : '',
                TracerNumber5: splitTracerID && splitTracerID[4] ? splitTracerID[4] : '',
                Language: localeObj.getLanguage(),
                PhoneNumber: addressData.phone ? addressData.phone : '',
                ORDER_BILLING_ADDRESS_EMAIL: addressData.email ? addressData.email : '',
                email: addressData.email ? addressData.email : ''
            };

            var assign = require('modules/server/assign');
            var sfccEventName = 'TRACER_REGISTRATION_TESTING';
            eventsHelper.processEventTriggering(sfccEventName, assign, emarsysPayload);
        }

        var template = new Template('tracerRegDone');
        var context = new HashMap();
        var object = { email: addressData.email ? addressData.email : '' };

        Object.keys(object).forEach(function (key) {
            context.put(key, object[key]);
        });

        res.json({
            error: false,
            renderedTemplate: template.render(context).text
        });
    }
    catch(e) {
        res.json({
            error: true,
            errorMessage: Resource.msg('tracer.already.registered', 'common', null)
        });
        return next();
    }
    next();
});

server.get('List', function (req, res, next) {
    try {
        var URLUtils = require('dw/web/URLUtils');
        var ArrayList = require('dw/util/ArrayList');
        var PagingModel = require('dw/web/PagingModel');
        var Logger = require('dw/system/Logger');
        var customer = req.currentCustomer.raw;
        var profile = customer.getProfile();
        if (profile) {
            var pagingModel;
            var showMoreButton = true;
            var moreUrl = null;
            var products = [];
            var pageStart = parseInt(req.querystring.pagestart, 10);
            var pageSize = parseInt(req.querystring.pagesize, 10);
            // var itemSize = parseInt(req.querystring.itemsize, 10);
            var ajaxCall = req.querystring.ajaxcall;
            var tracerProductsData = profile.custom.tracerRegistrationData;
            tracerProductsData = !empty(tracerProductsData) ? JSON.parse(tracerProductsData) : null;
            if (tracerProductsData) {
                var tracerProducts = new ArrayList(tracerProductsData);
                pagingModel = new PagingModel(tracerProducts);
                pagingModel.setStart(pageStart);
                pagingModel.setPageSize(pageSize);

                var totalProductCount = pagingModel.count;

                if (pageStart + pageSize >= totalProductCount) {
                    showMoreButton = false;
                }

                moreUrl = URLUtils.url('Tracer-List', 'pagesize', pageSize, 'pagestart', pageStart + pageSize).toString();

                var iter = pagingModel.pageElements;
                while (iter !== null && iter.hasNext()) {
                    var product = iter.next();
                    products.push(product);
                }
            } else {
                showMoreButton = false;
            }

            res.render('tracerList', {
                products: products,
                moreUrl: moreUrl,
                showMoreButton: showMoreButton,
                pageStart: pageStart,
                pageSize: pageSize,
                // itemSize: itemSize,
                ajaxCall: ajaxCall,
                sizeList: ['5', '10', '15', '20']
            });
        } else {
            res.redirect('Home-Show');
        }
    } catch (e) {
        var x = e;
        Logger.error('Error while displaying tracer products: ', e.message);
    }
    next();
});


module.exports = server.exports();
