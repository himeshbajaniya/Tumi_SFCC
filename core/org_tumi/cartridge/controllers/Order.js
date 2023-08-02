'use strict';

/**
 * @namespace Order
 */
var page = module.superModule;
var server = require('server');
server.extend(page);

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Site = require('dw/system/Site');
var rfkSitePreferences = require('*/cartridge/scripts/middleware/rfkSitePreferences');

/**
 * Order-Confirm : This endpoint is invoked when the shopper's Order is Placed and Confirmed
 * @name Base/Order-Confirm
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - ID - Order ID
 * @param {querystringparameter} - token - token associated with the order
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.replace(
    'Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');

        var order;

        if (!req.form.orderToken || !req.form.orderID) {
            if (!empty(req.querystring) && 'ID' in req.querystring) {
                order = OrderMgr.getOrder(req.querystring.ID);
            } else {
                res.render('/error', {
                    message: Resource.msg('error.confirmation.error', 'confirmation', null)
                });
                return next();
            }
        } else {
            order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
        }
            
        var currentLocale = Locale.getLocale(req.locale.id);

        // send confirmation mail
        var sendEmarsysConfirmationEmail = order && order.custom && order.custom.sendEmarsysConfirmationEmail;
        if(!sendEmarsysConfirmationEmail) {
            var HookMgr = require('dw/system/HookMgr');
            if (HookMgr.hasHook('emarsys.sendOrderConfirmation.'+ currentLocale.country)) HookMgr.callHook('emarsys.sendOrderConfirmation.'+ currentLocale.country, 'orderConfirmation', { Order: order });
        }

        if (!order || order.customer.ID !== req.currentCustomer.raw.ID
        ) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }
        var viewData = res.getViewData();
        viewData.orderID = req.form.orderID ?  req.form.orderID: req.querystring.ID;
        viewData.orderToken = req.form.orderToken ? req.form.orderToken: req.querystring.token;

        var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
        if (lastOrderID === req.querystring.ID) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }

        var config = {
            numberOfLineItems: '*'
        };

        var orderModel = new OrderModel(
            order,
            { config: config, countryCode: currentLocale.country, containerView: 'order' }
        );
        var passwordForm;

        var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);
        var lineItems = orderModel.items.items;
        var shipToHome= [];
        for(var i = 0; i < lineItems.length; i++) {
            if ((lineItems[i].shipmentType == null) && (lineItems[i].storeId == null)) {
                shipToHome.push(lineItems[i]);
            }
        }
        var registrationObj = {
            firstName: orderModel.billing.billingAddress.address.firstName,
            lastName: orderModel.billing.billingAddress.address.lastName,
            email: orderModel.orderEmail
        };

        var viewData = res.getViewData();
        viewData.klarna = {
            currency: order.getCurrencyCode()
        };
        res.setViewData({
            customer: req.currentCustomer
        });

        if (!req.currentCustomer.profile) {
            passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                shipToHome: shipToHome,
                returningCustomer: false,
                passwordForm: passwordForm,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID(),
                registerForm: JSON.stringify(registrationObj)
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                shipToHome: shipToHome,
                returningCustomer: true,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID()
            });
        }
        req.session.raw.custom.orderID = req.querystring.ID; // eslint-disable-line no-param-reassign
        return next();
    }, 
rfkSitePreferences.getRfkSitePreferences
);

/**
 * Order-Confirm : This endpoint is invoked the pixlee api call when the shopper's Order is Placed and Confirmed
 * @name Base/Order-Confirm
 * @function
 * @memberof Order
 */
server.append('Confirm', function (req, res, next) {
    var pixleeHelper = require('*/cartridge/scripts/pixlee/helpers/pixleeHelper');

    if (pixleeHelper.isPixleeEnabled()) {
        var viewData = res.getViewData();
        var trackingAllowed = pixleeHelper.isTrackingAllowed(viewData.tracking_consent);

        if (trackingAllowed) {
            var OrderMgr = require('dw/order/OrderMgr');
            var order = OrderMgr.getOrder(req.form.orderID);

            var PixleeEndCheckoutEvent = require('*/cartridge/scripts/pixlee/models/eventModel').PixleeEndCheckoutEvent;
            var endCheckoutEvent = new PixleeEndCheckoutEvent(order);

            if (endCheckoutEvent) {
                res.setViewData({
                    pixleeEventData: [endCheckoutEvent]
                });
            }
        }
    }

    next();
});

