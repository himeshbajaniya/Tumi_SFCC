'use strict';

/**
 * @namespace Product
 */

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var Site = require('dw/system/Site');
var rfkSitePreferences = require('*/cartridge/scripts/middleware/rfkSitePreferences');

function airlinesGuidedata() {
    var compatibleAirlineGuideImperial = Site.getCurrent().getCustomPreferenceValue('airlineGuideImperial');
    var airlineGuideImperial = JSON.parse(compatibleAirlineGuideImperial);

    var airlineGuideImperialValue;
    var size = [];
    var weight = [];
    var name = Object.keys(airlineGuideImperial);
    Object.keys(airlineGuideImperial).forEach(function (key) {
        if (airlineGuideImperial[key]) {
            airlineGuideImperialValue = airlineGuideImperial[key];
            size.push(airlineGuideImperialValue.size);
            weight.push(airlineGuideImperialValue.weight);
        }
    });
    var imperialData = {
        name: name,
        size: size,
        weight: weight
    };

    var compatibleAirlineGuideMetric = Site.getCurrent().getCustomPreferenceValue('airlineGuideMetric');
    var airlineGuideMetric = JSON.parse(compatibleAirlineGuideMetric);
    var sizeMetric = [];
    var weightMetric = [];
    var airlineGuideMetricValue;
    var nameMetric = Object.keys(airlineGuideMetric);
    Object.keys(airlineGuideMetric).forEach(function (key) {
        if (airlineGuideMetric[key]) {
            airlineGuideMetricValue = airlineGuideMetric[key];
            sizeMetric.push(airlineGuideMetricValue.size);
            weightMetric.push(airlineGuideMetricValue.weight);
        }
    });

    var metricData = {
        name: nameMetric,
        size: sizeMetric,
        weight: weightMetric
    };

    return {
        imperialData: imperialData,
        metricData: metricData
    };
}

