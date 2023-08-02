'use strict';

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
/**
 * Creates a list of address model for the logged in user
 * @param {string} customerNo - customer number of the current customer
 * @returns {List} a plain list of objects of the current customer's addresses
 */
function getList(customerNo) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var AddressModel = require('*/cartridge/models/address');
    var collections = require('*/cartridge/scripts/util/collections');

    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    var rawAddressBook = customer.addressBook.getAddresses();
    var addressBook = rawAddressBook.toArray().filter(function (rawAddress) {
        var isTracerRegistration = Object.hasOwnProperty.call(rawAddress, 'custom') && rawAddress.custom && Object.hasOwnProperty.call(rawAddress.custom, 'isTracerRegistration') && rawAddress.custom.isTracerRegistration;
        var addressAssociatedWithSavedCard = Object.hasOwnProperty.call(rawAddress, 'custom') && rawAddress.custom && Object.hasOwnProperty.call(rawAddress.custom, 'isAddressAssociatedWithSavedCard') && rawAddress.custom.isAddressAssociatedWithSavedCard;
        if (!isTracerRegistration && !addressAssociatedWithSavedCard) {
            var addressModel = new AddressModel(rawAddress);
            addressModel.address.UUID = rawAddress.UUID;
            return addressModel;
        }
    });
    return addressBook;
}

/**
 * Address-EditAddress : A link to edit and existing address
 * @name Base/Address-EditAddress
 * @function
 * @memberof Address
 * @param {middleware} - csrfProtection.generateToken
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - addressId - a string used to identify the address record
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
 server.append(
    'EditAddress',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var AddressModel = require('*/cartridge/models/address');
        var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
        var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');

        var addressId = req.querystring.addressId;
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var addressBook = customer.getProfile().getAddressBook();
        var rawAddress = addressBook.getAddress(addressId);
        var addressModel = new AddressModel(rawAddress);
        var addressForm = server.forms.getForm('address');
        addressForm.clear();

        addressForm.copyFrom(addressModel.address);

        if (isEmarsysEnable) {
            eventsHelper.profileUpdate(customer.profile, {updatePage: 'Address Book'});
        }

        res.render('account/editAddAddress', {
            addressForm: addressForm,
            addressId: addressId,
            addressBook: getList(req.currentCustomer.profile.customerNo),
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
                    htmlValue: Resource.msg('label.addressbook', 'account', null),
                    url: URLUtils.url('Address-List').toString()
                }
            ]
        });

        next();
    }
);

