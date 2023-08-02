'use strict';

// API includes
var Status = require('dw/system/Status');
var Money = require('dw/value/Money');
var CommonHelper = require('*/cartridge/scripts/helper/CommonHelper');
// script includes
var AvaTax = require('*/cartridge/scripts/avaTax');

// Logger includes
var LOGGER = require('dw/system/Logger').getLogger('Avalara', 'AvaTax');

// AvaTax setting preference
var settingsObject = JSON.parse(require('dw/system/Site').getCurrent().getCustomPreferenceValue('ATSettings'));
var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
/**
 * Creates an order and send it across to AvaTax service to be recorded.
 * @returns {string} order number
 */
exports.createOrderNo = function () {
	try {
		var basket = require('dw/order/BasketMgr').currentBasket;
		var orderNo = require('dw/order/OrderMgr').createOrderSequenceNo();
		var validShipments = validationHelpers.validateShipments(basket);
		if (validShipments && typeof session.privacy.placeOrderFlow !== 'undefined' && !empty(session.privacy.placeOrderFlow) && session.privacy.placeOrderFlow) {
			AvaTax.calculateTax(basket, orderNo);
			session.privacy.placeOrderFlow = null;
		}
		return orderNo;
	} catch (e) {
		LOGGER.warn('Error while generating order no. File - avataxhooks.js | ' + e.message);
		if (!empty(e.javaName) && e.javaName == 'CreateException') {
			throw e;
		}
		return new Status(Status.ERROR);
	}
};

/**
 * Calculates the taxes by contacting AvaTax service
 * @param {Object} basket dw.basket object
 * @returns {*} void
 */
exports.calculateTax = function (basket) {
	// default tax calculation, if AvaTax not enabled
	if (!settingsObject.taxCalculation) {
		LOGGER.warn('AvaTax tax calculation not enabled. Default tax calculation will be executed. File - avataxhooks.js~calculateTax');
		require('*/cartridge/scripts/hooks/cart/calculate').calculateTax(basket);
	} else {
		try {
			var validShipments = validationHelpers.validateShipments(basket);
			if (!empty(basket) && !empty(basket.getAllProductLineItems()) && (session.custom.applepayShippingContactSelected === 'true' || validShipments)) {
				var result;
	            var cartStateString;
				if (session.custom.applepayShippingContactSelected === 'true') {
					delete session.privacy.cartStateString;
					delete session.privacy.SkipTaxCalculation;
				}
	            result = CommonHelper.CreateCartStateString(basket);
	            if (result.success && !empty(result.CartStateString)) {
	                cartStateString = result.CartStateString;
	                if (((!empty(session.privacy.SkipTaxCalculation) || !session.privacy.SkipTaxCalculation)) && typeof session.privacy.SkipTaxCalculation !== 'undefined') {
	                    var taxationResponse = AvaTax.calculateTax(basket);
	                    if (taxationResponse.taxCalulatedSuccessfully) {
	                        session.privacy.cartStateString = cartStateString;
	                        session.privacy.SkipTaxCalculation = true;
	                    }
	                }
	            }
			} else {
				var lineItems = basket.getAllLineItems();
				var itemTax = new Money(0, basket.currencyCode);
				if (lineItems.length > 0) {
					for (var i = 0; i < lineItems.length; i++) {
						var lineItem = lineItems[i];
						lineItem.setTax(itemTax);
						lineItem.updateTax(0.00);
					}
				}
			}
			// Call updateAllPriceAdjustments function and update basket total even if tax calculation is being skipped, otherwise it will result in wrong basket total when there is price adjustment in basket. 
			AvaTax.updateAllPriceAdjustments(basket);
			basket.updateTotals();
			return new Status(Status.OK);
		} catch (e) {
			LOGGER.warn('Error while calculating the taxes. File - avataxhooks.js~calculateTax | ' + e.message);
			return new Status(Status.ERROR);
		}
	}
	return new Status(Status.OK);
};