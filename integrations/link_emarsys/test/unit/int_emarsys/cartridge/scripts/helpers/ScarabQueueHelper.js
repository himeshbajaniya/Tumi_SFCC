
var proxyquireModule = require('proxyquire');
var assert = require('chai').assert;

var Request = require('../../../../../mocks/dw/system/Request');
var Site = require('../../../../../mocks/dw/system/Site');
var Order = require('../../../../../mocks/dw/order/Order');
var Basket = require('../../../../../mocks/dw/order/Basket');

let proxyquire = proxyquireModule.noCallThru();
let ScarabQueueHelper = new (proxyquire('../../../../../../cartridges/int_emarsys/cartridge/scripts/helpers/scarabQueueHelper.js', {
    'dw/system/Site': Site
}));

describe('ScarabQueue Helper', () => {
    global.request = new Request();

    describe('getCategoryChain()', () => {

        it('should return a country path joined by >', () => {
            let result = ScarabQueueHelper.getCategoryChain({
                parent: {
                    displayName: 'countryName2',
                    online: true,
                    parent: {
                        ID: 'root'
                    }
                },
                displayName: 'countryName1',
                online: true
            });

            assert.equal(result, 'countryName2 > countryName1');
        });
    });

    describe('getOrderData()', () => {

        it('should return a spesific order values', () => {
            let result = ScarabQueueHelper.getOrderData(Order);
            assert.deepEqual(result, {
                orderId: '345021307483&',
                items: [{
                    item: "product1",
                    price: 13,
                    quantity: 1
                },
                {
                    item: "product2",
                    price: 27,
                    quantity: 2
                }]
            });
        });
    });

    describe('getCartData()', () => {

        it('should return a spesific basket values', () => {
            let result = ScarabQueueHelper.getCartData(Basket);

            assert.deepEqual(result, [{
                    item: "product1",
                    price: 13,
                    quantity: 1
                },
                {
                    item: "product2",
                    price: 27,
                    quantity: 2
                }]
            );
        });
    });
});
