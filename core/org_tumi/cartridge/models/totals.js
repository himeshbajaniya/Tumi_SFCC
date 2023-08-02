'use strict';

var base = module.superModule;

var formatMoney = require('dw/util/StringUtils').formatMoney;
var Resource = require('dw/web/Resource');
const collections = require('*/cartridge/scripts/util/collections');
const Money = require('dw/value/Money');

/**
 * Accepts a total object and formats the value
 * @param {dw.value.Money} total - Total price of the cart
 * @returns {string} the formatted money value
 */
function getTotals(total) {
    return !total.available ? '-' : formatMoney(total);
}

function getTotalDiscount(productLevelDiscountTotal, orderLevelDiscountTotal, lineItemContainer) {
    var orderLevelDiscount = orderLevelDiscountTotal.value;
    const totalDiscountValue = (productLevelDiscountTotal.value ||  0) + (orderLevelDiscount || 0);
  
    return {
      value: totalDiscountValue,
      formatted: formatMoney(new Money(totalDiscountValue, lineItemContainer.currencyCode))
    }
}

function getProductLevelDiscountTotal(lineItemContainer) {
    let totalProductLevelDiscount = new Money(0, lineItemContainer.currencyCode);
    collections.forEach(lineItemContainer.allProductLineItems, function (productLineItem) {
        collections.forEach(productLineItem.priceAdjustments, function (priceAdjustment) {
            totalProductLevelDiscount = totalProductLevelDiscount.subtract(priceAdjustment.price);
        });
    });

    return {
        value: totalProductLevelDiscount.value,
        formatted: formatMoney(totalProductLevelDiscount)
    };
}

/**
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    base.call(this, lineItemContainer);
    this.subTotal = getTotals(lineItemContainer.getMerchandizeTotalNetPrice());

    if (this.totalShippingCost === '$0.00') {
        this.totalShippingCost = Resource.msg('ordersummary.free.shipping', 'cart', null);
    }
    this.merchandizeTotalDiscount = getTotals(lineItemContainer.merchandizeTotalPrice.subtract(lineItemContainer.getAdjustedMerchandizeTotalPrice(false)));
    this.productLevelDiscountTotal = getProductLevelDiscountTotal(lineItemContainer);
    this.totalDiscount = getTotalDiscount(this.productLevelDiscountTotal, this.orderLevelDiscountTotal, lineItemContainer);
}

module.exports = totals;