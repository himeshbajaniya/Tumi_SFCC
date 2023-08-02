'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var rfkSitePreferences = require('*/cartridge/scripts/middleware/rfkSitePreferences');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger').getLogger('tumiLoginAPI', 'tumiLoginAPI');
/**
 * Account-Show : The Account-Show endpoint will render the shopper's account page. Once a shopper logs in they will see is a dashboard that displays profile, address, payment and order information.
 * @name Base/Account-Show
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {serverfunction} - append
 */
 server.append(
    'Show',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {

        next();
    }, rfkSitePreferences.getRfkSitePreferences
);

/**
 * Account-SaveProfileWithoutPW : The Account-SaveProfileWithoutPW endpoint is the endpoint that gets hit when a shopper has edited their profile
 * @name Base/Account-SaveProfileWithoutPW
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - dwfrm_profile_customer_firstname - Input field for the shoppers's first name
 * @param {httpparameter} - dwfrm_profile_customer_lastname - Input field for the shopper's last name
 * @param {httpparameter} - dwfrm_profile_customer_phone - Input field for the shopper's phone number
 * @param {httpparameter} - dwfrm_profile_customer_email - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_customer_emailconfirm - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_login_password  - Input field for the shopper's password
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensititve
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post(
    'SaveProfileWithoutPW',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var Site = require('dw/system/Site');
        var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
        var accountModel = accountHelpers.getAccountModel(req);

        var formErrors = require('*/cartridge/scripts/formErrors');

        var profileForm = server.forms.getForm('profile');

        var birthDay = profileForm.customer.birthday.value;
        var month;
        var date;
        if (birthDay) {
            var dob = birthDay.split("/");
            month = dob[0];
            date = dob[1];
        }
        var result = {
            firstName: profileForm.customer.firstname.value,
            lastName: profileForm.customer.lastname.value,
            phone: profileForm.customer.phone.value,
            email: profileForm.customer.email.value,
            month: month,
            date: date,
            gender: profileForm.customer.gender.value,
            profileForm: profileForm
        };
        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var profile = customer.getProfile();
                var customerLogin;
                var status;
                var custom = profile.custom;


                customerLogin = profile.credentials.setLogin(
                    formInfo.email,
                    formInfo.password
                );
                if (customerLogin || accountModel.isExternallyAuthenticated == true) {
                    Transaction.wrap(function () {
                        profile.setFirstName(formInfo.firstName);
                        profile.setLastName(formInfo.lastName);
                        profile.setEmail(formInfo.email);
                        profile.setGender(formInfo.gender);
                        profile.setPhoneHome(formInfo.phone);
                        custom.date = formInfo.date;
                        custom.month = formInfo.month;
                    });

                    // Send account edited email
                    var isEmarsysEnable = Site.getCurrent().getCustomPreferenceValue('emarsysEnabled');
                    var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
                    if (isEmarsysEnable) {
                        eventsHelper.profileUpdate(customer.profile, {updatePage: 'Profile'});
                    } else {
                        accountHelpers.sendAccountEditedEmail(customer.profile);
                    }

                    delete formInfo.profileForm;
                    delete formInfo.email;

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Account-MySettings').toString()
                    });
                } else {
                    formInfo.profileForm.customer.email.valid = false;
                    formInfo.profileForm.customer.email.error =
                        Resource.msg('error.message.username.invalid', 'forms', null);
                    delete formInfo.profileForm;
                    delete formInfo.email;

                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(profileForm)
                    });
                }
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);


/**
 * Account-SavePassword : The Account-SavePassword endpoint is the endpoit that handles changing the shopper's password
 * @name Base/Account-SavePassword
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - dwfrm_profile_login_currentpassword - Input field for the shopper's current password
 * @param {httpparameter} - dwfrm_profile_login_newpasswords_newpassword - Input field for the shopper's new password
 * @param {httpparameter} - dwfrm_profile_login_newpasswords_newpasswordconfirm - Input field for the shopper to confirm their new password
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.append(
    'SavePassword',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

        var formErrors = require('*/cartridge/scripts/formErrors');

        var profileForm = server.forms.getForm('profile');
        var newPasswords = profileForm.login.newpasswords;
        if (profileForm.login.currentpassword.value === newPasswords.newpassword.value) {
            profileForm.valid = false;
            newPasswords.newpassword.valid = false;
            newPasswords.newpassword.error =
                Resource.msg('profile.newPasword.same', 'forms', null);
        }
        var result = {
            currentPassword: profileForm.login.currentpassword.value,
            newPassword: newPasswords.newpassword.value,
            profileForm: profileForm
        };

        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
                var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
                var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var status;
                Transaction.wrap(function () {
                    status = customer.profile.credentials.setPassword(
                        formInfo.newPassword,
                        formInfo.currentPassword,
                        true
                    );
                });
                if (status.error) {
                    if (!CustomerMgr.isAcceptablePassword(newPasswords.newpassword.value)) {
                        formInfo.profileForm.login.newpasswords.newpassword.valid = false;
                        formInfo.profileForm.login.newpasswords.newpassword.error =
                            Resource.msg('error.message.password.constraints.not.matched', 'forms', null);
                    } else {
                        formInfo.profileForm.login.currentpassword.valid = false;
                        formInfo.profileForm.login.currentpassword.error =
                            Resource.msg('error.message.currentpasswordnomatch', 'forms', null);
                    }

                    delete formInfo.currentPassword;
                    delete formInfo.newPassword;
                    delete formInfo.profileForm;

                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(profileForm)
                    });
                } else {
                    delete formInfo.currentPassword;
                    delete formInfo.newPassword;
                    delete formInfo.profileForm;

                    if (isEmarsysEnable) {
                        eventsHelper.profileUpdate(customer.profile, {updatePage: 'Change Password'});
                    }

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Account-MySettings').toString()
                    });
                }
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);