/**
 * Order-Track : This endpoint is used to track a placed Order
 * @name Base/Order-Track
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateRequest
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - trackOrderNumber - Order Number to track
 * @param {querystringparameter} - trackOrderEmail - Email on the Order to track
 * @param {querystringparameter} - trackOrderPostal - Postal Code on the Order to track
 * @param {querystringparameter} - csrf_token - CSRF token
 * @param {querystringparameter} - submit - This is to submit the form
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - post
 */
server.replace(
    'Track',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.validateRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        var order;
        var validForm = true;
        var target = req.querystring.rurl || 1;
        var actionUrl = URLUtils.url('Account-Login', 'rurl', target);
        var profileForm = server.forms.getForm('profile');
        profileForm.clear();

        if (req.form.trackOrderEmail
            && req.form.trackOrderPostal
            && req.form.trackOrderNumber) {
            order = OrderMgr.getOrder(req.form.trackOrderNumber);
        } else {
            validForm = false;
        }

        if (!order) {
            res.render('/account/login', {
                navTabValue: 'login',
                orderTrackFormError: validForm,
                profileForm: profileForm,
                userName: '',
                actionUrl: actionUrl
            });
            next();
        } else {
            var config = {
                numberOfLineItems: '*'
            };

            var currentLocale = Locale.getLocale(req.locale.id);

            var orderModel = new OrderModel(
                order,
                { config: config, countryCode: currentLocale.country, containerView: 'order' }
            );

            // check the email and postal code of the form
            if (req.form.trackOrderEmail.toLowerCase()
                !== orderModel.orderEmail.toLowerCase()) {
                validForm = false;
            }

            if (req.form.trackOrderPostal
                !== orderModel.billing.billingAddress.address.postalCode) {
                validForm = false;
            }

            if (validForm) {
                var exitLinkText;
                var exitLinkUrl;

                exitLinkText = !req.currentCustomer.profile
                    ? Resource.msg('link.continue.shop', 'order', null)
                    : Resource.msg('link.orderdetails.myaccount', 'account', null);

                exitLinkUrl = !req.currentCustomer.profile
                    ? URLUtils.url('Home-Show')
                    : URLUtils.https('Account-Show');

                res.render('account/orderDetails', {
                    order: orderModel,
                    exitLinkText: exitLinkText,
                    exitLinkUrl: exitLinkUrl
                });
            } else {
                res.render('/account/login', {
                    navTabValue: 'login',
                    profileForm: profileForm,
                    orderTrackFormError: !validForm,
                    userName: '',
                    actionUrl: actionUrl
                });
            }

            next();
        }
    }
);

