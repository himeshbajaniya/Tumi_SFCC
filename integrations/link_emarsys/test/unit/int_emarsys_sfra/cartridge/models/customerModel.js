var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../mocks/';

var Request = require(mockPath + 'dw/system/Request');
var Customer = require(mockPath + 'dw/customer/Customer');

var cartridgePath = '../../../../../cartridges/int_emarsys_sfra/';

var CustomerModel = proxyquire(cartridgePath + 'cartridge/models/customerModel.js', {});

describe('CustomerModel Scripts', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    global.request = new Request();
    global.customer = new Customer();

    it('testing method: updateAccountFormWithCustomerData', () => {
        var signupForm = {
            copyFrom: function (params) {
                return params;
            }
        };
        var result = new CustomerModel.updateAccountFormWithCustomerData(signupForm);
         assert.deepEqual(result.copyFrom, signupForm.copyFrom);
    });

});