server.get('GetDefaultVariationUrl', function (req, res, next) {
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var pid = req.querystring.pid;
    var apiProduct = ProductMgr.getProduct(pid);
    var defaultVariationUrl;
    var options = productHelpers.getConfig(apiProduct, pid);
    var defaultVariant = options.variationModel.defaultVariant;
    var selectedVariant = options.variationModel.selectedVariant;
    var getProductVariants = options.variationModel.getVariants();

    if (selectedVariant && productHelpers.getInventoryStatus(selectedVariant.availabilityModel)) {
        // if selectedVariant (called from browser) is available, use this to load on PDP.
        defaultVariationUrl = productHelpers.getProductURL(apiProduct, selectedVariant, options);
    } else {
        if (!productHelpers.getInventoryStatus(defaultVariant.availabilityModel)) {
            // if defaultVariant is also not available, loop all variants and find the first one which is available and use that to load on PDP.
            defaultVariant = collections.find(getProductVariants, function (item) {
                return productHelpers.getInventoryStatus(item.availabilityModel);
            });
        }
        if (defaultVariant == null) {
            // if all variants are OOS, in this case load the actual SKU that was called from browser. i.e selectedVariant
            defaultVariant = selectedVariant;
        }
        defaultVariationUrl = productHelpers.getProductURL(apiProduct, defaultVariant, options);
    }

    if (defaultVariationUrl) {
        defaultVariationUrl = urlHelper.appendQueryParams(defaultVariationUrl, { newpageload: 'true' }).toString();
    }

    res.json({
        defaultVariationUrl: defaultVariationUrl
    });

    next();
});
/**
 * Product-Show : This endpoint is called to show the details of the selected product
 * @name Base/Product-Show
 * @function
 * @memberof Product
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - pid - Product ID
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append('Show', function (req, res, next) {
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var s7Images = require('*/cartridge/scripts/s7Images');
    var Resource = require('dw/web/Resource');
    var HashMap = require('dw/util/HashMap');
    var URLAction = require('dw/web/URLAction');
    var URLUtils = require('dw/web/URLUtils');
    var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
    var URLParameter = require('dw/web/URLParameter');
    var itemMap = new HashMap();
    var viewData = res.getViewData();
    viewData.limitedInventoryThreshold = Site.getCurrent().getCustomPreferenceValue('productLimitedInventory');
    viewData.p360config = Site.getCurrent().getCustomPreferenceValue('p360config');
    viewData.p360config2 = Site.getCurrent().getCustomPreferenceValue('p360config2');
    viewData.p360contenturl = Site.getCurrent().getCustomPreferenceValue('p360contenturl');
    viewData.p360imageUrl = Site.getCurrent().getCustomPreferenceValue('p360imageUrl');
    viewData.p360serverurl = Site.getCurrent().getCustomPreferenceValue('p360serverurl');
    viewData.p360src = Site.getCurrent().getCustomPreferenceValue('p360src');
    viewData.sizeAttributesfor360View = Site.getCurrent().getCustomPreferenceValue('sizeAttributesfor360View');
    viewData.p360Folder = "Tumi/";

    var {
        imperialData,
        metricData
    } = airlinesGuidedata();
    viewData.size = imperialData.size;
    viewData.weight = imperialData.weight;
    viewData.name = imperialData.name;
    viewData.sizeMetric = metricData.size;
    viewData.weightMetric = metricData.weight;
    viewData.nameMetric = metricData.name;
    var inventoryMsg = viewData.product.availableToSell;
    viewData.getResources = {
        labelText: Resource.msg('product.limited.inventory.text', 'product', null),
        labelInventoryleftText: Resource.msg('product.limited.inventory.left.text', 'product', null)
    };
    viewData.enableMonogram = Site.getCurrent().getCustomPreferenceValue('enableMonogram');
    var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
    var accountModel = accountHelpers.getAccountModel(req);
    if (accountModel) {
        var myMonogramData = accountModel.profile.monogramdata;
        if (myMonogramData) {
            viewData.myMonogramData = myMonogramData;
        }
    }
    viewData.monogramUrl = URLUtils.url('Account-GetMonogram').toString();

    var product = viewData.product;
    var params = [];
    if (product && product.id) {
        params.push(new URLParameter('pid', product.id));
    }
    var action = new URLAction('Product-GetDefaultVariationUrl', Site.getCurrent().getID(), Site.getCurrent().defaultLocale);
    viewData.product.getDefaultVariationUrl = URLUtils.https(action, params).toString();

    viewData.productId = product.id;

    if(viewData.product && viewData.product.promotions) {
        viewData.product.promotions.map(function (item) {
            if (item.isGwp) {
                var product = ProductMgr.getProduct(item.giftWithPurchaseSKU);
                var images = s7Images.getS7Images(product.custom.styleVariant);
                var scene7ImagesArr = [];
                for (var i in images.object) {
                    scene7ImagesArr.push(images.object[i]);
                }
    
                var imageTest = scene7ImagesArr.filter(function (x) {
                    return (x.indexOf('_main') !== -1);
                });
                item.imageUrl = imageTest[0];
            }
        });
    }

    var returnParams = [];
    if (product && product.id) {
        returnParams.push(new URLParameter('rurl', '2'));
        returnParams.push(new URLParameter('pid', product.id.toString()));
    }
    var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');
    viewData.janrainrUrlData =  accountHelper.getJanrainReturnUrl(returnParams, 0);

    var lineItems = ProductMgr.getProduct(product.id);
    product['eligibleToShowAirlineGuide'] = false;
    if (!empty(lineItems)) {
        if (lineItems.isVariant()) {
            lineItems = lineItems.getMasterProduct();
        }
        if (!empty(lineItems)) {
            if (lineItems.onlineCategories.length > 0) {
                var totalCat = lineItems.onlineCategories.length;
                for (var i = 0; i < totalCat; i++) {
                    var eligiableCategory = productHelpers.getEligibleCategoryToShowAirlineGuice(lineItems.onlineCategories[i]);
                    if (eligiableCategory) {
                        product['eligibleToShowAirlineGuide'] = eligiableCategory;
                        break;
                    }
                }
            }
        }
    }

    res.setViewData(viewData);
    next();
}, rfkSitePreferences.getRfkSitePreferences);

server.get('AirlinesShow', function (req, res, next) {
    var {
        imperialData,
        metricData
    } = airlinesGuidedata();
    res.render('product/components/airlineModelContent', {
        size: imperialData.size,
        weight: imperialData.weight,
        name: imperialData.name,
        sizeMetric: metricData.size,
        weightMetric: metricData.weight,
        nameMetric: metricData.name
    });

    return next();
});