/**
 * Order-History : This endpoint is invoked to get Order History for the logged in shopper
 * @name Base/Order-History
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.replace(
    'History',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var OrderMgr = require('dw/order/OrderMgr');

        var loadMoreCount = 0;
        var ordersResult = OrderHelpers.getOrders(
            req.currentCustomer,
            loadMoreCount,
            req.locale.id
        );
        var orders = ordersResult.orders;
        var orderIds = [];
        for (var i in orders) {
            var OrderList = OrderMgr.getOrder(orders[i].orderNumber).productLineItems.iterator();
            while (OrderList.hasNext()) {
                var currentOrder = OrderList.next();
                orderIds.push(currentOrder.productID);
            }
        }
        var rfkOrderIds = '';
        if (orderIds.length > 0) {
            for (var i = 0; i < orderIds.length-1; i += 1) {
                rfkOrderIds += orderIds[i] + ',';
            }
            rfkOrderIds += orderIds[orderIds.length-1];
        }
        var filterValues = ordersResult.filterValues;
        var loadMoreURL = ordersResult.loadMoreURL;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.mypurchases', 'account', null),
                url: URLUtils.url('Order-History').toString()
            }
        ];

        var CustomerMgr = require('dw/customer/CustomerMgr');
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );

        var orderCount = {
            totalOrders: customer.getOrderHistory().orderCount,
            currentOrders: ordersResult.currentOrders
        };

        res.render('account/order/history', {
            orders: orders,
            filterValues: filterValues,
            orderFilter: req.querystring.orderFilter,
            accountlanding: false,
            breadcrumbs: breadcrumbs,
            loadMoreURL: loadMoreURL,
            orderCount: orderCount,
            rfkOrderIds: rfkOrderIds
        });
        next();
    }, rfkSitePreferences.getRfkSitePreferences
);

/**
 * Order-Details : This endpoint is called to get Order Details
 * @name Base/Order-Details
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {querystringparameter} - orderID - Order ID
 * @param {querystringparameter} - orderFilter - Order Filter ID
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.replace(
    'Details',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');

        var order = OrderMgr.getOrder(req.querystring.orderID);
        var orderCustomerNo = req.currentCustomer.profile.customerNo;
        var currentCustomerNo = order.customer.profile.customerNo;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.mypurchases', 'account', null),
                url: URLUtils.url('Order-History').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Order-History').toString()
            }
        ];

        var digestString = ((order.customerEmail + order.orderNo).toLowerCase()) + Site.getCurrent().getCustomPreferenceValue('lincSalt');
        var Bytes = require('dw/util/Bytes');
        var crypto = require('dw/crypto');
        var hashing = new crypto.MessageDigest(crypto.MessageDigest.DIGEST_SHA_256);
        var digest = hashing.digest(new Bytes(digestString));

        if (order && orderCustomerNo === currentCustomerNo) {
            var orderModel = orderHelpers.getOrderDetails(req);
            var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
            var exitLinkUrl =
                URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);
            breadcrumbs[3].htmlValue = 'Order #' + orderModel.orderNumber;
            res.render('account/orderDetails', {
                order: orderModel,
                exitLinkText: exitLinkText,
                exitLinkUrl: exitLinkUrl,
                breadcrumbs: breadcrumbs,
                digest: digest,
                customer: order.customer,
                isOrderDetails: true
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }, rfkSitePreferences.getRfkSitePreferences
);

/**
 * Order-Filtered : This endpoint filters the Orders shown on the Order History Page
 * @name Base/Order-Filtered
 * @function
 * @memberof Order
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - userLoggedIn.validateLoggedInAjax
 * @param {querystringparameter} - orderFilter - Order Filter ID
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.replace(
    'Filtered',
    server.middleware.https,
    consentTracking.consent,
    userLoggedIn.validateLoggedInAjax,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');

        var data = res.getViewData();
        if (data && !data.loggedin) {
            res.json();
            return next();
        }

        var ordersResult = OrderHelpers.getOrders(
            req.currentCustomer,
            req.querystring.loadMoreCount,
            req.locale.id
        );

        var CustomerMgr = require('dw/customer/CustomerMgr');
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var orderCount = {
            totalOrders: customer.getOrderHistory().orderCount,
            currentOrders: ordersResult.currentOrders
        };
        var orders = ordersResult.orders;
        var loadMoreURL = ordersResult.loadMoreURL;

        res.render('account/order/orderList', {
            orders: orders,
            loadMoreURL: loadMoreURL,
            orderFilter: req.querystring.orderFilter,
            accountlanding: false,
            orderCount: orderCount
        });
        return next();
    }
);

/**
 * Order-CreateAccount : This endpoint is invoked when a shopper has already placed an Order as a guest and then tries to create an account
 * @name Base/Order-CreateAccount
 * @function
 * @memberof Order
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - ID: Order ID
 * @param {httpparameter} - dwfrm_newPasswords_newpassword - Password
 * @param {httpparameter} - dwfrm_newPasswords_newpasswordconfirm - Confirm Password
 * @param {httpparameter} - csrf_token - CSRF token
 * @param {category} - sensitive
 * @param {serverfunction} - post
 */
