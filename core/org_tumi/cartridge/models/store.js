'use strict';

function formatPhoneNumber(phoneNumber) {
    var formattedPhoneNumber = phoneNumber.replace(/\D[^\.]/g, "");
    formattedPhoneNumber = formattedPhoneNumber.slice(0,3)+"-"+ formattedPhoneNumber.slice(3,6)+"-"+ formattedPhoneNumber.slice(6);
    return formattedPhoneNumber;
}

/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.catalog.Store} storeObject - a Store objects
 */
function store(storeObject, distance) {
    var URLUtils = require('dw/web/URLUtils');
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var Site = require('dw/system/Site');
    if (storeObject) {
        this.ID = storeObject.ID;
        this.name = storeObject.name;
        this.address1 = storeObject.address1;
        this.address2 = storeObject.address2;
        this.city = storeObject.city;
        this.postalCode = storeObject.postalCode;
        this.latitude = storeObject.latitude;
        this.longitude = storeObject.longitude;
        this.distance = Math.ceil(distance);
        this.image = URLUtils.staticURL('/images/store.jpeg').toString();
        this.largeImage = Site.current.getCustomPreferenceValue('LargeStoreImageUrl');
        this.headerFooterImage = Site.current.getCustomPreferenceValue('HeaderFooterStoreImageUrl');

        if (storeObject.custom.storeType) {
            this.storeType = storeObject.custom.storeType;
        }

        if (storeObject.phone) {
            this.phone = formatPhoneNumber(storeObject.phone);
        }

        if (storeObject.stateCode) {
            this.stateCode = storeObject.stateCode;
        }

        if (storeObject.countryCode) {
            this.countryCode = storeObject.countryCode.value;
        }

        if (storeObject.stateCode) {
            this.stateCode = storeObject.stateCode;
        }

        if (storeObject.storeHours) {
            this.storeHours = storeObject.storeHours.markup;
            this.storetiming = storeHelpers.storeHours(storeObject.storeHours.markup);
        }
    }
}

module.exports = store;
