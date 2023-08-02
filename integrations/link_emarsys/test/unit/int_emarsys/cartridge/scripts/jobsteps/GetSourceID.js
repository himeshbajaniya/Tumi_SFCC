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

var sourceID = proxyquire(cartridgePath + 'cartridge/scripts/jobsteps/getSourceID.js', {
    'dw/system/Status': Status,
    'dw/system/Site': Site,
    'dw/system/Logger': Logger,
    'int_emarsys/cartridge/scripts/helpers/emarsysHelper': EmarsysHelper
});

describe('GetSourceID jobstep', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    it('Testing method: execute', () => {
    var result = sourceID.execute();
    assert.deepEqual(result, {
        code: 'OK',
        status: 2
        });
    });

});