'use strict';

var server = require('server');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var PAGE_SIZE_ITEMS = 15;
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var list = productListHelper.getList(req.currentCustomer.raw, { type: 12 });
    var WishlistModel = require('*/cartridge/models/productList');
    var loggedIn = req.currentCustomer.profile;
    var wishlistModel = new WishlistModel(
        list,
        {
            type: 'wishlist',
            publicView: false,
            pageSize: PAGE_SIZE_ITEMS,
            pageNumber: 1
        }
    ).productList;
    res.setViewData({
        wishlist: wishlistModel,
        loggedIn: loggedIn
    });
    next();
});

module.exports = server.exports();