server.replace(
    'CreateAccount',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');

        var formErrors = require('*/cartridge/scripts/formErrors');

        var profileForm = server.forms.getForm('profile');
        var order = OrderMgr.getOrder(req.querystring.ID);
        if (!order || order.customer.ID !== req.currentCustomer.raw.ID || order.getUUID() !== req.querystring.UUID) {
            res.json({ error: [Resource.msg('error.message.unable.to.create.account', 'login', null)] });
            return next();
        }

        res.setViewData({ orderID: req.querystring.ID });
        var registrationObj = {
            firstName: profileForm.customer.firstname.htmlValue,
            lastName: profileForm.customer.lastname.htmlValue,
            phone: order.billingAddress.phone,
            email: profileForm.customer.email.htmlValue,
            password: profileForm.login.password.htmlValue
        };

        if (profileForm.valid) {
            res.setViewData(registrationObj);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var CustomerMgr = require('dw/customer/CustomerMgr');
                var Transaction = require('dw/system/Transaction');
                var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');

                var registrationData = res.getViewData();

                var login = registrationData.email;
                var password = registrationData.password;
                var newCustomer;
                var authenticatedCustomer;
                var newCustomerProfile;
                var errorObj = {};

                delete registrationData.email;
                delete registrationData.password;

                // attempt to create a new user and log that user in.
                try {
                    Transaction.wrap(function () {
                        var error = {};
                        newCustomer = CustomerMgr.createCustomer(login, password);

                        var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
                        if (authenticateCustomerResult.status !== 'AUTH_OK') {
                            error = { authError: true, status: authenticateCustomerResult.status };
                            throw error;
                        }

                        authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);

                        if (!authenticatedCustomer) {
                            error = { authError: true, status: authenticateCustomerResult.status };
                            throw error;
                        } else {
                            // assign values to the profile
                            newCustomerProfile = newCustomer.getProfile();

                            newCustomerProfile.firstName = registrationData.firstName;
                            newCustomerProfile.lastName = registrationData.lastName;
                            newCustomerProfile.phoneHome = registrationData.phone;
                            newCustomerProfile.email = login;

                            order.setCustomer(newCustomer);

                            // save all used shipping addresses to address book of the logged in customer
                            var allAddresses = addressHelpers.gatherShippingAddresses(order);
                            allAddresses.forEach(function (address) {
                                addressHelpers.saveAddress(address, { raw: newCustomer }, addressHelpers.generateAddressName(address));
                            });

                            res.setViewData({ newCustomer: newCustomer });
                            res.setViewData({ order: order });
                        }
                    });
                } catch (e) {
                    errorObj.error = true;
                    errorObj.errorMessage = e.authError
                        ? Resource.msg('error.message.unable.to.create.account', 'login', null)
                        : Resource.msg('error.message.account.create.error', 'forms', null);
                }

                delete registrationData.firstName;
                delete registrationData.lastName;
                delete registrationData.phone;

                if (errorObj.error) {
                    res.json({ error: [errorObj.errorMessage] });

                    return;
                }

                accountHelpers.sendCreateAccountEmail(authenticatedCustomer.profile);

                res.json({
                    success: true,
                    redirectUrl: URLUtils.url('Account-Show', 'registration', 'submitted').toString()
                });
            });
        } else {
            res.json({
                fields: formErrors.getFormErrors(passwordForm)
            });
        }

        return next();
    }
);

/**
 * Order-GetSearchedOrders : This endpoint is invoked to get Orders searched by the logged in shopper
 * @name Base/Order-GetSearchedOrders
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.get(
    'GetSearchedOrders',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');

        var ordersResult = OrderHelpers.getSearchedOrders(
            req.currentCustomer,
            req.querystring,
            req.locale.id
        );

        var CustomerMgr = require('dw/customer/CustomerMgr');
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );

        var orderCount = {
            totalOrders: customer.getOrderHistory().orderCount,
            currentOrders: ordersResult.orders.length
        };
        var orders = ordersResult.orders;
        var filterValues = ordersResult.filterValues;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.mypurchases', 'account', null),
                url: URLUtils.url('Order-History').toString()
            }
        ];

        res.render('account/order/history', {
            orders: orders,
            filterValues: filterValues,
            orderFilter: req.querystring.orderFilter,
            accountlanding: false,
            breadcrumbs: breadcrumbs,
            orderCount: orderCount,
            querystring: req.querystring.q
        });
        next();
    }
);

module.exports = server.exports();
