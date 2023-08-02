'use strict';

var Site = require('dw/system/Site');

/**
 *
 * @param {Object} product product object
 * @returns {string/null} returns monogramming data for product type string or null
 */

module.exports = function (object, apiProduct, options) {
    var varientProduct = apiProduct;
    if(apiProduct.master) {
        varientProduct = apiProduct.variationModel.getDefaultVariant();
    }

    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    Object.defineProperty(object, 'monogramSymbolList', {
        enumerable: true,
        value: (apiProduct.custom.grandCollection === 'TUMI | McLaren') ? Site.getCurrent().getCustomPreferenceValue('symbolListGrandCollection') : Site.getCurrent().getCustomPreferenceValue('symbolList')
    });

    Object.defineProperty(object, 'fontList', {
        enumerable: true,
        value: Site.getCurrent().getCustomPreferenceValue('fontList')
    });

    Object.defineProperty(object, 'colorData', {
        enumerable: true,
        value: !empty(Site.getCurrent().getCustomPreferenceValue('colorList')) ? JSON.parse(Site.getCurrent().getCustomPreferenceValue('colorList')) : []
    });

    Object.defineProperty(object, 'monogramLuggageTag', {
        enumerable: true,
        value: (Object.hasOwnProperty.call(apiProduct.custom, 'monogramLuggageTag') && (apiProduct.custom.monogramLuggageTag || false))
    });

    Object.defineProperty(object, 'monogramable', {
        enumerable: true,
        value: (Object.hasOwnProperty.call(varientProduct.custom, 'monogramable') && (varientProduct.custom.monogramable != null)) ? varientProduct.custom.monogramable : false
    });

    Object.defineProperty(object, 'monogramPatch', {
        enumerable: true,
        value: (Object.hasOwnProperty.call(apiProduct.custom, 'monogramPatch') && (apiProduct.custom.monogramPatch || false))
    });

    Object.defineProperty(object, 'isPlacementOption', {
        enumerable: true,
        value: !!object.monogramLuggageTag && !!object.monogramPatch
    });

    Object.defineProperty(object, 'placementOption', {
        enumerable: true,
        value: (function (monogram) {
            if (monogram.monogramPatch && monogram.monogramLuggageTag) return 'classic-both';
            if (monogram.monogramPatch) return 'classic-patch';
            if (monogram.monogramLuggageTag) return 'classic-tag';
            return '';
        })(object)
    });

    Object.defineProperty(object, 'monoPatchImage', {
        enumerable: true,
        value: (function () {
            return ('styleVariant' in apiProduct.custom && apiProduct.custom.styleVariant)
            ? (Site.getCurrent().getCustomPreferenceValue('monogramImagePrefix') || 'https://tumi.scene7.com/is/image/Tumi/') + apiProduct.custom.styleVariant + '_patch'
            : Site.getCurrent().getCustomPreferenceValue('monoPatchImage');
        }())
    });

    Object.defineProperty(object, 'monoTagImage', {
        enumerable: true,
        value: (function () {
            return ('styleVariant' in apiProduct.custom && apiProduct.custom.styleVariant)
            ? (Site.getCurrent().getCustomPreferenceValue('monogramImagePrefix') || 'https://tumi.scene7.com/is/image/Tumi/') + apiProduct.custom.styleVariant + '_tag'
            : Site.getCurrent().getCustomPreferenceValue('monoPatchImage');
        }())
    });

    Object.defineProperty(object, 'isPremium', {
        enumerable: true,
        value: 'premiumMono' in varientProduct.custom && !!varientProduct.custom.premiumMono && require('*/cartridge/scripts/helpers/monogram').isWareHouseInventoryExists(varientProduct)
        });

    if (object.isPremium) {

        Object.defineProperty(object, 'isPremiumTag', {
            enumerable: true,
            value: 'premiumLuggageTag' in varientProduct.custom && !!varientProduct.custom.premiumLuggageTag
        });

        Object.defineProperty(object, 'isPremiumPatch', {
            enumerable: true,
            value: 'premiumPatch' in varientProduct.custom && !!varientProduct.custom.premiumPatch
        });

        Object.defineProperty(object, 'isPremiumMonogramSelectable', {
            enumerable: true,
            value: 'premiumPatch' in varientProduct.custom && 'premiumLuggageTag' in varientProduct.custom && !!varientProduct.custom.premiumPatch && !!varientProduct.custom.premiumLuggageTag
        });

    }

    Object.defineProperty(object, 'premiumMonogramPatchLookupTable', {
        enumerable: true,
        value: Site.getCurrent().getCustomPreferenceValue('premiumMonogramPatchLookupTable')
    });

    Object.defineProperty(object, 'premiumMonogramTagLookupTable', {
        enumerable: true,
        value: Site.getCurrent().getCustomPreferenceValue('premiumMonogramTagLookupTable')
    });

    Object.defineProperty(object, 'premiumMonogramLetterCount', {
        enumerable: true,
        value: productHelpers.getPremiumMonogramLetterCount(object, apiProduct)
    });

    Object.defineProperty(object, 'premiumMonogramLetterCost', {
        enumerable: true,
        value: (function () {
            var Money = require('dw/value/Money');
            var premMonogramMoney = new Money(Site.current.getCustomPreferenceValue('premiumDefaultProductPrice') || 15, session.currency.currencyCode);
            return require('dw/web/Resource').msgf('product.monogram.metal.content', 'product', null, require('dw/util/StringUtils').formatMoney(premMonogramMoney));
        }())
    });
};
