'use strict';

var Logger = require('dw/system/Logger').getLogger('gtmDataLayerHelpers', 'gtmDataLayerHelpers');
var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelper');

/**
 * @param {Array} breadcrumbs - Array of objects of Breadcrumbs
 * @returns {string} a string of breadcrumbs
 */
function getFormattedBreadcrumb(breadcrumbs) {
    try {
        var formattedBreadcrumbs = 'Home';
        var divider = '|';
        for (let i = 1; i < breadcrumbs.length; i +=1) {
            if (typeof breadcrumbs[i].htmlValue === "string") {
                formattedBreadcrumbs += (divider + breadcrumbs[i].htmlValue);
            }
        }
        return formattedBreadcrumbs;
    } catch(e) {
        Logger.error('[gtmDataLayerHelpers.js] getFormattedBreadcrumb method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
        return '';
    }
}

/**
 * Breadcrumb for category feed
 * @param {Object} category the category object
 * @return {string} return breadcrumb for the given category, category names in the breadcrumb are delimited by '>'
 */
 function getBreadcrumb(category) {
    try {
        var currentCat = category;
        var breadcrumb = [];
        breadcrumb.push(currentCat.displayName);
        while (!currentCat.root) {
            var parentCat = currentCat.parent;
            if (!parentCat.root) {
                breadcrumb.push(parentCat.displayName);
            }
            currentCat = parentCat;
        }
        return (breadcrumb.reverse().join('>'));
    } catch (e) {
        Logger.error('[gtmDataLayerHelpers.js] getBreadcrumb method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
        return '';
    }
}

/**
 * All online categories for given product id
 * @param {string} productID the product id
 * @return {string} return breadcrumbs for the given product id, e.g. Hidden Category>Sale>Womens>Clothing|Womens>Clothing>Tops
 */
function getProductBreadcrumb(productID) {
    var breadCrumbs = '';
    var product = ProductMgr.getProduct(productID);
    try {
        if (!empty(product)) {
            var productBreadcrumbs = [];
            if (product.isVariant()) {
                product = product.getMasterProduct();
            }
            var catIterator = product.onlineCategories.iterator();
            while (catIterator.hasNext()) {
                var currentCat = catIterator.next();
                var breadcrumb = getBreadcrumb(currentCat);
                productBreadcrumbs.push(breadcrumb);
            }
            breadCrumbs = productBreadcrumbs.join('|');
        }
    } catch (e) {
        Logger.error('[gtmDataLayerHelpers.js] getProductBreadcrumb method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    }
    return breadCrumbs;
}

/**
 * @param {string} action - Current Page Route
 * @returns {string} pageType - a string of current page type
 */
function getPageType(action) {
    var pageType = '';
    switch (action) {
        case 'Home-Show':
            pageType = 'HOME';
            break;
        case 'Search-Show':
            pageType = 'CATEGORY';
            break;
        case 'Order-Confirm':
            pageType = 'ORDERCONFIRMATION';
            break;
        case 'COPlaceOrder-Submit':
            pageType = 'ORDERCONFIRMATION';
            break;  
        case 'Checkout-Begin':
            pageType = 'CHECKOUT';
            break; 
        case 'Account-Show':
            pageType = 'ACCOUNT';
            break; 
        case 'Product-Show':
            pageType = 'PRODUCT';
            break;
        case 'Cart-Show':
            pageType = 'CART';
            break; 
        case 'GiftCard-Show':
            pageType = 'GIFTCARD';
            break; 
        case 'Wishlist-Show':
            pageType = 'WISHLIST';
            break; 
        case 'Stores-Find':
            pageType = 'STORES';
            break; 
        case 'ContactUs-Landing':
            pageType = 'CONTACTUS';
            break;
        default:
            pageType = 'CONTENTPAGE';
            break;
    }
    return pageType;
}

/**
 * @param {string} pageType - pageType which is filtered by getPageType function
 * @param {string} pid - product ID
 * @param {string} categoryID - Category ID
 * @returns {string} a string of formatted breadcrumbs
 */
function buildBreadcrumbs(pageType, pid, categoryID) {
    var plpHelper = require('*/cartridge/scripts/helpers/plpHelpers');
    var breadcrumbs;

    switch (pageType) {
        case 'HOME':
            breadcrumbs = 'home';
            break;
        case 'CATEGORY':
            //plp breadcrumbes
        var allBreadcrumbs = plpHelper.getAllBreadcrumbsforPLP(categoryID, []).reverse();;
            breadcrumbs = getFormattedBreadcrumb(allBreadcrumbs).toLocaleLowerCase(); 
            break;
        case 'PRODUCT':
            //pdp breadcrumbes
         var allBreadcrumbs = productHelpers.getAllBreadcrumbs(null, pid, []).reverse();
            breadcrumbs = getFormattedBreadcrumb(allBreadcrumbs).toLocaleLowerCase(); 
            break;
        case 'ORDERCONFIRMATION':
            breadcrumbs = 'home | checkout | orderconfirmation';
            break;
        case 'CART':
            breadcrumbs = 'home | cart' 
            break;
        case 'CHECKOUT':
            breadcrumbs = 'home | checkout'
            break;
        case 'ACCOUNT':
            breadcrumbs = 'home | myaccount'
            break;
        case 'GIFTCARD':
            breadcrumbs = 'home | gifting | gift card'
            break;
        case 'WISHLIST':
            breadcrumbs = 'home | wishlist'
            break;
        case 'STORES':
            breadcrumbs = 'home | stores'
            break;
        case 'CONTACTUS':
            breadcrumbs = 'home | contact us'
            break;
        case 'ContentPage':
            breadcrumbs = 'home | contentpage'; 
            break;
        default:
            breadcrumbs = '';
            break;
    }
    return breadcrumbs;
}

/** Create an object for cartProducts and cartProductsFinal objects
 * @param {Object} products - products in the current cart
 * @returns {Array} an Array of object which contains all products' data in the cart
 */
 function getCartProducts(products) {
    var cartProducts = [];
    try {   
        for (let p = 0; p < products.length; p+=1) {
            var cartProductData = {};
            let product = products[p];
            var pdpProductInfo = ProductMgr.getProduct(product.productID);
            cartProductData.sku = product.productID; 
            cartProductData.name = product.productName;
            cartProductData.oldPrice = product.basePrice.value;
            cartProductData.price = product.adjustedPrice.value;
            cartProductData.url = productHelpers.generatePdpURL(product.productID, true);
            cartProductData.stock = pdpProductInfo ? pdpProductInfo.availabilityModel.inventoryRecord.ATS.value : null;
            cartProductData.upc = product.product.UPC;
            cartProductData.category = pdpProductInfo ? pdpProductInfo.custom.collection : '';
            cartProductData.quantity = product.quantityValue;
            cartProducts.push(cartProductData);
        }
       
    } catch (e) {
        Logger.error('[gtmDataLayerHelpers.js] getCartProducts method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    }
    return cartProducts;
}


/**
 * @param {Object} dataLayerJson - current route response object
 * @param {Object} pid - product ID
 * @returns {Object} dataLayerJson of containing PDP specific info data
 */
function getPDPSpecificData(dataLayerJson, pid) {
    var product = ProductMgr.getProduct(pid);
    var category = getProductBreadcrumb(pid);
    try {
        if (!empty(product)) {
            var productCustom = product.custom;
            dataLayerJson.productName = product.name || '';
            dataLayerJson.productCat = category.substring(0, category.indexOf('>')) || '';
            dataLayerJson.productSubCat = productCustom.categories || '';
            dataLayerJson.productDescription = product.shortDescription !== null ? product.shortDescription.markup : '';
            dataLayerJson.productOldPrice = product.priceModel.price.value; 
            dataLayerJson.productPrice = product.priceModel.price.value;
            dataLayerJson.numberofReviews = productCustom.turntoReviewCount ? productCustom.turntoReviewCount : 0;
            dataLayerJson.reviewRating = productCustom.turntoAverageRating ? productCustom.turntoAverageRating : 0;
            dataLayerJson.productId = product.ID;
            dataLayerJson.productupc = product.UPC;
            dataLayerJson.product_sku_code = product.ID;
            dataLayerJson.product_stock = product.availabilityModel.inventoryRecord ? product.availabilityModel.inventoryRecord.ATS.value : ''; 
            dataLayerJson.product_manufacturer = product.brand;
            dataLayerJson.productURL = productHelpers.generatePdpURL(pid, true);
            dataLayerJson.product_size = productCustom.size !== null ? productCustom.size : ''; 
            dataLayerJson.product_voucher = '';
            dataLayerJson.productCollection = productCustom.collection;
            dataLayerJson.product_color = productCustom.color;
            dataLayerJson.reviewsDataMap = 0; 
            dataLayerJson.emarsysCategory = category;
            dataLayerJson.linked_products = '';
        }
    } catch (e) {
        Logger.error('[gtmDataLayerHelpers.js] getPDPSpecificData method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    }
    return dataLayerJson;
}


/**
 * @param {Object} dataLayerJson - current route response object
 * @param {Object} currentBasket - current basket
 * @returns {Object} dataLayerJson of containing cart info data
 */
function getCartData(dataLayerJson, currentBasket) {
    try {
        var productLineItems = currentBasket.allProductLineItems;
        dataLayerJson.cartID = currentBasket.UUID || '';
        dataLayerJson.cartCurrency = currentBasket.currencyCode || '';
        dataLayerJson.cartSubtotal = currentBasket.totalNetPrice.value || 0;
        dataLayerJson.cartSubtotal_Include_Tax = false;
        dataLayerJson.cart_Tax = currentBasket.totalTax.value || 0;
        dataLayerJson.cart_total = currentBasket.totalGrossPrice.value || 0;
        dataLayerJson.cart_delivery_cost = currentBasket.shippingTotalPrice.value || 0;
        var cartProducts = !empty(productLineItems) ? getCartProducts(productLineItems) : [];
        dataLayerJson.cartProducts = cartProducts;
        dataLayerJson.cartProductsFinal = cartProducts;
        
    } catch (e) {
        Logger.error('[gtmDataLayerHelpers.js] getCartData() method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    }
    return dataLayerJson;
}

/**
 * @param {Object} dataLayerJson - current route response object
 * @returns {Object} dataLayerJson of containing cart info data
 */
 function getEmptyCartData(dataLayerJson) {
    var UUIDUtils = require('dw/util/UUIDUtils');
    try {
        dataLayerJson.cartID = UUIDUtils.createUUID();
        dataLayerJson.cartCurrency = session.currency.currencyCode || '';
        dataLayerJson.cartSubtotal = 0;
        dataLayerJson.cartSubtotal_Include_Tax = false;
        dataLayerJson.cart_Tax = 0;
        dataLayerJson.cart_total = 0;
        dataLayerJson.cart_delivery_cost = 0;
    } catch (e) {
        Logger.error('[gtmDataLayerHelpers.js] getEmptyCartData() method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    }
    return dataLayerJson;
}

/** Get all promotion IDs
 * @param {Object} product - product in the order
 * @returns {string} product's image url
 */
function getImageURL(product) {
    var Site = require('dw/system/Site');
    var scene7Host = Site.current.getCustomPreferenceValue('scene7Host');
    var scene7Postfix = JSON.parse(Site.current.getCustomPreferenceValue('scene7Postfix'));
    var styleVariant = product.product.custom.baseCode;
    var imageUrl = !empty(styleVariant) ? (scene7Host + styleVariant + scene7Postfix.main) : '';
    return imageUrl;
};

/** Get all promotion IDs
 * @param {Object} order - current route response object
 * @param {Object} product - product could be null or product in order
 * @returns {string} all promo ids with pipe
 */
 function getAllPromos(order, product) {
    var promos = '';
    try {     
        var products = order.productLineItems;
        if (!empty(order.priceAdjustments)) {
            promos += (order.priceAdjustments[0].promotionID + '|');
        }

        if (product === null) {
            for (let i = 0; i < products.length; i +=1) {
                let product = products[i];
                if (!empty(product.priceAdjustments)) {
                    promos += (product.priceAdjustments[0].promotionID + '|');
                }
            }
            return promos !== '' ? promos.substring(0, promos.length-1) : '';
        } else {
            if (!empty(product.priceAdjustments)) {
                promos += (product.priceAdjustments[0].promotionID + '|');
            }
            return promos !== '' ? promos.substring(0, promos.length-1) : '';
        }

    } catch (e) {
        Logger.error('[gtmDataLayerHelpers.js] getAllPromos() method crashed for order no {0} on line:{1}. ERROR: {2}', order.currentOrderNo, e.lineNumber, e.message);
        return promos; 
    }
}


/** Generate transactionProduct array of object - Order Confirmation Page Data Layer
 * @param {Object} products - Ordered ProductLineItems
 * @returns {Object} dataLayerJson of containing PDP specific info data
 */
function getTransactionProducts(products, order) {
    var transactionProducts = [];
    try {
        for (let i = 0; i < products.length; i += 1) {
            var transactionProduct = {};
            var product = products[i];
            var productCustom = product.product.custom;
            var productURL = productHelpers.generatePdpURL(product.productID, true);
            var category = getProductBreadcrumb(product.productID);
            var promotion = getAllPromos(order, product);
            var adjustedPrice = product.adjustedPrice.value;
            var adjustedGrossPrice = product.adjustedGrossPrice.value;
            var availability = product.product.availabilityModel.inventoryRecord.ATS.value || 0;

            transactionProduct.baseProduct = productCustom.baseCode;
            transactionProduct.category = productCustom.collection;
            transactionProduct.collection = productCustom.collection;
            transactionProduct.color = productCustom.color;
            transactionProduct.imageUrl = getImageURL(product);
            transactionProduct.isCustomized = product.custom.vasMonogramAttributes ? true : false;
            transactionProduct.isGift = product.gift;
            transactionProduct.isGiftMessage = product.giftMessage;
            transactionProduct.isGiftBox = (product.custom.noGiftBox || product.custom.premiumGiftBox) ? true : false;
            transactionProduct.name = product.productName;
            transactionProduct.price = adjustedGrossPrice;
            transactionProduct.priceWithoutCurrency = adjustedGrossPrice;
            transactionProduct.productUrl = productURL;
            transactionProduct.promotion = promotion;
            transactionProduct.quantity = product.quantity.value;
            transactionProduct.size = productCustom.size !== null ? productCustom.size : '';
            transactionProduct.sku = product.productID;
            transactionProduct.stockStatusCode = availability > 0 ? 'In Stock' : 'Not In Stock';
            transactionProduct.totalPrice = '$' + adjustedPrice;
            transactionProduct.totalPriceWithoutCurrency = adjustedPrice;
            transactionProduct.upc = product.product.UPC;
            transactionProduct.oldPrice = product.basePrice.value;
            transactionProduct.price = adjustedPrice;
            transactionProduct.url = productURL;
            transactionProduct.quantity = product.quantityValue;
            transactionProduct.stock = productCustom.collection;
            transactionProduct.prodCategory = category.substring(0, category.indexOf('>')) || '';

            transactionProducts.push(transactionProduct);
        }
    } catch(e) {
        Logger.error('[gtmDataLayerHelpers.js] getTransactionProducts() method crashed for order no {0} on line:{1}. ERROR: {2}', order.currentOrderNo, e.lineNumber, e.message);
    }
    return transactionProducts;
}
 

/** Generate transactionMethod.deliveryAddress object - Order Confirmation Page Data Layer
 * @param {Object} order - Ordered ProductLineItems
 * @returns {Object} object containing delivery address info data
 */
function getDeliveryAddress(order) {
    try {
        var shippingAddress = order.shipments[0].shippingAddress;
        return {
            'country': shippingAddress.countryCode.displayValue,
            'title': '',
            'firstName': shippingAddress.firstName,
            'lastName': shippingAddress.lastName, 
            'line1': shippingAddress.address1,
            'line2': shippingAddress.address2,
            'phone': shippingAddress.phone,
            'postalCode': shippingAddress.postalCode,
            'region': shippingAddress.stateCode,
            'town': shippingAddress.city,
        }
    } catch(e) {
        Logger.error('[gtmDataLayerHelpers.js] getDeliveryAddress() method crashed for order no {0} on line:{1}. ERROR: {2}', order.currentOrderNo, e.lineNumber, e.message);
        return;
    }
}

/** Generate transactionPayment.billingAddress object - Order Confirmation Page Data Layer
 * @param {Object} order - current route response object
 * @returns {Object} an object contains billing Address information
 */
 function getBillingAddress(order) {
    try {
        var billingAddress = order.billingAddress;
        return {
            'country': billingAddress.countryCode.displayValue,
            'title': '',
            'firstName': billingAddress.firstName,
            'lastName': billingAddress.lastName, 
            'line1': billingAddress.address1,
            'line2': billingAddress.address2,
            'phone': billingAddress.phone,
            'postalCode': billingAddress.postalCode,
            'region': billingAddress.stateCode,
            'town': billingAddress.city,
            'email': order.customerEmail
        }
    } catch(e) {
        Logger.error('[gtmDataLayerHelpers.js] getBillingAddress() method crashed for order no {0} on line:{1}. ERROR: {2}', order.currentOrderNo, e.lineNumber, e.message);
        return;
    }
}

/** Generate transactionMethod.deliveryMethod object - Order Confirmation Page Data Layer
 * @param {Object} order - Ordered ProductLineItems
 * @returns {Object} object containing delivery method info data
 */
function getDeliveryMethod(order) {
    try {
        var shippingMethod = order.shipments[0].shippingMethod;
        var shippingTotalPrice = order.shippingTotalPrice.value;
        return {
            'name': shippingMethod.displayName,
            'cost': shippingTotalPrice === 0 ? 'FREE' : shippingTotalPrice,
            'costWithoutCurrency': shippingTotalPrice,
            'description': shippingMethod.custom.estimatedArrivalTime,
        }
    } catch(e) {
        Logger.error('[gtmDataLayerHelpers.js] getDeliveryMethod() method crashed for order no {0} on line:{1}. ERROR: {2}', order.currentOrderNo, e.lineNumber, e.message);
        return;
    }
}

/** Generate transactionPayment.paymentInfo object - Order Confirmation Page Data Layer
 * @param {Object} order - current route response object
 * @returns {Object} an object contains payment information
 */
function getPaymentInfo(order) {
    try {
        var paymentInstrument = order.paymentInstrument;
        if (paymentInstrument.paymentMethod === 'CREDIT_CARD') {
            return {
                'type': order.paymentTransaction.paymentProcessor.ID,
                'cardType': paymentInstrument.creditCardType,
                'cardNumber': paymentInstrument.creditCardNumber,
                'expiryInfo': 'Expiry: ' + paymentInstrument.creditCardExpirationMonth + '/' + paymentInstrument.creditCardExpirationYear
            }
        } else {
            return {
                'type': paymentInstrument.paymentMethod,
                'cardType':'',
                'cardNumber': '',
                'expiryInfo': '',
            }
        }

    } catch(e) {
        Logger.error('[gtmDataLayerHelpers.js] getPaymentInfo() method crashed for order no {0} on line:{1}. ERROR: {2}', order.currentOrderNo, e.lineNumber, e.message);
        return;
    }
}

/** Get current transaaction's credit card type (Visa, Master...) or paymentMethod
 * @param {Object} order - current route response object
 * @returns {string} either credit card type or paymentMethod
 */
function getPaymentType(order) {
    var payments = order.getPaymentInstruments();
    var paymentsString = '';
    if (payments.length > 1) {
        for (let p = 0; p < payments.length; p += 1) {
            if (payments[p].paymentMethod === 'CREDIT_CARD') {
                paymentsString += (payments[p].creditCardType + '|')
            } else {
                paymentsString += (payments[p].paymentMethod + '|') ;
            }
        }
       return paymentsString.slice(0, -1);
    }

    var paymentInstrument = order.paymentInstrument;
    if (paymentInstrument.paymentMethod === 'CREDIT_CARD') {

        return paymentInstrument.creditCardType;
    } else {
        return paymentInstrument.paymentMethod;
    }
}

/** Get current transaction's payment method
 * @param {Object} order - current route response object
 * @returns {string} payment type
 */
function getTransactionPaymentMethod(order) {
    var paymentMethod = order.paymentInstrument.paymentMethod;
    var paymentType = '';
    switch(paymentMethod) {
        case 'CREDIT_CARD':
            paymentType = 'CREDIT';
            break;
        case 'PayPal':
            paymentType = 'PAYPAL';
            break;
        case 'DW_APPLE_PAY':
            paymentType = 'APPLE_PAY';
                break;
        case 'KLARNA':
            paymentType = 'KLARNA';
            break;
        case 'GIFT_CERTIFICATE':
            paymentType = 'GIFT_CERTIFICATE';
            break;
        default:
            paymentType = '';
            break;
    }

    return paymentType;
}

/** Get current transaction's promotion values for both order and product levels
 * @param {Object} order - current transaction order object
 * @returns {Number} total promotion values
 */
function getAllDiscounts(order) {
    var totalPromo = 0;
    //Order level promotions
    totalPromo = (!empty(order.priceAdjustments)) ? order.priceAdjustments[0].price.value : 0;

    //Product level promotions
    var products = order.productLineItems;
    for (let i = 0; i < products.length; i +=1) {
        var product = products[i];
        var priceAdjustments = product.priceAdjustments;
        if (!empty(priceAdjustments)) {
            totalPromo += product.priceAdjustments[0].price.value;
        }
    }
    return totalPromo;
}


/** Generate Confirmation Data on the Confirmation Page
 * @param {Object} dataLayerJson - current route response object
 * @param {Object} order - Ordered productLineItems
 * @returns {Object} dataLayerJson of containing confirmation data
 */
function getConfirmationData(dataLayerJson, order) {

    try {
        var shippingMethod = order.shipments[0].shippingMethod;
        var x = null;
        dataLayerJson.transactionId = order.currentOrderNo;
        dataLayerJson.transactionTotal = order.totalGrossPrice.value;
        dataLayerJson.transactionTax = order.totalTax.value;
        dataLayerJson.transactionShipping = order.shippingTotalNetPrice.value;
        dataLayerJson.transactionSubtotal = order.merchandizeTotalNetPrice.value;
        dataLayerJson.transactionShippingMethod = shippingMethod.displayName;
        dataLayerJson.transactionDiscount = getAllDiscounts(order);
        dataLayerJson.transactionPaymentType = getTransactionPaymentMethod(order);
        dataLayerJson.transactionDate = StringUtils.formatCalendar(new Calendar(), 'yyyyMMdd');
        dataLayerJson.transactionType = shippingMethod === '005' ? 'BOPIS' : 'SHIP'; 
        dataLayerJson.transactionPromoCode = getAllPromos(order, x);
        dataLayerJson.transactionProducts = getTransactionProducts(order.productLineItems, order);
        dataLayerJson.transactionCurrency = order.currencyCode;   
        dataLayerJson.paymentType = getPaymentType(order);
        
        dataLayerJson.transactionPayment = {};
        dataLayerJson.transactionPayment.billingAddress = getBillingAddress(order);
        dataLayerJson.transactionPayment.paymentInfo = getPaymentInfo(order);
    
        dataLayerJson.transactionMethod = {};
        dataLayerJson.transactionMethod.deliveryAddress = getDeliveryAddress(order);
        dataLayerJson.transactionMethod.deliveryMethod = shippingMethod === '005' ? 'BOPIS' : getDeliveryMethod(order);
    
    } catch(e) {
        Logger.error('[gtmDataLayerHelpers.js] getConfirmationData() method crashed for Order no {0} on line:{1}. ERROR: {2}', order.currentOrderNo, e.lineNumber, e.message);    
    }
    return dataLayerJson;
}


/** Generate Delivery info on the Confirmation Page
 * @param {Object} dataLayerJson - current route response object
 * @param {Object} order - Ordered productLineItems
 * @returns {Object} dataLayerJson of containing delivery info data
 */
function getDeliveryData(dataLayerJson, order) {
    var shipAddress = order.shipments[0].shippingAddress;
    var delivery = {};
    try {
        delivery.name = shipAddress.fullName;
        delivery.address = shipAddress.address1 + (shipAddress.address2 !== null ? shipAddress.address2 : '');
        delivery.city = shipAddress.city;
        delivery.state = shipAddress.stateCode;
        delivery.postcode = shipAddress.postalCode;
        delivery.country = shipAddress.countryCode.displayValue;
        dataLayerJson.delivery = delivery;
    } catch (e) {
        Logger.error('[gtmDataLayerHelpers.js] getDeliveryData() method crashed for Order no {0} on line:{1}. ERROR: {2}', order.currentOrderNo, e.lineNumber, e.message);
        dataLayerJson.delivery = delivery;
    }
    return dataLayerJson;
}

/** Generate customer info for the logged in customer
 * @param {Object} dataLayerJson - current route response object
 * @param {Object} currentCustomer - Current customer's data
 * @returns {Object} dataLayerJson of containing delivery info data
 */
function getRegisteredCustomerData(currentCustomer, dataLayerJson) {
    try {
        var firstName = (!empty(currentCustomer.profile.firstName) ? currentCustomer.profile.firstName : '');
        var lastName = (!empty(currentCustomer.profile.lastName) ? currentCustomer.profile.lastName : '');
        var customerID = currentCustomer.profile.credentials.login;
        dataLayerJson.customerID = customerID;
        dataLayerJson.customer_email = customerID; 
        dataLayerJson.customerName = firstName + ' ' + lastName;
        dataLayerJson.customerDisplayUID = customerID;
        dataLayerJson.customerPrefLanguage = 'en';

    } catch (e) {
        Logger.error('[gtmDataLayerHelpers.js] getRegisteredCustomerData() method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    }
    return dataLayerJson;
}
 
/** Setup dataLayerJson object and invoke methods
 * @param {Object} req - current route request object
 * @param {string} pageType - page type 
 * @param {string} pid - product ID or null 
 * @param {string} categoryID - category ID or null
 * * @param {string} orderID - order ID or null 
 * @param {string} orderToken - orderToken or null
 * @returns {Object} Status
 */
function getData(req, pageType, pid, categoryID, orderID, orderToken) {
    var dataLayerJson = {};
    
    try {
        var currentCustomer = req.currentCustomer.raw;
        var breadcrumbs = buildBreadcrumbs(pageType, pid, categoryID);
        var currentBasket = BasketMgr.getCurrentBasket();
        //Page Data - All Pages
        dataLayerJson.pageBreadcrumb = breadcrumbs;
        dataLayerJson.pageType = pageType;
        dataLayerJson.visitorLoginState = currentCustomer.authenticated ? 'registered' : 'guest';
        dataLayerJson.pageCategory = breadcrumbs;
        dataLayerJson.dwsid = cookieHelpers.getCookie('dwsid');
    
        //Cart Data - All Pages
        if (!empty(currentBasket)) {
            getCartData(dataLayerJson, currentBasket);
        } else {
            getEmptyCartData(dataLayerJson);
        }
    
        //PDP Specific Data 
        if (pageType === 'PRODUCT') {
            getPDPSpecificData(dataLayerJson, pid);
        }
    
        // Authorized Customer Only Info
        if (!empty(currentCustomer) && currentCustomer.authenticated) {
            getRegisteredCustomerData(currentCustomer, dataLayerJson);
        }
        // Order Confirmation 
        if (!empty(orderID) && !empty(orderToken)) {
            var order = OrderMgr.getOrder(orderID, orderToken);
            if (pageType === 'ORDERCONFIRMATION' && !empty(order)) {
                getConfirmationData(dataLayerJson, order);
                getDeliveryData(dataLayerJson, order);
            }
            Logger.info('[gtmDataLayerHelpers.js] DataLayer JSON for order no {0}, dataLayerJson {1} ', orderID, JSON.stringify(dataLayerJson));
        }

    } catch (e) {
        if (!empty(orderID) && !empty(orderToken)) {
            Logger.error('[gtmDataLayerHelpers.js] getData() method crashed for Order no {0} on line:{1}. ERROR: {2}', orderID, e.lineNumber, e.message);
        } else {
            Logger.error('[gtmDataLayerHelpers.js] getData() method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    	}
    } 

    return JSON.stringify(dataLayerJson);
}

module.exports = {
    getData: getData,
    getPageType: getPageType,
    buildBreadcrumbs: buildBreadcrumbs,
    getFormattedBreadcrumb: getFormattedBreadcrumb,
    getProductBreadcrumb: getProductBreadcrumb
};