server.post('SaveMonogram',
    function (req, res, next) {
        if (!empty(req.form.monogramdata)) {
            var URLUtils = require('dw/web/URLUtils');
            var Transaction = require('dw/system/Transaction');
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var profile = customer.getProfile();
            var custom = profile.custom;

            Transaction.wrap(function () {
                custom.monogramText = req.form.monogramdata;
                if (req.form.date) {
                    custom.monogramCreationDate = req.form.date;
                }
            });
        }
        res.json({
            success: true
        });
        return next();
    }
);

server.post('RemoveMonogram', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var profile = customer.getProfile();
    var custom = profile.custom;

    Transaction.wrap(function () {
        custom.monogramText = null;
        custom.monogramCreationDate = null;
    });
    res.json({
        success: true,
        redirectUrl: URLUtils.url('Account-MyMonogram').toString()
    });
    return next();
});

server.get(
    'MyMonogram',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
        var Site = require('dw/system/Site');
        var monoPatchImage = Site.getCurrent().getCustomPreferenceValue('monoPatchImage');
        var color = Site.getCurrent().getCustomPreferenceValue('currentFontColor');
        var symbolList = Site.getCurrent().getCustomPreferenceValue('symbolList');
        var fontList = Site.getCurrent().getCustomPreferenceValue('fontList');
        var colorList = JSON.parse(Site.getCurrent().getCustomPreferenceValue('colorList'));
        var symbolListGrandCollection = Site.getCurrent().getCustomPreferenceValue('symbolListGrandCollection');
        var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
        var URLUtils = require('dw/web/URLUtils');

        // Object.keys(colorList).forEach(function (key) {
        //     if (colorList[key]) {
        //         // tempValue = colorList[key];
        //         colorName.push(tempValue.colorDisplayValue);
        //         colorValue.push(tempValue.colorHex);

        //         if (!empty(tempValue.colorHex)) {
        //             colorHValue.push("#" + tempValue.colorHex);
        //         } else {
        //             colorHValue.push("url('" + tempValue.swatchURL + "')");
        //         }
        //     }
        // });

        //     for(var i=0;i<colorList.length;i++){
        //        if(colorList[i].colorHex){
        //         return;
        //        }
        //        else {
        //            colorList[i].colorHValue="url('" + tempValue.swatchURL + "')"
        //     }
        // }
        var accountModel = accountHelpers.getAccountModel(req);
        var monogramdata = accountModel.profile.monogramdata;
        var monogramCreationDate = accountModel.profile.monogramCreationDate;
        var parsedMonogramData;
        if (monogramdata) {
            parsedMonogramData = JSON.parse(monogramdata);
        }
        var responseObject = {
            isError: false,
            returnHTML : ''
        };
    
        responseObject.returnHTML = renderTemplateHelper.getRenderedHtml({
            monogramdata: parsedMonogramData,
            monogramCreationDate: monogramCreationDate,
            monogramPatch: monoPatchImage,
            color: color,
            symbolList: symbolList,
            fontList: fontList,
            colorList: colorList,
            symbolListGrandCollection: symbolListGrandCollection,
            monogramUrl: URLUtils.url('Account-GetMonogram').toString()
        }, 'account/myMonogram');
        res.json(responseObject);
        next();
    }
);

server.get(
    'GetMonogram',
    function (req, res, next) {
        var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');

        var accountModel = accountHelpers.getAccountModel(req);
        if (accountModel) {
            var monogramdata = accountModel.profile.monogramdata;
            var monogramCreationDate = accountModel.profile.monogramCreationDate;
        }
        res.json({
            monogramdata: monogramdata,
            monogramCreationDate: monogramCreationDate
        });
        next();
    }
);

