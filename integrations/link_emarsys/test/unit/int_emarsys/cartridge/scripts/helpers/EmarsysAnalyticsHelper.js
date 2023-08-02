var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../../mocks/';

var Request = require(mockPath + 'dw/system/Request');
var Customer = require(mockPath + 'dw/customer/Customer');
var Site = require(mockPath + 'dw/system/Site');
var BasketMgr = require(mockPath + 'dw/order/BasketMgr');
var Category = require(mockPath + 'dw/catalog/Category');
var order = require(mockPath + 'dw/order/Order');

var cartridgePath = '../../../../../../cartridges/int_emarsys/';

var ScarabQueueHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/scarabQueueHelper.js', {
    'dw/system/Site': Site
});

var EmarsysAnalyticsHelper = proxyquire(cartridgePath + 'cartridge/scripts/helpers/emarsysAnalyticsHelper.js', {
    'dw/system/Site': Site,
    'int_emarsys/cartridge/scripts/helpers/scarabQueueHelper': ScarabQueueHelper,
    'dw/order/BasketMgr': BasketMgr
});

class ExpectedResponse {
    constructor() {
        this.currentBasket = [
            {
                item: 'product1',
                price: 13,
                quantity: 1,
            },
            {
                item: 'product2',
                price: 27,
                quantity: 2
            }
        ];
        this.isEnableEmarsys = true;
        this.isAnalyticPage = true;
        this.isSFRA = true;
        this.locale = 'en_US';
        this.logic = 'PERSONAL';
        this.predictMerchantID = '1273D0A7ACB7A11D';

        this.customerData = {
            guestEmail: false,
            isCustomer: true,
            customerEmail: 'test@test.com'
        };
        this.pageType = '';
    }
}

function getCategoriesChain(categoriesNames) {
    var firstCategory = new Category(categoriesNames[0]);
    var currentCategory = firstCategory;
    for(let i = 1; i < categoriesNames.length; i++) {
        let newCategory = new Category(categoriesNames[i]);
        currentCategory.parent = newCategory;
        currentCategory = newCategory;
    }
    // if(categoriesNames.length > 1) {
    //     currentCategory.root = true;
    //     currentCategory.ID = 'root';
    // }
    return firstCategory;
}

var emarsysAnalyticsHelper = new EmarsysAnalyticsHelper();
describe('EmarsysAnalyticsHelper Scripts', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    global.request = new Request();
    global.customer = new Customer();

    it('testing method: getEmarsysPreference; page: "search"', () => {
        var pageType = 'search';
        var data = {
            productSearch : {
                category: getCategoriesChain(['secondLevel', 'firstLevel', 'root']),
                categorySearch: true
            }
        };

        var res = new ExpectedResponse();
        res.pageType = pageType;
        res.nameTracking = 'category';
        res.trackingData = 'root > firstLevel > secondLevel';

        var result = emarsysAnalyticsHelper.setPageData(pageType, data);
        assert.deepEqual(result, res);


        var data = {
            productSearch : {
                categorySearch: false,
                searchPhrase: 'red T-shirt'
            }
        };

        res.nameTracking = 'searchTerm';
        res.trackingData = 'red T-shirt';

        var result = emarsysAnalyticsHelper.setPageData(pageType, data);
        assert.deepEqual(result, res);
    });

    it('testing method: getEmarsysPreference; page: "product"', () => {
        var pageType = 'product';
        var data = {
            product: {id: '987654321#'}
        };

        var res = new ExpectedResponse();
        res.pageType = pageType;
        res.nameTracking = 'view';
        res.trackingData = '987654321#';

        var result = emarsysAnalyticsHelper.setPageData(pageType, data);
        assert.deepEqual(result, res);
    });

    it('testing method: getEmarsysPreference; page: "orderconfirmation"', () => {
        var pageType = 'orderconfirmation';
        var data = {
            order: order
        };

        var res = new ExpectedResponse();
        res.pageType = pageType;
        res.nameTracking = 'purchase';
        res.trackingData = {
            orderId: '345021307483&',
            items: [
                {
                    item: 'product1',
                    price: 13,
                    quantity: 1,
                },
                {
                    item: 'product2',
                    price: 27,
                    quantity: 2
                }
            ]
        };
        res.customerData.guestEmail = 'test@gmail.com';

        var result = emarsysAnalyticsHelper.setPageData(pageType, data);
        assert.deepEqual(result, res);
    });

    it('testing method: getEmarsysPreference; page: "cart"', () => {
        var pageType = 'cart';
        var data = {};

        var res = new ExpectedResponse();
        res.pageType = pageType;
        
        var result = emarsysAnalyticsHelper.setPageData(pageType, data);
        assert.deepEqual(result, res);
    });

    it('testing method: getEmarsysPreference; page: "storefront"', () => {
        var pageType = 'storefront';
        var data = {};

        var res = new ExpectedResponse();
        res.pageType = pageType;

        var result = emarsysAnalyticsHelper.setPageData(pageType, data);
        assert.deepEqual(result, res);
    });
});