'use strict';
var server = require('server');
server.extend(module.superModule);

var productFactory = require('*/cartridge/scripts/factories/product');

server.append('Show', function (req, res, next) {
    var Site = require('dw/system/Site');
    var compareProductsForm = req.querystring;
    var URLUtils = require('dw/web/URLUtils');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var addToCartUrl = URLUtils.url('Cart-AddProduct').toString();
    var viewData = res.getViewData();
    var alterNateImageUrl = Site.getCurrent().getCustomPreferenceValue('scene7Host');
    var pids = Object.keys(compareProductsForm)
        .filter(function (key) { return key.indexOf('pid') === 0; })
        .map(function (pid) { return compareProductsForm[pid]; });
    var products = pids.map(function (pid) {
        return productFactory.get({ pid: pid, pview: 'tile', });
    });

    var compareVariationObject = {};
    pids.forEach(element => {
        var masterProduct = ProductMgr.getProduct(element);
        if (!empty(masterProduct)) {
            if (masterProduct.isVariant()) {
                masterProduct = masterProduct.getMasterProduct();
            }
            if (!empty(masterProduct)) {
                if (masterProduct.variants.length > 0) {
                    var iterator = masterProduct.variants.iterator();
                    while (iterator.hasNext()) {
                        var variant = iterator.next();
                        if (variant.onlineFlag && variant.availabilityModel !== null) {
                            var availabilityObj = {};
                            availabilityObj.available = variant.availabilityModel.inStock;
                            compareVariationObject[variant.ID.toString()] = availabilityObj;
                        }                        
                    }
                }
            }
        }
    });
    
    viewData.compareVariationObject = compareVariationObject;
    viewData.products = products;
    viewData.alterNateImageUrl = alterNateImageUrl;
    viewData.addToCartUrl = addToCartUrl;

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();