server.get(
    'MySettings',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.generateToken,
    function (req, res, next) {

        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
        var tumiHelpers = require('*/cartridge/scripts/helpers/tumiHelpers');
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var reportingURLs;

        // Get reporting event Account Open url
        if (req.querystring.registration && req.querystring.registration === 'submitted') {
            reportingURLs = reportingUrlsHelper.getAccountOpenReportingURLs(
                CustomerMgr.registeredCustomerCount
            );
        }

        var accountModel = accountHelpers.getAccountModel(req);
        var profileForm = server.forms.getForm('profile');
        profileForm.clear();
        profileForm.customer.firstname.value = accountModel.profile.firstName;
        profileForm.customer.lastname.value = accountModel.profile.lastName;
        profileForm.customer.phone.value = accountModel.profile.phone;
        profileForm.customer.email.value = accountModel.profile.email;
        profileForm.customer.gender.value = accountModel.profile.gender.value;
        var month = accountModel.profile.month;
        var date = accountModel.profile.date;
        if (month !== 'undefined' && date !== 'undefined') {
            profileForm.customer.birthday.value = month + '/' + date;
        } else {
            profileForm.customer.birthday.value = '';
        }
        var storetiming;

        var date = Date().substring(0, 3);
        var storeMgr = require('dw/catalog/StoreMgr');
        var StoreModel = require('*/cartridge/models/store');
        var favStore = req.currentCustomer.raw.profile.custom.favouriteStore;
        if (favStore) {
            var storeObj = storeMgr.getStore(favStore);
            if (storeObj) {
                var store = new StoreModel(storeObj);
                if (store.storeHours) {
                    var storeTime = store.storeHours.split(',');
                    for (var i = 0; i < storeTime.length; i++) {
                        if (storeTime[i].substring(0, 3) == date) {
                            storetiming = storeTime[0].split('-')[1].split(':')[0] - 12;
                        }
                    }
                }
            }
        }
        var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
        );
        tumiHelpers.setPreferredAddress(customer);

        res.render('account/mySettings', {
            profileForm: profileForm,
            account: accountModel,
            storeObj: storeObj,
            storetiming: storetiming ? storetiming.toFixed() : '',
            accountlanding: true,
            breadcrumbs: [{
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }],
            reportingURLs: reportingURLs,
            payment: accountModel.payment,
            viewSavedPaymentsUrl: URLUtils.url('PaymentInstruments-List').toString(),
            addPaymentUrl: URLUtils.url('PaymentInstruments-AddPayment').toString()
        });
        next();
    });

server.get(
    'MySettingsMenu',
    function (req, res, next) {
        res.render('account/mobileSettings', {});
        next();
    });

