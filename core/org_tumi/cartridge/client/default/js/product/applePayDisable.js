"use strict";

module.exports = {
    applePayDisableEnable: function(btnVal) {
        var applePayEle = $('.pdp-apple-pay-button');
        if(applePayEle.length > 0) {
            var btnWrapper = $('.product-btn-wrapper');
            if(btnVal) {
                btnWrapper.addClass('disable-apple-pay');
            }
            if(!btnVal && ($('.product-btn-wrapper [name="shipment-option"]:checked').val() !== 'instore-pickup')) {
                btnWrapper.removeClass('disable-apple-pay');
            }
        }
    }
}