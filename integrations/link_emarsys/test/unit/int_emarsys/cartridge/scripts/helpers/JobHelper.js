var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../../mocks/';

var Request = require(mockPath + 'dw/system/Request');
var Session = require(mockPath + 'dw/system/Session');
var io = require(mockPath + 'dw/io/Io');
var order = require(mockPath + 'dw/order/Order');
var web = require(mockPath + 'dw/web/Web');
var ArrayList = require(mockPath + 'dw/util/ArrayList');
var Currency = require(mockPath + 'dw/util/Currency');
var File = require(mockPath + 'dw/io/File');
var Money = require(mockPath + 'dw/value/Money');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var Site = require(mockPath + 'dw/system/Site');
var Variant = require(mockPath + 'dw/catalog/Variant');
var Product = require(mockPath + 'dw/catalog/Product');
var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');
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


describe('JobHelper Scripts', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };
    global.request = new Request();
    global.session = new Session();

    it('testing method: getFiles', () => {
        var directoryPath = 'IMPEX/src/test/test';
        var filePatern = '.*.csv';
        var result = JobHelper.getFiles(directoryPath, filePatern);

        assert.deepEqual(result[0], 'IMPEX/src/test/test/Test.csv');
    });

    it('testing method: getFileName', () => {
        var filePath = 'IMPEX/src/test/test/Test.csv';
        var result = JobHelper.getFileName(filePath);

        assert.equal(result,'Test.csv');
    });

    it('testing method:getFileListRecursive', () => {
        // Can not be tested
        var currentSourceDirectory = 'IMPEX/src/test';
        var filePattern = '.*.csv';
        var sourceFolder = 'src/test';
        var targetFolder = 'Test2';
        var recursive = true;
        var doOverwrite = false;
        var getTargetFile = false;
        var result = JobHelper.getFileListRecursive(currentSourceDirectory, filePattern, sourceFolder, targetFolder, recursive, doOverwrite, getTargetFile);
        assert.deepEqual(result,[]);
       
        var currentSourceDirectory2 = new File('IMPEX/src/test');
        result = JobHelper.getFileListRecursive(currentSourceDirectory2, filePattern, sourceFolder, targetFolder, recursive, doOverwrite, getTargetFile);
        assert.deepEqual(result,[]);
    });

    it('testing method: createDirectory', () => {
        var directoryPath = 'IMPEX/src/test/test';
        var result = JobHelper.createDirectory(directoryPath);

        assert.equal(result.fullPath,'IMPEX/src/test/test');
    });

    it('testing method: createSmartInsightExportFile', () => {
        var destinationFolder = 'smartinsight';
        var res = 'IMPEX/src/smartinsight/sales_items_siteName.csv';
        var result = JobHelper.createSmartInsightExportFile(destinationFolder);

        assert.deepEqual(result.fullPath, res);
    });

    it('testing method: createSmartInsightFeedName', () => {
        var res = 'sales_items_1234567890.csv';
        var result = JobHelper.createSmartInsightFeedName();

        assert.equal(result, res);
    });

    it('testing method: escapeCSVField', () => {
        var field = 'dd/"dd"/gg';
        var field2 ='dd/""dd""/gg';
        var result = JobHelper.escapeCSVField(field);
        assert.equal(result, field2);
    });

    it('testing method: getProductValues', () => {
        var productLineItem = new ProductLineItem();
        var attributes = ['url'];
        var result = JobHelper.getProductValues(productLineItem, attributes);
        assert.equal(result, 'Product-Show/pid=1234567');

        attributes = ['image'];
        result = JobHelper.getProductValues(productLineItem, attributes);
        assert.equal(result, 'testAbsUrl');

        attributes = ['rebate'];
        result = JobHelper.getProductValues(productLineItem, attributes);
        assert.deepEqual(result, { currencyCode: 'USD', value: 3 });
    });

    it('testing method: getLineItemValues', () => {
        var attributes = ['adjustedPrice', 'currencyCode'];
        var result = JobHelper.getLineItemValues(new ProductLineItem(), attributes);

        assert.equal(result, 'USD');
    });

    it('testing method: getOrderValues', () => {

        var attributes = ['orderRebate'];
        var result = JobHelper.getOrderValues(order, attributes);
        assert.deepEqual(result, { currencyCode: 'USD', value: 13.77 });

        attributes = ['billingAddress', 'phone'];
        result = JobHelper.getOrderValues(order, attributes);
        assert.equal(result, '617-555-1234');

        attributes = ['paymentMethods'];
        result = JobHelper.getOrderValues(order, attributes);
        assert.equal(result, 'paymentInstrumentId1+paymentInstrumentId2');
    });

    it('testing method: returnOrderPaymentMethods', () => {
        var result = JobHelper.returnOrderPaymentMethods(order);

        assert.equal(result, 'paymentInstrumentId1+paymentInstrumentId2');
    });

    it('testing method: getProductInfo', () => {
        var currenciesMap = {'default':'USD', 'en_US':'USD', 'en':'USD'};
        var dataObject = [];
        var defaultLocale = 'en';
        var mappedFields = [{'field':'product.ID','placeholder':'item'},
                            {'field':'product.availability','placeholder':'available'},
                            {'field':'product.name','placeholder':'title_multilang'},
                            {'field':'product.url','placeholder':'link_multilang'},
                            {'field':'product.image','placeholder':'image'},
                            {'field':'product.categories','placeholder':'category_multilang'},
                            {'field':'product.price','placeholder':'price_multilang'},
                            {'field':'product.brand','placeholder':'c_braand'},
                            {'field':'product.custom.color','placeholder':'coolor'},
                            {'field':'product.custom.size','placeholder':'size'},
                            {'field':'product.group_id','placeholder':'group_id'}
                        ];
        var product = new Variant();
        var res = [ ['1234567', true, 'test product', 'test product', 'test product',
            'Product-Show/pid=1234567', 'Product-Show/pid=1234567', 'Product-Show/pid=1234567', 'testAbsUrl',
            '', '', '', '20.00', '20.00', '20.00', '', 'color', 'size', '1111'] ];
        var siteLocales = ['default', 'zh', 'en', 'en_US'];
        var addSecondLine = false;

        var result = JobHelper.getProductInfo({
            mappedFields: mappedFields,
            siteLocales: siteLocales,
            defaultLocale: defaultLocale,
            currenciesMap: currenciesMap,
            product: product
        }, addSecondLine);
        assert.deepEqual(result, res);
    });
});
