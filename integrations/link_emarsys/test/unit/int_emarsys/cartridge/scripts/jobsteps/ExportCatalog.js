var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../../mocks/';

var io = require(mockPath + 'dw/io/Io');
var order = require(mockPath + 'dw/order/Order');
var web = require(mockPath + 'dw/web/Web');
var ArrayList = require(mockPath + 'dw/util/ArrayList');
var CatalogMgr = require(mockPath + 'dw/catalog/CatalogMgr');
var CSVStreamWriter = require(mockPath + 'dw/io/CSVStreamWriter');
var CustomObjectMgr = require(mockPath + 'dw/object/CustomObjectMgr');
var Currency = require(mockPath + 'dw/util/Currency');
var File = require(mockPath + 'dw/io/File');
var FileWriter = require(mockPath + 'dw/io/FileWriter');
var Logger = require(mockPath + 'dw/system/Logger');
var Site = require(mockPath + 'dw/system/Site');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var Status = require(mockPath + 'dw/system/Status');
var ProductMgr = require(mockPath + 'dw/catalog/ProductMgr');
var Money = require(mockPath + 'dw/value/Money');
var Variant = require(mockPath + 'dw/catalog/Variant');
var Request = require(mockPath + 'dw/system/Request');
var Session = require(mockPath + 'dw/system/Session');

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

var ExportCatalog = proxyquire(cartridgePath + 'cartridge/scripts/jobsteps/exportCatalog.js',{
    'dw/catalog/CatalogMgr': CatalogMgr,
    'dw/io/CSVStreamWriter': CSVStreamWriter,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/io/File': File,
    'dw/io/FileWriter': FileWriter,
    'dw/system/Site': Site,
    'dw/system/Status': Status,
    'dw/catalog/ProductMgr': ProductMgr,
    'dw/system/Logger': Logger,
    'int_emarsys/cartridge/scripts/helpers/jobHelper': JobHelper
});

describe('ExportCatalog jobstep', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    global.request = new Request();
    global.session = new Session();

    it('Testing method: execute', () => {
        var args = {
             exportFolderName: 'Test',
             exportFileName: '',
             catalogConfigKey: 'customConfig'
        };
       var result = ExportCatalog.execute(args);
     
       assert.deepEqual(result,{
         code: 'OK',
         status: 2
      });
     });

});