/**
 * Product-Variation : This endpoint is called when all the product variants are selected
 * @name Base/Product-Variation
 * @function
 * @memberof Product
 * @param {querystringparameter} - pid - Product ID
 * @param {querystringparameter} - quantity - Quantity
 * @param {querystringparameter} - dwvar_<pid>_color - Color Attribute ID
 * @param {querystringparameter} - dwvar_<pid>_size - Size Attribute ID
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.append('Variation', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var viewData = res.getViewData();
    viewData.limitedInventoryThreshold = Site.getCurrent().getCustomPreferenceValue('productLimitedInventory');
    viewData.p360config = Site.getCurrent().getCustomPreferenceValue('p360config');
    viewData.p360config2 = Site.getCurrent().getCustomPreferenceValue('p360config2');
    viewData.p360contenturl = Site.getCurrent().getCustomPreferenceValue('p360contenturl');
    viewData.p360imageUrl = Site.getCurrent().getCustomPreferenceValue('p360imageUrl');
    viewData.p360serverurl = Site.getCurrent().getCustomPreferenceValue('p360serverurl');
    viewData.p360src = Site.getCurrent().getCustomPreferenceValue('p360src');
    viewData.sizeAttributesfor360View = Site.getCurrent().getCustomPreferenceValue('sizeAttributesfor360View');
    viewData.p360Folder = "Tumi/";
    var purchaseAttr = productHelper.getIncludedWithPurchaseData(viewData.product);
    viewData.product.purchaseAttr = purchaseAttr;
    viewData.getResources = {
        labelText: Resource.msgf('product.limited.inventory.text', 'product', null),
        labelInventoryleftText: Resource.msgf('product.limited.inventory.left.text', 'product', null),
        purchaseHeading: Resource.msgf('purchasecomponent.heading', 'common', null),
        purchaseSubtext: Resource.msgf('purchasecomponent.subtext', 'common', null)
    };

    if (!req.querystring.newpageload) {
        // This generates product URL without .html
        viewData.prod_url = productHelper.generatePdpURL(viewData.product.id, false);
    }

    res.setViewData({
        featureAndSpec: require('*/cartridge/scripts/renderTemplateHelper').getRenderedHtml({ product: viewData.product }, 'product/components/featuresAndSpecifications')
    });
    res.setViewData(viewData);

    next();
});

server.get('IncludeBuyNow', server.middleware.include, function (req, res, next) {
    res.render('product/buyItNow', require('*/cartridge/scripts/factories/product').get({
        pid: req.querystring.pid
    }));
    next();
});

server.get('IncludeApplePayButton', server.middleware.include, function (req, res, next) {
    res.render('product/components/applePayButton', { isApplePayEnabled: req.querystring.isApplePayEnabled, pid: req.querystring.pid });
    next();
});

server.post('Buynow', function (req, res, next) {
    const {
        buyNow
    } = require('*/cartridge/scripts/helpers/buyNowhelpers');
    var buyNowObj = buyNow(req);
    var Resource = require('dw/web/Resource');
    if (buyNowObj.success && buyNowObj.errorMsg && buyNowObj.errorMsg === Resource.msg('error.no.shipping', 'buynow', null)) {
        res.setViewData({
            redirectURL: require('dw/web/URLUtils').url('Checkout-Begin').toString()
        });
    } else if (buyNowObj.success) {
        res.setViewData({
            redirectURL: require('dw/web/URLUtils').url('Checkout-Begin', 'stage', 'placeOrder').toString()
        });
    }
    res.json({
        success: buyNowObj.success,
        errorMsg: buyNowObj.errorMsg
    });
    next();
});

