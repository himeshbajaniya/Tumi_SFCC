'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Site = require('dw/system/Site');
var currentSite = Site.getCurrent();

/**
 * get site preference value by name
 * @param {string} name - site preference name
 * @returns {string} the site preference
 */
function getPreference(name) {
    return Object.hasOwnProperty.call(currentSite.preferences.custom, name) ? currentSite.getCustomPreferenceValue(name) : null;
}


/**
 * @constructor
 * @classdesc Returns images for a given product
 * @param {dw.catalog.Product} product - product to return images for
 * @param {Object} imageConfig - configuration object with image types
 */
function Images(product, imageConfig) {
    var s7Images = require('~/cartridge/scripts/s7Images');

    var scene7Host = getPreference('scene7Host');
    var scene7PostfixPref = getPreference('scene7Postfix');
    var s7PresetsPref = getPreference('s7Presets');
    var scene7Postfix = JSON.parse(scene7PostfixPref);
    var s7Presets = JSON.parse(s7PresetsPref);
    var isPDP = Object.hasOwnProperty.call(imageConfig, 'pView') && imageConfig.pView === 'PDP';
    var s7ImageUrls;
    var svcResponse;
    var s7ImageUrlCount;
    var images = [];
    var styleVariant;
    var isGCard = false;
    if((Object.hasOwnProperty.call(product, 'master') && product.master && product.master.ID == 'GCARD') || (Object.hasOwnProperty.call(product, 'custom') && product.custom && product.custom.baseCode == 'GCARD')) {
        isGCard = true;
    }
    
    if (imageConfig.types[0] !== 'swatch') {
        if (Object.hasOwnProperty.call(product, 'selectedVariant') && product.selectedVariant) {
            product = product.selectedVariant;
        } else if (Object.hasOwnProperty.call(product, 'defaultVariant') && product.defaultVariant) {
            product = product.defaultVariant;
        } else if(isGCard) {
            if(Object.hasOwnProperty.call(product, 'master') && product.master){
                product = product.master.variants[0];
            }
        } else if (product.isMaster()) {
            var prodVariationModel = product.variationModel;
            product = Object.hasOwnProperty.call(prodVariationModel, 'defaultVariant') && prodVariationModel.defaultVariant ? prodVariationModel.defaultVariant : prodVariationModel.variants[0];
        }
        styleVariant = isGCard ? product.ID : Object.hasOwnProperty.call(product.custom, 'styleVariant') && product.custom.styleVariant ? product.custom.styleVariant : '';
        if (isPDP) {
            svcResponse = styleVariant ? s7Images.getS7Images(styleVariant) : null;
            if (svcResponse) {
                s7ImageUrlCount = Object.hasOwnProperty.call(svcResponse, 'object') && svcResponse.object ? svcResponse.object.length : null;
                s7ImageUrls = svcResponse.object && s7ImageUrlCount ? svcResponse.object : null;
            }
        } else {
            s7ImageUrls = scene7Host + styleVariant + scene7Postfix.main;
        }
    }
    imageConfig.types.forEach(function (type) {
        if (type === 'swatch') {
            styleVariant = product && product.ID ? product.ID : '';
            s7ImageUrls = scene7Host + styleVariant + scene7Postfix.swatch;
            images = Array({ url: s7ImageUrls });
        } else if (s7ImageUrls && isPDP && s7ImageUrls.length === 1) {
            var i;
            for (i = 0; i < s7ImageUrls.length; i++) {
                images.push({ url: s7ImageUrls[i] + '?wid=' + s7Presets[type].width + '&hei=' + s7Presets[type].height });
            }
            this.vid = styleVariant;
        } else if (s7ImageUrls && isPDP) {
            var i;
            for (i = 0; i < s7ImageUrls.length; i++) {
                if(s7ImageUrls[i].indexOf('_sw') < 0) {
                    images.push({ url: s7ImageUrls[i] + '?wid=' + s7Presets[type].width + '&hei=' + s7Presets[type].height });
                }
            }
            this.vid = styleVariant;
        } else if (s7ImageUrls) {
            images.push({ url: s7ImageUrls + '?wid=' + s7Presets[type].width + '&hei=' + s7Presets[type].height });
        }

        if (images) {
            var result = {};

            if (imageConfig.quantity === 'single') {
                var firstImage = images[0];
                if (firstImage) {
                    result = [{
                        alt: product.ID,
                        url: firstImage.url,
                        index: '0',
                        title: product.ID,
                        absURL: firstImage.url
                    }];
                }
            } else {
                result = images.map(function (image, index) {
                    return {
                        alt: product.ID,
                        url: image.url,
                        index: index.toString(),
                        title: product.ID,
                        absURL: image.url
                    };
                });
            }
            this[type] = result;
        }
    }, this);
}

module.exports = Images;
