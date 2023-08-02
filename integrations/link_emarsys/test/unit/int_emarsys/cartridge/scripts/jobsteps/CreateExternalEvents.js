'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../../mocks/';

var Logger = require(mockPath + 'dw/system/Logger');
var Status = require(mockPath + 'dw/system/Status');
var Resource = require(mockPath +'dw/web/Resource');
var CustomObjectMgr = require(mockPath + 'dw/object/CustomObjectMgr');
var emarsysService = require(mockPath + 'service/emarsysService');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var Site = require(mockPath + 'dw/system/Site');
var siteCustomPreferences = Site.getCurrent();
var order = require(mockPath + 'dw/order/Order');
var web = require(mockPath + 'dw/web/Web');
var Money = require(mockPath + 'dw/value/Money');

var cartridgePathE = '../../../../../../cartridges/int_emarsys/';

var EmarsysHelper = proxyquire(cartridgePathE + 'cartridge/scripts/helpers/emarsysHelper.js', {
    'dw/web': web,
    'dw/order': order,
    'dw/value/Money': Money,
    'dw/system/Site': Site,
    'dw/order/ShippingMgr': ShippingMgr,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    siteCustomPreferences: siteCustomPreferences,
    '~/cartridge/scripts/service/emarsysService': emarsysService 
});

var EmarsysEventsHelper = proxyquire(cartridgePathE + 'cartridge/scripts/helpers/emarsysEventsHelper.js', {
    'dw/web/Resource': Resource,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'int_emarsys/cartridge/scripts/service/emarsysService': emarsysService,
    'dw/system/Site': Site
});

var CreateExternalEvents = proxyquire(cartridgePathE + 'cartridge/scripts/jobsteps/createExternalEvents.js', {
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/system/Status': Status,
    'dw/system/Logger': Logger,
    'int_emarsys/cartridge/scripts/helpers/emarsysEventsHelper': EmarsysEventsHelper,
    'int_emarsys/cartridge/scripts/helpers/emarsysHelper': EmarsysHelper
});

describe('CreateExternalEvents jobstep', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    it('Testing method: execute #1', () => {
        var params = {};
        var result = CreateExternalEvents.execute(params);
        assert.deepEqual(result, {
                code: 'OK',
                status: 2
            });
    });

    it('Testing method: execute; #2', () => {
        var params = {
            customObjectKey:'emptyObject'
        };
        var result = CreateExternalEvents.execute(params);
        assert.deepEqual(result, {
                code: 'ERROR',
                status: 1
            });
    });

    it('Testing method: execute; #3', () => {
        var params = {
            customObjectKey:'testObject'
        };
        var result = CreateExternalEvents.execute(params);
        assert.deepEqual(result, {
                code: 'ERROR',
                status: 1
            });
    });
});