/**
 * Address-AddAddress : A link to a page to create a new address
 * @name Base/Address-AddAddress
 * @function
 * @memberof Address
 * @param {middleware} - csrfProtection.generateToken
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
 server.append(
    'AddAddress',
    csrfProtection.generateToken,
    consentTracking.consent,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var addressForm = server.forms.getForm('address');
        addressForm.clear();
        res.render('account/editAddAddress', {
            addressForm: addressForm,
            addressBook: getList(req.currentCustomer.profile.customerNo),
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
                    htmlValue: Resource.msg('label.addressbook', 'account', null),
                    url: URLUtils.url('Address-List').toString()
                }
            ]
        });
        next();
    }
);

/**
 * Address-SaveAddress : Save a new or existing address
 * @name Base/Address-SaveAddress
 * @function
 * @memberof Address
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - addressId - a string used to identify the address record
 * @param {httpparameter} - dwfrm_address_addressId - An existing address id (unless new record)
 * @param {httpparameter} - dwfrm_address_firstName - A person’s first name
 * @param {httpparameter} - dwfrm_address_lastName - A person’s last name
 * @param {httpparameter} - dwfrm_address_address1 - A person’s street name
 * @param {httpparameter} - dwfrm_address_address2 -  A person’s apartment number
 * @param {httpparameter} - dwfrm_address_country - A person’s country
 * @param {httpparameter} - dwfrm_address_states_stateCode - A person’s state
 * @param {httpparameter} - dwfrm_address_city - A person’s city
 * @param {httpparameter} - dwfrm_address_postalCode - A person’s united states postel code
 * @param {httpparameter} - dwfrm_address_phone - A person’s phone number
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
 server.replace('SaveAddress', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    var emarsysHelper = new (require('*/cartridge/scripts/helpers/emarsysHelper'))();

    var addressForm = server.forms.getForm('address');
    var addressFormObj = addressForm.toObject();
    addressFormObj.addressForm = addressForm;
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var addressBook = customer.getProfile().getAddressBook();
    if (addressForm.valid) {
        res.setViewData(addressFormObj);
        this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
            var formInfo = res.getViewData();
            formInfo.addressId = formInfo.address1 + ' - ' + formInfo.city + ' - ' + formInfo.postalCode;
            formInfo.addressId = formInfo.addressId.toUpperCase();
            Transaction.wrap(function () {
                var address = null;
                if (formInfo.addressId.equals(req.querystring.addressId) || !addressBook.getAddress(formInfo.addressId)) {
                    address = req.querystring.addressId
                        ? addressBook.getAddress(req.querystring.addressId)
                        : addressBook.createAddress(formInfo.addressId);
                }

                if (address) {
                    if (req.querystring.addressId) {
                        address.setID(formInfo.addressId);
                    }

                    if (formInfo.checkbox) {
                        addressBook.setPreferredAddress(address);
                    }

                    // Save form's address
                    addressHelpers.updateAddressFields(address, formInfo);

                    // Send account edited email
                    accountHelpers.sendAccountEditedEmail(customer.profile);

                    if (isEmarsysEnable) {
                        emarsysHelper.exportCustomerInfo(customer.profile);

                        var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
                        if (isEmarsysEnable) {
                            eventsHelper.profileUpdate(customer.profile, {updatePage: 'Address Book'});
                        }
                    }

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Address-List').toString()
                    });
                } else {
                    formInfo.addressForm.valid = false;
                    res.json({
                        success: false,
                        message: Resource.msg('label.addressbook.alreadyexists', 'account', null),
                        fields: formErrors.getFormErrors(addressForm)
                    });
                }
            });
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(addressForm)
        });
    }
    return next();
});

/**
 * Address-List : Used to show a list of address created by a registered shopper
 * @name Base/Address-List
 * @function
 * @memberof Address
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace('List', csrfProtection.generateToken, userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var addressBooks = getList(req.currentCustomer.profile.customerNo);
    var actionUrls = {
        deleteActionUrl: URLUtils.url('Address-DeleteAddress').toString(),
        listActionUrl: URLUtils.url('Address-List').toString()
    };
    var addressForm = server.forms.getForm('address');
    addressForm.clear();
    var responseObject = {
        isError: false,
        returnHTML : ''
    };

    responseObject.returnHTML = renderTemplateHelper.getRenderedHtml(
        {
            addressForm: addressForm,
            addressBook: getList(req.currentCustomer.profile.customerNo),
            actionUrls: actionUrls,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-MySettings').toString()
                }
            ]
        }, 'account/addressBook');
    res.json(responseObject);
    next();
});

/**
 * Address-SetDefault : Set an address to be the default address
 * @name Base/Address-SetDefault
 * @function
 * @memberof Address
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {querystringparameter} - addressId - a string used to identify the address record
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
 server.replace('SetDefault', userLoggedIn.validateLoggedIn, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

    var addressId = req.querystring.addressId;
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var addressBook = customer.getProfile().getAddressBook();
    var address = addressBook.getAddress(addressId);
    this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
        Transaction.wrap(function () {
            addressBook.setPreferredAddress(address);
        });

        // Send account edited email
        accountHelpers.sendAccountEditedEmail(customer.profile);

        var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
        var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
        if (isEmarsysEnable) {
            eventsHelper.profileUpdate(customer.profile, {updatePage: 'Address Book'});
        }

        var returnObj = {
            success: true
        }

        res.json(returnObj);
    });
    next();
});

module.exports = server.exports();
