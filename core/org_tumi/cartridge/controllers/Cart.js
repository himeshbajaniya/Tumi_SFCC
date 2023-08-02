'use strict';

var server = require('server');
server.extend(module.superModule);

var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var collections = require('*/cartridge/scripts/util/collections');
var BasketMgr = require('dw/order/BasketMgr');
var instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
var giftHelper = require('*/cartridge/scripts/helpers/giftHelpers');
var rfkSitePreferences = require('*/cartridge/scripts/middleware/rfkSitePreferences');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var {
    ensurePremiumMonogramCheck,
    removePremiumMonogram
} = require('*/cartridge/scripts/helpers/monogram');

server.append('Show', function (req, res, next) {
    var Site = require('dw/system/Site');
    var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelper');
    var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');

    var viewData = res.getViewData();
    var compatiblecolorList = !empty(Site.getCurrent().getCustomPreferenceValue('colorList')) ? Site.getCurrent().getCustomPreferenceValue('colorList') : ''
    var symbolList = !empty(Site.getCurrent().getCustomPreferenceValue('symbolList')) ? Site.getCurrent().getCustomPreferenceValue('symbolList') : '';
    var fontList = !empty(Site.getCurrent().getCustomPreferenceValue('fontList')) ? Site.getCurrent().getCustomPreferenceValue('fontList') : '';
    var premiumGBEnable = Site.getCurrent().getCustomPreferenceValue('premiumGBEnable');

    var updatecolorlist = !empty(compatiblecolorList) ? JSON.parse(compatiblecolorList) : '';
    var colorName = [];
    var colorValue = [];
    var swatchUrl = [];
    var colorHValue = [];
    var tempValue;
    if (!empty(updatecolorlist)) {
        Object.keys(updatecolorlist).forEach(function (key) {
            if (updatecolorlist[key]) {
                tempValue = updatecolorlist[key];
                colorName.push(tempValue.colorDisplayValue);
                colorValue.push(tempValue.colorHex);
                colorHValue.push('#' + tempValue.colorHex);
                swatchUrl.push(tempValue.swatchURL);
            }
        });
    }

    var customer = session.customer;
    var isAuthenticated = false;
    if (customer.authenticated) {
        isAuthenticated = true;
    }
    viewData.isAuthenticated = isAuthenticated;

    viewData.items = ensurePremiumMonogramCheck(viewData.items);

    var colorData = {
        colorDisplayValue: colorName,
        colorHex: colorValue,
        colorHValue: colorHValue,
        swatchUrl: swatchUrl
    };
    viewData.monogramData = {
        colorData: colorData,
        symbolList: symbolList,
        fontList: fontList
    };
    var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
    var accountModel = accountHelpers.getAccountModel(req);
    if (accountModel) {
        var myMonogramData = accountModel.profile.monogramdata;
        if (myMonogramData) {
            viewData.myMonogramData = myMonogramData;
        }
    }
    var giftForm = server.forms.getForm('gift');
    giftForm.clear();
    viewData.giftForm = giftForm;
    viewData.premiumGBEnable = premiumGBEnable;
    viewData.janrainrURLType = 4;
    viewData.pageType = "cart";

    var lat = req.geolocation.latitude;
    var long = req.geolocation.longitude;
    var geoLocation = cookieHelpers.getCookie('geoLocation');
    if (geoLocation) {
        var latlong = geoLocation.split(',');
        if (latlong.length > 1) {
            lat = latlong[0].split('=')[1];
            long = latlong[1].split('=')[1];
        }
    } else {
        cookieHelpers.setCookie('geoLocation', 'lat=' + lat + ',long=' + long);
    }

    cartHelper.getInstorePickUpInventory(viewData.items, lat, long);
    viewData.janrainrUrlData =  accountHelper.getJanrainReturnUrl(null, 4);
    if (viewData && viewData.wishlist && viewData.wishlist.items && viewData.wishlist.items.length > 0) {
        var s7PresetsPlp = require('dw/system/Site').getCurrent().getCustomPreferenceValue('s7PresetsPlp');
        for (let index = 0; index < viewData.wishlist.items.length; index++) {
            var mainImage = viewData.wishlist.items[index].imageObj.small[0].url.split('?');
            viewData.wishlist.items[index].imageObj.small[0].url = mainImage[0] + s7PresetsPlp;
        }
    }
    res.setViewData(viewData);
    next();

}, rfkSitePreferences.getRfkSitePreferences);

