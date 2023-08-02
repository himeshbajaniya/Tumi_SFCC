'use strict';

var server = require('server');
server.extend(module.superModule);

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var PAGE_SIZE_ITEMS = 15;
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var rfkSitePreferences = require('*/cartridge/scripts/middleware/rfkSitePreferences');

server.replace('RemoveProduct', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');

    var params = req.querystring;
    var pid = params.pid;
    var apiProduct = ProductMgr.getProduct(pid);
    if (!apiProduct || apiProduct.master) {
        if (!apiProduct) {
            res.json({
                error: true,
                pid: pid
            });
            return next();
        } else {
            var options = productHelpers.getConfig(apiProduct, pid);
            var defaultVariant = options.variationModel.defaultVariant;
            if (defaultVariant) {
                pid = defaultVariant.ID;
            }
        }
    }
    var wishlistPidArray = [];
    var list = productListHelper.removeItem(req.currentCustomer.raw, pid, { req: req, type: 12 });
    var listIsEmpty = list.prodList && list.prodList.items && list.prodList.items.empty;
    var listforWishlist = productListHelper.getList(req.currentCustomer.raw, { type: 12 });
    var WishlistModel = require('*/cartridge/models/productList');
    var wishlistModel = new WishlistModel(
        listforWishlist,
        {
            type: 'wishlist',
            publicView: false,
            pageSize: PAGE_SIZE_ITEMS,
            pageNumber: 1
        }
    ).productList;
    if (wishlistModel.items.length != 0) {
        for (var i = 0; i < wishlistModel.items.length; i++) {
            wishlistPidArray[i] = wishlistModel.items[i].pid;
        }
    }
    res.json({
        success: true,
        wishlistPidArray: wishlistPidArray,
        listIsEmpty: listIsEmpty,
        emptyWishlistMsg: listIsEmpty ? Resource.msg('wishlist.empty.text', 'wishlist', null) : ''

    });
    next();
});
server.replace('AddProduct', function (req, res, next) {
    var wishlistPidArray = [];
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    var WishlistModel = require('*/cartridge/models/productList');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var productTileParams = { pview: 'tile' };
    
    Object.keys(req.querystring).forEach(function (key) {
        productTileParams[key] = req.querystring[key];
    });
    // var product = ProductFactory.get(params);
    // if (!req.form.pid == 'TUMIGCARD100') {
    // var product = ProductFactory.get(productTileParams);
    // }

    // var pid = req.form.pid;
    var list = productListHelper.getCurrentOrNewList(req.currentCustomer.raw, { type: 12 });
    var params = req.querystring;
    var pid = params.pid;
    var apiProduct = ProductMgr.getProduct(pid);
    // check if product if giftcart then skip
   if ((apiProduct) && (apiProduct.getMasterProduct().ID !== 'GCARD')) {
    var product = ProductFactory.get(productTileParams);
   }
    if (!apiProduct || apiProduct.master) {
        if (!apiProduct) {
            res.json({
                error: true,
                pid: pid,
                msg: errMsg
            });
            return next();
        } else {
            var options = productHelpers.getConfig(apiProduct, pid);
            var defaultVariant = options.variationModel.defaultVariant;
            if (defaultVariant) {
                pid = defaultVariant.ID;
            }
        }
    }
    var optionId = req.form.optionId || null;
    var optionVal = req.form.optionVal || null;

    var config = {
        qty: 1,
        optionId: optionId,
        optionValue: optionVal,
        req: req,
        type: 12
    };
    var errMsg = productListHelper.itemExists(list, pid, config) ? Resource.msg('wishlist.addtowishlist.exist.msg', 'wishlist', null)
        : Resource.msg('wishlist.addtowishlist.failure.msg', 'wishlist', null);
    var success = productListHelper.addItem(list, pid, config);
    var wishlistModel = new WishlistModel(
        list,
        {
            type: 'wishlist',
            publicView: false,
            pageSize: PAGE_SIZE_ITEMS,
            pageNumber: 1
        }
    ).productList;
    if (wishlistModel.items.length != 0) {
        for (var i = 0; i < wishlistModel.items.length; i++) {
            wishlistPidArray[i] = wishlistModel.items[i].pid;
        }
    }
    var productDetails = {};
    productDetails.imageUrl =  product && product.images.medium[0].url ? product.images.medium[0].url : '';
    if (success) {
        res.json({
            success: true,
            wishlistPidArray: wishlistPidArray,
            productDetails: productDetails,
            pid: pid,
            wishlistLandingUrl: URLUtils.url('Wishlist-Show').toString(),
            msg: Resource.msg('wishlist.addtowishlist.success.msg', 'wishlist', null)
        });
    } else {
        res.json({
            error: true,
            pid: pid,
            msg: errMsg
        });
    }
    next();
});
server.replace('Show', consentTracking.consent, server.middleware.https, csrfProtection.generateToken, userLoggedIn.validateLoggedIn, function (req, res, next) {
    var list = productListHelper.getList(req.currentCustomer.raw, { type: 12 });
    var WishlistModel = require('*/cartridge/models/productList');
    var sortingRule;
    if (req.querystring.sort !== 'OldestAdded') {
        sortingRule = 'LatestAdded';
    } else {
        sortingRule = 'OldestAdded';
    }
    var userName = '';
    var firstName;
    var rememberMe = false;
    if (req.currentCustomer.credentials) {
        rememberMe = true;
        userName = req.currentCustomer.credentials.username;
    }
    var loggedIn = req.currentCustomer.profile;
    var target = req.querystring.rurl || 1;
    var actionUrl = URLUtils.url('Account-Login');
    var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target).relative().toString();
    var navTabValue = req.querystring.action;
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        }
    ];
    if (loggedIn) {
        firstName = req.currentCustomer.profile.firstName;
        breadcrumbs.push({
            htmlValue: Resource.msg('page.title.myaccount', 'account', null),
            url: URLUtils.url('Account-Show').toString()
        });
    }

    var profileForm = server.forms.getForm('profile');
    profileForm.clear();
    var wishlistModel = new WishlistModel(
        list,
        {
            sortingRule: sortingRule,
            type: 'wishlist',
            publicView: false,
            pageSize: PAGE_SIZE_ITEMS,
            pageNumber: 1
        }
    ).productList;
    var s7PresetsPlp = require('dw/system/Site').getCurrent().getCustomPreferenceValue('s7PresetsPlp');
    for (let index = 0; index < wishlistModel.items.length; index++) {
        var mainImage = wishlistModel.items[index].imageObj.small[0].url.split('?');
        wishlistModel.items[index].imageObj.small[0].url = mainImage[0] + s7PresetsPlp;
    }
    res.render('/wishlist/components/wishlistLanding', {
        wishlist: wishlistModel,
        sortingRule: sortingRule,
        navTabValue: navTabValue || 'login',
        rememberMe: rememberMe,
        userName: userName,
        actionUrl: actionUrl,
        actionUrls: {
            updateQuantityUrl: ''
        },
        profileForm: profileForm,
        breadcrumbs: breadcrumbs,
        oAuthReentryEndpoint: 1,
        loggedIn: loggedIn,
        firstName: firstName,
        socialLinks: loggedIn,
        publicOption: loggedIn,
        createAccountUrl: createAccountUrl,
        sort: req.querystring
    });
    next();
}, rfkSitePreferences.getRfkSitePreferences);
module.exports = server.exports();
