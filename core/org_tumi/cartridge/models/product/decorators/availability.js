'use strict';

var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');

module.exports = function (object, quantity, minOrderQuantity, availabilityModel) {
    Object.defineProperty(object, 'availability', {
        enumerable: true,
        writable: true,
        value: (function () {
            var availability = {};
            availability.messages = [];
            var productQuantity = quantity ? parseInt(quantity, 10) : minOrderQuantity;
            var availabilityModelLevels = availabilityModel.getAvailabilityLevels(productQuantity);
            var inventoryRecord = availabilityModel.inventoryRecord;

            if (inventoryRecord && inventoryRecord.inStockDate) {
                var inStockDate = new Date(inventoryRecord.inStockDate)
                var calender =  new Calendar(inStockDate)
                availability.inStockDate = StringUtils.formatCalendar(calender, "dd/MM");
            } else {
                availability.inStockDate = null;
            }
            availability.label = '';
            availability.expected = '';

            if (availabilityModelLevels.inStock.value > 0) {
                if (availabilityModelLevels.inStock.value === productQuantity) {
                    availability.messages.push(Resource.msg('label.instock', 'common', null));
                } else {
                    availability.messages.push(
                        Resource.msgf(
                            'label.quantity.in.stock',
                            'common',
                            null,
                            availabilityModelLevels.inStock.value
                        )
                    );
                }
            }

            if (availabilityModelLevels.preorder.value > 0) {
                if (availabilityModelLevels.preorder.value === productQuantity) {
                    availability.messages.push(Resource.msg('label.preorder', 'common', null));
                } else {
                    availability.messages.push(
                        Resource.msgf(
                            'label.product.preorder.msg',
                            'common',
                            null,
                            availability.inStockDate
                        )
                    );

                }
                availability.label = Resource.msg('label.product.preorder', 'common', null);
                availability.expected = Resource.msgf('label.product.preorder.msg', 'common', null, availability.inStockDate);
                availability.expectedMsg = Resource.msgf('label.product.msg.expected', 'common', null, availability.inStockDate);
                
            }

            if (availabilityModelLevels.backorder.value > 0) {
                if (availabilityModelLevels.backorder.value === productQuantity) {
                    availability.messages.push(Resource.msg('label.back.order', 'common', null));
                } else {
                    availability.messages.push(
                        Resource.msgf(
                            'label.product.msg.expected',
                            'common',
                            null,
                            availability.inStockDate
                        )
                    );
                }
                availability.label = Resource.msg('label.product.backorder', 'common', null);
                availability.expected = Resource.msgf('label.product.msg.expected', 'common', null, availability.inStockDate);
                availability.expectedMsg = availability.expected;
            }

            if (availabilityModelLevels.notAvailable.value > 0) {
                if (availabilityModelLevels.notAvailable.value === productQuantity) {
                    availability.messages.push(Resource.msg('label.not.available', 'common', null));
                } else {
                    availability.messages.push(Resource.msg('label.not.available.items', 'common', null));
                }
            }

            return availability;
        }())
    });
    Object.defineProperty(object, 'available', {
        enumerable: true,
        value: availabilityModel.isOrderable(parseFloat(quantity) || minOrderQuantity)
    });
};