/**
 * Cart-AddProduct : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Base/Cart-AddProduct
 * @function
 * @memberof Cart
 * @param {httpparameter} - pid - product ID
 * @param {httpparameter} - quantity - quantity of product
 * @param {httpparameter} - options - list of product options
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('AddProduct', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var gtmDataLayerHelpers = require('*/cartridge/scripts/helpers/gtmDataLayerHelpers');
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers')
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var productId = req.form.pid;
    var storeId = req.form.storeId ? req.form.storeId : null;
    var childProducts = Object.hasOwnProperty.call(req.form, 'childProducts') ?
        JSON.parse(req.form.childProducts) : [];
    var options = req.form.options ? JSON.parse(req.form.options) : [];
    var quantity;
    var result;
    var pidsObj;

    var monogramPatchEnabled = false;
    var monogramTagEnabled = false;
    var metalMonogramPatchEnabled = false;
    var metalMonogramTagEnabled = false;
    var monogramJSON;
    var personalizationData;

    // eslint-disable-next-line no-undef
    if (!empty(req.form.personalizationData)) {
        personalizationData = JSON.parse(req.form.personalizationData);
        personalizationData.monogrammerProductID = productId;
        monogramJSON = cartHelper.buildPersonalizationData(JSON.stringify(personalizationData));

        monogramPatchEnabled = monogramJSON.monogramPatchEnabled;
        monogramTagEnabled = monogramJSON.monogramTagEnabled;
        metalMonogramPatchEnabled = monogramJSON.metalMonogramPatchEnabled;
        metalMonogramTagEnabled = monogramJSON.metalMonogramTagEnabled;

    }

    if (currentBasket) {
        var monogramData = (monogramTagEnabled || monogramPatchEnabled || metalMonogramPatchEnabled || metalMonogramTagEnabled) ? monogramJSON : null;
        Transaction.wrap(function () {
            if (!req.form.pidsObj) {
                quantity = parseInt(req.form.quantity, 10);
                result = cartHelper.addProductToCart(
                    currentBasket,
                    productId,
                    quantity,
                    childProducts,
                    options,
                    storeId,
                    req,
                    monogramData
                );
            } else {
                // product set
                pidsObj = JSON.parse(req.form.pidsObj);
                result = {
                    error: false,
                    message: Resource.msg('text.alert.addedtobasket', 'product', null)
                };

                pidsObj.forEach(function (PIDObj) {
                    quantity = parseInt(PIDObj.qty, 10);
                    var pidOptions = PIDObj.options ? JSON.parse(PIDObj.options) : {};
                    var PIDObjResult = cartHelper.addProductToCart(
                        currentBasket,
                        PIDObj.pid,
                        quantity,
                        childProducts,
                        pidOptions
                    );
                    if (PIDObjResult.error) {
                        result.error = PIDObjResult.error;
                        result.message = PIDObjResult.message;
                    }
                });
            }
            if (!result.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            }
        });
    }

    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
    var cartModel = new CartModel(currentBasket);

    var urlObject = {
        url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
        configureProductstUrl: URLUtils.url('Product-ShowBonusProducts').toString(),
        addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
    };

    var newBonusDiscountLineItem =
        cartHelper.getNewBonusDiscountLineItem(
            currentBasket,
            previousBonusDiscountLineItems,
            urlObject,
            result.uuid
        );
    if (newBonusDiscountLineItem) {
        var allLineItems = currentBasket.allProductLineItems;
        collections.forEach(allLineItems, function (pli) {
            if (pli.UUID === result.uuid) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                    pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
                });
            }
        });
    }

    var reportingURL = cartHelper.getReportingUrlAddToCart(currentBasket, result.error);
    var miniCartUrls = {
        checkoutUrl: URLUtils.url('Checkout-Begin').toString(),
        viewMyCartUrl: URLUtils.url('Cart-Show').toString()
    } 

    cartModel.miniCartUrls = miniCartUrls;
    if (!empty(currentBasket)) {
        for each(var productLine in currentBasket.productLineItems) {
            if (productLine.custom.parentProductLineItemID) {
                quantityTotal = quantityTotal - 1;
            }
        }
    }
    var miniCartResources = {
        viewMyCart: Resource.msgf('link.minicart.view.mycart', 'cart', null, quantityTotal),
        Checkout: Resource.msgf('link.minicart.checkout', 'cart', null)
    };

    cartModel.miniCartResources = miniCartResources;

    var pid;
    var breadcrumbObj = {};
    var upcObj = {};
    var stockObj = {};
    var pdpUrlObj = {};
    if (!empty(currentBasket)) {
        for each(var product in currentBasket.productLineItems) {
            if (product !== null || product !== undefined) {
                pid = product.productID;
                // product breadcrumbs
                var breadcrumb = gtmDataLayerHelpers.buildBreadcrumbs('PRODUCT', pid, null);
                breadcrumbObj[pid] = breadcrumb;
                // product upc
                var upc = product.product.UPC || null;
                upcObj[pid] = upc;
                // product stock
                var stock = product.product.availabilityModel.inventoryRecord ? product.product.availabilityModel.inventoryRecord.ATS.value : null;
                stockObj[pid] = stock || null;
                // product pdpURL
                var pdpUrl = productHelpers.generatePdpURL(pid, true);
                pdpUrlObj[pid] = pdpUrl;
            }
        }
    }

    res.json({
        reportingURL: reportingURL,
        quantityTotal: quantityTotal,
        message: result.message,
        cart: cartModel,
        newBonusDiscountLineItem: newBonusDiscountLineItem || {},
        error: result.error,
        pliUUID: result.uuid,
        minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal),
        currency: currentBasket.currencyCode,
        breadcrumbObj: breadcrumbObj,
        stockObj: stockObj,
        upcObj: upcObj,
        pdpUrlObj: pdpUrlObj
    });

    next();
});

