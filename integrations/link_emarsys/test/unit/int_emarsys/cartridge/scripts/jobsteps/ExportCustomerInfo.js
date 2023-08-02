var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../../mocks/';
var cartridgePath = '../../../../../../cartridges/int_emarsys/';

var web = require(mockPath + 'dw/web/Web');
var order = require(mockPath + 'dw/order/Order');
var Money = require(mockPath + 'dw/value/Money');
var Site = require(mockPath + 'dw/system/Site');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var emarsysService = require(mockPath + 'service/emarsysService');
var template = require(mockPath + 'dw/util/Template');
var hashMap = require(mockPath + 'dw/util/HashMap');
var Mail = require(mockPath + 'dw/net/Mail');
var system = require(mockPath + 'dw/system/system');
var io = require(mockPath + 'dw/io/Io');
var File = require(mockPath + 'dw/io/File');
var customerMgr = require(mockPath + 'dw/customer/CustomerMgr');
var CustomObjectMgr = require(mockPath + 'dw/object/CustomObjectMgr');
var Status = require(mockPath + 'dw/system/Status');
var Logger = require(mockPath + 'dw/system/Logger');

var EmarsysHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/emarsysHelper.js', {
    'dw/web': web,
    'dw/order': order,
    'dw/value/Money': Money,
    'dw/system/Site': Site,
    'dw/order/ShippingMgr': ShippingMgr,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/system/Site': Site,
    '~/cartridge/scripts/service/emarsysService': emarsysService
});

var ExportCustomerInfo = proxyquire(cartridgePath + 'cartridge/scripts/jobsteps/exportCustomerInfo.js', {
    'dw/system': system,
    'dw/io': io,
    'dw/io/File': File,
    'dw/customer/CustomerMgr': customerMgr,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/system/Status': Status,
    'dw/system/Logger': Logger,
    'dw/system/Site': Site,
    'int_emarsys/cartridge/scripts/helpers/emarsysHelper': EmarsysHelper,
    'dw/util/Template': template,
    'dw/util/HashMap': hashMap,
    'dw/net/Mail': Mail
});

describe('ExportCustomerInfo jobstep', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    it('Testing method: execute', () => {
        var args = {
            enableAPI: false,
            csvFileColumnsDelimiter: ';',
            optInStatus: '0',
            customAttributeId: 'EmarsysOptInFlag',
            profilesExportThreshold: '1000',
            fromEmail: 'test@gmail.com',
            mailTo: 'marsik.tagManager@gmail.com',
            mailSubject: 'Export orders'
        };
        var result = ExportCustomerInfo.execute(args);
        assert.deepEqual(result, {
            code: 'OK',
            status: 2
        });
    });

    it('Testing method: execute; time limitation', () => {
        var args = {
            enableCustomTimeFrame:true,
            timeframeStart: new Date(2020,1,5),
            timeframeEnd:  new Date(2020,1,7),
            csvFileColumnsDelimiter: ';',
            optInStatus: '0',
            customAttributeId: 'EmarsysOptInFlag',
            profilesExportThreshold: '1000',
            fromEmail: 'test@gmail.com',
            mailTo: 'marsik.tagManager@gmail.com',
            mailSubject: 'Export orders'
        };

        var result = ExportCustomerInfo.execute(args);
        assert.deepEqual(result, {
            code: 'OK',
            status: 2
        });

    });

    it('Testing method: execute; enableAPI = true', () => {
        var args = {
            enableAPI: true,
            csvFileColumnsDelimiter: ';',
            optInStatus: 0,
            customAttributeId: 'EmarsysOptInFlag',
            profilesExportThreshold: '1000',
            fromEmail: 'test@gmail.com',
            mailTo: 'marsik.tagManager@gmail.com',
            mailSubject: 'Export orders'
        };
        var result = ExportCustomerInfo.execute(args);
        assert.deepEqual(result, {
            code: 'OK',
            status: 2
        });
    });

    it('Testing method: execute; optInStatus', () => {
        var args = {
            enableAPI: true,
            csvFileColumnsDelimiter: ';',
            optInStatus: 1, // All users true
            customAttributeId: 'EmarsysOptInFlag',
            profilesExportThreshold: '1000',
            fromEmail: 'test@gmail.com',
            mailTo: 'marsik.tagManager@gmail.com',
            mailSubject: 'Export orders'
        };
        var result = ExportCustomerInfo.execute(args);
        assert.deepEqual(result, {
            code: 'OK',
            status: 2
        });

        args.optInStatus = 2;  // Depending on attribute
        var result = ExportCustomerInfo.execute(args);
        assert.deepEqual(result, {
            code: 'OK',
            status: 2
        });
    });
});
