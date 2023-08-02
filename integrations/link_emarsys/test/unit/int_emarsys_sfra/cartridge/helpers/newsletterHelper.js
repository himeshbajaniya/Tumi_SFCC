'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath ='./../../../../mocks/';

var Request = require(mockPath + 'dw/system/Request');
var Session = require(mockPath + 'dw/system/Session');
var Shipment = require(mockPath + 'dw/order/Shipment');
var Site = require(mockPath + 'dw/system/Site');
var Money = require(mockPath + 'dw/value/Money');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var order = require(mockPath + 'dw/order/Order');
var web = require(mockPath + 'dw/web/Web');
var emarsysService = require(mockPath + 'service/emarsysService');
var siteCustomPreferences = Site.getCurrent();
var Logger = require(mockPath + 'dw/system/Logger');
var Transaction = require(mockPath + 'dw/system/Transaction');
var CustomObjectMgr = require(mockPath + 'dw/object/CustomObjectMgr');

var cartridgePath = '../../../../../cartridges/int_emarsys_sfra/';
var cartridgePathE = '../../../../../cartridges/int_emarsys/';

var emarsysHelper = proxyquire(cartridgePathE + 'cartridge/scripts/helpers/emarsysHelper.js', {
    'dw/web': web,
    'dw/order': order,
    'dw/value/Money': Money,
    'dw/system/Site': Site,
    'dw/order/ShippingMgr': ShippingMgr,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    siteCustomPreferences: siteCustomPreferences,
    '~/cartridge/scripts/service/emarsysService': emarsysService
});

var newsletterHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/newsletterHelper.js', {
    'dw/system/Logger': Logger,
    'dw/system/Transaction': Transaction,
    'dw/system/Site': Site,
    'int_emarsys/cartridge/scripts/helpers/emarsysHelper': emarsysHelper,
    'dw/object/CustomObjectMgr': CustomObjectMgr
});

