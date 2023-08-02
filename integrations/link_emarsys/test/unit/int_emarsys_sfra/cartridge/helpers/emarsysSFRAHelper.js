'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../mocks/';

var BasketMgr = require(mockPath + 'dw/order/BasketMgr');
var Money = require(mockPath + 'dw/value/Money');
var Resource = require(mockPath +'dw/web/Resource');
var emarsysService = require(mockPath + 'service/emarsysService');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var order = require(mockPath + 'dw/order/Order');
var web = require(mockPath + 'dw/web/Web');
var Site = require(mockPath + 'dw/system/Site');
var Transaction = require(mockPath + 'dw/system/Transaction');
var Logger = require(mockPath + 'dw/system/Logger');
var CustomObjectMgr = require(mockPath + 'dw/object/CustomObjectMgr');
var Request = require(mockPath + 'dw/system/Request');
var Session = require(mockPath + 'dw/system/Session');
Logger.getLogger('emarsys');

var siteCustomPreferences = Site.getCurrent();

var cartridgePath = '../../../../../cartridges/int_emarsys_sfra/';
var cartridgePathE = '../../../../../cartridges/int_emarsys/';

var emarsysHelper = proxyquire(cartridgePathE + 'cartridge/scripts/helpers/emarsysHelper.js', {
    'dw/web': web,
    'dw/order': order,
    'dw/value/Money': Money,
    'dw/system/Site': Site,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/order/ShippingMgr': ShippingMgr,
    siteCustomPreferences: siteCustomPreferences,
    '~/cartridge/scripts/service/emarsysService': emarsysService
});

var newsletterHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/newsletterHelper.js', {
    'dw/system/Logger': Logger,
    'dw/system/Transaction': Transaction,
    'dw/system/Site': Site,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'int_emarsys/cartridge/scripts/helpers/emarsysHelper': emarsysHelper
});

var emarsysEventsHelper = proxyquire(cartridgePathE + 'cartridge/scripts/helpers/emarsysEventsHelper.js', {
    'dw/web/Resource': Resource,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'int_emarsys/cartridge/scripts/service/emarsysService': emarsysService
});

var triggerEventHelper = proxyquire(cartridgePathE + 'cartridge/scripts/helpers/triggerEventHelper.js', {
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/system/Site': Site,
    'dw/system/Logger': Logger,
    'int_emarsys/cartridge/scripts/helpers/emarsysHelper': emarsysHelper,
    '*/cartridge/scripts/helpers/emarsysEventsHelper': emarsysEventsHelper
});


var emarsysSFRAHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/emarsysSFRAHelper.js', {
    'dw/system/Site': Site,
    'dw/system/Logger': Logger,
    'dw/order/BasketMgr': BasketMgr,
    '~/cartridge/scripts/helpers/newsletterHelper': newsletterHelper,
    '*/cartridge/scripts/helpers/triggerEventHelper': triggerEventHelper
});

