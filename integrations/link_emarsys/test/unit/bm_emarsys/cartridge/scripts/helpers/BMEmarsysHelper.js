'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = '../../../../../mocks/';

var CustomObjectMgr = require(mockPath + 'dw/object/CustomObjectMgr');
var Site = require(mockPath + 'dw/system/Site');
var order = require(mockPath + 'dw/order/Order');
var web = require(mockPath + 'dw/web/Web');
var Money = require(mockPath + 'dw/value/Money');
var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var emarsysService = require(mockPath + 'service/emarsysService');
var siteCustomPreferences = Site.getCurrent();

var cartridgePathE = '../../../../../../cartridges/int_emarsys/';

var cartridgePath = '../../../../../../cartridges/bm_emarsys/';

var EmarsysHelper = proxyquire(cartridgePathE + 'cartridge/scripts/helpers/emarsysHelper.js', {
    'dw/web': web,
    'dw/order': order,
    'dw/value/Money': Money,
    'dw/system/Site': Site,
    'dw/order/ShippingMgr': ShippingMgr,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    '~/cartridge/scripts/service/emarsysService': emarsysService,
    siteCustomPreferences: siteCustomPreferences 
});

var BMEmarsysHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/bmEmarsysHelper.js', {
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/system/Site': Site,
    'int_emarsys/cartridge/scripts/helpers/emarsysHelper': EmarsysHelper
});

describe('BMEmarsysHelper Helpers', () => {
    it('Testing method: getAllCustomObjectByType', () => {
        var customObj = CustomObjectMgr.getCustomObject('EmarsysCatalogConfig','customConfig');
        var result = BMEmarsysHelper.getAllCustomObjectByType('EmarsysCatalogConfig');

        assert.deepEqual(result[0], customObj);
    });

    it('Testing method: getExternalEvents #1', () => {
        var result = BMEmarsysHelper.getExternalEvents('StoredEvents', 'otherResult', false);
        assert.deepEqual(result, [
            {id: '12678', name: 'cancelled_order'},
            {id: '12561', name: 'forgot_password_submitted'},
            {id: '12563', name: 'contact_form_submitted'}]);
    });

    it('Testing method: parseCustomPrefValue', () => {
        var result = BMEmarsysHelper.parseCustomPrefValue('emarsysCatalogExportType');

        assert.deepEqual(result,[{
            id: 'master', 
            name: 'master.export.type.label'
        },
        {
            id: 'variations',
            name: 'variations.export.type.label'
        }]);
    });

    it('Testing method: copyCustomPrefValue ', () => {
        var res = ['product.custom.color', 'product.custom.size'];
        var result = BMEmarsysHelper.copyCustomPrefValue('emarsysPredictVariationAttributes');

        assert.deepEqual(result, res);
    });

    it('Testing method: getTabsAttr', () => {
        var res = [{ id: 'customConfig', label: 'CustomConfig'},
            {id: 'customConfig2', label: 'CustomConfig2'}];
        var result = BMEmarsysHelper.getTabsAttr('EmarsysCatalogConfig', 'EmarsysCatalogConfig', true);

        assert.deepEqual(result, res);
    });

    it('Testing method: getStoredConfigurations', () => {
        var res = CustomObjectMgr.getCustomObject('EmarsysCatalogConfig','customConfig2').custom;
        var result = BMEmarsysHelper.getStoredConfigurations('EmarsysCatalogConfig');

        assert.deepEqual(result[1], res);
    });

    it('Testing method: parseCustomObjects', () => {
        var res = { 
            contentID: 'customConfig2',
            additionalParam: 'masters',
            mappedFields: [
                {field: 'product.ID', placeholder: 'item'},
                {field: 'product.image', placeholder: 'image'}],
            fieldsLength: 2
        };

        var args = {
            objectType: 'EmarsysCatalogConfig',
            objectKey: null,
            contentFieldKey: 'EmarsysCatalogConfig',
            additionalFieldKey: 'exportType'
        }
        var result = BMEmarsysHelper.parseCustomObjects(args);

        assert.deepEqual(result[1], res);
    });


    it('Testing method: parseCustomObjects #2', () => {
        // var argument1 = CustomObjectMgr.getCustomObject('EmarsysCatalogConfig', 'customConfigTEST');
        // var result = BMEmarsysHelper.parseCustomObjects([argument1], 'EmarsysCatalogConfig', '');


        var args = {
            objectType: 'EmarsysCatalogConfig',
            objectKey:'customConfigTEST',
            contentFieldKey: 'EmarsysCatalogConfig',
            additionalFieldKey: 'exportType'
        }
        var result = BMEmarsysHelper.parseCustomObjects(args);
        assert.deepEqual(result, [{
            additionalParam: "masters",
            contentID: 'customConfig2',
            fieldsLength: 0,
            mappedFields: ''
        }]);
    });
});
