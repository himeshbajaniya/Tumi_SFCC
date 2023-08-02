var proxyquireModule = require('proxyquire');
var assert = require('chai').assert;

var URLUtils = require('../../../../../mocks/dw/web/URLUtils');
var Resource = require('../../../../../mocks/dw/web/Resource');
var Site = require('../../../../../mocks/dw/system/Site');

let proxyquire = proxyquireModule.noCallThru();
let EmarsysResource = proxyquire('../../../../../../cartridges/int_emarsys/cartridge/scripts/helpers/emarsysResource.js', {
    'dw/web/URLUtils': URLUtils,
    'dw/web/Resource': Resource,
    'dw/system/Site': Site
});

describe('EmarsysResource', () => {

    describe('Available resources', () => {

        it('should contain all settings be available', () => {
            let urls = EmarsysResource.getUrls();
            let resources = EmarsysResource.getResources();
            let preferences = EmarsysResource.getPreferences();

            assert.lengthOf(Object.keys(urls), 8);
            assert.lengthOf(Object.keys(resources), 3);
            assert.lengthOf(Object.keys(preferences), 2);
        });
    });

        it('testing method: emarsysResourceHelper', () => {
             // Can not be tested
            assert.isUndefined(EmarsysResource());
        });

});