server.append('Login', function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var customPreferences = Site.getCurrent().getPreferences().custom;
    var PAGE_SIZE_ITEMS = 15;

    var viewData = res.getViewData();
    var email = req.form.loginEmail;
    var password = req.form.loginPassword;
    var rememberMe = req.form.loginRememberMe ?
        (!!req.form.loginRememberMe) :
        false;
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var tumiHelpers = require('*/cartridge/scripts/helpers/tumiHelpers');
    var customerLoginResult = accountHelpers.loginCustomer(email, password, rememberMe);
    var authenticatedCustomer = customerLoginResult && customerLoginResult.authenticatedCustomer ? customerLoginResult.authenticatedCustomer : false;
    
    var profile = authenticatedCustomer && authenticatedCustomer.profile ? authenticatedCustomer.profile : false;
    if (profile) {
    	var customer = CustomerMgr.getCustomerByCustomerNumber(profile.customerNo);
    	tumiHelpers.setPreferredAddress(customer);
    }
    if (profile && profile.custom.accountHasToBeVerifiedByCustomer) {
        var accountVerificationTokenAge = 'accountVerificationTokenAge' in customPreferences ? customPreferences.accountVerificationTokenAge : 2880; // min
        var accountVerificationLinkSentTime = new Number(profile.custom.accountVerificationLinkSentTime);
        var TokenAge = parseInt(accountVerificationTokenAge, 10) * 60;
        var expTime = accountVerificationLinkSentTime + TokenAge * 1000;
        var isTokenValid = (expTime - new Date().getTime()) >= 0;
        if (isTokenValid) {
            res.json({
                success: true,
                accountVerified: false,
                linkExpired: false,
                message: Resource.msg('account.verify', 'account', null)
            });
        } else {
            res.json({
                success: true,
                accountVerified: false,
                linkExpired: true,
                link: URLUtils.abs('Account-ResendAccountVerificationEmail', 'customerID', profile.customerNo).toString(),
                linkName: Resource.msg('account.verify.expired.clickhere', 'account', null),
                message: Resource.msg('account.verify.expired', 'account', null)
            });
        }
        CustomerMgr.logoutCustomer(false);
        return next();
    }

    if (customerLoginResult.error && Site.getCurrent().getCustomPreferenceValue('enableCustomerMigration')) {
        var param = {
            userName: email,
            password: password
        };
        var result;
        var resettingCustomer = CustomerMgr.getCustomerByLogin(email);
        if (customerLoginResult.status === 'ERROR_PASSWORD_MISMATCH') {
            if (!resettingCustomer.profile.custom.ispasswordmigrated) {
                Logger.error('[Account.js] customer found in SFCC with Email id {0} , user tried to login with wrong password. Calling Login API Now.', email);
                result = accountHelpers.getLoginAuthService(param);
                if (result.status === 'OK' && !empty(result.object)) {
                    Logger.error('[Account.js] Login API Call success for email id {0}. Resetting password in SFCC now.', email);
                    // write logic to reset the password
                    var passwordResetToken = accountHelpers.getPasswordResetToken(resettingCustomer);
                    Transaction.wrap(function () {
                        var status = resettingCustomer.profile.credentials.setPasswordWithToken(
                            passwordResetToken,
                            password
                        );
                        if (!status.error) {
                            Logger.error('[Account.js] Password reset done successfully for customer with email id {0}', email);
                            customerLoginResult = accountHelpers.loginCustomer(email, password, rememberMe);
                            if (customerLoginResult.authenticatedCustomer) {
                                Logger.error('[Account.js] User {0} logged in successfully.', email);
                                var data = JSON.parse(result.object);
                                var customerProfile = customerLoginResult.authenticatedCustomer.profile;
                                customerProfile.custom.ispasswordmigrated = true;
                                customerProfile.firstName = customerProfile.firstName ? customerProfile.firstName : data.firstName;
                                customerProfile.lastName = customerProfile.lastName ? customerProfile.lastName : data.lastName;
                                customerProfile.email = customerProfile.email ? customerProfile.email : email;

                                res.setViewData({
                                    authenticatedCustomer: customerLoginResult.authenticatedCustomer
                                });
                                res.json({
                                    success: true,
                                    redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, false)
                                });
                            }
                        } else {
                            Logger.error('[Account.js] Password reset failed for customer {0}', email);
                        }
                    });
                } else {
                    Logger.error('[Account.js] Login API Service Call resulted in failed Authentication for email id {0}. Service response : {1} ', email, result.object);
                }
            } else {
                Logger.error('[Account.js] customer found in SFCC with Email id {0} , but password mismatch and this customer already migared one. So no service call to Login API.', email);
            }
        }
        if (customerLoginResult.status === 'ERROR_CUSTOMER_NOT_FOUND') {
            Logger.error('[Account.js] Customer with email id {0} not found in SFCC. Calling Login API...', email);
            result = accountHelpers.getLoginAuthService(param);
            if (result.status === 'OK' && !empty(result.object)) {
                Logger.error('[Account.js] Login API Call success for email id {0}', email);
                Transaction.wrap(function () {
                    Logger.error('[Account.js] Creating Customer in SFCC for email id {0}', email);
                    CustomerMgr.createCustomer(email, password);
                    var authenticateCustomerResult = CustomerMgr.authenticateCustomer(email, password);
                    if (authenticateCustomerResult.status === 'AUTH_OK') {
                        var authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);
                        if (authenticatedCustomer) {
                            Logger.error('[Account.js] Newly created customer for email id {0} is successfully logged in.', email);
                            var data = JSON.parse(result.object);
                            authenticatedCustomer.profile.custom.ispasswordmigrated = true;
                            authenticatedCustomer.profile.firstName = data.firstName;
                            authenticatedCustomer.profile.lastName = data.lastName;
                            authenticatedCustomer.profile.email = email;
                            res.setViewData({
                                authenticatedCustomer: customerLoginResult.authenticatedCustomer
                            });
                            res.json({
                                success: true,
                                redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, false)
                            });
                        }
                    } else {
                        Logger.error('[Account.js] Newly created customer {0} not able to login successfully.', email);
                    }
                });
            } else {
                Logger.error('[Account.js] Login API Call failed for email id {0}, Service response : {1}', email, result.object);
            }
        }
    }
    
    try {
        if (customerLoginResult.authenticatedCustomer) {
	        var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
	        productHelper.mergeBasket();
	        var wishlistPidArray = [];
	        var WishlistModel = require('*/cartridge/models/productList');
	        var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
	        var list = productListHelper.getList(customerLoginResult.authenticatedCustomer, {
	            type: 12
	        });
	        var wishlistModel = new WishlistModel(
	            list, {
	                type: 'wishlist',
	                publicView: false,
	                pageSize: PAGE_SIZE_ITEMS,
	                pageNumber: 1
	            }
	        ).productList;
	        if (wishlistModel && wishlistModel.items.length != 0) {
	            for (var i = 0; i < wishlistModel.items.length; i++) {
	                wishlistPidArray[i] = wishlistModel.items[i].pid;
	            }
	        }
	        viewData.wishlistPidArray = wishlistPidArray;
    	}	
    } catch (e) {
        Logger.error('[Account.js] Login end point crashed at line number {0} ERROR: {1}', e.lineNumber, e.message);
    }


    res.setViewData(viewData);
    next();
});