server.get('CheckPremiumMonogramAvalibility', function (req, res, next) {

    var ProductMgr = require('dw/catalog/ProductMgr');
    var HashMap = require('dw/util/HashMap');
    var collections = require('*/cartridge/scripts/util/collections');

    const VARIATION_ATTR_PREMIUM_MONOGRAM_LETTER = 'letter';
    const VARIATION_ATTR_PREMIUM_MONOGRAM_COLOR = 'color';

    var monogramMasterID = Site.getCurrent().getCustomPreferenceValue('premiumMonogramLookUpProductID');
    var monogramMaster = ProductMgr.getProduct(monogramMasterID);
    if (!monogramMaster) return next();

    var valueArray = 'monogramText' in req.querystring && req.querystring.monogramText ? req.querystring.monogramText : [];

    if (!valueArray || !valueArray.length) return next();

    var variationModel = monogramMaster.variationModel;

    var products = {};
    valueArray.reverse().forEach((item) => {
        var filter = new HashMap();
        filter.put(VARIATION_ATTR_PREMIUM_MONOGRAM_LETTER, item.toUpperCase());
        collections.forEach(variationModel.getVariants(filter), (variant) => {
            var savedColor = products[variant.custom.color];
            var available = require('*/cartridge/scripts/cart/cartHelpers').getLineItemInventory(req.querystring.uuid, variant);
            var totalPrice = 0;
            var price = (variant.priceModel && variant.priceModel.price) ? variant.priceModel.price.value : 0;
            if (!savedColor) {
                var list = [];
                list.push({
                    sku: variant.ID,
                    available: available,
                    letter: item.toUpperCase(),
                    price: price
                });
                savedColor = list;
                totalPrice = price;
            } else {
                savedColor.data.push({
                    sku: variant.ID,
                    available: available,
                    letter: item.toUpperCase(),
                    price: price
                });
                savedColor = savedColor.data;
                totalPrice = savedColor[0].price + price;
            }
            var totalPriceMoney = new (require('dw/value/Money'))(totalPrice, session.currency.currencyCode);
            var ProductImages = require('*/cartridge/models/product/productImages');
            var pva = variant.variationModel.getProductVariationAttribute(VARIATION_ATTR_PREMIUM_MONOGRAM_COLOR);
            if (pva) {
                var pvav = variant.variationModel.getSelectedValue(pva);
                var productImages = new ProductImages(pvav, {
                    pView: 'PDP',
                    types: ['swatch'],
                    quantity: 'single'
                });
                products[variant.custom.color] = {
                    data: savedColor,
                    swatch: (require('dw/system/Site').current.getCustomPreferenceValue('scene7Host') || 'https://tumi.scene7.com/is/image/Tumi/') + ('color' in variant.custom && variant.custom.color ? encodeURI(variant.custom.color) : '') + '?S7product$',
                    btnName: require('dw/web/Resource').msgf('product.metal.monogram.next', 'product', null, require('dw/util/StringUtils').formatMoney(totalPriceMoney)),
                    btnNameL2: require('dw/web/Resource').msgf('product.metal.monogram.level2.next', 'product', null, require('dw/util/StringUtils').formatMoney(totalPriceMoney)),
                    btnNameL2Both: require('dw/web/Resource').msgf('product.metal.monogram.level2.next', 'product', null, require('dw/util/StringUtils').formatMoney(totalPriceMoney.multiply(2))),
                    tagPrice: require('dw/web/Resource').msgf('product.metal.monogram.next', 'product', null, require('dw/util/StringUtils').formatMoney(totalPriceMoney.multiply(2))),
                    premiumBtnName: require('dw/web/Resource').msg('product.metal.monogram.addmessage', 'product', null),
                    premiumBtnTagName: require('dw/web/Resource').msg('product.metal.monogram.addmessage', 'product', null),
                    premiumTile: require('dw/web/Resource').msgf('product.metal.monogram.tile', 'product', null, pvav.displayValue, require('dw/util/StringUtils').formatMoney(totalPriceMoney)),
                    premiumTileBoth: require('dw/web/Resource').msgf('product.metal.monogram.tile', 'product', null, variant.custom.color, require('dw/util/StringUtils').formatMoney(totalPriceMoney.multiply(2)))
                };
            }
        });
    });
    var currentBasket = require('dw/order/BasketMgr').currentBasket;
    if (currentBasket && currentBasket.productLineItems && currentBasket.productLineItems.length) {
        var pli = collections.find(currentBasket.productLineItems, (item) => item.UUID === req.querystring.uuid);
        if (pli && 'monogramDataOnPLI' in pli.custom && pli.custom.monogramDataOnPLI) {
            try {
                var monogramDataOnPLI = JSON.parse(pli.custom.monogramDataOnPLI);
                var monogramItem = monogramDataOnPLI.find((obj) => !!obj.color);
                if (monogramItem) {
                    res.setViewData({
                        selectedColor: monogramItem.color
                    });
                }
            } catch (e) {
                e.stack;
            }
        }
    }
    res.json({
        products: products,
        resource: {
            btnName: require('dw/web/Resource').msgf('product.metal.monogram.next', 'product', null, 15 * valueArray.length)
        }
    });
    return next();
});

module.exports = server.exports();