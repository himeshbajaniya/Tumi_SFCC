'use strict';

/**
 * Middleware to get rfk_preferences
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */

function getRfkSitePreferences(req, res, next) {
    var Site = require('dw/system/Site');

    var rfk_preferences = {};
    rfk_preferences.n_item = Site.getCurrent().getCustomPreferenceValue('reflektion_n_item');
    rfk_preferences.rfkid_category_page = Site.getCurrent().getCustomPreferenceValue('rfkid_category_page');
    rfk_preferences.uri = Site.getCurrent().getCustomPreferenceValue('reflektion_uri');
    rfk_preferences.exact_match = Site.getCurrent().getCustomPreferenceValue('reflektion_exact_match');
    rfk_preferences.trending_category_max = Site.getCurrent().getCustomPreferenceValue('reflektion_trending_category_max');
    rfk_preferences.product_max = Site.getCurrent().getCustomPreferenceValue('reflektion_product_max');
    rfk_preferences.category_max = Site.getCurrent().getCustomPreferenceValue('reflektion_category_max');
    rfk_preferences.product_group = Site.getCurrent().getCustomPreferenceValue('reflektion_product_group');
    rfk_preferences.query_keyphrase_value = Site.getCurrent().getCustomPreferenceValue('reflektion_query_keyphrase_value');
    rfk_preferences.recommendation_carousel_n_item = Site.getCurrent().getCustomPreferenceValue('recommendation_carousel_n_item');
    rfk_preferences.rfkid_homepage = Site.getCurrent().getCustomPreferenceValue('rfkid_homepage');
    rfk_preferences.rfkid_pdp = Site.getCurrent().getCustomPreferenceValue('rfkid_pdp');
    rfk_preferences.rfkid_search_page = Site.getCurrent().getCustomPreferenceValue('rfkid_search_page');
    rfk_preferences.authorization = Site.getCurrent().getCustomPreferenceValue('reflektion_authorization');
    rfk_preferences.reflktionUrl = Site.getCurrent().getCustomPreferenceValue('reflektion_URL');
    rfk_preferences.rfkid_empty_cart = Site.getCurrent().getCustomPreferenceValue('rfkid_empty_cart');
    rfk_preferences.rfkid_cart = Site.getCurrent().getCustomPreferenceValue('rfkid_cart');
    rfk_preferences.rfkid_null_search_page = Site.getCurrent().getCustomPreferenceValue('rfkid_null_search_page');
    rfk_preferences.reflektion_sort_name = Site.getCurrent().getCustomPreferenceValue('reflektion_sort_name'),
    rfk_preferences.reflektion_sort_order = Site.getCurrent().getCustomPreferenceValue('reflektion_sort_order');
    rfk_preferences.reflektion_desktop_nitem = Site.getCurrent().getCustomPreferenceValue('rfkdesktop_n_item');
    rfk_preferences.reflektion_mobile_nitem = Site.getCurrent().getCustomPreferenceValue('rfkmobile_n_item');
    rfk_preferences.reflektion_searchflyout_nitem = Site.getCurrent().getCustomPreferenceValue('rfksearchflyout_n_item');
    rfk_preferences.rfkGroupValue = Site.getCurrent().getCustomPreferenceValue('rfkGroupValue');
    rfk_preferences.rfkid_type_ahead = Site.getCurrent().getCustomPreferenceValue('rfkid_type_ahead');
    rfk_preferences.uri = request.httpPath;
    rfk_preferences.uuid = session.sessionID;
    rfk_preferences.currentLocale = request.getLocale();

    res.setViewData({
        rfk_preferences: rfk_preferences
    });
    next();
}

module.exports = {
    getRfkSitePreferences: getRfkSitePreferences
}