/**
 * Account-Header : The Account-Header endpoint is used as a remote include to include the login/account menu in the header
 * @name Base/Account-Header
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.include
 * @param {querystringparameter} - mobile - a flag determining whether or not the shopper is on a mobile sized screen this determines what isml template to render
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace('Header', function (req, res, next) {
    var template = 'account/header';
    var wishlistPidArray = '';
    if (req.currentCustomer.profile) {
        var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
        var list = productListHelper.getList(req.currentCustomer.raw, { type: 12 });
        var WishlistModel = require('*/cartridge/models/productList');
        var PAGE_SIZE_ITEMS = 50;

        var wishlistModel = new WishlistModel(
            list,
            {
                type: 'wishlist',
                publicView: false,
                pageSize: PAGE_SIZE_ITEMS,
                pageNumber: 1
            }
        ).productList;
        if(wishlistModel != null){
        if (wishlistModel.items.length != 0) {
            var length = wishlistModel.items.length;
            for (var i = 0; i < length - 1; i++) {
                wishlistPidArray  = wishlistPidArray + wishlistModel.items[i].pid + ',';
            }
            wishlistPidArray = wishlistPidArray + wishlistModel.items[length-1].pid;
        }
        }
    }
    res.render(template, {
        name: req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null,
        wishlistPidArray: wishlistPidArray
    });
    next();
});

/**
 * Account-SubmitRegistration : The Account-SubmitRegistration endpoint is the endpoint that gets hit when a shopper submits their registration for a new account
 * @name Base/Account-SubmitRegistration
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - rurl - redirect url. The value of this is a number. This number then gets mapped to an endpoint set up in oAuthRenentryRedirectEndpoints.js
 * @param {httpparameter} - dwfrm_profile_customer_firstname - Input field for the shoppers's first name
 * @param {httpparameter} - dwfrm_profile_customer_lastname - Input field for the shopper's last name
 * @param {httpparameter} - dwfrm_profile_customer_phone - Input field for the shopper's phone number
 * @param {httpparameter} - dwfrm_profile_customer_email - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_customer_emailconfirm - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_login_password - Input field for the shopper's password
 * @param {httpparameter} - dwfrm_profile_login_passwordconfirm: - Input field for the shopper's password to confirm
 * @param {httpparameter} - dwfrm_profile_customer_addtoemaillist - Checkbox for whether or not a shopper wants to be added to the mailing list
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace(
    'SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');

        var formErrors = require('*/cartridge/scripts/formErrors');

        var registrationForm = server.forms.getForm('profile');

        if (!CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)) {
            registrationForm.login.password.valid = false;
            registrationForm.valid = false;
        }

        // setting variables for the BeforeComplete function
        var registrationFormObj = {
            firstName: registrationForm.customer.firstname.value,
            lastName: registrationForm.customer.lastname.value,
            email: registrationForm.customer.email.value,
            password: registrationForm.login.password.value,
            validForm: registrationForm.valid,
            form: registrationForm
        };

        if (registrationFormObj.email && registrationFormObj.email.match(/([a-z0-9]+@[united]+\.[a-z]{2,3})$/g)) {
            registrationForm.valid = false;
            registrationForm.customer.email.valid = false;
            registrationForm.customer.email.error = Resource.msg('error.link.us.customer', 'login', null);
        }

        if (registrationForm.valid) {
            res.setViewData(registrationFormObj);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var Transaction = require('dw/system/Transaction');
                var Locale = require('dw/util/Locale');
                var URLUtils = require('dw/web/URLUtils');
                var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
                var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                var assign = require('modules/server/assign');
                var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
                var accountVerify = require('*/cartridge/scripts/helpers/accountVerify');
                var currentLocale = Locale.getLocale(req.locale.id);
                var authenticatedCustomer;
                var serverError;
                var verificationURL;
                var emarsysPayload;

                // getting variables for the BeforeComplete function
                var registrationForm = res.getViewData(); // eslint-disable-line

                if (registrationForm.validForm) {
                    var login = registrationForm.email;
                    var password = registrationForm.password;

                    // attempt to create a new user and log that user in.
                    try {
                        Transaction.wrap(function () {
                            var error = {};
                            var newCustomer = CustomerMgr.createCustomer(login, password);

                            var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
                            if (authenticateCustomerResult.status !== 'AUTH_OK') {
                                error = {
                                    authError: true,
                                    status: authenticateCustomerResult.status
                                };
                                throw error;
                            }

                            authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);

                            // put the code for wishlistpidarray
                            if (!authenticatedCustomer) {
                                error = {
                                    authError: true,
                                    status: authenticateCustomerResult.status
                                };
                                throw error;
                            } else {
                                // assign values to the profile
                                var newCustomerProfile = newCustomer.getProfile();

                                newCustomerProfile.firstName = registrationForm.firstName;
                                newCustomerProfile.lastName = registrationForm.lastName;
                                newCustomerProfile.email = registrationForm.email;
                                newCustomerProfile.custom.ispasswordmigrated = true;
                                newCustomerProfile.custom.accountHasToBeVerifiedByCustomer = true;
                                newCustomerProfile.custom.accountVerificationLinkSentTime = new Date().getTime().toString();
                                newCustomerProfile.custom.optInEmail = registrationForm.form.customer.addtoemaillist.checked;

                                var token = accountVerify.getAccountVerifitcationToken({
                                    customerID: newCustomerProfile.customerNo,
                                    email: registrationForm.email
                                });
                                verificationURL = URLUtils.abs('Account-VerifyEmail', 'token', token);
                                emarsysPayload = {
                                    email: registrationForm.email,
                                    language: currentLocale.language,
                                    firstName: registrationForm.firstName,
                                    verificationURL: verificationURL.toString(),
                                    country: currentLocale.country,
                                    lastName: registrationForm.lastName
                                };
                            }
                        });
                    } catch (e) {
                        if (e.authError) {
                            serverError = true;
                        } else {
                            registrationForm.validForm = false;
                            registrationForm.form.customer.email.valid = false;
                            registrationForm.form.customer.email.error = Resource.msg('error.email.duplicate.msg', 'forms', null);
                        }
                    }
                }

                delete registrationForm.password;
                formErrors.removeFormValues(registrationForm.form);

                if (serverError) {
                    res.setStatusCode(500);
                    res.json({
                        success: false,
                        errorMessage: Resource.msg('error.message.unable.to.create.account', 'login', null)
                    });

                    return;
                }
                if (registrationForm.validForm) {
                    // send a registration email
                    if (isEmarsysEnable) {
                        var sfccEventName = 'ACCOUNT_VERIFICATION_TESTING';
                        eventsHelper.processEventTriggering(sfccEventName, assign, emarsysPayload);
                    } else {
                        accountHelpers.sendCreateAccountEmail(authenticatedCustomer.profile);
                    }
                    res.setViewData({
                        authenticatedCustomer: authenticatedCustomer
                    });
                    res.json({
                        success: true,
                        message: Resource.msg('account.verify', 'account', null)
                        //redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true)
                    });

                    req.session.privacyCache.set('args', null);
                } else {
                    res.json({
                        fields: formErrors.getFormErrors(registrationForm)
                    });
                }
                CustomerMgr.logoutCustomer(false);
            });
        } else {
            res.json({
                fields: formErrors.getFormErrors(registrationForm)
            });
        }

        return next();
    }
);

