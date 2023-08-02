var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../../mocks/';

var Session = require(mockPath + 'dw/system/Session');
var Logger = require(mockPath + 'dw/system/Logger');
var Status = require(mockPath + 'dw/system/Status');
var File = require(mockPath + 'dw/io/File');
var io = require(mockPath + 'dw/io/Io');
var order = require(mockPath + 'dw/order/Order');
var web = require(mockPath + 'dw/web/Web');
var ArrayList = require(mockPath + 'dw/util/ArrayList');
var Currency = require(mockPath + 'dw/util/Currency');
var File = require(mockPath + 'dw/io/File');
var Site = require(mockPath + 'dw/system/Site');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var Money = require(mockPath + 'dw/value/Money');
var Variant = require(mockPath + 'dw/catalog/Variant');
var OrderMgr = require(mockPath + 'dw/order/OrderMgr');
var FileWriter = require(mockPath + 'dw/io/FileWriter');
var CSVStreamWriter = require(mockPath + 'dw/io/CSVStreamWriter');
var CustomObjectMgr = require(mockPath + 'dw/object/CustomObjectMgr');
var Calendar = require(mockPath + 'dw/util/Calendar');
var StringUtils = require(mockPath + 'dw/util/StringUtils');
var Currency = require(mockPath + 'dw/util/Currency');
var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');
var GiftCertificateLineItem = require(mockPath + 'dw/order/GiftCertificateLineItem');

var siteCustomPreferences = Site.getCurrent();
var cartridgePath = '../../../../../../cartridges/int_emarsys/';

var EmarsysHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/emarsysHelper.js', {
    'dw/web': web,
    'dw/order': order,
    'dw/value/Money': Money,
    'dw/system/Site': Site,
    'dw/order/ShippingMgr': ShippingMgr,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    siteCustomPreferences: siteCustomPreferences 
});

var JobHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/jobHelper.js', {
    'dw/io/File': File,
    'dw/io': io,
    'dw/system/Site': Site,
    'dw/util/Currency': Currency,
    'dw/catalog/Variant': Variant,
    'dw/util/ArrayList': ArrayList,
    'int_emarsys/cartridge/scripts/helpers/emarsysHelper': EmarsysHelper, 
    siteCustomPreferences: siteCustomPreferences 
});

var ExportOrders = proxyquire(cartridgePath + 'cartridge/scripts/jobsteps/exportOrders.js', {
    'dw/io/File':File,
    'dw/system/Status': Status,
    'dw/system/Logger':Logger,
    'int_emarsys/cartridge/scripts/helpers/jobHelper': JobHelper,
    'dw/order/OrderMgr':OrderMgr,
    'dw/io/FileWriter': FileWriter,
    'dw/io/CSVStreamWriter': CSVStreamWriter,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/util/Calendar':Calendar,
    'dw/util/StringUtils':StringUtils,
    'dw/util/Currency':Currency,
    'dw/order/ProductLineItem': ProductLineItem,
    'dw/order/GiftCertificateLineItem': GiftCertificateLineItem,
    'dw/catalog/Variant': Variant

});

describe('ExportOrders jobstep', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };
    global.session = new Session();

    it('Testing method: execute', () => {
        var nowDate = new Date();
        var monthEarlier = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, nowDate.getDate());
        var args = {
            destinationFolder: 'test/orders',
            smartInsightCurrency: 'USD',
            enableCustomTimeFrame: false,
            timeframeStart: monthEarlier,
            timeframeEnd: nowDate
        };

        var result = ExportOrders.execute(args);
        assert.deepEqual(result,{
            code: 'OK',
            status: 2
        });
    });

    it('Testing method: execute; currency: "EUR"', () => {
        var nowDate = new Date();
        var monthEarlier = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, nowDate.getDate());
        var args = {
            destinationFolder: 'test/orders',
            smartInsightCurrency: 'EUR',
            enableCustomTimeFrame: false,
            timeframeStart: monthEarlier,
            timeframeEnd: nowDate
        };

        var result = ExportOrders.execute(args);
        assert.deepEqual(result,{
            code: 'OK',
            status: 2
        });
    });

});