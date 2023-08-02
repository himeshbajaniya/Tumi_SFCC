var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../mocks/';

var Site = require(mockPath + 'dw/system/Site');
var Logger = require(mockPath + 'dw/system/Logger');
var Request = require(mockPath + 'dw/system/Request');
var Customer = require(mockPath + 'dw/customer/Customer');
var crypto = require(mockPath + 'dw/crypto/crypto');

var cartridgePath = '../../../../../cartridges/int_emarsys/';


var LoyaltyCustomerDataModel = proxyquire(cartridgePath + 'cartridge/models/loyaltyCustomerData.js', {
    'dw/system/Site': Site,
    'dw/system/Logger': Logger,
    'dw/crypto': crypto
});

describe('LoyaltyCustomerDataModel Scripts', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    global.request = new Request();
    global.customer = new Customer();

    it('testing method: loyaltyCustomerData; ', () => {
        var result = new LoyaltyCustomerDataModel();
        assert.deepEqual(result, {
            appId: '2260332443498184708',
            contactId: 'test@test.com',
            customerId: 'test',
            timestamp: Math.floor((new Date()).getTime() / 1000),
            token: 4,
            region: 'eu'
        });
    });

});
