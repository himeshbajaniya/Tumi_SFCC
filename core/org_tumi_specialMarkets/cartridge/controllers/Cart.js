var server = require('server');
server.extend(module.superModule);

server.append('AddProduct', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');

    var viewData = res.getViewData();
    var cart = viewData.cart;
    var miniCartUrls = {
        checkoutUrl: URLUtils.url('Cart-Show').toString(),
        viewMyCartUrl: URLUtils.url('Home-Show').toString()
    };
    var miniCartResources = {
        Checkout: Resource.msgf('link.minicart.checkout', 'cart', null),
        viewMyCart: Resource.msgf('link.minicart.view.mycart', 'cart', null)
    };
    
    cart.miniCartUrls = miniCartUrls;
    cart.miniCartResources = miniCartResources;
    res.setViewData({
        cart: cart
    });
    next();
});

server.append('Show', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var viewData = res.getViewData();
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    if(currentBasket && currentBasket.allProductLineItems.length >0){
        var tumiHelpers = require('*/cartridge/scripts/helpers/tumiHelpers');
        var agentDetailsJSON = tumiHelpers.getLocalAgentDetails();
        viewData.agentDetailsJSON = agentDetailsJSON;
        viewData.actionUrl = URLUtils.url('Cart-SubmitInquiry');
        res.setViewData(viewData);
    } else{
        viewData.emptyCart = URLUtils.url('Cart-SubmitInquiry');
    }
    next();
})

server.post('SubmitInquiry', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    if(currentBasket && currentBasket.allProductLineItems.length >0) {
        var Resource = require('dw/web/Resource');
        var Site = require('dw/system/Site');
        var emailHelper = require('*/cartridge/scripts/helpers/emailHelpers');
        var tumiHelpers = require('*/cartridge/scripts/helpers/tumiHelpers');
        var CartModel = require('*/cartridge/models/cart');
        var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
        var emarsysHelper = require('*/cartridge/scripts/helpers/emarsysSFRAHelper');
        
        var myForm = req.form;
        var agentDetails = null;
        var emailToSitePref = Site.current.getCustomPreferenceValue('specialMarketsToEmail');
        
        if(myForm.inquiryRepresentative) {
            agentDetails = tumiHelpers.getLocalAgentDetails(myForm.inquiryRepresentative);
        }
        if(myForm.inquiryMarketingEmail == 'on'){
            var billingData = {email:{value:''}};
            billingData.email.value=myForm.inquiryEmail
            emarsysHelper.checkoutSubscription(res, billingData);
        }
        var basketModel = new CartModel(currentBasket);
        var context = {
            form: myForm,
            items: basketModel.items
        }

        res.setViewData(basketModel);

        tumiHelpers.removeAllProducts(currentBasket);
        res.render('checkout/confirmation/inquiryConfirmation', {
            form: myForm,
            agentDetails: agentDetails
        });
        // Send product inquiry email
        var isEmarsysEnable = Site.getCurrent().getCustomPreferenceValue('emarsysEnabled');
        var eventsHelper = require('*/cartridge/scripts/helpers/triggerEventHelper');
        if (isEmarsysEnable) {
            eventsHelper.specialMarketsProductInquiry(context);
        }
    } else {
        res.redirect(URLUtils.url('Home-Show'));
    }
    next();
})

module.exports = server.exports();