/**
 * Cart-AddProduct : The Cart-AddProduct endpoint envoke the pixlee Api call for add Product.
 * @name Base/Cart-AddProduct
 * @function
 * @memberof Cart
 */
server.append('AddProduct', function (req, res, next) {
    var pixleeHelper = require('*/cartridge/scripts/pixlee/helpers/pixleeHelper');

    if (pixleeHelper.isPixleeEnabled()) {
        var viewData = res.getViewData();
        var trackingAllowed = pixleeHelper.isTrackingAllowed(viewData.tracking_consent);

        if (trackingAllowed && !viewData.error) {
            var addedProducts;
            if (req.form.pidsObj) {
                addedProducts = JSON.parse(req.form.pidsObj);
            } else {
                addedProducts = [{
                    pid: req.form.pid,
                    qty: req.form.quantity
                }];
            }

            if (addedProducts && addedProducts.length) {
                var addToCartEvents = pixleeHelper.getAddToCartEvents(addedProducts);
                res.json({
                    pixleeEventData: addToCartEvents
                });
            }
        }
    }

    next();
});

/**
 * Cart-AddCoupon : The Cart-AddCoupon endpoint is responsible for adding a coupon to a basket
 * @name Base/Cart-AddCoupon
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - couponCode - the coupon code to be applied
 * @param {querystringparameter} - csrf_token - hidden input field csrf token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.replace(
    'AddCoupon',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var CartModel = require('*/cartridge/models/cart');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });

            return next();
        }

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                errorMessage: Resource.msg('error.add.coupon', 'cart', null)
            });
            return next();
        }

        var error = false;
        var updateCart = false;
        var errorMessage;

        try {
            Transaction.wrap(function () {
                return currentBasket.createCouponLineItem(req.querystring.couponCode, true);
            });
        } catch (e) {
            error = true;
            var errorCodes = {
                COUPON_CODE_ALREADY_IN_BASKET: 'error.coupon.already.in.cart',
                COUPON_ALREADY_IN_BASKET: 'error.unable.to.add.coupon.code',
                COUPON_CODE_ALREADY_REDEEMED: 'error.unable.to.add.coupon.code',
                COUPON_CODE_UNKNOWN: 'error.unable.to.add.coupon.code',
                COUPON_DISABLED: 'error.unable.to.add.coupon.code',
                REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon.code',
                TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon.code',
                NO_ACTIVE_PROMOTION: 'error.unable.to.add.coupon.code',
                default: 'error.unable.to.add.coupon.code'
            };

            var errorMessageKey = errorCodes[e.errorCode] || errorCodes.default;
            errorMessage = Resource.msgf(errorMessageKey, 'cart', null, req.querystring.couponCode);
        }

        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var basketModel = new CartModel(currentBasket);
        if (!error) {
            try {
                if (!empty(basketModel.totals.discounts)) {
                    basketModel.totals.discounts.forEach((element) => {
                        if (element.applied === false) {
                            error = true;
                            updateCart = true;
                            errorMessage = Resource.msgf('error.unable.to.add.coupon.code', 'cart', null, element.couponCode);
                            res.redirect(URLUtils.url('Cart-RemoveCouponLineItem', 'uuid', element.UUID, 'errorMessage', errorMessage));
                        }
                    });
                }
            } catch (e) {}
        }

        if (error) {
            res.json({
                error: error,
                updateCart: updateCart,
                errorMessage: errorMessage
            });
            res.json(basketModel);
            return next();
        }

        res.json(basketModel);
        return next();
    }
);

