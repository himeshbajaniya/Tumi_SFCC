var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../../mocks/';

var Logger = require(mockPath + 'dw/system/Logger');

var Status = require(mockPath + 'dw/system/Status');
var order = require(mockPath + 'dw/order/Order');
var web = require(mockPath + 'dw/web/Web');
var Site = require(mockPath + 'dw/system/Site');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var Money = require(mockPath + 'dw/value/Money');
var emarsysService = require(mockPath + 'service/emarsysService');
var CustomObjectMgr = require(mockPath + 'dw/object/CustomObjectMgr');
var Order = require(mockPath + 'dw/order/Order');
var OrderMgr = require(mockPath + 'dw/order/OrderMgr');

var siteCustomPreferences = Site.getCurrent();
var cartridgePath = '../../../../../../cartridges/int_emarsys/';

var EmarsysHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/emarsysHelper.js', {
    'dw/web': web,
    'dw/order': order,
    'dw/value/Money': Money,
    'dw/system/Site': Site,
    'dw/order/ShippingMgr': ShippingMgr,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    siteCustomPreferences: siteCustomPreferences,
    '~/cartridge/scripts/service/emarsysService': emarsysService 
});

var OrderStatusСhangeNotification = proxyquire(cartridgePath + 'cartridge/scripts/jobsteps/orderStatusChangeNotification.js', {
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/system/Status': Status,
    'dw/system/Site': Site,
    'dw/order/Order': Order,
    'dw/order/OrderMgr': OrderMgr,
    'dw/system/Logger': Logger,
    'int_emarsys/cartridge/scripts/helpers/emarsysHelper': EmarsysHelper
});

describe('OrderStatusСhangeNotification jobstep', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    it('Testing method: execute', () => {
        args = {
            isDisabled: true
        };
        var result = OrderStatusСhangeNotification.execute(args);
        assert.deepEqual(result, {
                code: 'OK',
                status: 2
            });
    });
    it('Testing method: execute; stepFunctional:0 ', () => {
        args = {
            isDisabled: false,
            stepFunctional:0
        };
        var result = OrderStatusСhangeNotification.execute(args);
        assert.deepEqual(result, {
            code: 'OK',
            status: 2
            });
    });
    it('Testing method: execute; stepFunctional:1 ', () => {
        args = {
            isDisabled: false,
            stepFunctional:1 // 1: orderCancelledConf, there is no externalEvent
        };
        var result = OrderStatusСhangeNotification.execute(args);
        assert.deepEqual(result, {
            code: 'ERROR',
            status: 1
            });
    });
    it('Testing method: execute; stepFunctional:default ', () => {
        args = {
            isDisabled: false
        };
        var result = OrderStatusСhangeNotification.execute(args);
        assert.deepEqual(result, {
            code: 'ERROR',
            status: 1
            });
    });
});
