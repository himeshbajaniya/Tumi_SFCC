var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../../mocks/';

var File = require(mockPath + 'dw/io/File');
var Status = require(mockPath + 'dw/system/Status');
var io = require(mockPath + 'dw/io/Io');
var order = require(mockPath + 'dw/order/Order');
var web = require(mockPath + 'dw/web/Web');
var ArrayList = require(mockPath + 'dw/util/ArrayList');
var Currency = require(mockPath + 'dw/util/Currency');
var Site = require(mockPath + 'dw/system/Site');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var Money = require(mockPath + 'dw/value/Money');
var Variant = require(mockPath + 'dw/catalog/Variant');
var emarsysFTPService = require(mockPath + 'service/emarsysFTPService');
var StepUtil = require(mockPath + 'util/stepUtil');
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


var FtpUpload = proxyquire(cartridgePath + 'cartridge/scripts/jobsteps/ftpUpload.js', {
    'dw/io/File': File,
    'dw/system/Status': Status,
    'int_emarsys/cartridge/scripts/helpers/jobHelper': JobHelper,
    'int_emarsys/cartridge/scripts/service/emarsysFTPService': emarsysFTPService,
    'int_emarsys/cartridge/scripts/util/stepUtil': StepUtil
});

describe('FtpUpload jobstep', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    it('Testing method: Run', () => {
    var args = {
        ServiceID: 'exchange.emarsys.api',
        FilePattern: '.*.csv',
        SourceFolder: 'src/test',
        TargetFolder: 'Test2',
        Recursive: false,
        ArchiveFolder: 'src/test/archives',
        NoFileFoundStatus: 'OK',
        IsDisabled: false
    };

    var result = FtpUpload.Run(args);
    assert.deepEqual(result, {
        code: 'OK',
        status: 2
        });
    });

});