/**
 * Cart-RemoveCouponLineItem : The Cart-RemoveCouponLineItem endpoint is responsible for removing a coupon from a basket
 * @name Base/Cart-RemoveCouponLineItem
 * @function
 * @memberof Cart
 * @param {querystringparameter} - code - the coupon code
 * @param {querystringparameter} - uuid - the UUID of the coupon line item object
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.replace('RemoveCouponLineItem', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var couponLineItem;

    if (currentBasket && req.querystring.uuid) {
        couponLineItem = collections.find(currentBasket.couponLineItems, function (item) {
            return item.UUID === req.querystring.uuid;
        });

        if (couponLineItem) {
            Transaction.wrap(function () {
                currentBasket.removeCouponLineItem(couponLineItem);
                basketCalculationHelpers.calculateTotals(currentBasket);
            });

            var basketModel = new CartModel(currentBasket);
            var errorMessage = req.querystring.errorMessage

            if (!empty(errorMessage)) {
                res.json({
                    error: true,
                    updateCart: true,
                    errorMessage: errorMessage
                });
            }

            res.json(basketModel);
            return next();
        }
    }

    res.setStatusCode(500);
    res.json({
        errorMessage: Resource.msg('error.cannot.remove.coupon', 'cart', null)
    });
    return next();
});

/**
 * Cart-EditProductLineItem : The Cart-EditProductLineItem endpoint edits a product line item in the basket on cart page
 * @name Base/Cart-EditProductLineItem
 * @function
 * @memberof Cart
 * @param {httpparameter} - uuid - UUID of product line item being edited
 * @param {httpparameter} - pid - Product ID
 * @param {httpparameter} - quantity - Quantity
 * @param {httpparameter} - selectedOptionValueId - ID of selected option
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('EditProductLineItem', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var arrayHelper = require('*/cartridge/scripts/util/array');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Resource = require('dw/web/Resource');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var uuid = req.form.uuid;
    var productId = req.form.pid;
    var selectedOptionValueId = req.form.selectedOptionValueId;
    var updateQuantity = parseInt(req.form.quantity, 10);

    var productLineItems = currentBasket.allProductLineItems;
    var requestLineItem = collections.find(productLineItems, function (item) {
        return item.UUID === uuid;
    });

    var availableToSell = 0;
    var totalQtyRequested = 0;
    var qtyAlreadyInCart = 0;
    var minOrderQuantity = 0;
    var canBeUpdated = false;
    var perpetual = false;
    var bundleItems;

    if (requestLineItem) {
        if (requestLineItem.product.bundle) {
            bundleItems = requestLineItem.bundledProductLineItems;
            canBeUpdated = collections.every(bundleItems, function (item) {
                var quantityToUpdate = updateQuantity *
                    requestLineItem.product.getBundledProductQuantity(item.product).value;
                qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                    item.productID,
                    productLineItems,
                    item.UUID
                );
                totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                availableToSell = item.product.availabilityModel.inventoryRecord.ATS.value;
                perpetual = item.product.availabilityModel.inventoryRecord.perpetual;
                minOrderQuantity = item.product.minOrderQuantity.value;
                return (totalQtyRequested <= availableToSell || perpetual) &&
                    (quantityToUpdate >= minOrderQuantity);
            });
        } else {
            availableToSell = requestLineItem.product.availabilityModel.inventoryRecord.ATS.value;
            perpetual = requestLineItem.product.availabilityModel.inventoryRecord.perpetual;
            qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                productId,
                productLineItems,
                requestLineItem.UUID
            );
            totalQtyRequested = updateQuantity + qtyAlreadyInCart;
            minOrderQuantity = requestLineItem.product.minOrderQuantity.value;
            canBeUpdated = (totalQtyRequested <= availableToSell || perpetual) &&
                (updateQuantity >= minOrderQuantity);
        }
    }

    var error = false;
    if (canBeUpdated) {
        var product = ProductMgr.getProduct(productId);
        try {
            if (product.master) throw new Error('selected product is master product');
            Transaction.wrap(function () {

                // If the product has options
                var optionModel = product.getOptionModel();
                if (optionModel && optionModel.options && optionModel.options.length) {
                    var productOption = optionModel.options.iterator().next();
                    var productOptionValue = optionModel.getOptionValue(productOption, selectedOptionValueId);
                    var optionProductLineItems = requestLineItem.getOptionProductLineItems();
                    var optionProductLineItem = optionProductLineItems.iterator().next();
                    optionProductLineItem.updateOptionValue(productOptionValue);
                }

                if (requestLineItem.productID !== productId) {
                    requestLineItem.replaceProduct(product);
                }
                var qty;
                for (qty = 0; qty < updateQuantity - 1; qty++) {
                    var newProductLineItem = cartHelper.addLineItem(
                        currentBasket,
                        product,
                        1,
                        null,
                        optionModel,
                        requestLineItem.getShipment()
                    );
                    var shipment = requestLineItem.getShipment()
                    if (shipment.custom.fromStoreId) {
                        instorePickupStoreHelper.setStoreInProductLineItem(shipment.custom.fromStoreId, newProductLineItem);
                    }
                }
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        } catch (e) {
            error = true;
        }
    }

    if (!error && requestLineItem && canBeUpdated) {
        var cartModel = new CartModel(currentBasket);

        var responseObject = {
            cartModel: cartModel,
            newProductId: productId
        };

        var cartItem = arrayHelper.find(cartModel.items, function (item) {
            return item.UUID === uuid;
        });

        var productCardContext = {
            lineItem: cartItem,
            actionUrls: cartModel.actionUrls
        };
        var productCardTemplate = 'cart/productCard/cartProductCardServer.isml';

        responseObject.renderedTemplate = renderTemplateHelper.getRenderedHtml(
            productCardContext,
            productCardTemplate
        );

        res.json(responseObject);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('product.add.to.cart.limited.inventory.cart', 'cart', null)
        });
    }

    return next();
});

server.post('UpdateClassicMonogram', function (req, res, next) {
    if (!empty(req.form.personalizationData)) {
        var basket = require('dw/order/BasketMgr').currentBasket;
        if (!basket) {
            res.json({
                success: false
            });
            return next();
        }
        var monogramJSON = cartHelper.buildPersonalizationData(req.form.personalizationData);
        var collections = require('*/cartridge/scripts/util/collections');
        var productLineItem = collections.find(basket.productLineItems, (lineItem) => lineItem.UUID === req.form.uuid);
        if (!productLineItem) {
            res.json({
                success: false
            });
            return next();
        }
        require('dw/system/Transaction').wrap(() => productLineItem.custom.monogramDataOnPLI = monogramJSON.vasData);
    }
    var CartModel = require('*/cartridge/models/cart');
    res.setViewData({
        order: new CartModel(basket)
    });
    res.json({
        success: true
    });
    return next();
});