/**
 * Account-SaveNewPassword : The Account-SaveNewPassword endpoint handles resetting a shoppers password. This is the last step in the forgot password user flow. (This step does not log the shopper in.)
 * @name Base/Account-SaveNewPassword
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {querystringparameter} - Token - SFRA utilizes this token to retrieve the shopper
 * @param {httpparameter} - dwfrm_newPasswords_newpassword - Input field for the shopper's new password
 * @param {httpparameter} - dwfrm_newPasswords_newpasswordconfirm  - Input field to confirm the shopper's new password
 * @param {httpparameter} - save - unutilized param
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - post
 */
server.replace('SaveNewPassword', server.middleware.https, function (req, res, next) {
    var Transaction = require('dw/system/Transaction');

    var passwordForm = server.forms.getForm('newPasswords');
    var token = req.querystring.Token;

    if (passwordForm.valid) {
        var result = {
            newPassword: passwordForm.newpassword.value,
            token: token,
            passwordForm: passwordForm
        };
        res.setViewData(result);
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
            var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
            var URLUtils = require('dw/web/URLUtils');

            var formInfo = res.getViewData();
            var status;
            var resettingCustomer; 
            Transaction.wrap(function () {
                resettingCustomer = CustomerMgr.getCustomerByToken(formInfo.token);
                status = resettingCustomer.profile.credentials.setPasswordWithToken(
                    formInfo.token,
                    formInfo.newPassword
                );
            });
            if (status.error) {
                passwordForm.newpassword.valid = false;
                res.render('account/password/newPassword', {
                    passwordForm: passwordForm,
                    token: token
                });
            } else {
                Transaction.wrap(function () {
                    resettingCustomer.profile.custom.ispasswordmigrated = true;
                });
                if (isEmarsysEnable) {
                    eventsHelper.profileUpdate(resettingCustomer.profile, {updatePage: 'Change Password'});
                }
                res.redirect(URLUtils.url('Home-Show'));
            }
        });
    } else {
        res.render('account/password/newPassword', {
            passwordForm: passwordForm,
            token: token
        });
    }
    next();
});