describe('newsletterHelper Helpers', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    global.request = new Request();
    global.session = new Session();

    it('Testing method: mapFieldsSignup', () => {
        var result = newsletterHelper.mapFieldsSignup();
        assert.deepEqual(result, {
            '3': 'test@test.com'
        });
    });

    it('Testing method: getCustomerData; basket.billingAddress', () => {
        var args = {
            SubscriptionType: 'footer',
            basket: {
                billingAddress: {
                    'address1': 'Street Address',
                    'city': 'City',
                    'firstName': 'Test',
                    'fullName': 'Test Test',
                    'lastName': 'Test',
                    'phone': '333-333-3333',
                    'postalCode': '12345',
                    'stateCode': 'AL',
                    'countryCode': 'us'
                },
                shipments: {
                    shipment: new Shipment({ID: '0940'})
                }
            },
            Map: {}
        };
        var result = newsletterHelper.getCustomerData(args);
        assert.deepEqual(result.Map, {
            '1': 'Test',
            '2': 'Test',
            '10': 'Street Address',
            '11': 'City',
            '12': 'AL',
            '13': '12345',
            '14': 'us',
            '15': '333-333-3333'
        });
    });

    it('Testing method: getCustomerData; basket.shipments', () => {
        var args = {
            SubscriptionType: 'footer',
            basket: {
                shipments: [new Shipment({ID: '0940'})]
            },
            Map: {}
        };
        var result = newsletterHelper.getCustomerData(args);
        assert.deepEqual(result.Map, {
            '1': 'Amanda',
            '2': 'Jones',
            '10': '65 May Lane',
            '11': 'Allston',
            '12': 'MA',
            '13': '02135',
            '14': 'us',
            '15': '617-555-1234'
        });
    });

    it('Testing method: getCustomerData; authenticated: true', () => {
        var args = {
            SubscriptionType: 'account',
            Map: {}
        };
        var result = newsletterHelper.getCustomerData(args);
        assert.deepEqual(result.Map, {});
    });

    it('Testing method: doubleOptInSubscribe', () => {
        var args = {
            ExternalEvent: 5636,
            ExternalEventAfterConfirmation: 5634,
            Strategy: 1
        };
        var result = newsletterHelper.doubleOptInSubscribe(args);
        assert.deepEqual(result, args);
    });

    it('Testing method: doubleOptInSubscribe; bad event', () => {
        var args = {
            ExternalEvent: 1000,
            ExternalEventAfterConfirmation: 1000,
            Strategy: 1
        };
        var result = newsletterHelper.doubleOptInSubscribe(args);
        assert.isNull(result);
    });
    it('Testing method: subscriptionTypeData', () => {
        var result = newsletterHelper.subscriptionTypeData('account');
        assert.deepEqual(result, {
            Strategy: '2',
            ExternalEventName: 'newsletter_subscription_confirmation',
            ExternalEventAfterConfirmationName: 'newsletter_subscription_confirmation'
        });
    });

    it('Testing method: subscriptionTypeData', () => {
        var result = newsletterHelper.subscriptionTypeData('test');
        assert.deepEqual(result, {
            Strategy: null,
            ExternalEventName: null,
            ExternalEventAfterConfirmationName: null
        });
    });

    it('Testing method: sendDataForDoubleOptIn', () => {
        var args = {
            Map: {},
            Email: 'test@test.com'
        };
        var result = newsletterHelper.sendDataForDoubleOptIn(args);
        assert.deepEqual(result, {
            Map: {},
            Email: 'test@test.com', 
            TriggerEvent: true
        });
    });

    it('Testing method: triggerExternalEvent', () => {
        var args = {
            ExternalEvent: 5634,
            Email: 'test@test.com'
        };
        var result = newsletterHelper.triggerExternalEvent(args);
        assert.deepEqual(result,args);
    });

    it('Testing method: triggerExternalEvent; bad event', () => {
        var args = {
            ExternalEvent: 1000,
            Email: 'test@test.com'
        };
        var result = newsletterHelper.triggerExternalEvent(args);
        assert.deepEqual(result,args);
    });

    it('Testing method: getAccountStatus', () => {
        var args = {
            Email: 'test@test.com',
            SubscriptionType: 'footer'
        };
        var result = newsletterHelper.getAccountStatus(args,{});
        assert.deepEqual(result, {
            'Email': 'test@test.com',
            'Status': 'NOT FILLED',
            'SubscriptionType': 'footer'
        });
    });

    it('Testing method: submitContactData', () => {
        var args = {
            Map: {},
            Method: 'GET',
            Email: 'test@test.com',
            SubscriptionType: 'footer',
            SubscribeToEmails: ''
        };
        var result = newsletterHelper.submitContactData(args, {});
        assert.deepEqual(result, args);
    });

    it('Testing method: newsletterUnsubscribe', () => {
        var args = {
            passedParams: {
                uid: 'iduser123',
                cid: 'idcampaign123',
                lid: 'idlist123',
                direct: 'y',
                confirmation: {
                    triggeredAction:{
                        formId: 'newsletter_unsubscribe'
                    }
                }
            }
        };
        var result = newsletterHelper.newsletterUnsubscribe(args);
        assert.deepEqual(result, {
            'errorText': 'ERROR',
            'errors': true,
            'passedParams': {
              'cid': 'idcampaign123',
              'confirmation': {
                'triggeredAction': {
                  'formId': 'newsletter_unsubscribe'
                }
              },
              'direct': 'y',
              'lid': 'idlist123',
              'uid': 'iduser123'
            },
            'showConfirmation': false
        });
    });

    it('Testing method: newsletterUnsubscribe; empty passedParams', () => {
        var args = {
                uid: 'iduser123',
                cid: 'idcampaign123',
                lid: 'idlist123',
                confirmation: {
                    triggeredAction:{
                        formId: 'newsletter_unsubscribe'
                    }
            }
        };
        var result = newsletterHelper.newsletterUnsubscribe(args);
        assert.deepEqual(result, {
            cid: 'idcampaign123',
            confirmation: {
            triggeredAction: {
                formId: 'newsletter_unsubscribe'
                }
            },
            errorText: 'ERROR',
            errors: true,
            lid: 'idlist123',
            showConfirmation: false,
            uid: 'iduser123'
        });
    });

    it('Testing method: newsletterUnsubscribe; empty confirmation', () => {
        var args = {
                uid: 'iduser123',
                cid: 'idcampaign123',
                lid: 'idlist123',
                direct: 'n'
        };
        var result = newsletterHelper.newsletterUnsubscribe(args);
        assert.deepEqual(result, {
            cid: 'idcampaign123',
            lid: 'idlist123',
            direct: 'n',
            params: {
                cid: 'idcampaign123',
                direct: 'y',
                lid: 'idlist123',
                uid: 'iduser123'
            },
            showConfirmation: true,
            uid: 'iduser123'
        });
    });

    it('Testing method: accountUnsubscribe', () => {
        var result = newsletterHelper.accountUnsubscribe('test@test.com');
        assert.equal(result.status,'SUCCESS');
    });

    it('Testing method: accountUnsubscribe; Empty Email', () => {
        var result = newsletterHelper.accountUnsubscribe('');
        assert.equal(result.status,'NO EMAIL');
    });

});