server.post('UpdatePremiumMonogram', function (req, res, next) {
    if (!empty(req.form.personalizationData)) {
        var basket = require('dw/order/BasketMgr').currentBasket;
        if (!basket) {
            res.json({
                error: true
            });
            return next();
        }
        var originalPLI = require('*/cartridge/scripts/util/collections').find(basket.productLineItems, (lineItem) => lineItem.UUID === req.form.uuid);
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        try {
            var personalizationData = JSON.parse(req.form.personalizationData);
            personalizationData.monogrammerProductID = originalPLI.productID;
            var monogramJSON = cartHelper.buildPersonalizationData(JSON.stringify(personalizationData));
            var result = require('dw/system/Transaction').wrap(() => {
                if ('associatedLetters' in originalPLI.custom && originalPLI.custom.associatedLetters)
                    cartHelper.removePremiumMonogramLetters(basket, basket.productLineItems, originalPLI.custom.associatedLetters.split(','));
                cartHelper.addProductToCart(basket, originalPLI.productID, 1, null, null, originalPLI.custom.fromStoreId, req, monogramJSON, originalPLI);
            });
            require('*/cartridge/scripts/helpers/basketCalculationHelpers').calculateTotals(basket);
            res.json(result);
            var CartModel = require('*/cartridge/models/cart');
            res.setViewData({
                order: new CartModel(basket),
                link: {
                    remove: require('dw/web/URLUtils').url('Cart-RemovePremiumMonogram').toString()
                }
            });
            return next();
        } catch (e) {
            require('dw/system/Logger').getLogger('remove-monogram').error('message: {0} \n stack: {1}', e.message, e.stack);
        }
    }
    res.json({
        error: true
    });
    return next();
});

server.post('RemoveClassicMonogram', function (req, res, next) {
    var basket = require('dw/order/BasketMgr').currentBasket;
    if (!basket) {
        res.json({
            success: false
        });
        return next();
    }
    var collections = require('*/cartridge/scripts/util/collections');
    var productLineItem = collections.find(basket.productLineItems, (lineItem) => lineItem.UUID === req.form.uuid);
    if (!productLineItem) {
        res.json({
            success: false
        });
        return next();
    }
    require('dw/system/Transaction').wrap(() => productLineItem.custom.monogramDataOnPLI = null);
    var CartModel = require('*/cartridge/models/cart');
    res.setViewData({
        order: new CartModel(basket)
    });
    res.json({
        success: true
    });
    return next();
});

server.post('RemovePremiumMonogram', function (req, res, next) {
    res.json({
        success: removePremiumMonogram(req.form.uuid)
    });
    var basket = require('dw/order/BasketMgr').currentBasket;
    var CartModel = require('*/cartridge/models/cart');
    res.setViewData({
        order: new CartModel(basket)
    });
    return next();
});

/**
 * Cart-GetProduct : The Cart-GetProduct endpoint handles showing the product details in a modal/quickview for editing a product in basket on cart page
 * @name Base/Cart-GetProduct
 * @function
 * @memberof Cart
 * @param {querystringparameter} - uuid - UUID of the product line item (to edit)
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.replace('GetProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var collections = require('*/cartridge/scripts/util/collections');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var requestUuid = req.querystring.uuid;
    var storeId = req.querystring.storeId && req.querystring.storeId !== '' ? req.querystring.storeId : null;

    var requestPLI = collections.find(BasketMgr.getCurrentBasket().allProductLineItems, function (item) {
        return item.UUID === requestUuid;
    });

    var requestQuantity = requestPLI.quantityValue.toString();

    // If the product has options
    var optionProductLineItems = requestPLI.getOptionProductLineItems();
    var selectedOptions = null;
    var selectedOptionValueId = null;
    if (optionProductLineItems && optionProductLineItems.length) {
        var optionProductLineItem = optionProductLineItems.iterator().next();
        selectedOptionValueId = optionProductLineItem.optionValueID;
        selectedOptions = [{
            optionId: optionProductLineItem.optionID,
            selectedValueId: optionProductLineItem.optionValueID,
            productId: requestPLI.productID
        }];
    }

    var pliProduct = {
        pid: requestPLI.productID,
        quantity: requestQuantity,
        options: selectedOptions,
        storeId: storeId
    };
    // var templatemMain;
    // if (requestPLI.product.custom.accentable || requestPLI.product.custom.isAccentingSku) {
    //     templatemMain = 'product/quickViewAccent.isml'
    // } else {
    //     templatemMain = 'product/quickView.isml'
    // }

    var context = {
        product: ProductFactory.get(pliProduct),
        selectedQuantity: requestQuantity,
        selectedOptionValueId: selectedOptionValueId,
        uuid: requestUuid,
        updateCartUrl: URLUtils.url('Cart-EditProductLineItem'),
        closeButtonText: Resource.msg('link.editProduct.close', 'cart', null),
        enterDialogMessage: Resource.msg('msg.enter.edit.product', 'cart', null),
        template: 'product/quickView.isml',
        resources: {
            accentheader: 'Add Color Accents',
            chooseAccent: 'Choose Your Accent Color',
            noneAccent: 'None Selected'
        }
    };

    res.setViewData(context);

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();

        res.json({
            renderedTemplate: renderTemplateHelper.getRenderedHtml(viewData, viewData.template),
            storeId: storeId
        });
    });

    next();
});

