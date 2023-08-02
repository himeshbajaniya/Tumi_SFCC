'use strict';
var base = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');

const COLLECTION_CATEGORY_NAME = 'collections';
const GIFT_CATEGORY_NAME = 'gifting';
const PRODUCT_CATEGORY_NAME = 'productcatalog';

/**
 * Get category url
 * @param {dw.catalog.Category} category - Current category
 * @returns {string} - Url of the category
 */
function getCategoryUrl(category) {
    return category.custom && 'alternativeUrl' in category.custom && category.custom.alternativeUrl
        ? (category.custom.alternativeUrl.toString()).replace(/&amp;/g, '&')
        : URLUtils.url('Search-Show', 'cgid', category.getID()).toString();
}

/**
 * Converts a given category from dw.catalog.Category to plain object
 * @param {dw.catalog.Category} category - A single category
 * @returns {Object} plain object that represents a category
 */
function categoryToObject(category) {
    if (!category.custom || !category.custom.showInMenu) {
        return null;
    }
    var result = {
        name: category.getDisplayName(),
        url: getCategoryUrl(category),
        id: category.ID,
        menuTemplateRender: category.ID === COLLECTION_CATEGORY_NAME,
        menuTemplateRender2: category.ID === GIFT_CATEGORY_NAME || category.ID === PRODUCT_CATEGORY_NAME,
        thumbnail: category.thumbnail ? category.thumbnail.absURL.toString() : null,
        description: category.description ? category.description : null,
        displayShopAll: category.custom.displayShopAll ? category.custom.displayShopAll.markup : null
    };
    var subCategories = category.hasOnlineSubCategories() ?
        category.getOnlineSubCategories() : null;

    if (subCategories) {
        collections.forEach(subCategories, function (subcategory) {
            var converted = null;
            if (subcategory.hasOnlineProducts() || subcategory.hasOnlineSubCategories()) {
                converted = categoryToObject(subcategory);
            }
            if (converted) {
                if (!result.subCategories) {
                    result.subCategories = [];
                }
                result.subCategories.push(converted);
            }
        });
        if (result.subCategories) {
            result.complexSubCategories = result.subCategories.some(function (item) {
                return !!item.subCategories;
            });
        }
    }

    return result;
}


/**
 * Represents a single category with all of it's children
 * @param {dw.util.ArrayList<dw.catalog.Category>} items - Top level categories
 * @constructor
 */
function categories(items) {
    base.call(this, items);
    this.categories = [];
    collections.forEach(items, function (item) {
        if (item.custom && item.custom.showInMenu &&
                (item.hasOnlineProducts() || item.hasOnlineSubCategories() || item.ID === 'services')) {
            this.categories.push(categoryToObject(item));
        }
    }, this);
}

module.exports = categories;