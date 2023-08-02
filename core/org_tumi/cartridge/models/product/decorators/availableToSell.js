'use strict';

module.exports = function (object, availabilityModel) {
    Object.defineProperty(object, 'availableToSell', {
        enumerable: true,
        value: availabilityModel.inventoryRecord && availabilityModel.inventoryRecord.ATS ? 
        availabilityModel.inventoryRecord.ATS.value : 0

    });
};