server.get('SelectDeliveryOption', function (req, res, next) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var arrayHelper = require('*/cartridge/scripts/util/array');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var storeId = req.querystring.storeId || null;
    var deliveryOption = req.querystring.deliveryOption;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var pliUUID = req.querystring.uuid || null;
    var productLineItem = cartHelper.getProductLineItemByUUID(currentBasket, pliUUID);
    if (!productLineItem) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var bonusProductLineItem = null;
    var bonusProducts = productLineItem.getRelatedBonusProductLineItems();
    if(bonusProducts && bonusProducts.length > 0) {
        collections.forEach(bonusProducts, function (items) {
            bonusProductLineItem = collections.find(currentBasket.getAllProductLineItems(), function (val) {
                return val.UUID == items.UUID
            });
        });
    }
    
    var defaultShipment = currentBasket.defaultShipment;
    var pliShipment = productLineItem.getShipment();
    var ShipmentPLIs = pliShipment.getProductLineItems();
    if (deliveryOption === 'store' && storeId !== null) {
        var shippingMethods =
            ShippingMgr.getShipmentShippingModel(pliShipment).getApplicableShippingMethods();
        var instorePickupShippingMethod = collections.find(shippingMethods, function (method) {
            return method.custom.storePickupEnabled;
        });
        Transaction.wrap(function () {
            var shipment;
            if (ShipmentPLIs.length > 1) {
                shipment = cartHelper.createInStorePickupShipmentForLineItem(currentBasket, storeId, req);
                if (!Object.is(pliShipment, shipment)) {
                    shipment.setShippingMethod(instorePickupShippingMethod);
                    productLineItem.setShipment(shipment);
                    if(bonusProductLineItem != null) {
                        bonusProductLineItem.setShipment(shipment);
                    }
                    cartHelper.UpdatePremiumMonogramLineItem(currentBasket, shipment, productLineItem, storeId);
                }
            } else {
                shipment = cartHelper.getInStorePickupShipmentInCartByStoreId(currentBasket, storeId);
                if (!Object.is(pliShipment, shipment)) {
                    if (pliShipment.default && shipment) {
                        cartHelper.updateAddressStoreMethodOfShipment(pliShipment, instorePickupShippingMethod, storeId);
                        var productLineItems = shipment.getProductLineItems();
                        collections.forEach(productLineItems, function (items) {
                            items.setShipment(pliShipment);
                            cartHelper.UpdatePremiumMonogramLineItem(currentBasket, shipment, items, storeId);
                        });
                        currentBasket.removeShipment(shipment);
                    } else if (shipment) {
                        productLineItem.setShipment(shipment);
                        if(bonusProductLineItem != null) {
                            bonusProductLineItem.setShipment(shipment);
                        }
                        cartHelper.UpdatePremiumMonogramLineItem(currentBasket, shipment, productLineItem, storeId);
                        currentBasket.removeShipment(pliShipment);
                    } else {
                        cartHelper.UpdatePremiumMonogramLineItem(currentBasket, pliShipment, productLineItem, storeId);
                        cartHelper.updateAddressStoreMethodOfShipment(pliShipment, instorePickupShippingMethod, storeId);
                        if(bonusProductLineItem != null) {
                            var bpliShipment = bonusProductLineItem.getShipment();
                            cartHelper.updateAddressStoreMethodOfShipment(bpliShipment, instorePickupShippingMethod, storeId);
                        }
                    }
                }
            }
        });
        instorePickupStoreHelper.setStoreInProductLineItem(storeId, productLineItem);
        if(bonusProductLineItem != null) {
            instorePickupStoreHelper.setStoreInProductLineItem(storeId, bonusProductLineItem);
        }
    } else if (deliveryOption === 'home' && storeId === null) {
        var shipToMeShipment = cartHelper.getShipToMeShipment(currentBasket);
        var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
        Transaction.wrap(function () {
            if (ShipmentPLIs.length > 1) {
                if (shipToMeShipment) {
                    productLineItem.setShipment(shipToMeShipment);
                    if(bonusProductLineItem != null) {
                        bonusProductLineItem.setShipment(shipToMeShipment);
                    }
                    cartHelper.UpdatePremiumMonogramLineItem(currentBasket, shipToMeShipment, productLineItem);
                } else {
                    var shipToMeShipment = currentBasket.createShipment(UUIDUtils.createUUID());
                    cartHelper.updateAddressStoreMethodOfShipment(shipToMeShipment, defaultShippingMethod, null);
                    productLineItem.setShipment(shipToMeShipment);
                    if(bonusProductLineItem != null) {
                        bonusProductLineItem.setShipment(shipToMeShipment);
                    }
                    cartHelper.UpdatePremiumMonogramLineItem(currentBasket, shipToMeShipment, productLineItem);
                }
            } else {
                if (pliShipment.default && shipToMeShipment) {
                    cartHelper.updateAddressStoreMethodOfShipment(pliShipment, defaultShippingMethod, null);
                    var productLineItems = shipToMeShipment.getProductLineItems();
                    collections.forEach(productLineItems, function (items) {
                        items.setShipment(pliShipment);
                        cartHelper.UpdatePremiumMonogramLineItem(currentBasket, pliShipment, items);
                    });
                    currentBasket.removeShipment(shipToMeShipment);
                } else if (shipToMeShipment) {
                    productLineItem.setShipment(shipToMeShipment);
                    if(bonusProductLineItem != null) {
                        bonusProductLineItem.setShipment(shipToMeShipment);
                    }
                    cartHelper.UpdatePremiumMonogramLineItem(currentBasket, shipToMeShipment, productLineItem);
                    basket.removeShipment(pliShipment);
                } else {
                    cartHelper.UpdatePremiumMonogramLineItem(currentBasket, pliShipment, productLineItem);
                    cartHelper.updateAddressStoreMethodOfShipment(pliShipment, defaultShippingMethod, null);
                    if(bonusProductLineItem != null) {
                        var bpliShipment = bonusProductLineItem.getShipment();
                        cartHelper.updateAddressStoreMethodOfShipment(bpliShipment, defaultShippingMethod, null);
                    }
                }
            }
            productLineItem.custom.fromStoreId = null;
            productLineItem.setProductInventoryList(null);
            if(bonusProductLineItem != null) {
                bonusProductLineItem.custom.fromStoreId = null;
                bonusProductLineItem.setProductInventoryList(null);
            }
        });
    }
    res.json({
        success: true,
        redirectUrl: URLUtils.url('Cart-Show').toString()
    });
    next();
});

