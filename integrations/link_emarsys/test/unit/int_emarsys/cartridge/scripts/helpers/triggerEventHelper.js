'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = '../../../../../mocks/';

var CustomObjectMgr = require(mockPath +'dw/object/CustomObjectMgr');
var Logger = require(mockPath + 'dw/system/Logger');
var Request = require(mockPath + 'dw/system/Request');
var Session = require(mockPath + 'dw/system/Session');
var Resource = require(mockPath +'dw/web/Resource');
var order = require(mockPath + 'dw/order/Order');
var web = require(mockPath + 'dw/web/Web');
var Money = require(mockPath + 'dw/value/Money');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var Site = require(mockPath + 'dw/system/Site');
var emarsysService = require(mockPath + 'service/emarsysService');
var siteCustomPreferences = Site.getCurrent();

var cartridgePath = '../../../../../../cartridges/int_emarsys/';

var emarsysEventsHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/emarsysEventsHelper.js', {
    'dw/web/Resource': Resource,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'int_emarsys/cartridge/scripts/service/emarsysService': emarsysService
});

var EmarsysHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/emarsysHelper.js', {
    'dw/web': web,
    'dw/order': order,
    'dw/value/Money': Money,
    'dw/system/Site': Site,
    'dw/order/ShippingMgr': ShippingMgr,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    '~/cartridge/scripts/service/emarsysService': emarsysService,
    siteCustomPreferences: siteCustomPreferences 
});

var triggerEventHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/triggerEventHelper.js', {
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/system/Site': Site,
    'dw/system/Logger': Logger,
    'int_emarsys/cartridge/scripts/helpers/emarsysHelper': EmarsysHelper,
    '*/cartridge/scripts/helpers/emarsysEventsHelper': emarsysEventsHelper
});

describe('triggerEventHelper Scripts', function() {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };
    global.request = new Request();
    global.session = new Session();

    it('testing method: triggerExternalEvent; #1(Bad request)',function () {
        var context = {
            externalEventId: '1000',
            additionalParams: {
                first_name: 'John',
                last_name: 'Snow',
                optin: true
            },
            email: 'test@test.com',
            profileFields: {
                email: {
                    id: 'test@test.com'
                }
            }
        };

        var onError = function (err) { 
            return {
                    'replyCode':1,
                    'replyText':'ERROR'
        }};
        var result = triggerEventHelper.triggerExternalEvent(context, onError);
        
        assert.deepEqual(result, {
            'replyCode':1,
            'replyText':'ERROR'
        });
    });

    it('testing method: triggerExternalEvent; #2(Good request)',function () {
        var context = {
            externalEventId: '5633',
            additionalParams: {
                first_name: 'John',
                last_name: 'Snow',
                optin: true,
                isSingleChoice: true,
                options : {
                    value: "rue"
                }
            },
            email: 'test@test.com',
            profileFields: {
                email: {
                    id: 'test@test.com'
                },
                first_name: 'John',
                last_name: 'Snow',
                optin: true,
                options : {
                    value: "rue"
                }
            }
        };

        var onError = function (err) { 
            return {
                'replyCode':1,
                'replyText':'ERROR'
        }};
        var result = triggerEventHelper.triggerExternalEvent(context, onError);
        
        assert.deepEqual(result, context);
    });

    it('testing method: getExternalEventData #1',function () {
        var sfccEventName = 'contact_form_submitted';
        var result = triggerEventHelper.getExternalEventData(sfccEventName, 'otherResult');

        assert.deepEqual(result, {
            campaignId: '7497057',
            emarsysId: '12563',
            emarsysName: 'SFCC_CONTACT_FORM_SUBMITTED',
            sfccName: 'contact_form_submitted'
        });
    });
    it('testing method: getExternalEventData #2',function () {
        var sfccEventName = '';
        var result = triggerEventHelper.getExternalEventData(sfccEventName, 'otherResult');

        assert.deepEqual(result, {
            emarsysId: null,
            emarsysName: null,
            sfccName: null
        });
    });
    it('testing method: processEventTriggering',function () {
        var sfccEventName = 'cancelled_order';
        var extendFunc = function () {
            var result = {};
            Array.prototype.forEach.call(arguments, function (argument) {
                if (typeof argument === 'object') {
                    Object.keys(argument).forEach(function (key) {
                        result[key] = argument[key];
                    });
                }
            });
            return result;
        };
        var initialData = {
            email: 'test@test.com'
        };
        var result = triggerEventHelper.processEventTriggering(sfccEventName, extendFunc, initialData);

        assert.isUndefined(result);
    });
});