/**
 * Account-Storeheader : The Account-Storeheader endpoint handles setting setting a store based on geolocation or customer's favourite Store 
 */
server.get('Storeheader', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var storeMgr = require('dw/catalog/StoreMgr');
    var StoreModel = require('*/cartridge/models/store');
    var URLUtils = require('dw/web/URLUtils');
    var sitePreferences = require('dw/system/Site');
    var URLParameter = require('dw/web/URLParameter');
    var URLAction = require('dw/web/URLAction');
    var locationEnabled = req.querystring.locationEnabled;
    var store = {};
    var openUntil;
    var date = Date().substring(0, 3);
    var storeTime;
    var storeDistance;
    var nostoreImage = sitePreferences.getCurrent().getCustomPreferenceValue('HeaderFooterStoreImageUrl');
    var nostoreLargeImage = sitePreferences.getCurrent().getCustomPreferenceValue('LargeStoreImageUrl');
    try {
        if (locationEnabled === 'true') {
            var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
            var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelper');
            var radius = req.querystring.radius;
            var lat = req.querystring.lat;
            var long = req.querystring.long;
            cookieHelpers.setCookie('geoLocation','lat=' + lat + ',long=' + long);
            var storesModel;
            if (req.currentCustomer.raw.authenticated) {
                var favStore = req.currentCustomer.raw.profile.custom.favouriteStore;
                if (favStore) {
                    var storeObj = storeMgr.getStore(favStore);
                    if (storeObj) {
                        store = new StoreModel(storeObj);
                        var dlon = ((store.longitude * (Math.PI / 180)) - (long * (Math.PI / 180)));
                        var dlat = ((store.latitude * (Math.PI / 180)) - (lat * (Math.PI / 180)));
                        var a = Math.pow(Math.sin(dlat / 2), 2) +
                            Math.cos(store.latitude) * Math.cos(lat) *
                            Math.pow(Math.sin(dlon / 2), 2);
                        var c = 2 * Math.asin(Math.sqrt(a));
                        storeDistance = Math.ceil(6371 * c);
                    }
                } else {
                    storesModel = storeHelpers.getStores(radius, null, lat, long, req.geolocation, null, null);
                    var filteredStores = storesModel.stores.filter(function (store) {
                        return store.storeType.toLowerCase() == "retail";
                    })
                    if (filteredStores && filteredStores.length > 0) {
                        store = filteredStores[0];
                        storeDistance = store.distance;
                    }
                }
            } else {
                storesModel = storeHelpers.getStores(radius, null, lat, long, req.geolocation, null, null);
                var filteredStores = storesModel.stores.filter(function (store) {
                    return store.storeType.toLowerCase() == "retail";
                })
                if (filteredStores && filteredStores.length > 0) {
                    store = filteredStores[0];
                    storeDistance = store.distance;
                }
            }
            if (store.storeHours) {
                storeTime = store.storeHours.split(',');
                for (var i = 0; i < storeTime.length; i++) {
                    if (storeTime[i].substring(0, 3) == date) {
                        openUntil = storeTime[0].split('-')[1].split(':')[0] - 12;
                    }
                }
            }
        } else if (req.currentCustomer.raw.authenticated) {
            storeDistance = false;
            var favStore = req.currentCustomer.raw.profile.custom.favouriteStore;
            if (favStore) {
                var storeObj = storeMgr.getStore(favStore);
                if (storeObj) {
                    store = new StoreModel(storeObj);
                    if(store.storeHours) {
                        storeTime = store.storeHours.split(',');
                        for (var i = 0; i < storeTime.length; i++) {
                            if (storeTime[i].substring(0, 3) == date) {
                                openUntil = storeTime[0].split('-')[1].split(':')[0] - 12;
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {}

    var getResources = {
        storeHeading: Resource.msg('store.heading', 'storeLocator', null),
        storescheduleAppointment: Resource.msg('store.scheduleAppointment', 'storeLocator', null),
        seeAllStores: Resource.msg('store.seeAllStores', 'storeLocator', null),
        nostoreHeading: Resource.msg('nostore.heading', 'storeLocator', null),
        nostoreLocation: Resource.msg('nostore.storeLocation', 'storeLocator', null),
        nostoreDescription: Resource.msg('nostore.description', 'storeLocator', null),
        nostoreButtonFindStore: Resource.msg('nostore.button.findStore', 'storeLocator', null),
        nostoreImage: nostoreImage,
        nostoreLargeImage: nostoreLargeImage,
        headerStoreHeading: Resource.msg('headerStore.heading', 'storeLocator', null),
        headerGetDirection: Resource.msg('header.button.getDirection', 'storeLocator', null)
    };
    var radiusSitePreference = sitePreferences.getCurrent().getCustomPreferenceValue('storeLookupMaxDistance');
    var radius = radiusSitePreference ? radiusSitePreference : 50;
    var params = [];
    params.push(new URLParameter('radius', radius.toString()));
    if(store && store.latitude && store.longitude) {
        params.push(new URLParameter('lat', store.latitude));
        params.push(new URLParameter('long', store.longitude));
    }
    var storeUrl = URLUtils.url(new URLAction('Stores-Find'), params).toString();

    res.json({
        success: true,
        store: store,
        openUntil: openUntil,
        storeDistance: storeDistance,
        getResources: getResources,
        storeLocatorUrl: storeUrl
    });
    next();
});

server.get('VerifyEmail', function (req, res, next) {
    var Encoding = require('dw/crypto/Encoding');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var accountVerify = require('*/cartridge/scripts/helpers/accountVerify');
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');

    var token = req.querystring.token;
    var tokenData = token.split('.');
    var payloadData = Encoding.fromBase64(tokenData[1]).toString();
    payloadData = JSON.parse(payloadData);
    var data = tokenData[0] + '.' + tokenData[1];
    var isTokenValid = (payloadData.exp - new Date().getTime()) >= 0 && accountVerify.getSignature(data) === tokenData[2];
    var message = '';

    if (isTokenValid) {
        var existingCustomer = CustomerMgr.getCustomerByCustomerNumber(payloadData.customerID);
        if (existingCustomer && existingCustomer.profile && existingCustomer.profile.custom.accountHasToBeVerifiedByCustomer) {
            Transaction.wrap(function () {
                existingCustomer.profile.custom.accountHasToBeVerifiedByCustomer = false;
            });

            if (isEmarsysEnable && existingCustomer.profile.custom.optInEmail) {
                eventsHelper.profileUpdate(existingCustomer.profile, {updatePage: 'NewsLetter Preferences', optInEmail: existingCustomer.profile.custom.optInEmail});
            }
        }
        res.redirect(URLUtils.url('Home-Show', 'page', 'login'));
    } else {
        message = Resource.msg('account.verify.expired', 'account', null);
        var link = URLUtils.abs('Account-ResendAccountVerificationEmail', 'customerID', payloadData.customerID).toString();
        var linkName = Resource.msg('account.verify.expired.clickhere', 'account', null);
        res.redirect(URLUtils.url('Home-Show', 'page', 'login', 'message', message, 'link', link, 'linkName', linkName));
    }

    next();
});

server.get('ResendAccountVerificationEmail', function (req, res, next) {
    var Site = require('dw/system/Site');
    var Locale = require('dw/util/Locale');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var isEmarsysEnable = require('dw/system/Site').getCurrent().getCustomPreferenceValue('emarsysEnabled');
    var customPreferences = Site.getCurrent().getPreferences().custom;
    var assign = require('modules/server/assign');
    var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
    var accountVerify = require('*/cartridge/scripts/helpers/accountVerify');
    var currentLocale = Locale.getLocale(req.locale.id);
    var customerID = req.querystring.customerID;

    var existingCustomer = CustomerMgr.getCustomerByCustomerNumber(customerID);
    var profile = existingCustomer && existingCustomer.profile ? existingCustomer.profile : false;

    var accountVerificationTokenAge = 'accountVerificationTokenAge' in customPreferences ? customPreferences.accountVerificationTokenAge : 500;
    var accountVerificationLinkSentTime = new Number(profile.custom.accountVerificationLinkSentTime);
    var TokenAge = parseInt(accountVerificationTokenAge, 10) * 60;
    var expTime = accountVerificationLinkSentTime + TokenAge * 1000;
    var isTokenValid = (expTime - new Date().getTime()) >= 0;

    if (!isTokenValid) {
        Transaction.wrap(function () {
            profile.custom.accountVerificationLinkSentTime = new Date().getTime().toString();
        });
        var token = accountVerify.getAccountVerifitcationToken({
            customerID: profile.customerNo,
            email: profile.email
        });
        var verificationURL = URLUtils.abs('Account-VerifyEmail', 'token', token);
        var emarsysPayload = {
            email: profile.email,
            language: currentLocale.language,
            firstName: profile.firstName,
            verificationURL: verificationURL.toString(),
            country: currentLocale.country,
            lastName: profile.lastName
        };

        // send a registration email
        if (isEmarsysEnable) {
            var sfccEventName = 'ACCOUNT_VERIFICATION_TESTING';
            eventsHelper.processEventTriggering(sfccEventName, assign, emarsysPayload);
        }
    }

    res.redirect(URLUtils.url('Home-Show', 'page', 'login'));

    next();
});

module.exports = server.exports();