/**
 * Cart-MiniCart : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Base/Cart-MiniCart
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.include
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace('MiniCart', server.middleware.include, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
    } else {
        quantityTotal = 0;
    }
    if (!empty(currentBasket)) {
        for each(var productLine in currentBasket.productLineItems) {
            if (productLine.custom.isPremiumMonogramLetter || productLine.custom.parentProductLineItemID) {
                quantityTotal = quantityTotal - 1;
            }
        }
    }

    res.render('/components/header/miniCart', {
        quantityTotal: quantityTotal
    });
    next();
});

/**
 * Cart-RemoveProductLineItem : The Cart-RemoveProductLineItem endpoint removes a product line item from the basket
 * @name Base/Cart-RemoveProductLineItem
 * @function
 * @memberof Cart
 * @param {querystringparameter} - pid - the product id
 * @param {querystringparameter} - uuid - the universally unique identifier of the product object
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.replace('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var isProductLineItemFound = false;
    var bonusProductsUUIDs = [];

    Transaction.wrap(function () {
        if (req.querystring.pid && req.querystring.uuid) {
            var productLineItems = currentBasket.getAllProductLineItems();
            var bonusProductLineItems = currentBasket.bonusLineItems;
            var mainProdItem;
            for (var i = 0; i < productLineItems.length; i++) {
                var item = productLineItems[i];
                if ((item.UUID === req.querystring.uuid)) {
                    if (bonusProductLineItems && bonusProductLineItems.length > 0) {
                        for (var j = 0; j < bonusProductLineItems.length; j++) {
                            var bonusItem = bonusProductLineItems[j];
                            mainProdItem = bonusItem.getQualifyingProductLineItemForBonusProduct();
                            if (mainProdItem !== null &&
                                (mainProdItem.productID === item.productID)) {
                                bonusProductsUUIDs.push(bonusItem.UUID);
                                currentBasket.removeProductLineItem(bonusItem);
                            }
                        }
                    }

                    var shipmentToRemove = item.shipment;
                    var associatedLetters = !empty(item.custom.associatedLetters) ? (item.custom.associatedLetters).split(',') : [];
                    if (item.custom.giftBoxUUID) {
                        var giftBoxUUID = item.custom.giftBoxUUID;
                        var giftBoxProductLineItem = collections.find(BasketMgr.getCurrentBasket().allProductLineItems, function (item) {
                            return item.UUID === giftBoxUUID;
                        });
                        currentBasket.removeProductLineItem(giftBoxProductLineItem);
                    }
                    currentBasket.removeProductLineItem(item);
                    if (!empty(associatedLetters)) {
                        cartHelper.removePremiumMonogramLetters(currentBasket, productLineItems, associatedLetters)
                    }
                    if (shipmentToRemove.productLineItems.empty) {
                        delete shipmentToRemove.custom.fromStoreId;
                        delete shipmentToRemove.custom.shipmentType;
                    }
                    if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                        currentBasket.removeShipment(shipmentToRemove);
                    }
                    isProductLineItemFound = true;
                    break;
                }
            }
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    if (isProductLineItemFound) {
        var basketModel = new CartModel(currentBasket);
        var basketModelPlus = {
            basket: basketModel,
            toBeDeletedUUIDs: bonusProductsUUIDs
        };
        res.json(basketModelPlus);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.remove.product', 'cart', null)
        });
    }

    var dataLayer = require('*/cartridge/scripts/helpers/gtmDataLayerHelpers');
    var querystring = req.querystring;
    var pid = querystring.pid || null;
    var categoryID = querystring.categoryID || null;
    var orderID = querystring.orderID || null;
    var orderToken = querystring.orderToken || null;
    var dataLayerJson = dataLayer.getData(req, 'CART', pid, categoryID, orderID, orderToken);
    res.json({
        dataLayerJson: dataLayerJson
    });

    return next();
});