describe('emarsysSFRA Helpers', () => {
    global.session = new Session();
    global.request = new Request();

    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('errorPage()', () => {
        // Can not be tested
        it('should render the error page', () => {
            var e = {
                error:''
            };
            var res = {
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.errorPage(e,res));
        });
    });

    describe('thankYouPage()', () => {
        // Can not be tested
        it('should render the thank you page', () => {
            var res = {
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.thankYouPage(res));
        });
    });

    describe('alreadyRegisteredPage()', () => {
        // Can not be tested
        it('should render the already registered page', () => {
            var res = {
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.alreadyRegisteredPage(res));
        });
    });

    describe('dataSubmittedPage()', () => {
        // Can not be tested
        it('should render the data submitted page', () => {
            var res = {
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.dataSubmittedPage(res));
        });
    });

    describe('emarsysDisabledTemplate()', () => {
        // Can not be tested
        it('should render the emarsys disabled template page', () => {
            var res = {
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.emarsysDisabledTemplate(res));
        });
    });

    describe('signup()', () => {
        // Can not be tested
        it('should render the subscription/emarsyssignup page', () => {
            var server = {
                forms: {
                    getForm: function (data) {
                        return {
                            clear: function () {}
                        }
                    }
                }
            };
            var res = {
                render: function(data,{}) {}
            };
            var URLUtils = {
                https: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.signup(server, URLUtils, res));
        });
    });

    describe('redirect()', () => {
        it('should return the redirect route', () => {
            var args = {
                SubscriptionType: 'checkout'
            };
            assert.equal(emarsysSFRAHelper.redirect(args), 'noRedirect');

            args.SubscriptionType = 'footer';
            assert.equal(emarsysSFRAHelper.redirect(args), 'noAjax');

            args.SubscriptionType = 'footer1';
            assert.equal(emarsysSFRAHelper.redirect(args), 'ajax');

            args.SubscriptionType = 'account';
            assert.equal(emarsysSFRAHelper.redirect(args), 'noRedirect');
        });
    });

    describe('redirectToDataSubmittedPage()', () => {
        // Can not be tested
        it('should redirect to data submitted data', () => {
           var args = {
                 SubscriptionType: 'checkout'
           };
            var res = {
                json: function(data) {
                    data.success = true;
                    data.accountStatus = '';
                },
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.redirectToDataSubmittedPage(args, res));

            args.SubscriptionType = 'footer'; //noAjax
            assert.isUndefined(emarsysSFRAHelper.redirectToDataSubmittedPage(args, res));
        });
        it('should redirect to data submitted data; ajax', () => {
            var args = {
                  SubscriptionType: 'test'
            };
             var res = {
                 json: function(data) {
                     data.success = true;
                     data.accountStatus = '';
                 },
                 render: function(data) {}
             };
             assert.isUndefined(emarsysSFRAHelper.redirectToDataSubmittedPage(args, res));
 
         });
    });

    describe('redirectToThankYouPage()', () => {
        // Can not be tested
        it('should redirect to thankYou page', () => {
           var args = {};
            var res = {
                json: function(data) {},
                render: function(data) {}
            };

            args.SubscriptionType = 'checkout';
            assert.isUndefined(emarsysSFRAHelper.redirectToThankYouPage(args, res));

            args.SubscriptionType = 'footer'; //noAjax
            assert.isUndefined(emarsysSFRAHelper.redirectToThankYouPage(args, res));

            args.SubscriptionType = 'test'; //ajax
            assert.isUndefined(emarsysSFRAHelper.redirectToThankYouPage(args, res));
        });
    });

    describe('redirectToAlreadyRegisteredPage()', () => {
        // Can not be tested
        it('should redirect to AlreadyRegistered page', () => {
           var args = {
                 SubscriptionType: 'checkout'
           };
            var res = {
                json: function(data) {},
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.redirectToAlreadyRegisteredPage(args, res));

            args.SubscriptionType = 'footer'; //noAjax
            assert.isUndefined(emarsysSFRAHelper.redirectToAlreadyRegisteredPage(args, res));

            args.SubscriptionType = 'test'; // Ajax
            assert.isUndefined(emarsysSFRAHelper.redirectToAlreadyRegisteredPage(args, res));
        });
    });

    describe('redirectToErrorPage()', () => {
        // Can not be tested
        it('should redirect to Error page', () => {
           var args = {
                 SubscriptionType: 'checkout'
           };
            var res = {
                json: function(data) {},
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.redirectToErrorPage(args, res));

            args.SubscriptionType = 'footer'; //noAjax
            assert.isUndefined(emarsysSFRAHelper.redirectToErrorPage(args, res));

            args.SubscriptionType = 'test'; // Ajax
            assert.isUndefined(emarsysSFRAHelper.redirectToErrorPage(args, res));
        });
    });

    describe('checkNotEmpty()', () => {
        it('should return status ', () => {
            var args = {
                SubscriptionType: 'checkout'
            };
            assert.equal(emarsysSFRAHelper.checkNotEmpty(args), true);
        });
        // Can not be tested
        it('should return status false', () => {
            var args = '';
            var res = {
                render: function(data) {}
            };
            assert.equal(emarsysSFRAHelper.checkNotEmpty(args,res), false);
        });
    });

    describe('processor()', () => {
        // Can not be tested
        it('should OptInStrategy handle; empty SubscriptionType', () => {
           var args = {
                 SubscriptionType: ''
           };
            var res = {
                json: function(data) {},
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.processor(args, res));
        });

        it('should OptInStrategy handle; strategy: "1" ', () => {
            var args = {
                  Email: 'test@test.com',
                  SubscriptionType: 'checkout',
                  Status: 'NOT FILLED',
                  Method: 'PUT'
            };
             var res = {
                 json: function(data) {},
                 render: function(data) {}
             };

             var result = emarsysSFRAHelper.processor(args, res);
             assert.isUndefined(result);

             args.SubscriptionType = 'footer';
             var result = emarsysSFRAHelper.processor(args, res);
             assert.isUndefined(result);
         });

         it('should OptInStrategy handle; strategy: "2" ', () => {
            var args = {
                  Email: 'test@test.com',
                  SubscriptionType: 'account',
                  Map: {}
            };
             var res = {
                 json: function(data) {},
                 render: function(data) {}
             };

             var result = emarsysSFRAHelper.processor(args, res);
             assert.isUndefined(result);

         });

         it('should OptInStrategy handle; strategy: "2" - error ', () => {
            var args = {
                  Email: 'test@test.com',
                  SubscriptionType: 'account',
                  Error: 'error',
                  Map: {}
            };
             var res = {
                 json: function(data) {},
                 render: function(data) {}
             };

             var result = emarsysSFRAHelper.processor(args, res);
             assert.isUndefined(result);

         });
         it('should OptInStrategy handle; strategy: "2" - empty error ', () => {
            var args = {
                  Email: 'test@test.com',
                  SubscriptionType: 'account',
                  Error: {},
                  Map: {}
            };
             var res = {
                 json: function(data) {},
                 render: function(data) {}
             };

             var result = emarsysSFRAHelper.processor(args, res);
             assert.isUndefined(result);

         });

         it('should OptInStrategy handle; Empty TypeData ', () => {
            var args = {
                  Email: 'test@test.com',
                  SubscriptionType: 'test',
            };
             var res = {
                 json: function(data) {},
                 render: function(data) {}
             };

             var result = emarsysSFRAHelper.processor(args, res);
             assert.isUndefined(result);
         });
        });

    describe('getCustomerData()', () => {
  
        it('should get current customer data', () => {
            var args = {
                SubscriptionType: 'footer',
            Map: {}
            }
           var result = emarsysSFRAHelper.getCustomerData(args);
            assert.deepEqual(result.basket.billingAddress,{
                    'address1': '65 May Lane',
                    'address2': '',
                    'city': 'Allston',
                    'countryCode': {
                        'value': 'us'
                    },
                    'firstName': 'Amanda',
                    'lastName': 'Jones',
                    'phone': '617-555-1234',
                    'postalCode': '02135',
                    'stateCode': 'MA'
                });
        });
    });

    describe('accountSubscription()', () => {
        it('should redirect page ', () => {
            var profileForm = {
                SubscriptionType: 'checkout',
                email: 'test@test.com'
            };
            var res = {
                json: function(data) {},
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.accountSubscription(res, profileForm));
        });
    });

    describe('checkoutSubscription()', () => {
        it('should redirect page ', () => {
            var billingData = {
                email: {
                    value: 'test@test.com'
                }
            };
            var res = {
                json: function(data) {},
                render: function(data) {}
            };
            assert.isUndefined(emarsysSFRAHelper.checkoutSubscription(res, billingData));
        });
    });

});