/**
 * Cart-GiftItem : The Cart-GiftItem endpoint is responsible for adding and editing gift option in Cart.
 * @name Base/Cart-GiftItem
 * @function
 * @memberof Cart
 */
server.post('GiftItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var collections = require('*/cartridge/scripts/util/collections');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var Site = require('dw/system/Site');

    // var ComplimentaryGBSKU = Site.getCurrent().getCustomPreferenceValue('ComplimentaryGBSKU');
    // var complimentaryGBEnable = Site.getCurrent().getCustomPreferenceValue('complimentaryGBEnable');
    // var premiumGBEnable = Site.getCurrent().getCustomPreferenceValue('premiumGBEnable');
    // var PremiumGBSKU = Site.getCurrent().getCustomPreferenceValue('PremiumGBSKU');

    var currentBasket = BasketMgr.getCurrentBasket();
    var giftForm = server.forms.getForm('gift')
    var requestUuid = req.querystring.uuid;
    var productId = req.querystring.pid;

    var result = {};
    //var quantity = parseInt(req.form.quantity || 1, 10);
    var requestPLI = collections.find(BasketMgr.getCurrentBasket().allProductLineItems, function (item) {
        return item.UUID === requestUuid;
    });

    if (!requestPLI) {
        res.json({
            success: false
        });
        return next();
    }

    var giftBoxStatus = Transaction.wrap(function () {
        if (req.form.giftBoxCart == 'true') {
            return giftHelper.addGiftBox(requestPLI);
        } else if (requestPLI.custom.giftBoxEnableLineitem == true) {
            requestPLI.custom.giftBoxEnableLineitem = null;
        }

        // return false;
    });

    // if (!giftBoxStatus) {
    //     res.json({
    //         success: false
    //     });
    //     return next();
    // }

    result = {
        receiverName: giftForm.receiverName.value ? giftForm.receiverName.value : null,
        senderName: giftForm.senderName.value ? giftForm.senderName.value : null,
        giftMessage: giftForm.giftMessage.value,
        giftBox: req.form.giftBoxCart == 'true' ? true : false,
        // complimentaryBox: req.form.giftBoxCart == 'complimentaryBox' ? true : false,
        // premiumBox: req.form.giftBoxCart == 'premiumBox' ? true : false,
        // skipBox: req.form.giftBoxCart == 'skipBox' ? true : false,
    };
    if (result.giftMessage || result.receiverName || result.senderName) {
        giftHelper.setGiftMsg(result, requestPLI);
    }

    res.json({
        success: true,
        product: requestPLI.toString()
        // complimentaryGiftBox: requestPLI.custom.complimentaryGiftBox,
        // premiumGiftBoxEnable: premiumGBEnable,
        // premiumGiftBox: requestPLI.custom.premiumGiftBox,
        // noGiftBox: requestPLI.custom.noGiftBox
    });
    return next();
});

/**
 * Cart-RemoveGiftItem : The Cart-RemoveGiftItem endpoint is responsible for removing gift option in Cart.
 * @name Base/Cart-RemoveGiftItem
 * @function
 * @memberof Cart
 */
server.get('RemoveGiftItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var collections = require('*/cartridge/scripts/util/collections');
    var giftForm = server.forms.getForm('gift')
    giftForm.clear();
    if (!currentBasket) {
        res.json({
            success: false
        });
        return next();
    }
    var collections = require('*/cartridge/scripts/util/collections');
    var requestPLI = collections.find(BasketMgr.getCurrentBasket().allProductLineItems, function (item) {
        return item.UUID === req.querystring.uuid;
    });
    // var giftBoxPLI = collections.find(BasketMgr.getCurrentBasket().allProductLineItems, function (item) {
    //     return item.UUID === requestPLI.custom.giftBoxUUID;
    // });

    Transaction.wrap(function () {
        requestPLI.setGiftMessage(null);
        requestPLI.custom.recipientName = null;
        requestPLI.custom.senderName = null;
        // requestPLI.custom.complimentaryGiftBox = null;
        // requestPLI.custom.premiumGiftBox = null;
        // requestPLI.custom.noGiftBox = null;
        if (requestPLI.custom.giftBoxEnableLineitem = true) {
            requestPLI.custom.giftBoxEnableLineitem = null;
        }
    });
    res.json({
        success: true
    });
    return next();
});

module.exports = server.exports();